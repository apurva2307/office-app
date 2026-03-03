'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Loader2 } from "lucide-react"
import { adminEditUser } from "../actions"
import { toast } from "sonner"

export function EditUserDialog({ user, onUpdate }: { user: any, onUpdate: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [fullName, setFullName] = useState(user.fullName)
    const [email, setEmail] = useState(user.email)
    const [designation, setDesignation] = useState(user.designation || "")
    const [department, setDepartment] = useState(user.department || "Accounts")

    const handleSave = async () => {
        setLoading(true)
        try {
            const result = await adminEditUser(user.id, {
                fullName,
                email,
                designation,
                department,
            })
            if (result.success) {
                toast.success("User updated successfully")
                onUpdate()
                setOpen(false)
            } else {
                toast.error(result.error || "Failed to update user")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update user")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v)
            if (v) {
                // Reset to current values when opening
                setFullName(user.fullName)
                setEmail(user.email)
                setDesignation(user.designation || "")
                setDepartment(user.department || "Accounts")
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Edit details for <strong>{user.fullName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-fullName">Full Name</Label>
                        <Input
                            id="edit-fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            minLength={2}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                            id="edit-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-designation">Designation</Label>
                        <Input
                            id="edit-designation"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            placeholder="e.g. Accountant, Clerk, Officer"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-department">Department</Label>
                        <Input
                            id="edit-department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="Accounts"
                            required
                        />
                    </div>
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
