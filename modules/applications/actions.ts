'use server'

import prisma from "@/lib/prisma"
import { ApplicationStatus, ApplicationType, AccessLevel } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { logAudit, AuditAction, EntityType } from "@/modules/core/audit.service"
import { checkModuleAccess } from "@/modules/users/actions"

// Types
export type CreateApplicationInput = {
    type: ApplicationType
    subject: string
    content: string
}

export type ReviewApplicationInput = {
    id: string
    status: ApplicationStatus
    comment?: string
}

// Actions

export async function submitApplication(data: CreateApplicationInput) {
    const userId = await checkModuleAccess("application", AccessLevel.WRITE, true)
    if (!userId) {
        throw new Error("Unauthorized: Insufficient permissions to submit applications")
    }

    try {
        // Auto-assign reviewer from hierarchy (first direct supervisor)
        let reviewerId: string | undefined
        const { getDirectSupervisors } = await import("@/modules/hierarchy/hierarchy.service")
        const supervisors = await getDirectSupervisors(userId)
        if (supervisors.length > 0) {
            reviewerId = supervisors[0].supervisorId
        }

        const application = await prisma.application.create({
            data: {
                applicantId: userId,
                type: data.type,
                subject: data.subject,
                content: data.content,
                status: ApplicationStatus.PENDING,
                currentReviewerId: reviewerId,
            },
        })

        await logAudit({
            userId,
            action: AuditAction.CREATE,
            entityType: EntityType.APPLICATION,
            entityId: application.id,
            metadata: { type: application.type, subject: application.subject }
        })

        revalidatePath("/dashboard/applications")
        return { success: true, data: application, applicationId: application.id }
    } catch (error) {
        console.error("Failed to submit application:", error)
        return { success: false, error: "Failed to submit application" }
    }
}

export async function reviewApplication(data: ReviewApplicationInput) {
    const userId = await checkModuleAccess("application", AccessLevel.APPROVE, true)
    if (!userId) {
        throw new Error("Unauthorized: Insufficient permissions to review applications")
    }

    try {
        const application = await prisma.application.update({
            where: { id: data.id },
            data: {
                status: data.status,
                currentReviewerId: userId,
                comments: data.comment ? {
                    create: {
                        authorId: userId,
                        text: data.comment
                    }
                } : undefined
            },
        })

        await logAudit({
            userId,
            action: data.status === ApplicationStatus.APPROVED ? AuditAction.APPROVE : AuditAction.REJECT,
            entityType: EntityType.APPLICATION,
            entityId: application.id,
            metadata: { comment: data.comment }
        })

        revalidatePath("/dashboard/applications")
        return { success: true, data: application }
    } catch (error) {
        console.error("Failed to review application:", error)
        return { success: false, error: "Failed to review application" }
    }
}

export async function getApplications(filter?: { status?: ApplicationStatus, type?: ApplicationType }) {
    const userId = await checkModuleAccess("application", AccessLevel.READ, true)
    if (!userId) return []

    // Determine visibility based on role
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { globalRole: true }
    })

    let whereFilter: any = { ...filter }

    if (user?.globalRole === 'EMPLOYEE') {
        // Employees see only their own applications
        whereFilter = { ...whereFilter, applicantId: userId }
    } else if (user?.globalRole === 'SECTION_OFFICER') {
        // Section Officers see their own + mapped subordinates' applications
        const { getSubordinateUserIds } = await import("@/modules/hierarchy/hierarchy.service")
        const subordinateIds = await getSubordinateUserIds(userId)
        const visibleIds = [userId, ...subordinateIds]
        whereFilter = { ...whereFilter, applicantId: { in: visibleIds } }
    }
    // ADMIN and SUPER_ADMIN see all

    return prisma.application.findMany({
        where: whereFilter,
        include: {
            applicant: { select: { fullName: true, email: true, department: true } },
            currentReviewer: { select: { fullName: true } },
            attachments: { select: { id: true, fileName: true, fileSize: true, mimeType: true } },
        },
        orderBy: { createdAt: 'desc' }
    })
}
