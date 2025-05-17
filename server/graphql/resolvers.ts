import { storage } from "../storage";
import type { Request, Response } from "express";

interface Context {
  req: Request;
  res: Response;
}

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      // Get user id from the session
      const userId = context.req.session?.user?.id;
      if (!userId) return null;
      
      try {
        // Fetch the user data from storage
        const user = await storage.getUser(userId);
        return user || null;
      } catch (error) {
        console.error("GraphQL me query error:", error);
        return null;
      }
    },
    
    membershipTiers: async () => {
      try {
        return await storage.getMembershipTiers();
      } catch (error) {
        console.error("GraphQL membershipTiers query error:", error);
        return [];
      }
    },
    
    membershipTier: async (_: any, args: { id: string }) => {
      try {
        return await storage.getMembershipTier(args.id);
      } catch (error) {
        console.error("GraphQL membershipTier query error:", error);
        return null;
      }
    },
    
    members: async (_: any, args: { status?: string, tierId?: string }) => {
      try {
        return await storage.getMembers({
          status: args.status,
          tierId: args.tierId
        });
      } catch (error) {
        console.error("GraphQL members query error:", error);
        return [];
      }
    },
    
    member: async (_: any, args: { id: string }) => {
      try {
        const id = parseInt(args.id);
        if (isNaN(id)) {
          return null;
        }
        return await storage.getMember(id);
      } catch (error) {
        console.error("GraphQL member query error:", error);
        return null;
      }
    },
    
    transactions: async () => {
      try {
        return await storage.getTransactions();
      } catch (error) {
        console.error("GraphQL transactions query error:", error);
        return [];
      }
    },
    
    transaction: async (_: any, args: { id: string }) => {
      try {
        const id = parseInt(args.id);
        if (isNaN(id)) {
          return null;
        }
        return await storage.getTransaction(id);
      } catch (error) {
        console.error("GraphQL transaction query error:", error);
        return null;
      }
    },
    
    memberTransactions: async (_: any, args: { memberId: string }) => {
      try {
        const memberId = parseInt(args.memberId);
        if (isNaN(memberId)) {
          return [];
        }
        return await storage.getMemberTransactions(memberId);
      } catch (error) {
        console.error("GraphQL memberTransactions query error:", error);
        return [];
      }
    },
    
    newsletterCampaigns: async () => {
      try {
        return await storage.getNewsletterCampaigns();
      } catch (error) {
        console.error("GraphQL newsletterCampaigns query error:", error);
        return [];
      }
    },
    
    newsletterCampaign: async (_: any, args: { id: string }) => {
      try {
        const id = parseInt(args.id);
        if (isNaN(id)) {
          return null;
        }
        return await storage.getNewsletterCampaign(id);
      } catch (error) {
        console.error("GraphQL newsletterCampaign query error:", error);
        return null;
      }
    }
  },
  
  Mutation: {
    // New test email functionality
    sendTestNewsletterCampaign: async (_: any, { id }: { id: string }) => {
      try {
        const campaignId = parseInt(id);
        if (isNaN(campaignId)) {
          throw new Error("Invalid campaign ID");
        }
        
        // Get the campaign details
        const campaign = await storage.getNewsletterCampaign(campaignId);
        if (!campaign) {
          throw new Error("Campaign not found");
        }
        
        if (!process.env.SENDGRID_API_KEY) {
          throw new Error("SendGrid API key not configured. Please set the SENDGRID_API_KEY environment variable.");
        }
        
        // Import the sendNewsletterCampaign function from the sendgrid module
        const { sendNewsletterCampaign } = await import('../sendgrid');
        
        // Use the configured sender email or a default one
        const senderEmail = process.env.SENDER_EMAIL || 'noreply@herschellmuseum.org';
        const senderName = 'Herschell Carrousel Factory Museum';
        
        // Send a test email (only to the first recipient in the audience)
        const result = await sendNewsletterCampaign(
          campaignId,
          senderEmail,
          senderName,
          campaign.subject,
          campaign.content,
          true // In test mode
        );
        
        return {
          success: result.success,
          message: result.success 
            ? `Test email sent successfully to ${result.sent} recipient(s).`
            : `Failed to send test email. ${result.failed} failures.`
        };
      } catch (error) {
        console.error("GraphQL sendTestNewsletterCampaign mutation error:", error);
        return {
          success: false,
          message: "Failed to send test newsletter: " + (error instanceof Error ? error.message : "Unknown error")
        };
      }
    },
    createMember: async (_: any, { input }: { input: any }) => {
      try {
        return await storage.createMember(input);
      } catch (error) {
        console.error("GraphQL createMember mutation error:", error);
        throw new Error("Failed to create member");
      }
    },
    
    updateMember: async (_: any, { id, input }: { id: string, input: any }) => {
      try {
        const memberId = parseInt(id);
        if (isNaN(memberId)) {
          throw new Error("Invalid member ID");
        }
        return await storage.updateMember(memberId, input);
      } catch (error) {
        console.error("GraphQL updateMember mutation error:", error);
        throw new Error("Failed to update member");
      }
    },
    
    archiveMember: async (_: any, { id }: { id: string }) => {
      try {
        const memberId = parseInt(id);
        if (isNaN(memberId)) {
          throw new Error("Invalid member ID");
        }
        return await storage.archiveMember(memberId);
      } catch (error) {
        console.error("GraphQL archiveMember mutation error:", error);
        throw new Error("Failed to archive member");
      }
    },
    
    createTransaction: async (_: any, { input }: { input: any }) => {
      try {
        return await storage.createTransaction(input);
      } catch (error) {
        console.error("GraphQL createTransaction mutation error:", error);
        throw new Error("Failed to create transaction");
      }
    },
    
    createNewsletterCampaign: async (_: any, { input }: { input: any }) => {
      try {
        return await storage.createNewsletterCampaign(input);
      } catch (error) {
        console.error("GraphQL createNewsletterCampaign mutation error:", error);
        throw new Error("Failed to create newsletter campaign");
      }
    },
    
    updateNewsletterCampaign: async (_: any, { id, input }: { id: string, input: any }) => {
      try {
        const campaignId = parseInt(id);
        if (isNaN(campaignId)) {
          throw new Error("Invalid campaign ID");
        }
        return await storage.updateNewsletterCampaign(campaignId, input);
      } catch (error) {
        console.error("GraphQL updateNewsletterCampaign mutation error:", error);
        throw new Error("Failed to update newsletter campaign");
      }
    },
    
    sendNewsletterCampaign: async (_: any, { id }: { id: string }) => {
      try {
        const campaignId = parseInt(id);
        if (isNaN(campaignId)) {
          throw new Error("Invalid campaign ID");
        }
        
        // Get the campaign details
        const campaign = await storage.getNewsletterCampaign(campaignId);
        if (!campaign) {
          throw new Error("Campaign not found");
        }
        
        if (!process.env.SENDGRID_API_KEY) {
          throw new Error("SendGrid API key not configured. Please set the SENDGRID_API_KEY environment variable.");
        }
        
        // Import the sendNewsletterCampaign function from the sendgrid module
        const { sendNewsletterCampaign } = await import('../sendgrid');
        
        // Use the configured sender email or a default one
        const senderEmail = process.env.SENDER_EMAIL || 'noreply@herschellmuseum.org';
        const senderName = 'Herschell Carrousel Factory Museum';
        
        // Send the newsletter campaign
        const result = await sendNewsletterCampaign(
          campaignId,
          senderEmail,
          senderName,
          campaign.subject,
          campaign.content,
          false // Not in test mode
        );
        
        if (!result.success) {
          throw new Error(`Failed to send campaign. Sent: ${result.sent}, Failed: ${result.failed}`);
        }
        
        // Get the updated campaign and return it
        const updatedCampaign = await storage.getNewsletterCampaign(campaignId);
        if (!updatedCampaign) {
          throw new Error("Failed to retrieve updated campaign");
        }
        
        return updatedCampaign;
      } catch (error) {
        console.error("GraphQL sendNewsletterCampaign mutation error:", error);
        throw new Error("Failed to send newsletter campaign: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    },
    
    scheduleNewsletterCampaign: async (_: any, { id, scheduledFor }: { id: string, scheduledFor: string }) => {
      try {
        const campaignId = parseInt(id);
        if (isNaN(campaignId)) {
          throw new Error("Invalid campaign ID");
        }
        
        // Get the campaign details
        const campaign = await storage.getNewsletterCampaign(campaignId);
        if (!campaign) {
          throw new Error("Campaign not found");
        }
        
        // Update campaign status to 'scheduled'
        return await storage.updateNewsletterCampaign(campaignId, {
          status: 'scheduled',
          scheduledFor
        });
      } catch (error) {
        console.error("GraphQL scheduleNewsletterCampaign mutation error:", error);
        throw new Error("Failed to schedule newsletter campaign");
      }
    }
  }
};