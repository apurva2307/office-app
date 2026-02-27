'use server'

import prisma from "@/lib/prisma"
import { RelationshipType, AccessLevel } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { logAudit, AuditAction, EntityType } from "@/modules/core/audit.service"
import { checkModuleAccess } from "@/modules/users/actions"
import { auth } from "@/modules/core/auth"
import {
    validateAssignment,
    getSubordinateUserIds,
    getHierarchyTree,
    getDirectSubordinates,
    getDirectSupervisors,
} from "./hierarchy.service"

// ─── Assign Supervisor ──────────────────────────────────────────────────────────

export async function assignSupervisor(data: {
    supervisorId: string
    subordinateId: string
    relationshipType: RelationshipType
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const role = session.user.role

    // Only ADMIN and SUPER_ADMIN can assign
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        throw new Error("Only Admins and Super Admins can manage hierarchy")
    }

    // ADMIN cannot create ADMIN_TO_SUPERADMIN mappings
    if (role === "ADMIN" && data.relationshipType === "ADMIN_TO_SUPERADMIN") {
        throw new Error("Only Super Admins can assign Admin → Super Admin mappings")
    }

    // Validate the assignment
    const error = await validateAssignment(data.supervisorId, data.subordinateId, data.relationshipType)
    if (error) {
        return { success: false, error }
    }

    try {
        const mapping = await prisma.userHierarchy.create({
            data: {
                supervisorId: data.supervisorId,
                subordinateId: data.subordinateId,
                relationshipType: data.relationshipType,
            },
        })

        await logAudit({
            userId: session.user.id,
            action: AuditAction.CREATE,
            entityType: EntityType.HIERARCHY,
            entityId: mapping.id,
            metadata: {
                supervisorId: data.supervisorId,
                subordinateId: data.subordinateId,
                relationshipType: data.relationshipType,
            },
        })

        revalidatePath("/dashboard/hierarchy")
        return { success: true, data: mapping }
    } catch (error: any) {
        if (error.code === "P2002") {
            return { success: false, error: "This mapping already exists" }
        }
        console.error("Failed to assign supervisor:", error)
        return { success: false, error: "Failed to create mapping" }
    }
}

// ─── Remove Mapping ─────────────────────────────────────────────────────────────

export async function removeMapping(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const role = session.user.role

    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        throw new Error("Only Admins and Super Admins can manage hierarchy")
    }

    const mapping = await prisma.userHierarchy.findUnique({ where: { id } })
    if (!mapping) return { success: false, error: "Mapping not found" }

    // ADMIN can only remove mappings where they are the supervisor
    if (role === "ADMIN" && mapping.supervisorId !== session.user.id) {
        // Check if the supervisor is in the admin's subtree
        const subordinates = await getSubordinateUserIds(session.user.id)
        if (!subordinates.includes(mapping.supervisorId)) {
            throw new Error("You can only remove mappings within your supervision tree")
        }
    }

    await prisma.userHierarchy.delete({ where: { id } })

    await logAudit({
        userId: session.user.id,
        action: AuditAction.DELETE,
        entityType: EntityType.HIERARCHY,
        entityId: id,
        metadata: {
            supervisorId: mapping.supervisorId,
            subordinateId: mapping.subordinateId,
            relationshipType: mapping.relationshipType,
        },
    })

    revalidatePath("/dashboard/hierarchy")
    return { success: true }
}

// ─── Get Hierarchy Tree ─────────────────────────────────────────────────────────

export async function fetchHierarchyTree(userId?: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const role = session.user.role
    const targetUserId = userId || session.user.id

    // Non-admin roles can only see their own tree
    if (role !== "SUPER_ADMIN" && role !== "ADMIN" && targetUserId !== session.user.id) {
        throw new Error("You can only view your own hierarchy")
    }

    return getHierarchyTree(targetUserId)
}

// ─── Get My Subordinates ────────────────────────────────────────────────────────

export async function fetchMySubordinates() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return getDirectSubordinates(session.user.id)
}

// ─── Get My Supervisors ─────────────────────────────────────────────────────────

export async function fetchMySupervisors() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    return getDirectSupervisors(session.user.id)
}

// ─── Get All Mappings (Admin view) ──────────────────────────────────────────────

export async function getAllMappings() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const role = session.user.role
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    // SUPER_ADMIN sees all, ADMIN sees only their subtree
    let whereFilter = {}
    if (role === "ADMIN") {
        const subordinateIds = await getSubordinateUserIds(session.user.id)
        const visibleIds = [session.user.id, ...subordinateIds]
        whereFilter = {
            OR: [
                { supervisorId: { in: visibleIds } },
                { subordinateId: { in: visibleIds } },
            ],
        }
    }

    return prisma.userHierarchy.findMany({
        where: whereFilter,
        include: {
            supervisor: {
                select: { id: true, fullName: true, email: true, globalRole: true, department: true },
            },
            subordinate: {
                select: { id: true, fullName: true, email: true, globalRole: true, department: true },
            },
        },
        orderBy: { createdAt: "desc" },
    })
}
