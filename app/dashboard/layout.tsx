import { auth } from "@/modules/core/auth"
import { DashboardSidebar, MobileNav } from "@/components/dashboard-sidebar"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    const user = {
        name: session?.user?.name,
        email: session?.user?.email,
        role: session?.user?.role,
        moduleAccess: session?.user?.moduleAccess
    }

    return (
        <div className="flex h-screen w-full flex-col md:flex-row">
            {/* Mobile header with hamburger */}
            <MobileNav user={user} />

            {/* Desktop sidebar */}
            <DashboardSidebar user={user} />

            {/* Main Content */}
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
