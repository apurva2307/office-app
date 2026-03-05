import { getRewards, getUsers } from "@/modules/rewards/actions"
import { checkModuleAccess } from "@/modules/users/actions"
import { NominateDialog } from "@/modules/rewards/components/NominateDialog"
import { RewardActions } from "@/modules/rewards/components/RewardActions"
import { Award, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AccessLevel } from "@prisma/client"

export default async function RewardsPage() {
    const hasAccess = await checkModuleAccess("reward")
    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <ShieldAlert className="h-16 w-16 text-red-500" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this module.</p>
            </div>
        )
    }

    const canApprove = await checkModuleAccess("reward", AccessLevel.APPROVE)

    const rewards = await getRewards()
    const users = await getUsers()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Rewards & Recognition</h2>
                    <p className="text-muted-foreground">Celebrate good work and achievements.</p>
                </div>
                <NominateDialog users={users} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rewards.map((reward) => (
                    <Card key={reward.id} className={reward.status === 'APPROVED' ? 'border-yellow-400 bg-yellow-50/50' : ''}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {reward.category}
                            </CardTitle>
                            {reward.status === 'APPROVED' && <Award className="h-4 w-4 text-yellow-600" />}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{reward.nominee.fullName}</div>
                            <p className="text-xs text-muted-foreground mb-4">
                                Nominated by {reward.nominator.fullName}
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                                &quot;{reward.reason}&quot;
                            </p>
                            <div className="flex flex-col gap-2">
                                <div>
                                    <Badge variant={reward.status === 'APPROVED' ? 'default' : 'secondary'}>
                                        {reward.status}
                                    </Badge>
                                </div>
                                {canApprove && reward.status === 'NOMINATED' && (
                                    <RewardActions rewardId={reward.id} />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
