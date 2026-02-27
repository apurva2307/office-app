'use client'

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApplicationStatus, ApplicationType } from "@prisma/client"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Check, X, Paperclip, Download } from "lucide-react"
import { reviewApplication } from "@/modules/applications/actions"
import { useRouter } from "next/navigation"

type Attachment = {
    id: string
    fileName: string
    fileSize: number
    mimeType: string
}

export function ApplicationTable({ data, showActions = false }: { data: any[], showActions?: boolean }) {
    const router = useRouter()

    const handleReview = async (id: string, status: "APPROVED" | "REJECTED") => {
        const comment = prompt(status === "APPROVED" ? "Approval Comment (Optional):" : "Rejection Reason:")
        if (comment === null) return;

        await reviewApplication({ id, status, comment: comment || undefined })
        router.refresh()
    }

    function formatFileSize(bytes: number) {
        if (bytes < 1024) return bytes + " B"
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
        return (bytes / (1024 * 1024)).toFixed(1) + " MB"
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Applications</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Applicant</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Files</TableHead>
                            <TableHead>Status</TableHead>
                            {showActions && <TableHead>Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={showActions ? 7 : 6} className="text-center">No applications found</TableCell>
                            </TableRow>
                        ) : data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{format(new Date(item.createdAt), 'MMM d, yyyy')}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{item.applicant.fullName}</span>
                                        <span className="text-xs text-muted-foreground">{item.applicant.department || 'N/A'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{item.type}</Badge>
                                </TableCell>
                                <TableCell>{item.subject}</TableCell>
                                <TableCell>
                                    {item.attachments && item.attachments.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                            {item.attachments.map((att: Attachment) => (
                                                <a
                                                    key={att.id}
                                                    href={`/api/upload/${att.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                                    title={`${att.fileName} (${formatFileSize(att.fileSize)})`}
                                                >
                                                    <Download className="h-3 w-3" />
                                                    <span className="truncate max-w-[100px]">{att.fileName}</span>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        item.status === 'APPROVED' ? 'default' :
                                            item.status === 'REJECTED' ? 'destructive' : 'secondary'
                                    }>
                                        {item.status}
                                    </Badge>
                                </TableCell>
                                {showActions && (
                                    <TableCell>
                                        {item.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => handleReview(item.id, ApplicationStatus.APPROVED)}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="outline" className="h-8 w-8 text-red-600" onClick={() => handleReview(item.id, ApplicationStatus.REJECTED)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
