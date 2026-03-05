"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"
import { reviewReward } from "@/modules/rewards/actions"
import { RewardStatus } from "@prisma/client"
import { toast } from "sonner"

export function RewardActions({ rewardId }: { rewardId: string }) {
    const [loading, setLoading] = useState<RewardStatus | null>(null)

    const handleAction = async (status: RewardStatus) => {
        setLoading(status)
        try {
            const result = await reviewReward({ id: rewardId, status })
            if (result.success) {
                toast.success(`Reward ${status.toLowerCase()} successfully`)
            } else {
                toast.error(result.error || `Failed to ${status.toLowerCase()} reward`)
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => handleAction('APPROVED')}
                disabled={loading !== null}
            >
                {loading === 'APPROVED' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Approve
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleAction('REJECTED')}
                disabled={loading !== null}
            >
                {loading === 'REJECTED' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                Reject
            </Button>
        </div>
    )
}
