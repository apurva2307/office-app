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
import { Link2 } from "lucide-react"
import { AssignMappingForm } from "./AssignMappingForm"

type UserOption = {
    id: string
    fullName: string
    email: string
    globalRole: string
}

export function AssignMappingDialog({
    users,
    currentRole,
}: {
    users: UserOption[]
    currentRole: string
}) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Link2 className="mr-2 h-4 w-4" /> New Mapping
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Assign Supervisor–Subordinate</DialogTitle>
                    <DialogDescription>
                        Create a new reporting relationship between two users.
                    </DialogDescription>
                </DialogHeader>
                <AssignMappingForm
                    users={users}
                    currentRole={currentRole}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
