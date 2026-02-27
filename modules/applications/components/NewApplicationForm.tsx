'use client'

import { useState, useRef } from "react"
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
import { submitApplication } from "@/modules/applications/actions"
import { useRouter } from "next/navigation"
import { Loader2, Paperclip, X } from "lucide-react"
import { ApplicationType } from "@prisma/client"

const formSchema = z.object({
    type: z.nativeEnum(ApplicationType),
    subject: z.string().min(3, "Subject is required"),
    content: z.string().min(10, "Content must be at least 10 characters"),
})

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export function NewApplicationForm({ onSuccess }: { onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            subject: "",
            content: "",
            type: ApplicationType.GENERAL
        },
    })

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(e.target.files || [])
        const valid = selected.filter(f => f.size <= MAX_FILE_SIZE)
        if (valid.length < selected.length) {
            alert("Some files exceed the 10MB size limit and were skipped.")
        }
        setFiles(prev => [...prev, ...valid])
        // Reset input so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    function removeFile(index: number) {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    function formatFileSize(bytes: number) {
        if (bytes < 1024) return bytes + " B"
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
        return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const result = await submitApplication(values)
            if (result.success && result.applicationId) {
                // Upload files if any
                if (files.length > 0) {
                    for (const file of files) {
                        const formData = new FormData()
                        formData.append("file", file)
                        formData.append("applicationId", result.applicationId)

                        const uploadRes = await fetch("/api/upload", {
                            method: "POST",
                            body: formData,
                        })

                        if (!uploadRes.ok) {
                            const err = await uploadRes.json()
                            console.error("Upload failed for", file.name, err)
                        }
                    }
                }

                form.reset()
                setFiles([])
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
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Application Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={ApplicationType.GENERAL}>General</SelectItem>
                                    <SelectItem value={ApplicationType.GRIEVANCE}>Grievance</SelectItem>
                                    <SelectItem value={ApplicationType.OTHERS}>Others</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Annual Leave, New Monitor..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Details</FormLabel>
                            <FormControl>
                                <Textarea className="min-h-[100px]" placeholder="Provide full details..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* File attachment section */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Attachments (optional)</label>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="mr-2 h-4 w-4" />
                            Attach Files
                        </Button>
                        <span className="text-xs text-muted-foreground">Max 10MB per file</span>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    {files.length > 0 && (
                        <div className="space-y-1 mt-2">
                            {files.map((file, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5 text-sm">
                                    <span className="truncate mr-2">{file.name} <span className="text-muted-foreground">({formatFileSize(file.size)})</span></span>
                                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeFile(i)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </form>
        </Form>
    )
}
