import { defineConfig } from '@prisma/config'
import 'dotenv/config'

console.log('Prisma CLI using DATABASE_URL:', process.env.DATABASE_URL ? 'FOUND' : 'NOT FOUND')

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
