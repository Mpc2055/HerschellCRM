import { storage } from "../storage";
import type { Request, Response } from "express";

interface Context {
  req: Request;
  res: Response;
}

export const resolvers = {
  Query: {
    me: (_: any, __: any, context: Context) => {
      if (context.req.session && context.req.session.user) {
        return context.req.session.user;
      }
      return null;
    }
  }
};