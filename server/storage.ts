import { eq, and, gte, lte, desc, asc, like, or, inArray, isNull, isNotNull } from "drizzle-orm";
import { 
  users, User, InsertUser,
  membershipTiers, MembershipTier, InsertMembershipTier,
  members, Member, InsertMember,
  transactions, Transaction, InsertTransaction,
  newsletterCampaigns, NewsletterCampaign, InsertNewsletterCampaign
} from "@shared/schema";
import { db } from "./db";
import { hash, compare } from "bcrypt";

export interface MemberFilters {
  search?: string;
  status?: string;
  tierId?: string;
  isArchived?: boolean;
  renewalStart?: Date;
  renewalEnd?: Date;
}

export interface CampaignFilters {
  status?: string;
  search?: string;
  dateStart?: Date;
  dateEnd?: Date;
}

export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  validateUserCredentials(email: string, password: string): Promise<User | null>;
  
  // Membership tier operations
  getMembershipTiers(): Promise<MembershipTier[]>;
  getMembershipTier(id: string): Promise<MembershipTier | undefined>;
  createMembershipTier(tier: InsertMembershipTier): Promise<MembershipTier>;
  updateMembershipTier(id: string, tier: Partial<InsertMembershipTier>): Promise<MembershipTier>;
  deleteMembershipTier(id: string): Promise<void>;
  initializeMembershipTiers(): Promise<void>;
  
  // Member operations
  getMembers(filters?: MemberFilters): Promise<Member[]>;
  getMember(id: number): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member>;
  archiveMember(id: number): Promise<Member>;
  deleteMember(id: number): Promise<void>;
  getRenewalsDue(dayRange: number): Promise<Member[]>;
  getRecentMembers(limit: number): Promise<Member[]>;
  getMemberCountByTier(): Promise<{ tierId: string; count: number }[]>;
  
  // Transaction operations
  getTransactions(): Promise<Transaction[]>;
  getMemberTransactions(memberId: number): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;
  getRecentTransactions(limit: number): Promise<Transaction[]>;
  
  // Newsletter operations
  getNewsletterCampaigns(filters?: CampaignFilters): Promise<NewsletterCampaign[]>;
  getNewsletterCampaign(id: number): Promise<NewsletterCampaign | undefined>;
  createNewsletterCampaign(campaign: InsertNewsletterCampaign): Promise<NewsletterCampaign>;
  updateNewsletterCampaign(id: number, campaign: Partial<InsertNewsletterCampaign>): Promise<NewsletterCampaign>;
  deleteNewsletterCampaign(id: number): Promise<void>;
  updateCampaignMetrics(id: number, opens: number, clicks: number): Promise<NewsletterCampaign>;
  getRecentCampaigns(limit: number): Promise<NewsletterCampaign[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    let updatedUserData = { ...userData };
    
    // If password is being updated, hash it
    if (userData.password) {
      const hashedPassword = await hash(userData.password, 10);
      updatedUserData.password = hashedPassword;
    }
    
    const [user] = await db
      .update(users)
      .set({
        ...updatedUserData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    return user;
  }
  
  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async validateUserCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) return null;
    
    return user;
  }

  // Membership tier operations
  async getMembershipTiers(): Promise<MembershipTier[]> {
    return await db.select().from(membershipTiers);
  }

  async getMembershipTier(id: string): Promise<MembershipTier | undefined> {
    const [tier] = await db
      .select()
      .from(membershipTiers)
      .where(eq(membershipTiers.id, id));
    return tier;
  }

  async createMembershipTier(tier: InsertMembershipTier): Promise<MembershipTier> {
    const [newTier] = await db
      .insert(membershipTiers)
      .values(tier)
      .returning();
    return newTier;
  }

  async updateMembershipTier(id: string, tier: Partial<InsertMembershipTier>): Promise<MembershipTier> {
    const [updatedTier] = await db
      .update(membershipTiers)
      .set({
        ...tier,
        updatedAt: new Date(),
      })
      .where(eq(membershipTiers.id, id))
      .returning();
    return updatedTier;
  }

  async deleteMembershipTier(id: string): Promise<void> {
    await db.delete(membershipTiers).where(eq(membershipTiers.id, id));
  }

  async initializeMembershipTiers(): Promise<void> {
    const existingTiers = await this.getMembershipTiers();
    
    if (existingTiers.length === 0) {
      // Define the default tiers with their benefits
      const defaultTiers: InsertMembershipTier[] = [
        {
          id: 'family',
          name: 'Family',
          description: 'Perfect for families with children',
          price: '60',
          benefits: JSON.stringify([
            'Free admission for two adults and all children under 18',
            'Two ride tokens per visit',
            '10% gift-shop discount',
            'Early event access',
            'Quarterly newsletter'
          ])
        },
        {
          id: 'adult',
          name: 'Adult',
          description: 'Individual adult membership',
          price: '40',
          benefits: JSON.stringify([
            'Free admission for one adult',
            'Two ride tokens per visit',
            '10% gift-shop discount',
            'Early event access',
            'Quarterly newsletter'
          ])
        },
        {
          id: 'senior_couple',
          name: 'Senior Couple',
          description: 'For two seniors age 65+',
          price: '45',
          benefits: JSON.stringify([
            'Free admission for two seniors',
            'Two ride tokens per visit',
            '10% gift-shop discount',
            'Early event access',
            'Quarterly newsletter'
          ])
        },
        {
          id: 'senior',
          name: 'Senior',
          description: 'Individual senior membership, age 65+',
          price: '30',
          benefits: JSON.stringify([
            'Free admission for one senior',
            'Two ride tokens per visit',
            '10% gift-shop discount',
            'Early event access', 
            'Quarterly newsletter'
          ])
        },
        {
          id: 'student',
          name: 'Student',
          description: 'For students with valid ID',
          price: '20',
          benefits: JSON.stringify([
            'Free admission for one student',
            'Two ride tokens per visit',
            '10% gift-shop discount',
            'Quarterly newsletter'
          ])
        }
      ];
      
      // Insert all default tiers
      for (const tier of defaultTiers) {
        await this.createMembershipTier(tier);
      }
    }
  }

  // Member operations
  async getMembers(filters: MemberFilters = {}): Promise<Member[]> {
    let query = db.select().from(members);
    
    if (filters.search) {
      query = query.where(
        or(
          like(members.firstName, `%${filters.search}%`),
          like(members.lastName, `%${filters.search}%`),
          like(members.email, `%${filters.search}%`)
        )
      );
    }
    
    if (filters.status) {
      query = query.where(eq(members.status, filters.status));
    }
    
    if (filters.tierId) {
      query = query.where(eq(members.tierId, filters.tierId));
    }
    
    if (filters.isArchived !== undefined) {
      query = query.where(eq(members.isArchived, filters.isArchived));
    }
    
    if (filters.renewalStart && filters.renewalEnd) {
      query = query.where(
        and(
          gte(members.renewalDate, filters.renewalStart),
          lte(members.renewalDate, filters.renewalEnd)
        )
      );
    }
    
    return await query.orderBy(members.lastName, members.firstName);
  }

  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, id));
    return member;
  }

  async createMember(member: InsertMember): Promise<Member> {
    const [newMember] = await db
      .insert(members)
      .values(member)
      .returning();
    return newMember;
  }

  async updateMember(id: number, member: Partial<InsertMember>): Promise<Member> {
    const [updatedMember] = await db
      .update(members)
      .set({
        ...member,
        updatedAt: new Date(),
      })
      .where(eq(members.id, id))
      .returning();
    return updatedMember;
  }

  async archiveMember(id: number): Promise<Member> {
    const [archivedMember] = await db
      .update(members)
      .set({
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(eq(members.id, id))
      .returning();
    return archivedMember;
  }

  async deleteMember(id: number): Promise<void> {
    await db.delete(members).where(eq(members.id, id));
  }

  async getRenewalsDue(dayRange: number): Promise<Member[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + dayRange);
    
    return await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.isArchived, false),
          gte(members.renewalDate, today),
          lte(members.renewalDate, futureDate)
        )
      )
      .orderBy(members.renewalDate);
  }

  async getRecentMembers(limit: number): Promise<Member[]> {
    return await db
      .select()
      .from(members)
      .orderBy(desc(members.createdAt))
      .limit(limit);
  }

  async getMemberCountByTier(): Promise<{ tierId: string; count: number }[]> {
    const result = await db.execute(
      `SELECT tier_id as "tierId", COUNT(*) as count 
       FROM members 
       WHERE is_archived = false 
       GROUP BY tier_id`
    );
    return result.rows as { tierId: string; count: number }[];
  }

  // Transaction operations
  async getTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.date));
  }

  async getMemberTransactions(memberId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.memberId, memberId))
      .orderBy(desc(transactions.date));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set({
        ...transaction,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async getRecentTransactions(limit: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  // Newsletter operations
  async getNewsletterCampaigns(filters: CampaignFilters = {}): Promise<NewsletterCampaign[]> {
    let query = db.select().from(newsletterCampaigns);
    
    if (filters.status) {
      query = query.where(eq(newsletterCampaigns.status, filters.status));
    }
    
    if (filters.search) {
      query = query.where(
        or(
          like(newsletterCampaigns.title, `%${filters.search}%`),
          like(newsletterCampaigns.subject, `%${filters.search}%`)
        )
      );
    }
    
    if (filters.dateStart && filters.dateEnd) {
      query = query.where(
        and(
          gte(newsletterCampaigns.createdAt, filters.dateStart),
          lte(newsletterCampaigns.createdAt, filters.dateEnd)
        )
      );
    }
    
    return await query.orderBy(desc(newsletterCampaigns.createdAt));
  }

  async getNewsletterCampaign(id: number): Promise<NewsletterCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.id, id));
    return campaign;
  }

  async createNewsletterCampaign(campaign: InsertNewsletterCampaign): Promise<NewsletterCampaign> {
    const [newCampaign] = await db
      .insert(newsletterCampaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateNewsletterCampaign(id: number, campaign: Partial<InsertNewsletterCampaign>): Promise<NewsletterCampaign> {
    const [updatedCampaign] = await db
      .update(newsletterCampaigns)
      .set({
        ...campaign,
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async deleteNewsletterCampaign(id: number): Promise<void> {
    await db.delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, id));
  }

  async updateCampaignMetrics(id: number, opens: number, clicks: number): Promise<NewsletterCampaign> {
    const [updatedCampaign] = await db
      .update(newsletterCampaigns)
      .set({
        opens,
        clicks,
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  async getRecentCampaigns(limit: number): Promise<NewsletterCampaign[]> {
    return await db
      .select()
      .from(newsletterCampaigns)
      .orderBy(desc(newsletterCampaigns.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
