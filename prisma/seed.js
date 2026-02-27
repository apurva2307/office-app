const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const email = 'superadmin@office.app'
    const password = 'SuperAdmin@123'
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            fullName: 'Super Admin',
            globalRole: 'SUPER_ADMIN',
            department: 'Administration',
            passwordHash,
        },
    })

    console.log('✅ Super Admin created!')
    console.log(`   Email:    ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   ID:       ${user.id}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
