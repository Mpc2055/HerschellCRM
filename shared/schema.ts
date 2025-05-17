import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  varchar,
  jsonb,
  pgEnum,
  decimal,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").default("staff").notNull(), // "staff" or "manager"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Membership tiers enum
export const tierIdEnum = pgEnum('tier_id', [
  'family', 
  'adult', 
  'senior_couple', 
  'senior', 
  'student'
]);

// Membership tiers table
export const membershipTiers = pgTable("membership_tiers", {
  id: tierIdEnum("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  benefits: jsonb("benefits").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Member status enum
export const memberStatusEnum = pgEnum('member_status', [
  'active', 
  'expired', 
  'pending',
  'archived'
]);

// Members table
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  address: varchar("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  tierId: tierIdEnum("tier_id").notNull().references(() => membershipTiers.id),
  joinDate: date("join_date").notNull(),
  renewalDate: date("renewal_date").notNull(),
  status: memberStatusEnum("status").default("active").notNull(),
  notes: text("notes"),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payment method enum
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash', 
  'credit_card', 
  'check',
  'online'
]);

// Transaction type enum
export const transactionTypeEnum = pgEnum('transaction_type', [
  'new_membership', 
  'renewal',
  'donation'
]);

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  type: transactionTypeEnum("type").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  notes: text("notes"),
  receiptNumber: varchar("receipt_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Newsletter campaign status enum
export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft', 
  'scheduled',
  'sent',
  'cancelled'
]);

// Newsletter campaigns table
export const newsletterCampaigns = pgTable("newsletter_campaigns", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  audience: jsonb("audience").notNull(),
  status: campaignStatusEnum("status").default("draft").notNull(),
  sentAt: timestamp("sent_at"),
  scheduledFor: timestamp("scheduled_for"),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  opens: integer("opens").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const membersRelations = relations(members, ({ one, many }) => ({
  membershipTier: one(membershipTiers, {
    fields: [members.tierId],
    references: [membershipTiers.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  member: one(members, {
    fields: [transactions.memberId],
    references: [members.id],
  }),
}));

export const newsletterCampaignsRelations = relations(newsletterCampaigns, ({ one }) => ({
  sender: one(users, {
    fields: [newsletterCampaigns.senderId],
    references: [users.id],
  }),
}));

export const membershipTiersRelations = relations(membershipTiers, ({ many }) => ({
  members: many(members),
}));

// Create insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertMembershipTierSchema = createInsertSchema(membershipTiers)
  .omit({ createdAt: true, updatedAt: true });

export const insertMemberSchema = createInsertSchema(members)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertNewsletterCampaignSchema = createInsertSchema(newsletterCampaigns)
  .omit({ id: true, createdAt: true, updatedAt: true, opens: true, clicks: true });

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MembershipTier = typeof membershipTiers.$inferSelect;
export type InsertMembershipTier = z.infer<typeof insertMembershipTierSchema>;

export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type NewsletterCampaign = typeof newsletterCampaigns.$inferSelect;
export type InsertNewsletterCampaign = z.infer<typeof insertNewsletterCampaignSchema>;
