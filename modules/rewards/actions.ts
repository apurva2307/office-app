'use server'

import prisma from "@/lib/prisma"
import { RewardStatus, AccessLevel } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { logAudit, AuditAction, EntityType } from "@/modules/core/audit.service"
import { checkModuleAccess } from "@/modules/users/actions"

// Types
export type NominateRewardInput = {
    nomineeId: string
    reason: string
    category: string // e.g., "Innovation", "Hard Work", "Team Spirit"
}

export type ReviewRewardInput = {
    id: string
    status: RewardStatus
}

// Actions

export async function nominateReward(data: NominateRewardInput) {
    const userId = await checkModuleAccess("reward", AccessLevel.WRITE, true)
    if (!userId) {
        throw new Error("Unauthorized: Insufficient permissions to nominate rewards")
    }

    try {
        const nomination = await prisma.rewardNomination.create({
            data: {
                nominatorId: userId,
                nomineeId: data.nomineeId,
                reason: data.reason,
                category: data.category,
                status: RewardStatus.NOMINATED,
            },
        })

        await logAudit({
            userId,
            action: AuditAction.CREATE,
            entityType: EntityType.REWARD,
            entityId: nomination.id,
            metadata: { category: nomination.category, nomineeId: nomination.nomineeId }
        })

        revalidatePath("/dashboard/rewards")
        return { success: true, data: nomination }
    } catch (error) {
        console.error("Failed to nominate reward:", error)
        return { success: false, error: "Failed to nominate reward" }
    }
}

export async function reviewReward(data: ReviewRewardInput) {
    const userId = await checkModuleAccess("reward", AccessLevel.APPROVE, true)
    if (!userId) {
        throw new Error("Unauthorized: Insufficient permissions to review rewards")
    }

    try {
        const reward = await prisma.rewardNomination.update({
            where: { id: data.id },
            data: {
                status: data.status,
                approvedAt: data.status === 'APPROVED' ? new Date() : null,
            },
        })

        await logAudit({
            userId,
            action: data.status === 'APPROVED' ? AuditAction.APPROVE : AuditAction.REJECT,
            entityType: EntityType.REWARD,
            entityId: reward.id,
        })

        revalidatePath("/dashboard/rewards")
        return { success: true, data: reward }
    } catch (error) {
        console.error("Failed to review reward:", error)
        return { success: false, error: "Failed to review reward" }
    }
}

export async function getRewards() {
    const userId = await checkModuleAccess("reward", AccessLevel.READ, true)
    if (!userId) return []

    // Determine visibility based on role
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { globalRole: true }
    })

    let whereFilter: any = {}

    if (user?.globalRole === 'EMPLOYEE') {
        // Employees see only rewards where they are nominee or nominator
        whereFilter = { OR: [{ nomineeId: userId }, { nominatorId: userId }] }
    } else if (user?.globalRole === 'SECTION_OFFICER') {
        // Section Officers see their own + subordinates' rewards
        const { getSubordinateUserIds } = await import("@/modules/hierarchy/hierarchy.service")
        const subordinateIds = await getSubordinateUserIds(userId)
        const visibleIds = [userId, ...subordinateIds]
        whereFilter = { OR: [{ nomineeId: { in: visibleIds } }, { nominatorId: { in: visibleIds } }] }
    }
    // ADMIN and SUPER_ADMIN see all

    return prisma.rewardNomination.findMany({
        where: whereFilter,
        include: {
            nominee: { select: { fullName: true, department: true } },
            nominator: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function getUsers() {
    // Helper to list users for the dropdown
    return prisma.user.findMany({
        select: { id: true, fullName: true, email: true }
    })
}
