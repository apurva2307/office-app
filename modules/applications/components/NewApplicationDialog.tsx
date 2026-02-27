'use client'

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { NewApplicationForm } from "@/modules/applications/components/NewApplicationForm"

export function NewApplicationDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> New Application</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Submit Application</DialogTitle>
                    <DialogDescription>
                        Fill out the form below to submit a new request.
                    </DialogDescription>
                </DialogHeader>
                <NewApplicationForm onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
