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
  }
};