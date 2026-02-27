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
import { NominationForm } from "@/modules/rewards/components/NominationForm"

export function NominateDialog({ users }: { users: any[] }) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Nominate Colleague</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nominate for Reward</DialogTitle>
                    <DialogDescription>
                        Who Went Above and Beyond?
                    </DialogDescription>
                </DialogHeader>
                <NominationForm users={users} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
