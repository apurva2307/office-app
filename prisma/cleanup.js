const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    // Demote admin@example.com from SUPER_ADMIN to EMPLOYEE
    await prisma.user.updateMany({
        where: { email: 'admin@example.com' },
        data: { globalRole: 'EMPLOYEE' }
    })
    console.log('✅ Demoted admin@example.com to EMPLOYEE')

    // Verify
    const users = await prisma.user.findMany({
        select: { email: true, globalRole: true, fullName: true }
    })
    console.log('\nAll users:')
    users.forEach(u => console.log(`  ${u.email} — ${u.globalRole} (${u.fullName})`))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
