import { auth } from "@/modules/core/auth"
import prisma from "@/lib/prisma"
import { ProfileForm } from "@/modules/users/components/ProfileForm"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            fullName: true,
            email: true,
            globalRole: true,
            department: true,
        }
    })

    if (!user) redirect("/login")

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
                <p className="text-muted-foreground">View and update your account information.</p>
            </div>
            <ProfileForm user={user} />
        </div>
    )
}
