import { auth } from "@/modules/core/auth"
import { getAllMappings, fetchHierarchyTree } from "@/modules/hierarchy/actions"
import { getUsers } from "@/modules/users/actions"
import { HierarchyTree } from "@/modules/hierarchy/components/HierarchyTree"
import { AssignMappingDialog } from "@/modules/hierarchy/components/AssignMappingDialog"
import { ShieldAlert, GitBranch, Users, Network } from "lucide-react"

export default async function HierarchyPage() {
    const session = await auth()
    const role = session?.user?.role

    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <ShieldAlert className="h-16 w-16 text-red-500" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to manage hierarchy.</p>
            </div>
        )
    }

    const [mappings, users, tree] = await Promise.all([
        getAllMappings(),
        getUsers(),
        fetchHierarchyTree(session?.user?.id),
    ])

    const mappingSummary = mappings.map(m => ({
        id: m.id,
        subordinateId: m.subordinateId,
    }))

    const userOptions = users.map(u => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        globalRole: u.globalRole,
    }))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Hierarchy Management</h2>
                    <p className="text-muted-foreground">
                        Manage officer–subordinate mappings and delegation of authority.
                    </p>
                </div>
                <AssignMappingDialog users={userOptions} currentRole={role || ""} />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Tree View — takes 2 columns */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b flex items-center gap-2">
                        <Network className="h-5 w-5 text-gray-400" />
                        <h3 className="font-semibold">Hierarchy Tree</h3>
                    </div>
                    <div className="p-4 max-h-[600px] overflow-y-auto">
                        <HierarchyTree
                            tree={tree}
                            mappings={mappingSummary}
                            canManage={role === "SUPER_ADMIN" || role === "ADMIN"}
                        />
                    </div>
                </div>

                {/* Mapping List */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-400" />
                        <h3 className="font-semibold">Active Mappings</h3>
                        <span className="ml-auto text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                            {mappings.length}
                        </span>
                    </div>
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                        {mappings.length === 0 && (
                            <div className="py-8 text-center text-gray-400 text-sm">
                                No mappings yet. Create one using the "New Mapping" button.
                            </div>
                        )}
                        {mappings.map(m => (
                            <div key={m.id} className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <GitBranch className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {m.supervisor.fullName}
                                            <span className="text-gray-400 mx-1">→</span>
                                            {m.subordinate.fullName}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {m.relationshipType.replace(/_/g, " ")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
