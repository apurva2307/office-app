'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Shield, Check, Loader2 } from "lucide-react"
import { updateUserModuleAccess } from "../actions"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const MODULES = [
    { key: "recovery", label: "Recovery Tracking" },
    { key: "application", label: "Leave & Applications" },
    { key: "reward", label: "Rewards & Recognition" },
    { key: "users", label: "User Management" },
]

const ACCESS_LEVELS = ["READ", "WRITE", "APPROVE", "ADMIN"]

export function ModuleAccessDialog({ user, onUpdate }: { user: any, onUpdate: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [permissions, setPermissions] = useState<Record<string, string>>(
        user.moduleAccess?.reduce((acc: any, cur: any) => ({ ...acc, [cur.moduleKey]: cur.accessLevel }), {}) || {}
    )

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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Module Permissions</DialogTitle>
                    <DialogDescription>
                        Manage module-specific access for <strong>{user.fullName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {MODULES.map((mod) => (
                        <div key={mod.key} className="flex items-center justify-between gap-4">
                            <span className="text-sm font-medium">{mod.label}</span>
                            <Select
                                value={permissions[mod.key] || "NONE"}
                                onValueChange={(val) => setPermissions(prev => {
                                    const next = { ...prev }
                                    if (val === "NONE") {
                                        delete next[mod.key]
                                    } else {
                                        next[mod.key] = val
                                    }
                                    return next
                                })}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="No Access" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">No Access</SelectItem>
                                    {ACCESS_LEVELS.map(level => (
                                        <SelectItem key={level} value={level}>{level}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
