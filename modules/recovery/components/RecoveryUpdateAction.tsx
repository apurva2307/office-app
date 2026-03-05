"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Edit2 } from "lucide-react"
import { updateRecoveryStatus } from "@/modules/recovery/actions"
import { RecoveryStatus } from "@prisma/client"
import { toast } from "sonner"

export function RecoveryUpdateAction({
    recoveryId,
    currentStatus
}: {
    recoveryId: string,
    currentStatus: RecoveryStatus
}) {
    const [open, setOpen] = useState(false)
    const [status, setStatus] = useState<RecoveryStatus>(currentStatus)
    const [note, setNote] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const result = await updateRecoveryStatus({ id: recoveryId, status, note })
            if (result.success) {
                toast.success("Recovery status updated successfully")
                setOpen(false)
                setNote("")
            } else {
                toast.error(result.error || "Failed to update status")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Update Status</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Recovery Status</DialogTitle>
                    <DialogDescription>
                        Change the current status and add an optional timeline note.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as RecoveryStatus)}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DETECTED">Detected</SelectItem>
                                <SelectItem value="NOTICE_ISSUED">Notice Issued</SelectItem>
                                <SelectItem value="RECOVERED">Recovered</SelectItem>
                                <SelectItem value="CLOSED">Closed (Waived/Resolved)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="note">Note (Optional)</Label>
                        <Textarea
                            id="note"
                            placeholder="Add details about this status change..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || status === currentStatus}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Status
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
