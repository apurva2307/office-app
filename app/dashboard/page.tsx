import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecoveries } from "@/modules/recovery/actions";
import { getApplications } from "@/modules/applications/actions";
import { getRewards } from "@/modules/rewards/actions";
import { IndianRupee, FileText, Award } from "lucide-react";
import { checkModuleAccess } from "@/modules/users/actions";

export default async function DashboardPage() {
  const [hasRecovery, hasApplication, hasReward] = await Promise.all([
    checkModuleAccess("recovery"),
    checkModuleAccess("application"),
    checkModuleAccess("reward"),
  ])

  // Only fetch if they have access
  const [recoveries, applications, rewards] = await Promise.all([
    hasRecovery ? getRecoveries() : Promise.resolve([]),
    hasApplication ? getApplications() : Promise.resolve([]),
    hasReward ? getRewards() : Promise.resolve([]),
  ]);

  const pendingRecoveries = recoveries.filter(
    (r) => r.status !== "RECOVERED" && r.status !== "CLOSED",
  ).length;
  const totalRecoveredAmount = recoveries
    .filter((r) => r.status === "RECOVERED")
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const pendingApplications = applications.filter(
    (a) => a.status === "PENDING",
  ).length;
  const approvedRewards = rewards.filter((r) => r.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your office activities.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {hasRecovery && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Recoveries
                </CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingRecoveries}</div>
                <p className="text-xs text-muted-foreground">cases under process</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recovered Amount
                </CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{totalRecoveredAmount.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">total collected</p>
              </CardContent>
            </Card>
          </>
        )}

        {hasApplication && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Applications
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApplications}</div>
              <p className="text-xs text-muted-foreground">
                requests awaiting review
              </p>
            </CardContent>
          </Card>
        )}

        {hasReward && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Given</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedRewards}</div>
              <p className="text-xs text-muted-foreground">
                colleagues recognized
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity Section could go here */}
    </div>
  );
}
