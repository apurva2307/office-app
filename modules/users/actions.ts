"use server";

import { auth } from "@/modules/core/auth";
import prisma from "@/lib/prisma";
import { AccessLevel } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { sendWelcomeEmail } from "@/modules/core/email.service";
import { logAudit, AuditAction, EntityType } from "@/modules/core/audit.service";

/**
 * Check if the current user has access to a specific module at the required level.
 * Super Admins and Admins always have full access.
 * 
 * @param returnUserId - If true, returns the userId string on success instead of boolean
 * @returns boolean | string (userId) | false
 */
export async function checkModuleAccess(moduleKey: string, requiredLevel?: AccessLevel, returnUserId?: true): Promise<string | false>;
export async function checkModuleAccess(moduleKey: string, requiredLevel?: AccessLevel, returnUserId?: false): Promise<boolean>;
export async function checkModuleAccess(moduleKey: string, requiredLevel?: AccessLevel): Promise<boolean>;
export async function checkModuleAccess(moduleKey: string, requiredLevel: AccessLevel = AccessLevel.READ, returnUserId: boolean = false): Promise<boolean | string> {
  const session = await auth()
  if (!session?.user?.id) return returnUserId ? false : false

  // Super Admins and Admins always have full access
  if (session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN') {
    return returnUserId ? session.user.id : true
  }

  // Use module access data embedded in the JWT session instead of hitting the DB again
  const moduleAccess = session.user.moduleAccess?.find((a: any) => a.moduleKey === moduleKey)
  if (!moduleAccess) return returnUserId ? false : false

  const levels = [AccessLevel.READ, AccessLevel.WRITE, AccessLevel.APPROVE, AccessLevel.ADMIN]
  const userLevelIndex = levels.indexOf(moduleAccess.accessLevel as any)
  const requiredLevelIndex = levels.indexOf(requiredLevel)

  const hasAccess = userLevelIndex >= requiredLevelIndex
  if (!hasAccess) return returnUserId ? false : false

  return returnUserId ? session.user.id : true
}

export async function getUsers() {
  const userId = await checkModuleAccess("users", AccessLevel.READ, true)
  if (!userId) {
    throw new Error("Unauthorized: No access to User Management");
  }

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { globalRole: true } })

  // Filter by hierarchy — only show subordinates + self for non-SUPER_ADMIN
  let whereFilter: any = {}
  if (caller?.globalRole !== 'SUPER_ADMIN') {
    const { getSubordinateUserIds } = await import("@/modules/hierarchy/hierarchy.service")
    const subordinateIds = await getSubordinateUserIds(userId)
    const visibleIds = [userId, ...subordinateIds]
    whereFilter = { id: { in: visibleIds } }
  }
  // SUPER_ADMIN sees all users

  return prisma.user.findMany({
    where: whereFilter,
    select: {
      id: true,
      email: true,
      fullName: true,
      designation: true,
      globalRole: true,
      department: true,
      createdAt: true,
      moduleAccess: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// Lightweight user list for dropdowns — accessible to any authenticated user
export async function getUsersForDropdown() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
    },
    orderBy: { fullName: "asc" },
  });
}

export async function updateUserModuleAccess(userId: string, moduleAccess: { moduleKey: string, accessLevel: "READ" | "WRITE" | "APPROVE" | "ADMIN" }[]) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Only Super Admins can manage core permissions");
  }

  // Use a transaction to update access
  const result = await prisma.$transaction(async (tx) => {
    // Delete existing access
    await tx.moduleAccess.deleteMany({
      where: { userId }
    });

    // Create new access
    if (moduleAccess.length > 0) {
      await tx.moduleAccess.createMany({
        data: moduleAccess.map(access => ({
          userId,
          moduleKey: access.moduleKey,
          accessLevel: access.accessLevel
        }))
      });
    }

    return { success: true };
  });

  await logAudit({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entityType: EntityType.USER,
    entityId: userId,
    metadata: { action: "module_access_change", newAccess: moduleAccess }
  })

  revalidatePath('/dashboard/settings')
  return result;
}

export async function getAuditLogs() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  // SUPER_ADMIN sees all logs
  // ADMIN sees only their own + subordinate logs
  let whereFilter: any = {}
  if (session.user.role === 'ADMIN') {
    const { getSubordinateUserIds } = await import("@/modules/hierarchy/hierarchy.service")
    const subordinateIds = await getSubordinateUserIds(session.user.id)
    const visibleIds = [session.user.id, ...subordinateIds]
    whereFilter = { userId: { in: visibleIds } }
  }

  return prisma.auditLog.findMany({
    where: whereFilter,
    include: {
      user: {
        select: {
          fullName: true,
          email: true
        }
      }
    },
    orderBy: { timestamp: "desc" },
    take: 100
  });
}

