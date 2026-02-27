import prisma from "@/lib/prisma"

export enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    LOGIN = "LOGIN",
}

export enum EntityType {
    USER = "USER",
    RECOVERY = "RECOVERY",
    APPLICATION = "APPLICATION",
    REWARD = "REWARD",
    HIERARCHY = "HIERARCHY",
}

export async function logAudit({
    userId,
    action,
    entityType,
    entityId,
    metadata,
}: {
    userId: string
    action: AuditAction
    entityType: EntityType
    entityId?: string
    metadata?: Record<string, any>
}) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                metadata: metadata ? JSON.stringify(metadata) : undefined,
            },
        })
    } catch (error) {
        console.error("Failed to create audit log:", error)
        // We don't want to throw here to prevent blocking the main flow
    }
}
