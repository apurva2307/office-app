import { getRecoveries } from "@/modules/recovery/actions";
import { checkModuleAccess, getUsersForDropdown } from "@/modules/users/actions";
import { RecoveryTable } from "@/modules/recovery/components/RecoveryTable";
import { NewRecoveryDialog } from "@/modules/recovery/components/NewRecoveryDialog";
import { ShieldAlert } from "lucide-react";
import { AccessLevel } from "@prisma/client";

export default async function RecoveryPage() {
  const hasAccess = await checkModuleAccess("recovery");
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ShieldAlert className="h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this module.</p>
      </div>
    )
  }

  const canUpdate = await checkModuleAccess("recovery", AccessLevel.WRITE)

  const [recoveries, users] = await Promise.all([
    getRecoveries(),
    getUsersForDropdown(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Recovery Management
          </h2>
          <p className="text-muted-foreground">
            Track and manage financial recoveries.
          </p>
        </div>
        <NewRecoveryDialog users={users} />
      </div>

      <RecoveryTable data={recoveries} canUpdate={!!canUpdate} />
    </div>
  );
}
