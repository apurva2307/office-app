const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    // List all users
    const users = await prisma.user.findMany({
        select: { id: true, email: true, fullName: true, globalRole: true, passwordHash: true }
    })

    console.log(`\n📋 Total users: ${users.length}\n`)

    for (const user of users) {
        // Test password against "Password@123" and "SuperAdmin@123"
        const testPasswords = ['Password@123', 'SuperAdmin@123']
        const results = []
        for (const pwd of testPasswords) {
            const match = await bcrypt.compare(pwd, user.passwordHash)
            if (match) results.push(pwd)
        }
        console.log(`  ${user.email} (${user.globalRole})`)
        console.log(`    → Matching password: ${results.length > 0 ? results.join(', ') : '❌ NONE matched'}`)
        console.log(`    → Hash: ${user.passwordHash.substring(0, 20)}...`)
        console.log()
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
