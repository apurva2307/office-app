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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createRecoveryCase } from "@/modules/recovery/actions"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    amount: z.preprocess((val) => Number(val), z.number().min(0.01, "Amount must be greater than 0")),
    employeeNumber: z.string().min(1, "Employee number is required"),
    employeeName: z.string().min(1, "Employee name is required"),
    employeeDesignation: z.string().min(1, "Employee designation is required"),
    assignedToUserId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type UserOption = {
    id: string
    fullName: string
    email: string
}

export function CreateRecoveryForm({ onSuccess, users = [] }: { onSuccess?: () => void, users?: UserOption[] }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            amount: 0,
            employeeNumber: "",
            employeeName: "",
            employeeDesignation: "",
            assignedToUserId: undefined,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const result = await createRecoveryCase({
                title: values.title,
                description: values.description,
                amount: values.amount,
                employeeNumber: values.employeeNumber,
                employeeName: values.employeeName,
                employeeDesignation: values.employeeDesignation,
                userId: values.assignedToUserId,
            })
            if (result.success) {
                form.reset()
                router.refresh()
                if (onSuccess) onSuccess()
            } else {
                alert("Error: " + result.error)
            }
        } catch (error) {
            console.error(error)
            alert("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Missing inventory..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount to Recover (₹)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="employeeName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Employee Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="employeeNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Employee Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="EMP001" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="employeeDesignation"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Employee Designation</FormLabel>
                            <FormControl>
                                <Input placeholder="Technical Officer" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {users.length > 0 && (
                    <FormField
                        control={form.control}
                        name="assignedToUserId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assigned To</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a user (optional)" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.fullName} ({user.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Details about the recovery..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Recovery Case
                </Button>
            </form>
        </Form>
    )
}
