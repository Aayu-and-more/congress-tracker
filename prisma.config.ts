import path from 'path'
import { defineConfig } from 'prisma/config'

const dbUrl = process.env.DATABASE_URL

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // CLI migrations use DATABASE_URL (Neon) if set, else local SQLite for dev
    url: dbUrl ?? `file:${path.resolve(process.cwd(), 'dev.db')}`,
  },
})
