"use client";

import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  IndianRupee,
  FileText,
  Award,
  LogOut,
  KeyRound,
  Settings,
  Menu,
  GitBranch,
  User,
  Crown,
  Shield,
  Briefcase,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type SidebarUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  moduleAccess?: { moduleKey: string; accessLevel: string }[];
};

function SidebarContent({ user, onNavigate }: { user: SidebarUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (href === pathname) return;
    setNavigatingTo(href);
    onNavigate?.();
    // Trigger the global navigation overlay
    if (typeof window !== "undefined" && (window as any).__setNavLoading) {
      (window as any).__setNavLoading(true);
    }
    startTransition(() => {
      router.push(href);
    });
  };

  // Reset navigatingTo when the route actually changes
  const activeNavigating = isPending ? navigatingTo : null;

  const hasAccess = (moduleKey: string) => {
    if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") return true;
    return user.moduleAccess?.some((a) => a.moduleKey === moduleKey) || false;
  };

  const allLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
    { href: "/dashboard/recovery", label: "Recoveries", icon: IndianRupee, module: "recovery" },
    { href: "/dashboard/applications", label: "Applications", icon: FileText, module: "application" },
    { href: "/dashboard/rewards", label: "Rewards", icon: Award, module: "reward" },
  ];

  const links = allLinks.filter(
    (l) => l.module === "dashboard" || hasAccess(l.module),
  );

  const hasUsersModuleAccess = user.moduleAccess?.some((a) => a.moduleKey === "users") || false;

  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN" || hasUsersModuleAccess) {
    links.push({ href: "/dashboard/hierarchy", label: "Hierarchy", icon: GitBranch, module: "hierarchy" });
    links.push({ href: "/dashboard/settings", label: "Settings", icon: Settings, module: "settings" });
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-[60px] items-center border-b px-6">
        <Link
          className="flex items-center gap-2 font-semibold"
          href="/dashboard"
          onClick={(e) => handleNavigation("/dashboard", e)}
        >
          <span>Sr. DFM Office App</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            const isLoading = activeNavigating === link.href;
            return (
              <Link
                key={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  isActive
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                  isLoading && "opacity-70",
                )}
                href={link.href}
                onClick={(e) => handleNavigation(link.href, e)}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="mb-4 space-y-2">
          {/* 1. User Name */}
          <p className="font-semibold text-sm">{user.name || "User"}</p>

          {/* 2. User Email */}
          <p className="text-xs text-gray-500">{user.email}</p>

          {/* 3. Module Access Badges */}
          {/* {user.moduleAccess && user.moduleAccess.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {user.moduleAccess.map((acc) => (
                <span
                  key={acc.moduleKey}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] px-2 py-0.5 font-medium"
                >
                  {acc.moduleKey === "recovery" && <IndianRupee className="h-3 w-3" />}
                  {acc.moduleKey === "application" && <FileText className="h-3 w-3" />}
                  {acc.moduleKey === "reward" && <Award className="h-3 w-3" />}
                  {acc.moduleKey === "users" && <User className="h-3 w-3" />}
                  {acc.moduleKey.charAt(0).toUpperCase() + acc.moduleKey.slice(1)}
                </span>
              ))}
            </div>
          )} */}

          {/* 4. Role Badge with icon */}
          <div>
            {user.role === "SUPER_ADMIN" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-[10px] px-2 py-0.5 font-bold uppercase">
                <Crown className="h-3 w-3" /> Super Admin
              </span>
            )}
            {user.role === "ADMIN" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-[10px] px-2 py-0.5 font-bold uppercase">
                <Shield className="h-3 w-3" /> Admin
              </span>
            )}
            {user.role === "SECTION_OFFICER" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-[10px] px-2 py-0.5 font-bold uppercase">
                <Briefcase className="h-3 w-3" /> Section Officer
              </span>
            )}
            {user.role === "EMPLOYEE" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-[10px] px-2 py-0.5 font-bold uppercase">
                <User className="h-3 w-3" /> Employee
              </span>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start"
          size="sm"
          asChild
        >
          <Link href="/dashboard/profile" onClick={onNavigate}>
            <User className="mr-2 h-4 w-4" />
            My Profile
          </Link>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start mt-2"
          size="sm"
          asChild
        >
          <Link href="/dashboard/change-password" onClick={onNavigate}>
            <KeyRound className="mr-2 h-4 w-4" />
            Change Password
          </Link>
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start mt-2"
              size="sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Sign Out</DialogTitle>
              <DialogDescription>
                Are you sure you want to sign out of your account?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex sm:justify-between sm:space-x-2">
              <DialogClose asChild>
                <Button variant="outline">Go Back</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Sign Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Desktop sidebar — hidden on mobile
export function DashboardSidebar({ user }: { user: SidebarUser }) {
  return (
    <aside className="w-64 flex-shrink-0 border-r bg-gray-100/40 hidden md:block">
      <SidebarContent user={user} />
    </aside>
  );
}

// Mobile header with hamburger — visible only on mobile
export function MobileNav({ user }: { user: SidebarUser }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b px-4 h-14 md:hidden bg-white">
      <Link href="/dashboard" className="font-semibold text-sm">
        Sr. DFM Office App
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent user={user} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
