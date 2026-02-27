'use server'

import prisma from "@/lib/prisma"
import { RecoveryStatus, AccessLevel } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { logAudit, AuditAction, EntityType } from "@/modules/core/audit.service"
import { checkModuleAccess } from "@/modules/users/actions"

// Types
export type CreateRecoveryInput = {
    title: string
    description: string
    amount: number
    employeeNumber?: string
    employeeName?: string
    employeeDesignation?: string
    userId?: string // Optional: assign to user immediately
}

export type UpdateRecoveryStatusInput = {
    id: string
    status: RecoveryStatus
    note?: string
}

// Actions

export async function createRecoveryCase(data: CreateRecoveryInput) {
    const userId = await checkModuleAccess("recovery", AccessLevel.WRITE, true)
    if (!userId) {
        throw new Error("Unauthorized: Insufficient permissions to create recovery cases")
    }

    try {
        const recovery = await prisma.recoveryCase.create({
            data: {
                title: data.title,
                description: data.description,
                amount: data.amount,
                employeeNumber: data.employeeNumber,
                employeeName: data.employeeName,
                employeeDesignation: data.employeeDesignation,
                createdByUserId: userId,
                assignedToUserId: data.userId,
                status: RecoveryStatus.DETECTED,
                timeline: {
                    create: {
                        createdById: userId,
                        statusChangeTo: RecoveryStatus.DETECTED,
                        note: "Recovery Case Created",
                    }
                }
            },
        })

        await logAudit({
            userId,
            action: AuditAction.CREATE,
            entityType: EntityType.RECOVERY,
            entityId: recovery.id,
            metadata: { title: recovery.title, amount: recovery.amount }
        })

        revalidatePath("/dashboard/recovery")
        return {
            success: true,
            data: {
                ...recovery,
                amount: Number(recovery.amount)
            }
        }
    } catch (error) {
        console.error("Failed to create recovery case:", error)
        return { success: false, error: "Failed to create recovery case" }
    }
}

export async function updateRecoveryStatus(data: UpdateRecoveryStatusInput) {
    const userId = await checkModuleAccess("recovery", AccessLevel.WRITE, true)
    if (!userId) {
        throw new Error("Unauthorized: Insufficient permissions to update recovery cases")
    }

    try {
        const currentCase = await prisma.recoveryCase.findUnique({
            where: { id: data.id }
        })

        if (!currentCase) throw new Error("Case not found")

        const recovery = await prisma.recoveryCase.update({
            where: { id: data.id },
            data: {
                status: data.status,
                updatedAt: new Date(),
                timeline: {
                    create: {
                        createdById: userId,
                        statusChangeTo: data.status,
                        note: data.note || `Status updated to ${data.status}`,
                    }
                }
            }
        })

        await logAudit({
            userId,
            action: AuditAction.UPDATE,
            entityType: EntityType.RECOVERY,
            entityId: recovery.id,
            metadata: {
                oldStatus: currentCase.status,
                newStatus: data.status,
                note: data.note
            }
        })

        revalidatePath("/dashboard/recovery")
        revalidatePath(`/dashboard/recovery/${data.id}`)
        return { success: true, data: recovery }
    } catch (error) {
        console.error("Failed to update status:", error)
        return { success: false, error: "Failed to update status" }
    }
}

export async function getRecoveries(filter?: { status?: RecoveryStatus }) {
    const userId = await checkModuleAccess("recovery", AccessLevel.READ, true)
    if (!userId) return []

    // Determine visibility based on role
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { globalRole: true }
    })

    let whereFilter: any = { ...filter }

    if (user?.globalRole === 'EMPLOYEE') {
        // Employees see only their own cases
        whereFilter = { ...whereFilter, OR: [{ createdByUserId: userId }, { assignedToUserId: userId }] }
    } else if (user?.globalRole === 'SECTION_OFFICER') {
        // Section Officers see their own + mapped subordinates' cases
        const { getSubordinateUserIds } = await import("@/modules/hierarchy/hierarchy.service")
        const subordinateIds = await getSubordinateUserIds(userId)
        const visibleIds = [userId, ...subordinateIds]
        whereFilter = {
            ...whereFilter,
            OR: [
                { createdByUserId: { in: visibleIds } },
                { assignedToUserId: { in: visibleIds } }
            ]
        }
    }
    // ADMIN and SUPER_ADMIN see all (no additional filter)

    const recoveries = await prisma.recoveryCase.findMany({
        where: whereFilter,
        include: {
            assignedTo: { select: { fullName: true, email: true } },
            createdBy: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    return recoveries.map(r => ({
        ...r,
        amount: Number(r.amount)
    }))
}

export async function getRecoveryById(id: string) {
    const hasAccess = await checkModuleAccess("recovery", AccessLevel.READ)
    if (!hasAccess) return null

    const recovery = await prisma.recoveryCase.findUnique({
        where: { id },
        include: {
            assignedTo: { select: { id: true, fullName: true, email: true } },
            createdBy: { select: { id: true, fullName: true } },
            timeline: {
                include: {
                    createdBy: { select: { fullName: true } }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!recovery) return null

    return {
        ...recovery,
        amount: Number(recovery.amount)
    }
}
