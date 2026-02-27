import { auth } from "@/modules/core/auth"
import { getUsers, getAuditLogs } from "@/modules/users/actions"
import { UserList } from "@/modules/users/components/UserList"
import { CreateUserDialog } from "@/modules/users/components/CreateUserDialog"
import { Button } from "@/components/ui/button"
import { ShieldAlert, History, Users } from "lucide-react"
import { AuditLogTable } from "@/modules/core/components/AuditLogTable"
import Link from "next/link"

export default async function SettingsPage(props: { searchParams: Promise<{ userId?: string }> }) {
    const searchParams = await props.searchParams
    const session = await auth()

    const role = session?.user?.role
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <ShieldAlert className="h-16 w-16 text-red-500" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to manage users.</p>
            </div>
        )
    }

    const users = await getUsers()
    const logs = await getAuditLogs()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Settings</h2>
                    <p className="text-muted-foreground">Manage users, roles, and system configurations.</p>
                </div>
                <div className="flex items-center gap-2">
                    {searchParams.userId && (
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard/settings">Clear Filter</Link>
                        </Button>
                    )}
                    <CreateUserDialog />
                </div>
            </div>

            <div className="grid gap-6">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-400" />
                        <h3 className="font-semibold">User Management</h3>
                    </div>
                    <UserList users={users} currentRole={role} currentUserId={session?.user?.id} />
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden" id="audit-logs">
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-gray-400" />
                            <h3 className="font-semibold">Audit Logs {searchParams.userId && "(Filtered)"}</h3>
                        </div>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                        <AuditLogTable logs={logs} filterUserId={searchParams.userId} />
                    </div>
                </div>
            </div>
        </div>
    )
}
