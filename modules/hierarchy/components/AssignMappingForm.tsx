'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { assignSupervisor } from "@/modules/hierarchy/actions"
import { useRouter } from "next/navigation"
import { Loader2, Link2 } from "lucide-react"

const RELATIONSHIP_LABELS: Record<string, string> = {
    EMPLOYEE_TO_SO: "Employee → Section Officer",
    EMPLOYEE_TO_ADMIN: "Employee → Admin",
    SO_TO_ADMIN: "Section Officer → Admin",
    ADMIN_TO_SUPERADMIN: "Admin → Super Admin",
}

// Role filters for dropdowns based on relationship type
const RELATIONSHIP_ROLES: Record<string, { supervisor: string; subordinate: string }> = {
    EMPLOYEE_TO_SO: { supervisor: "SECTION_OFFICER", subordinate: "EMPLOYEE" },
    EMPLOYEE_TO_ADMIN: { supervisor: "ADMIN", subordinate: "EMPLOYEE" },
    SO_TO_ADMIN: { supervisor: "ADMIN", subordinate: "SECTION_OFFICER" },
    ADMIN_TO_SUPERADMIN: { supervisor: "SUPER_ADMIN", subordinate: "ADMIN" },
}

type UserOption = {
    id: string
    fullName: string
    email: string
    globalRole: string
}

const formSchema = z.object({
    relationshipType: z.enum(["EMPLOYEE_TO_SO", "EMPLOYEE_TO_ADMIN", "SO_TO_ADMIN", "ADMIN_TO_SUPERADMIN"]),
    supervisorId: z.string().min(1, "Select a supervisor"),
    subordinateId: z.string().min(1, "Select a subordinate"),
})

export function AssignMappingForm({
    users,
    currentRole,
    onSuccess,
}: {
    users: UserOption[]
    currentRole: string
    onSuccess?: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // Admins can't create ADMIN_TO_SUPERADMIN
    const availableTypes = Object.keys(RELATIONSHIP_LABELS).filter(type => {
        if (currentRole === "ADMIN" && type === "ADMIN_TO_SUPERADMIN") return false
        return true
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            relationshipType: undefined,
            supervisorId: "",
            subordinateId: "",
        },
    })

    const selectedType = form.watch("relationshipType")
    const roleFilter = selectedType ? RELATIONSHIP_ROLES[selectedType] : null

    const supervisorOptions = roleFilter
        ? users.filter(u => u.globalRole === roleFilter.supervisor)
        : []

    const subordinateOptions = roleFilter
        ? users.filter(u => u.globalRole === roleFilter.subordinate)
        : []

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        setError(null)
        try {
            const result = await assignSupervisor({
                supervisorId: values.supervisorId,
                subordinateId: values.subordinateId,
                relationshipType: values.relationshipType as any,
            })

            if (result.success) {
                form.reset()
                router.refresh()
                if (onSuccess) onSuccess()
            } else {
                setError(result.error || "Failed to create mapping")
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Relationship Type */}
                <FormField
                    control={form.control}
                    name="relationshipType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Relationship Type</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    field.onChange(value)
                                    // Reset dependent fields
                                    form.setValue("supervisorId", "")
                                    form.setValue("subordinateId", "")
                                }}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select mapping type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableTypes.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {RELATIONSHIP_LABELS[type]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Supervisor */}
                <FormField
                    control={form.control}
                    name="supervisorId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Supervisor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedType}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={selectedType ? "Select supervisor" : "Select type first"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {supervisorOptions.map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.fullName} ({u.email})
                                        </SelectItem>
                                    ))}
                                    {supervisorOptions.length === 0 && selectedType && (
                                        <div className="py-2 px-3 text-xs text-gray-400">No matching users</div>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Subordinate */}
                <FormField
                    control={form.control}
                    name="subordinateId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subordinate</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedType}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={selectedType ? "Select subordinate" : "Select type first"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {subordinateOptions.map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.fullName} ({u.email})
                                        </SelectItem>
                                    ))}
                                    {subordinateOptions.length === 0 && selectedType && (
                                        <div className="py-2 px-3 text-xs text-gray-400">No matching users</div>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Link2 className="mr-2 h-4 w-4" />
                    )}
                    Assign Mapping
                </Button>
            </form>
        </Form>
    )
}
