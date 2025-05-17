export const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    role: String
  }

  type MembershipTier {
    id: ID!
    name: String!
    price: Float!
    description: String
    benefits: [String]
  }

  type Member {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    phone: String
    address: String
    city: String
    state: String
    zip: String
    tierId: String!
    joinDate: String!
    renewalDate: String!
    status: String!
    isArchived: Boolean!
    notes: String
  }

  type Transaction {
    id: ID!
    memberId: Int!
    amount: Float!
    date: String!
    type: String!
    paymentMethod: String!
    receiptNumber: String
    notes: String
  }

  type NewsletterCampaign {
    id: ID!
    title: String!
    subject: String!
    content: String!
    audience: String
    status: String!
    sentAt: String
    scheduledFor: String
    opens: Int
    clicks: Int
  }

  input MemberInput {
    firstName: String!
    lastName: String!
    email: String!
    phone: String
    address: String
    city: String
    state: String
    zip: String
    tierId: String!
    joinDate: String!
    renewalDate: String!
    status: String!
    notes: String
  }

  input TransactionInput {
    memberId: Int!
    amount: Float!
    date: String!
    type: String!
    paymentMethod: String!
    receiptNumber: String
    notes: String
  }

  input NewsletterCampaignInput {
    title: String!
    subject: String!
    content: String!
    audience: String
    status: String!
    scheduledFor: String
  }

  type Query {
    me: User
    membershipTiers: [MembershipTier!]!
    membershipTier(id: ID!): MembershipTier
    members(status: String, tierId: String): [Member!]!
    member(id: ID!): Member
    transactions: [Transaction!]!
    transaction(id: ID!): Transaction
    memberTransactions(memberId: ID!): [Transaction!]!
    newsletterCampaigns: [NewsletterCampaign!]!
    newsletterCampaign(id: ID!): NewsletterCampaign
  }

  type Mutation {
    createMember(input: MemberInput!): Member
    updateMember(id: ID!, input: MemberInput!): Member
    archiveMember(id: ID!): Member
    
    createTransaction(input: TransactionInput!): Transaction
    
    createNewsletterCampaign(input: NewsletterCampaignInput!): NewsletterCampaign
    updateNewsletterCampaign(id: ID!, input: NewsletterCampaignInput!): NewsletterCampaign
    sendNewsletterCampaign(id: ID!): NewsletterCampaign
    scheduleNewsletterCampaign(id: ID!, scheduledFor: String!): NewsletterCampaign
  }
`;