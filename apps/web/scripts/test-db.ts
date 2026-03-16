import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from "@prisma/adapter-neon"
import { Pool } from "@neondatabase/serverless"
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaNeon(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    console.log('Testing connection to NeonDB...')
    await prisma.$connect()
    console.log('✅ Connected successfully!')
    
    // Attempt a basic query
    const result = await prisma.$queryRaw`SELECT 1 as connected`
    console.log('✅ Database query successful:', result)
  } catch (e) {
    console.error('❌ Connection failed!')
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