export async function createUser(data: {
  email: string,
  fullName: string,
  designation: string,
  role: "SUPER_ADMIN" | "ADMIN" | "SECTION_OFFICER" | "EMPLOYEE",
  department?: string,
  password?: string
}) {
  const userId = await checkModuleAccess("users", AccessLevel.WRITE, true)
  if (!userId) {
    throw new Error("Unauthorized: No access to create users")
  }

  // Determine caller's effective access level
  const hasAdminAccess = await checkModuleAccess("users", AccessLevel.ADMIN)

  // WRITE-level users can only create EMPLOYEE/SECTION_OFFICER
  if (!hasAdminAccess && (data.role === 'SUPER_ADMIN' || data.role === 'ADMIN')) {
    throw new Error("Insufficient permissions: Cannot create Admin or Super Admin users")
  }

  const tempPassword = data.password || Math.random().toString(36).slice(-10) + "!"
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        designation: data.designation,
        globalRole: data.role,
        department: data.department || 'Accounts',
        passwordHash
      }
    })

    await logAudit({
      userId,
      action: AuditAction.CREATE,
      entityType: EntityType.USER,
      entityId: user.id,
      metadata: { email: user.email, role: data.role }
    })

    // Send Welcome Email
    const emailResult = await sendWelcomeEmail(data.email, data.fullName, tempPassword)
    if (!emailResult.success) {
      console.error("User created but welcome email failed to send")
    }

    revalidatePath('/dashboard/settings')
    return { success: true, data: user, tempPassword: data.password ? undefined : tempPassword }
  } catch (error: any) {
    console.error(error);
    return {
      success: false,
      error:
        error.code === "P2002"
          ? "Email already exists"
          : "Failed to create user",
    };
  }
}

