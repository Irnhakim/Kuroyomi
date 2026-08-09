import type { Request, Response } from 'express';
import { prisma } from '../db/client';

export interface Context {
  req: Request;
  res: Response;
  prisma: typeof prisma;
}

export function createContext({ req, res }: { req: Request; res: Response }): Context {
  return { req, res, prisma };
}
