import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

console.log("DEBUG_DB: Initializing Standard Prisma Client")

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