export async function deleteUser(targetUserId: string) {
  const callerId = await checkModuleAccess("users", AccessLevel.ADMIN, true)
  if (!callerId) {
    throw new Error("Unauthorized: Admin-level User Management access required")
  }

  if (targetUserId === callerId) {
    throw new Error("Cannot delete your own account")
  }

  const userId = targetUserId

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, fullName: true, globalRole: true } })
  if (!target) throw new Error("User not found")

  // Delete all related records in dependency order

  // 1. Application comments authored by user
  await prisma.applicationComment.deleteMany({ where: { authorId: userId } })

  // 2. Attachments on user's applications
  const userAppIds = (await prisma.application.findMany({ where: { applicantId: userId }, select: { id: true } })).map(a => a.id)
  if (userAppIds.length > 0) {
    await prisma.attachment.deleteMany({ where: { applicationId: { in: userAppIds } } })
    // Also delete comments on those applications
    await prisma.applicationComment.deleteMany({ where: { applicationId: { in: userAppIds } } })
  }

  // 3. Applications (as applicant or reviewer)
  await prisma.application.deleteMany({ where: { applicantId: userId } })
  // Unset reviewer reference on other applications
  await prisma.application.updateMany({ where: { currentReviewerId: userId }, data: { currentReviewerId: null } })

  // 4. Recovery timelines created by user
  await prisma.recoveryTimeline.deleteMany({ where: { createdById: userId } })

  // 5. Recovery cases (created by or assigned to)
  // First delete timelines for cases created by user
  const userCaseIds = (await prisma.recoveryCase.findMany({ where: { createdByUserId: userId }, select: { id: true } })).map(c => c.id)
  if (userCaseIds.length > 0) {
    await prisma.recoveryTimeline.deleteMany({ where: { caseId: { in: userCaseIds } } })
  }
  await prisma.recoveryCase.deleteMany({ where: { createdByUserId: userId } })
  // Unset assigned user on other cases
  await prisma.recoveryCase.updateMany({ where: { assignedToUserId: userId }, data: { assignedToUserId: null } })

  // 6. Reward nominations (as nominee or nominator)
  await prisma.rewardNomination.deleteMany({ where: { OR: [{ nomineeId: userId }, { nominatorId: userId }] } })

  // 7. Module access
  await prisma.moduleAccess.deleteMany({ where: { userId } })

  // 8. Audit logs
  await prisma.auditLog.deleteMany({ where: { userId } })

  // 9. Hierarchy mappings
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "UserHierarchy" WHERE "supervisorId" = $1 OR "subordinateId" = $1`, userId)
  } catch (e) {
    // Table may not exist yet
  }

  // 10. Finally delete the user
  await prisma.user.delete({ where: { id: userId } })

  await logAudit({
    userId: callerId,
    action: AuditAction.DELETE,
    entityType: EntityType.USER,
    entityId: userId,
    metadata: { action: "user_deleted", email: target.email, role: target.globalRole }
  })

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  if (!user) throw new Error("User not found")

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) {
    return { success: false, error: "Current password is incorrect" }
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash }
  })

  return { success: true }
}

// ─── Profile: Update own name ───────────────────────────────────────────────────

export async function updateProfile(data: { fullName: string, department?: string, designation?: string }) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (!data.fullName || data.fullName.trim().length < 2) {
    return { success: false, error: "Name must be at least 2 characters" }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      fullName: data.fullName.trim(),
      department: data.department?.trim() || undefined,
      designation: data.designation?.trim() || undefined,
    }
  })

  await logAudit({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entityType: EntityType.USER,
    entityId: session.user.id,
    metadata: { action: "profile_update", fullName: data.fullName }
  })

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Admin: Change user role ────────────────────────────────────────────────────

export async function updateUserRole(userId: string, newRole: "SUPER_ADMIN" | "ADMIN" | "SECTION_OFFICER" | "EMPLOYEE") {
  const session = await auth()
  const callerId = await checkModuleAccess("users", AccessLevel.ADMIN, true)
  if (!callerId) {
    throw new Error("Unauthorized: Admin-level User Management access required")
  }

  const callerRole = session?.user?.role

  // ADMIN cannot promote to SUPER_ADMIN or ADMIN
  if (callerRole === 'ADMIN' && (newRole === 'SUPER_ADMIN' || newRole === 'ADMIN')) {
    throw new Error("Admins cannot promote users to Admin or Super Admin")
  }

  // Cannot change own role
  if (userId === callerId) {
    throw new Error("Cannot change your own role")
  }

  // Only SUPER_ADMIN can change another SUPER_ADMIN or ADMIN
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { globalRole: true } })
  if (!target) throw new Error("User not found")
  if (callerRole !== 'SUPER_ADMIN' && (target.globalRole === 'SUPER_ADMIN' || target.globalRole === 'ADMIN')) {
    throw new Error("Only Super Admins can change Admin/Super Admin roles")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { globalRole: newRole }
  })

  await logAudit({
    userId: callerId,
    action: AuditAction.UPDATE,
    entityType: EntityType.USER,
    entityId: userId,
    metadata: { action: "role_change", oldRole: target.globalRole, newRole }
  })

  revalidatePath('/dashboard/settings')
  return { success: true }
}

// ─── Admin: Edit user details ───────────────────────────────────────────────────

export async function adminEditUser(userId: string, data: {
  fullName: string,
  email: string,
  designation: string,
  department: string,
}) {
  const callerId = await checkModuleAccess("users", AccessLevel.ADMIN, true)
  if (!callerId) {
    throw new Error("Unauthorized: Admin-level User Management access required")
  }

  if (!data.fullName || data.fullName.trim().length < 2) {
    return { success: false, error: "Name must be at least 2 characters" }
  }
  if (!data.email || !data.email.includes("@")) {
    return { success: false, error: "Valid email is required" }
  }
  if (!data.designation || data.designation.trim().length < 2) {
    return { success: false, error: "Designation is required" }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        designation: data.designation.trim(),
        department: data.department.trim() || 'Accounts',
      }
    })

    await logAudit({
      userId: callerId,
      action: AuditAction.UPDATE,
      entityType: EntityType.USER,
      entityId: userId,
      metadata: { action: "admin_edit_user", changes: data }
    })

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "Email already in use by another user" }
    }
    return { success: false, error: "Failed to update user" }
  }
}

export async function registerUser(data: {
  email: string,
  fullName: string,
  designation: string,
  department?: string,
  password: string
}) {
  // Public registration - creates EMPLOYEE with no module access
  const passwordHash = await bcrypt.hash(data.password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        designation: data.designation,
        globalRole: 'EMPLOYEE',
        department: data.department || 'Accounts',
        passwordHash
      }
    })

    return { success: true, data: { id: user.id, email: user.email } }
  } catch (error: any) {
    console.error(error)
    return {
      success: false,
      error:
        error.code === "P2002"
          ? "Email already exists"
          : "Failed to create account",
    }
  }
}

export async function resetPasswordByAdmin(userId: string) {
  const callerId = await checkModuleAccess("users", AccessLevel.ADMIN, true)
  if (!callerId) {
    throw new Error("Unauthorized: Admin-level User Management access required")
  }

  const newPassword = Math.random().toString(36).slice(-10) + "!"
  const passwordHash = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash }
  })

  await logAudit({
    userId: callerId,
    action: AuditAction.UPDATE,
    entityType: EntityType.USER,
    entityId: userId,
    metadata: { action: "password_reset" }
  })

  revalidatePath('/dashboard/settings')
  return { success: true, tempPassword: newPassword }
}
