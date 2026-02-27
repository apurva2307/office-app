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
import { CreateRecoveryForm } from "@/modules/recovery/components/CreateRecoveryForm"

type UserOption = {
    id: string
    fullName: string
    email: string
}

export function NewRecoveryDialog({ users }: { users: UserOption[] }) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Case
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Recovery Case</DialogTitle>
                    <DialogDescription>
                        Enter the details of the recovery.
                    </DialogDescription>
                </DialogHeader>
                <CreateRecoveryForm users={users} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
