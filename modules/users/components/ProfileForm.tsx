'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, User, Mail, Shield, Building } from "lucide-react"
import { updateProfile } from "@/modules/users/actions"
import { useRouter } from "next/navigation"

type ProfileData = {
    fullName: string
    email: string
    globalRole: string
    department: string | null
}

export function ProfileForm({ user }: { user: ProfileData }) {
    const [fullName, setFullName] = useState(user.fullName)
    const [department, setDepartment] = useState(user.department || "")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError("")
        setSuccess(false)
        setLoading(true)

        try {
            const result = await updateProfile({ fullName, department: department || undefined })
            if (result.success) {
                setSuccess(true)
                router.refresh()
                setTimeout(() => setSuccess(false), 3000)
            } else {
                setError(result.error || "Failed to update profile")
            }
        } catch (err) {
            setError("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const roleLabel = user.globalRole.replace(/_/g, " ")

    return (
        <div className="space-y-6">
            {/* Read-only Info */}
            <Card className="max-w-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" /> Account Info
                    </CardTitle>
                    <CardDescription>Your account information. Some fields are managed by your administrator.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <div>
                            <p className="text-xs text-muted-foreground">Role</p>
                            <Badge variant="secondary">{roleLabel}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Editable Fields */}
            <Card className="max-w-lg">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Edit Profile</CardTitle>
                        <CardDescription>Update your name and department.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                required
                                minLength={2}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                placeholder="e.g. Finance, IT"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        {success && (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" /> Profile updated successfully!
                            </p>
                        )}
                    </CardContent>
                    <CardFooter className="mt-4">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
