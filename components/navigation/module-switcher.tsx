"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Building2, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { canAccessOtherModules } from "@/lib/permissions/role-permissions";

interface ModuleSwitcherProps {
  currentModule: "team" | "crm";
  className?: string;
}

/**
 * Reusable component for switching between Team Management and Client CRM modules
 * Only visible to: Admin, Operations Manager, Accountant, Supervisor
 */
export function ModuleSwitcher({ currentModule, className }: ModuleSwitcherProps) {
  const { data: session } = useSession();
  const router = useRouter();

  // Check if user can access both modules
  const canSwitch = session?.user?.role && canAccessOtherModules(session.user.role as UserRole);

  if (!canSwitch) {
    return null; // Don't show switcher if user can't access both modules
  }

  const handleSwitch = () => {
    if (currentModule === "team") {
      // Switch to CRM
      router.push("/dashboard");
    } else {
      // Switch to Team
      router.push("/team");
    }
  };

  return (
    <Button
      onClick={handleSwitch}
      variant="outline"
      className={className}
      size="sm"
    >
      <ArrowLeftRight className="mr-2 h-4 w-4" />
      {currentModule === "team" ? (
        <>
          <Building2 className="mr-2 h-4 w-4" />
          Go to Client CRM
        </>
      ) : (
        <>
          <Users className="mr-2 h-4 w-4" />
          Go to Our Team
        </>
      )}
    </Button>
  );
}

