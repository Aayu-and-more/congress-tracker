import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? ''

  if (dbUrl.startsWith('postgresql') || dbUrl.startsWith('postgres')) {
    // Production: Neon serverless Postgres
    const { neonConfig, Pool } = require('@neondatabase/serverless')
    const { PrismaNeon } = require('@prisma/adapter-neon')
    neonConfig.webSocketConstructor = require('ws')
    const pool = new Pool({ connectionString: dbUrl })
    return new PrismaClient({ adapter: new PrismaNeon(pool) })
  }

  // Local dev: SQLite
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
  const path = require('path')
  const dbPath = path.resolve(process.cwd(), 'dev.db')
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${dbPath}` }) })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
