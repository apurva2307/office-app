'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Shield, Check, Loader2, Info } from "lucide-react"
import { updateUserModuleAccess } from "../actions"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const MODULES: { key: string; label: string; levels: string[] }[] = [
    { key: "recovery", label: "Recovery Tracking", levels: ["READ", "WRITE", "ADMIN"] },
    { key: "application", label: "Applications", levels: ["READ", "WRITE", "APPROVE", "ADMIN"] },
    { key: "reward", label: "Rewards & Recognition", levels: ["READ", "WRITE", "APPROVE", "ADMIN"] },
    { key: "users", label: "User Management", levels: ["READ", "WRITE", "ADMIN"] },
]

const LEVEL_DESCRIPTIONS: Record<string, Record<string, string>> = {
    recovery: {
        READ: "View cases & timelines",
        WRITE: "Create/edit cases, update status",
        ADMIN: "Full control, delete cases",
    },
    application: {
        READ: "View applications",
        WRITE: "Submit applications",
        APPROVE: "Approve/reject applications",
        ADMIN: "Full control, delete applications",
    },
    reward: {
        READ: "View nominations",
        WRITE: "Nominate for rewards",
        APPROVE: "Approve/reject nominations",
        ADMIN: "Full control, delete nominations",
    },
    users: {
        READ: "View user list",
        WRITE: "Create users (Employee/SO)",
        ADMIN: "Full control, delete users",
    },
}

export function ModuleAccessDialog({ user, onUpdate }: { user: any, onUpdate: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [permissions, setPermissions] = useState<Record<string, string>>(
        user.moduleAccess?.reduce((acc: any, cur: any) => ({ ...acc, [cur.moduleKey]: cur.accessLevel }), {}) || {}
    )

    const isImplicitFullAccess = user.globalRole === "SUPER_ADMIN"

    const handleSave = async () => {
        setLoading(true)
        try {
            const data = Object.entries(permissions)
                .filter(([, accessLevel]) => accessLevel && accessLevel !== "NONE")
                .map(([moduleKey, accessLevel]) => ({
                    moduleKey,
                    accessLevel: accessLevel as "READ" | "WRITE" | "APPROVE" | "ADMIN"
                }))
            await updateUserModuleAccess(user.id, data)
            toast.success("Permissions updated")
            onUpdate()
            setOpen(false)
        } catch (error) {
            toast.error("Failed to update permissions")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 flex gap-2">
                    <Shield className="h-4 w-4" />
                    Permissions
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Module Permissions</DialogTitle>
                    <DialogDescription>
                        Manage module-specific access for <strong>{user.fullName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {isImplicitFullAccess && (
                    <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-3">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>{user.globalRole === "SUPER_ADMIN" ? "Super Admins" : "Admins"}</strong> automatically have full access to all modules.
                            The settings below only apply when the user&apos;s role changes.
                        </p>
                    </div>
                )}

                <div className="space-y-3 py-2">
                    {MODULES.map((mod) => (
                        <div key={mod.key} className="space-y-1">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <span className="text-sm font-medium">{mod.label}</span>
                                    {isImplicitFullAccess && (
                                        <span className="ml-2 text-[10px] font-semibold text-green-700 bg-green-100 rounded-full px-1.5 py-0.5 border border-green-200">
                                            FULL ACCESS
                                        </span>
                                    )}
                                </div>
                                <Select
                                    value={isImplicitFullAccess ? "ADMIN" : (permissions[mod.key] || "NONE")}
                                    onValueChange={(val) => setPermissions(prev => {
                                        const next = { ...prev }
                                        if (val === "NONE") {
                                            delete next[mod.key]
                                        } else {
                                            next[mod.key] = val
                                        }
                                        return next
                                    })}
                                    disabled={isImplicitFullAccess}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="No Access" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">No Access</SelectItem>
                                        {mod.levels.map(level => (
                                            <SelectItem key={level} value={level}>
                                                {level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* Show description of selected level */}
                            {!isImplicitFullAccess && permissions[mod.key] && LEVEL_DESCRIPTIONS[mod.key]?.[permissions[mod.key]] && (
                                <p className="text-[11px] text-muted-foreground pl-1">
                                    {LEVEL_DESCRIPTIONS[mod.key][permissions[mod.key]]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading || isImplicitFullAccess}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
