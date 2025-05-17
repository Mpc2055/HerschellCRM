import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertMemberSchema, 
  insertMembershipTierSchema, 
  insertTransactionSchema, 
  insertNewsletterCampaignSchema 
} from "@shared/schema";
import { sendEmail } from "./sendgrid";
// GraphQL implementation will be added later
// import { ApolloServer } from '@apollo/server';
// import { expressMiddleware } from '@apollo/server/express4';
// import { typeDefs } from "./graphql/typeDefs";
// import { resolvers } from "./graphql/resolvers";
import bcrypt from "bcrypt";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { Pool } from '@neondatabase/serverless';
import csv from 'csv-parser';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';

// Function to seed initial admin user
async function seedAdminUser() {
  try {
    const existingAdmin = await storage.getUserByEmail("Admin@test.com");
    
    if (!existingAdmin) {
      await storage.createUser({
        email: "Admin@test.com",
        password: "admin", // This will be hashed by the createUser method
        firstName: "Admin",
        lastName: "User",
        role: "manager"
      });
      console.log("Created admin user");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Function to initialize membership tiers
async function initializeTiers() {
  try {
    await storage.initializeMembershipTiers();
    console.log("Initialized membership tiers");
  } catch (error) {
    console.error("Error initializing membership tiers:", error);
  }
}

// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session storage
  const PgStore = pgSession(session);
  const sessionPool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  app.use(
    session({
      store: new PgStore({
        pool: sessionPool,
        tableName: 'sessions'
      }),
      secret: process.env.SESSION_SECRET || 'herschell-carousel-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  );

  // Initialize sample data
  await seedAdminUser();
  await initializeTiers();

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session && req.session.user) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  const isManager = (req: Request, res: Response, next: Function) => {
    if (req.session && req.session.user && req.session.user.role === "manager") {
      return next();
    }
    return res.status(403).json({ message: "Forbidden" });
  };

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.validateUserCredentials(email, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Remove password from the user object before storing in session
      const { password: _, ...userWithoutPassword } = user;
      req.session.user = userWithoutPassword;
      
      return res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "An error occurred during login" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/me', isAuthenticated, (req, res) => {
    return res.status(200).json({ user: req.session.user });
  });

  // User routes
  app.get('/api/users', isAuthenticated, isManager, async (req, res) => {
    try {
      const users = await Promise.all(
        (await storage.getUsers()).map(async user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        })
      );
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, isManager, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Membership tier routes
  app.get('/api/membership-tiers', async (req, res) => {
    try {
      const tiers = await storage.getMembershipTiers();
      return res.status(200).json(tiers);
    } catch (error) {
      console.error("Error fetching membership tiers:", error);
      return res.status(500).json({ message: "Failed to fetch membership tiers" });
    }
  });

  app.get('/api/membership-tiers/:id', async (req, res) => {
    try {
      const tier = await storage.getMembershipTier(req.params.id);
      if (!tier) {
        return res.status(404).json({ message: "Membership tier not found" });
      }
      return res.status(200).json(tier);
    } catch (error) {
      console.error("Error fetching membership tier:", error);
      return res.status(500).json({ message: "Failed to fetch membership tier" });
    }
  });

  app.post('/api/membership-tiers', isAuthenticated, isManager, async (req, res) => {
    try {
      const tierData = insertMembershipTierSchema.parse(req.body);
      const newTier = await storage.createMembershipTier(tierData);
      return res.status(201).json(newTier);
    } catch (error) {
      console.error("Error creating membership tier:", error);
      return res.status(500).json({ message: "Failed to create membership tier" });
    }
  });

  app.put('/api/membership-tiers/:id', isAuthenticated, isManager, async (req, res) => {
    try {
      const tierData = insertMembershipTierSchema.partial().parse(req.body);
      const updatedTier = await storage.updateMembershipTier(req.params.id, tierData);
      return res.status(200).json(updatedTier);
    } catch (error) {
      console.error("Error updating membership tier:", error);
      return res.status(500).json({ message: "Failed to update membership tier" });
    }
  });

  app.delete('/api/membership-tiers/:id', isAuthenticated, isManager, async (req, res) => {
    try {
      await storage.deleteMembershipTier(req.params.id);
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting membership tier:", error);
      return res.status(500).json({ message: "Failed to delete membership tier" });
    }
  });

  // Member routes
  app.get('/api/members', isAuthenticated, async (req, res) => {
    try {
      const { search, status, tierId, isArchived, renewalStart, renewalEnd } = req.query;
      
      const filters = {
        search: search as string,
        status: status as string,
        tierId: tierId as string,
        isArchived: isArchived === 'true',
        renewalStart: renewalStart ? new Date(renewalStart as string) : undefined,
        renewalEnd: renewalEnd ? new Date(renewalEnd as string) : undefined
      };
      
      const members = await storage.getMembers(filters);
      return res.status(200).json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      return res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get('/api/members/:id', isAuthenticated, async (req, res) => {
    try {
      const member = await storage.getMember(parseInt(req.params.id));
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      return res.status(200).json(member);
    } catch (error) {
      console.error("Error fetching member:", error);
      return res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  app.post('/api/members', isAuthenticated, async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const newMember = await storage.createMember(memberData);
      return res.status(201).json(newMember);
    } catch (error) {
      console.error("Error creating member:", error);
      return res.status(500).json({ message: "Failed to create member" });
    }
  });

  app.put('/api/members/:id', isAuthenticated, async (req, res) => {
    try {
      const memberData = insertMemberSchema.partial().parse(req.body);
      const updatedMember = await storage.updateMember(parseInt(req.params.id), memberData);
      return res.status(200).json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      return res.status(500).json({ message: "Failed to update member" });
    }
  });

  app.patch('/api/members/:id/archive', isAuthenticated, async (req, res) => {
    try {
      const archivedMember = await storage.archiveMember(parseInt(req.params.id));
      return res.status(200).json(archivedMember);
    } catch (error) {
      console.error("Error archiving member:", error);
      return res.status(500).json({ message: "Failed to archive member" });
    }
  });

  app.delete('/api/members/:id', isAuthenticated, isManager, async (req, res) => {
    try {
      await storage.deleteMember(parseInt(req.params.id));
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting member:", error);
      return res.status(500).json({ message: "Failed to delete member" });
    }
  });

  app.get('/api/members/renewals/due', isAuthenticated, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const renewals = await storage.getRenewalsDue(days);
      return res.status(200).json(renewals);
    } catch (error) {
      console.error("Error fetching renewals:", error);
      return res.status(500).json({ message: "Failed to fetch renewals" });
    }
  });

  app.get('/api/dashboard/recent-members', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const recentMembers = await storage.getRecentMembers(limit);
      return res.status(200).json(recentMembers);
    } catch (error) {
      console.error("Error fetching recent members:", error);
      return res.status(500).json({ message: "Failed to fetch recent members" });
    }
  });

  app.get('/api/dashboard/membership-distribution', isAuthenticated, async (req, res) => {
    try {
      const distribution = await storage.getMemberCountByTier();
      return res.status(200).json(distribution);
    } catch (error) {
      console.error("Error fetching membership distribution:", error);
      return res.status(500).json({ message: "Failed to fetch membership distribution" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      return res.status(200).json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/members/:id/transactions', isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getMemberTransactions(parseInt(req.params.id));
      return res.status(200).json(transactions);
    } catch (error) {
      console.error("Error fetching member transactions:", error);
      return res.status(500).json({ message: "Failed to fetch member transactions" });
    }
  });

  app.get('/api/transactions/:id', isAuthenticated, async (req, res) => {
    try {
      const transaction = await storage.getTransaction(parseInt(req.params.id));
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      return res.status(200).json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const newTransaction = await storage.createTransaction(transactionData);
      return res.status(201).json(newTransaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      return res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.put('/api/transactions/:id', isAuthenticated, async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      const updatedTransaction = await storage.updateTransaction(parseInt(req.params.id), transactionData);
      return res.status(200).json(updatedTransaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      return res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.delete('/api/transactions/:id', isAuthenticated, isManager, async (req, res) => {
    try {
      await storage.deleteTransaction(parseInt(req.params.id));
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  app.get('/api/dashboard/recent-transactions', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const recentTransactions = await storage.getRecentTransactions(limit);
      return res.status(200).json(recentTransactions);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      return res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });

  // Newsletter campaign routes
  app.get('/api/newsletter/campaigns', isAuthenticated, async (req, res) => {
    try {
      const { status, search, dateStart, dateEnd } = req.query;
      
      const filters = {
        status: status as string,
        search: search as string,
        dateStart: dateStart ? new Date(dateStart as string) : undefined,
        dateEnd: dateEnd ? new Date(dateEnd as string) : undefined
      };
      
      const campaigns = await storage.getNewsletterCampaigns(filters);
      return res.status(200).json(campaigns);
    } catch (error) {
      console.error("Error fetching newsletter campaigns:", error);
      return res.status(500).json({ message: "Failed to fetch newsletter campaigns" });
    }
  });

  app.get('/api/newsletter/campaigns/:id', isAuthenticated, async (req, res) => {
    try {
      const campaign = await storage.getNewsletterCampaign(parseInt(req.params.id));
      if (!campaign) {
        return res.status(404).json({ message: "Newsletter campaign not found" });
      }
      return res.status(200).json(campaign);
    } catch (error) {
      console.error("Error fetching newsletter campaign:", error);
      return res.status(500).json({ message: "Failed to fetch newsletter campaign" });
    }
  });

  app.post('/api/newsletter/campaigns', isAuthenticated, async (req, res) => {
    try {
      const campaignData = insertNewsletterCampaignSchema.parse(req.body);
      const newCampaign = await storage.createNewsletterCampaign({
        ...campaignData,
        senderId: req.session.user.id
      });
      return res.status(201).json(newCampaign);
    } catch (error) {
      console.error("Error creating newsletter campaign:", error);
      return res.status(500).json({ message: "Failed to create newsletter campaign" });
    }
  });

  app.put('/api/newsletter/campaigns/:id', isAuthenticated, async (req, res) => {
    try {
      const campaignData = insertNewsletterCampaignSchema.partial().parse(req.body);
      const updatedCampaign = await storage.updateNewsletterCampaign(parseInt(req.params.id), campaignData);
      return res.status(200).json(updatedCampaign);
    } catch (error) {
      console.error("Error updating newsletter campaign:", error);
      return res.status(500).json({ message: "Failed to update newsletter campaign" });
    }
  });

  app.delete('/api/newsletter/campaigns/:id', isAuthenticated, async (req, res) => {
    try {
      await storage.deleteNewsletterCampaign(parseInt(req.params.id));
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting newsletter campaign:", error);
      return res.status(500).json({ message: "Failed to delete newsletter campaign" });
    }
  });

  // SendGrid integration for newsletter
  app.post('/api/newsletter/send', isAuthenticated, async (req, res) => {
    try {
      const { campaignId } = req.body;
      
      if (!campaignId) {
        return res.status(400).json({ message: "Campaign ID is required" });
      }
      
      const campaign = await storage.getNewsletterCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Get the audience members based on the campaign's audience settings
      const audienceConfig = JSON.parse(campaign.audience as string);
      
      // Build the filters for getting members
      const memberFilters: any = {};
      
      if (audienceConfig.tiers && audienceConfig.tiers.length > 0) {
        memberFilters.tierIds = audienceConfig.tiers;
      }
      
      if (audienceConfig.joinStartDate && audienceConfig.joinEndDate) {
        memberFilters.joinStartDate = new Date(audienceConfig.joinStartDate);
        memberFilters.joinEndDate = new Date(audienceConfig.joinEndDate);
      }
      
      if (audienceConfig.tags && audienceConfig.tags.length > 0) {
        memberFilters.tags = audienceConfig.tags;
      }
      
      // Get the members that match the audience criteria
      const members = await storage.getMembers(memberFilters);
      
      // Process the message with merge tags for each member
      const sendPromises = members.map(async (member) => {
        let content = campaign.content;
        
        // Replace merge tags with member data
        content = content.replace(/{{first_name}}/g, member.firstName);
        content = content.replace(/{{last_name}}/g, member.lastName);
        content = content.replace(/{{membership_level}}/g, member.tierId);
        content = content.replace(/{{renewal_date}}/g, new Date(member.renewalDate).toLocaleDateString());
        
        // Send the email
        return sendEmail(
          process.env.SENDGRID_API_KEY || "",
          {
            to: member.email,
            from: "noreply@herschellmuseum.org",
            subject: campaign.subject,
            html: content
          }
        );
      });
      
      await Promise.all(sendPromises);
      
      // Update the campaign status and sent timestamp
      await storage.updateNewsletterCampaign(campaignId, {
        status: "sent",
        sentAt: new Date()
      });
      
      return res.status(200).json({ message: "Campaign sent successfully" });
    } catch (error) {
      console.error("Error sending newsletter:", error);
      return res.status(500).json({ message: "Failed to send newsletter" });
    }
  });

  app.post('/api/newsletter/send-test', isAuthenticated, async (req, res) => {
    try {
      const { campaignId } = req.body;
      
      if (!campaignId) {
        return res.status(400).json({ message: "Campaign ID is required" });
      }
      
      const campaign = await storage.getNewsletterCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      const user = req.session.user;
      
      if (!user || !user.email) {
        return res.status(400).json({ message: "User email not available" });
      }
      
      // Placeholder data for merge tags
      const placeholderData = {
        firstName: user.firstName || "Test",
        lastName: user.lastName || "User",
        membershipLevel: "Family",
        renewalDate: new Date().toLocaleDateString()
      };
      
      let content = campaign.content;
      
      // Replace merge tags with placeholder data
      content = content.replace(/{{first_name}}/g, placeholderData.firstName);
      content = content.replace(/{{last_name}}/g, placeholderData.lastName);
      content = content.replace(/{{membership_level}}/g, placeholderData.membershipLevel);
      content = content.replace(/{{renewal_date}}/g, placeholderData.renewalDate);
      
      // Send the test email
      const success = await sendEmail(
        process.env.SENDGRID_API_KEY || "",
        {
          to: user.email,
          from: "noreply@herschellmuseum.org",
          subject: `[TEST] ${campaign.subject}`,
          html: content
        }
      );
      
      if (success) {
        return res.status(200).json({ message: "Test email sent successfully" });
      } else {
        return res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error sending test newsletter:", error);
      return res.status(500).json({ message: "Failed to send test newsletter" });
    }
  });

  app.post('/api/newsletter/schedule', isAuthenticated, async (req, res) => {
    try {
      const { campaignId, scheduledTime } = req.body;
      
      if (!campaignId || !scheduledTime) {
        return res.status(400).json({ message: "Campaign ID and scheduled time are required" });
      }
      
      const campaign = await storage.getNewsletterCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Update the campaign status and scheduled time
      await storage.updateNewsletterCampaign(campaignId, {
        status: "scheduled",
        scheduledFor: new Date(scheduledTime)
      });
      
      return res.status(200).json({ message: "Campaign scheduled successfully" });
    } catch (error) {
      console.error("Error scheduling newsletter:", error);
      return res.status(500).json({ message: "Failed to schedule newsletter" });
    }
  });

  app.post('/api/newsletter/campaigns/:id/metrics', isAuthenticated, async (req, res) => {
    try {
      const { opens, clicks } = req.body;
      
      if (opens === undefined || clicks === undefined) {
        return res.status(400).json({ message: "Opens and clicks are required" });
      }
      
      const updatedCampaign = await storage.updateCampaignMetrics(
        parseInt(req.params.id),
        opens,
        clicks
      );
      
      return res.status(200).json(updatedCampaign);
    } catch (error) {
      console.error("Error updating campaign metrics:", error);
      return res.status(500).json({ message: "Failed to update campaign metrics" });
    }
  });

  app.get('/api/dashboard/recent-campaigns', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const recentCampaigns = await storage.getRecentCampaigns(limit);
      return res.status(200).json(recentCampaigns);
    } catch (error) {
      console.error("Error fetching recent campaigns:", error);
      return res.status(500).json({ message: "Failed to fetch recent campaigns" });
    }
  });

  // Export members as CSV
  app.get('/api/members/export/csv', isAuthenticated, async (req, res) => {
    try {
      const members = await storage.getMembers();
      
      if (members.length === 0) {
        return res.status(404).json({ message: "No members found to export" });
      }
      
      // Convert members to CSV format
      const csvHeader = "ID,First Name,Last Name,Email,Phone,Address,City,State,Zip Code,Membership Tier,Join Date,Renewal Date,Status\n";
      
      const csvRows = members.map(member => {
        return `${member.id},"${member.firstName}","${member.lastName}","${member.email}","${member.phone || ''}","${member.address || ''}","${member.city || ''}","${member.state || ''}","${member.zipCode || ''}","${member.tierId}","${new Date(member.joinDate).toISOString().split('T')[0]}","${new Date(member.renewalDate).toISOString().split('T')[0]}","${member.status}"`;
      });
      
      const csvContent = csvHeader + csvRows.join('\n');
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=herschell_members_${new Date().toISOString().split('T')[0]}.csv`);
      
      return res.status(200).send(csvContent);
    } catch (error) {
      console.error("Error exporting members to CSV:", error);
      return res.status(500).json({ message: "Failed to export members to CSV" });
    }
  });

  // Import members from CSV
  app.post('/api/members/import/csv', isAuthenticated, isManager, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const results: any[] = [];
      
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            // Process each row and create members
            const created = [];
            const errors = [];
            
            for (const row of results) {
              try {
                // Validate and transform the data
                const memberData = {
                  firstName: row['First Name'] || row['FirstName'] || '',
                  lastName: row['Last Name'] || row['LastName'] || '',
                  email: row['Email'] || '',
                  phone: row['Phone'] || '',
                  address: row['Address'] || '',
                  city: row['City'] || '',
                  state: row['State'] || '',
                  zipCode: row['Zip Code'] || row['ZipCode'] || '',
                  tierId: row['Membership Tier'] || row['MembershipTier'] || 'family',
                  joinDate: new Date(row['Join Date'] || row['JoinDate'] || new Date()),
                  renewalDate: new Date(row['Renewal Date'] || row['RenewalDate'] || new Date()),
                  status: row['Status'] || 'active',
                  notes: row['Notes'] || '',
                  isArchived: false
                };
                
                // Create the member in the database
                const newMember = await storage.createMember(memberData as any);
                created.push(newMember);
              } catch (error) {
                errors.push({
                  row,
                  error: error.message
                });
              }
            }
            
            // Remove the temporary file
            fs.unlinkSync(req.file.path);
            
            return res.status(200).json({
              message: `Imported ${created.length} members successfully with ${errors.length} errors`,
              created,
              errors
            });
          } catch (error) {
            console.error("Error processing CSV data:", error);
            return res.status(500).json({ message: "Failed to process CSV data" });
          }
        });
    } catch (error) {
      console.error("Error importing members from CSV:", error);
      return res.status(500).json({ message: "Failed to import members from CSV" });
    }
  });

  // GraphQL implementation will be added later
  // const apolloServer = new ApolloServer({
  //   typeDefs,
  //   resolvers,
  // });

  // await apolloServer.start();

  /* GraphQL setup to be added later
  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        return { req, storage };
      },
    })
  );
  */

  const httpServer = createServer(app);
  return httpServer;
}
