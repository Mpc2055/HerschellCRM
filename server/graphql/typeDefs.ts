export const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    role: String
  }

  type Query {
    me: User
  }
`;