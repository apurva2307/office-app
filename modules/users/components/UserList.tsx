'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ModuleAccessDialog } from "./ModuleAccessDialog"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { updateUserRole, deleteUser } from "@/modules/users/actions"
import { useState } from "react"

const ROLE_OPTIONS = [
    { value: "SUPER_ADMIN", label: "Super Admin" },
    { value: "ADMIN", label: "Admin" },
    { value: "SECTION_OFFICER", label: "Section Officer" },
    { value: "EMPLOYEE", label: "Employee" },
]

export function UserList({
    users,
    currentRole,
    currentUserId,
}: {
    users: any[]
    currentRole?: string
    currentUserId?: string
}) {
    const router = useRouter()
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function handleRoleChange(userId: string, newRole: string) {
        setUpdatingId(userId)
        try {
            await updateUserRole(userId, newRole as any)
            router.refresh()
        } catch (err: any) {
            alert(err.message || "Failed to update role")
        } finally {
            setUpdatingId(null)
        }
    }

    async function handleDelete(userId: string, name: string) {
        if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return
        setDeletingId(userId)
        try {
            await deleteUser(userId)
            router.refresh()
        } catch (err: any) {
            alert(err.message || "Failed to delete user")
        } finally {
            setDeletingId(null)
        }
    }

    // ADMIN can only assign SO or EMPLOYEE
    const allowedRoles = currentRole === 'SUPER_ADMIN'
        ? ROLE_OPTIONS
        : ROLE_OPTIONS.filter(r => r.value === 'SECTION_OFFICER' || r.value === 'EMPLOYEE')

    const canEditRole = (userId: string) => {
        // Can't change own role
        if (userId === currentUserId) return false
        return true
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Module Permissions</TableHead>
                    <TableHead>Audit Logs</TableHead>
                    {currentRole === 'SUPER_ADMIN' && <TableHead>Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => {
                    const isSelf = user.id === currentUserId
                    return (
                        <TableRow key={user.id} className={isSelf ? "bg-blue-50/50" : ""}>
                            <TableCell className="font-medium">
                                {user.fullName}
                                {isSelf && <span className="text-xs text-blue-500 ml-1">(You)</span>}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                {canEditRole(user.id) ? (
                                    <Select
                                        defaultValue={user.globalRole}
                                        onValueChange={(val) => handleRoleChange(user.id, val)}
                                        disabled={updatingId === user.id}
                                    >
                                        <SelectTrigger className="w-[160px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allowedRoles.map(role => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant={user.globalRole === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                                        {user.globalRole.replace(/_/g, ' ')}
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>{user.department || 'N/A'}</TableCell>
                            <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1 overflow-hidden">
                                        {user.moduleAccess?.length > 0 ? (
                                            user.moduleAccess.map((acc: any) => (
                                                <Badge key={acc.id} variant="outline" className="text-[10px] px-1 h-5 bg-blue-50">
                                                    {acc.moduleKey[0].toUpperCase()}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground italic">None</span>
                                        )}
                                    </div>
                                    <ModuleAccessDialog user={user} onUpdate={() => router.refresh()} />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/dashboard/settings?userId=${user.id}#audit-logs`}>
                                        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">Logs</Badge>
                                    </Link>
                                </Button>
                            </TableCell>
                            {currentRole === 'SUPER_ADMIN' && (
                                <TableCell>
                                    {!isSelf && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(user.id, user.fullName)}
                                            disabled={deletingId === user.id}
                                        >
                                            {deletingId === user.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
