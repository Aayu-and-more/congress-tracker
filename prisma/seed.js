const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Run POST /api/sync to pull live data from Senate/House Stock Watcher APIs.')
  console.log('No seed data needed — all data comes from public government disclosures.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
