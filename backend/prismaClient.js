import { PrismaClient } from '@prisma/client'

// Singleton Prisma client for local always-on usage.
// (Vite UI doesn't import this; backend can be started independently.)
export const prisma = new PrismaClient()

