'use server'

import prisma from "@/lib/prisma"
import { GlobalRole, RelationshipType } from "@prisma/client"
import { Prisma } from "@prisma/client"

// ─── Types ──────────────────────────────────────────────────────────────────────

export type HierarchyNode = {
    id: string
    fullName: string
    email: string
    globalRole: GlobalRole
    department: string | null
    children: HierarchyNode[]
}

// ─── Recursive Subordinate Query (CTE) ─────────────────────────────────────────

/**
 * Get all subordinate user IDs recursively using a Postgres CTE.
 * Walks the full UserHierarchy tree downward from the given userId.
 */
export async function getSubordinateUserIds(userId: string): Promise<string[]> {
    const result = await prisma.$queryRaw<{ subordinateId: string }[]>(
        Prisma.sql`
            WITH RECURSIVE subtree AS (
                SELECT "subordinateId"
                FROM "UserHierarchy"
                WHERE "supervisorId" = ${userId}
                UNION
                SELECT h."subordinateId"
                FROM "UserHierarchy" h
                INNER JOIN subtree s ON h."supervisorId" = s."subordinateId"
            )
            SELECT DISTINCT "subordinateId" FROM subtree
        `
    )
    return result.map(r => r.subordinateId)
}

// ─── Hierarchy Tree Builder ─────────────────────────────────────────────────────

/**
 * Build a nested tree of subordinates starting from a given user.
 */
export async function getHierarchyTree(rootUserId: string): Promise<HierarchyNode | null> {
    const rootUser = await prisma.user.findUnique({
        where: { id: rootUserId },
        select: { id: true, fullName: true, email: true, globalRole: true, department: true }
    })
    if (!rootUser) return null

    // Get all hierarchy edges from this root downward
    const subordinateIds = await getSubordinateUserIds(rootUserId)
    const allUserIds = [rootUserId, ...subordinateIds]

    // Fetch all users and edges in bulk
    const [users, edges] = await Promise.all([
        prisma.user.findMany({
            where: { id: { in: allUserIds } },
            select: { id: true, fullName: true, email: true, globalRole: true, department: true }
        }),
        prisma.userHierarchy.findMany({
            where: {
                supervisorId: { in: allUserIds },
                subordinateId: { in: allUserIds }
            },
            select: { supervisorId: true, subordinateId: true }
        })
    ])

    // Build adjacency map
    const childrenMap = new Map<string, string[]>()
    for (const edge of edges) {
        const list = childrenMap.get(edge.supervisorId) || []
        if (!list.includes(edge.subordinateId)) {
            list.push(edge.subordinateId)
        }
        childrenMap.set(edge.supervisorId, list)
    }

    const userMap = new Map(users.map(u => [u.id, u]))

    // Recursive tree builder
    function buildNode(userId: string, visited: Set<string>): HierarchyNode | null {
        if (visited.has(userId)) return null // prevent cycles
        visited.add(userId)

        const user = userMap.get(userId)
        if (!user) return null

        const childIds = childrenMap.get(userId) || []
        const children: HierarchyNode[] = []
        for (const childId of childIds) {
            const childNode = buildNode(childId, visited)
            if (childNode) children.push(childNode)
        }

        return { ...user, children }
    }

    return buildNode(rootUserId, new Set())
}

// ─── Validation ─────────────────────────────────────────────────────────────────

/**
 * Valid role → relationship type mappings.
 * Defines which supervisor role + subordinate role = which relationship type is allowed.
 */
const VALID_ASSIGNMENTS: Record<RelationshipType, { supervisor: GlobalRole; subordinate: GlobalRole }> = {
    EMPLOYEE_TO_SO: { supervisor: "SECTION_OFFICER", subordinate: "EMPLOYEE" },
    EMPLOYEE_TO_ADMIN: { supervisor: "ADMIN", subordinate: "EMPLOYEE" },
    SO_TO_ADMIN: { supervisor: "ADMIN", subordinate: "SECTION_OFFICER" },
    ADMIN_TO_SUPERADMIN: { supervisor: "SUPER_ADMIN", subordinate: "ADMIN" },
}

/**
 * Validate that a proposed assignment is allowed.
 * Returns an error string if invalid, null if valid.
 */
export async function validateAssignment(
    supervisorId: string,
    subordinateId: string,
    relationshipType: RelationshipType
): Promise<string | null> {
    // 1. No self-assignment
    if (supervisorId === subordinateId) {
        return "Cannot assign a user as their own supervisor"
    }

    // 2. Fetch both users
    const [supervisor, subordinate] = await Promise.all([
        prisma.user.findUnique({ where: { id: supervisorId }, select: { globalRole: true, fullName: true } }),
        prisma.user.findUnique({ where: { id: subordinateId }, select: { globalRole: true, fullName: true } }),
    ])

    if (!supervisor) return "Supervisor not found"
    if (!subordinate) return "Subordinate not found"

    // 3. Check role compatibility
    const expected = VALID_ASSIGNMENTS[relationshipType]
    if (supervisor.globalRole !== expected.supervisor) {
        return `Supervisor must have role ${expected.supervisor} for ${relationshipType}, but has ${supervisor.globalRole}`
    }
    if (subordinate.globalRole !== expected.subordinate) {
        return `Subordinate must have role ${expected.subordinate} for ${relationshipType}, but has ${subordinate.globalRole}`
    }

    // 4. Check for duplicate
    const existing = await prisma.userHierarchy.findUnique({
        where: {
            supervisorId_subordinateId_relationshipType: {
                supervisorId,
                subordinateId,
                relationshipType
            }
        }
    })
    if (existing) return "This mapping already exists"

    // 5. Check for circular dependency: subordinate must not already be an ancestor of supervisor
    const subordinateTree = await getSubordinateUserIds(subordinateId)
    if (subordinateTree.includes(supervisorId)) {
        return "Circular hierarchy detected: the subordinate is already an ancestor of the supervisor"
    }

    return null // valid
}

/**
 * Get direct subordinates for a given user (not recursive).
 */
export async function getDirectSubordinates(userId: string) {
    return prisma.userHierarchy.findMany({
        where: { supervisorId: userId },
        include: {
            subordinate: {
                select: { id: true, fullName: true, email: true, globalRole: true, department: true }
            }
        },
        orderBy: { createdAt: "desc" }
    })
}

/**
 * Get direct supervisors for a given user.
 */
export async function getDirectSupervisors(userId: string) {
    return prisma.userHierarchy.findMany({
        where: { subordinateId: userId },
        include: {
            supervisor: {
                select: { id: true, fullName: true, email: true, globalRole: true, department: true }
            }
        }
    })
}
