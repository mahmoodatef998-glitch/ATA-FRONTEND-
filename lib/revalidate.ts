/**
 * Revalidation utilities for Next.js App Router
 * Ensures pages are refreshed after mutations
 */

import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Revalidate common paths after mutations
 */
export async function revalidateAfterMutation(paths?: string[]) {
  const defaultPaths = [
    "/dashboard",
    "/dashboard/users",
    "/dashboard/clients",
    "/dashboard/orders",
    "/team/members",
    "/team/tasks",
    "/client/portal",
  ];

  const pathsToRevalidate = paths || defaultPaths;

  try {
    // Revalidate specific paths
    pathsToRevalidate.forEach((path) => {
      revalidatePath(path);
    });

    // Also revalidate common tags
    revalidateTag("users");
    revalidateTag("orders");
    revalidateTag("clients");
    revalidateTag("tasks");
    revalidateTag("notifications");
  } catch (error) {
    console.error("Error revalidating paths:", error);
  }
}

/**
 * Revalidate after user mutations
 */
export async function revalidateUsers() {
  await revalidateAfterMutation([
    "/dashboard/users",
    "/team/members",
    "/dashboard/rbac/users",
  ]);
}

/**
 * Revalidate after order mutations
 */
export async function revalidateOrders() {
  await revalidateAfterMutation([
    "/dashboard/orders",
    "/client/portal",
    "/dashboard",
  ]);
}

/**
 * Revalidate after client mutations
 */
export async function revalidateClients() {
  await revalidateAfterMutation([
    "/dashboard/clients",
    "/dashboard",
  ]);
}

/**
 * Revalidate after task mutations
 */
export async function revalidateTasks() {
  await revalidateAfterMutation([
    "/team/tasks",
    "/dashboard",
  ]);
}

/**
 * Revalidate after notification mutations
 */
export async function revalidateNotifications() {
  await revalidateAfterMutation([
    "/dashboard/notifications",
    "/client/portal/notifications",
  ]);
}



