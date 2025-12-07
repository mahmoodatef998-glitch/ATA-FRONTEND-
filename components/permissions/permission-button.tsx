/**
 * Permission Button Component
 * Button that is disabled if user lacks permission, with tooltip
 */

"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCan } from "@/lib/permissions/frontend-helpers";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { ReactNode } from "react";

interface PermissionButtonProps extends ButtonProps {
  permission: string | PermissionAction;
  tooltipMessage?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function PermissionButton({
  permission,
  tooltipMessage = "You don't have permission to perform this action",
  children,
  onClick,
  disabled,
  ...props
}: PermissionButtonProps) {
  const hasPermission = useCan(permission);
  const isDisabled = disabled || !hasPermission;

  const button = (
    <Button
      {...props}
      disabled={isDisabled}
      onClick={hasPermission ? onClick : undefined}
      className={isDisabled ? "opacity-50 cursor-not-allowed" : props.className}
    >
      {children}
    </Button>
  );

  if (!hasPermission) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}


