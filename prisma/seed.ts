import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const email = 'superadmin@office.app'
    const password = 'SuperAdmin@123'
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash: hashedPassword,
            fullName: 'Shailendra Kumar Singh',
            designation: 'Sr. DFM',
            globalRole: 'SUPER_ADMIN',
            department: 'Accounts',
        },
    })

    // Sync module access records for SUPER_ADMIN (ADMIN level on all modules)
    const modules = ['recovery', 'application', 'reward', 'users']
    for (const moduleKey of modules) {
        const existing = await prisma.moduleAccess.findFirst({
            where: { userId: user.id, moduleKey }
        })
        if (!existing) {
            await prisma.moduleAccess.create({
                data: { userId: user.id, moduleKey, accessLevel: 'ADMIN' }
            })
        }
    }

    console.log({ user })
    console.log('Module access records synced for SUPER_ADMIN')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
