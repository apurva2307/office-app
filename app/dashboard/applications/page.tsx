import { getApplications } from "@/modules/applications/actions"
import { checkModuleAccess } from "@/modules/users/actions"
import { ApplicationTable } from "@/modules/applications/components/ApplicationTable"
import { NewApplicationDialog } from "@/modules/applications/components/NewApplicationDialog"
import { ShieldAlert } from "lucide-react"
import { AccessLevel } from "@prisma/client"

export default async function ApplicationsPage() {
    const hasAccess = await checkModuleAccess("application")
    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <ShieldAlert className="h-16 w-16 text-red-500" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this module.</p>
            </div>
        )
    }

    const [applications, canReview] = await Promise.all([
        getApplications(),
        checkModuleAccess("application", AccessLevel.APPROVE) as Promise<boolean>,
    ])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Applications</h2>
                    <p className="text-muted-foreground">Manage leave, purchase, and general requests.</p>
                </div>
                <NewApplicationDialog />
            </div>

            <ApplicationTable data={applications} showActions={canReview} />
        </div>
    )
}
