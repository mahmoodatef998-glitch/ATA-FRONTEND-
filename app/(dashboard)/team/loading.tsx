import { TeamDashboardSkeleton } from "@/components/loading-skeletons/team-dashboard-skeleton";

/**
 * Loading component for Team Dashboard page
 * Shows skeleton UI while data is being fetched
 */
export default function Loading() {
  return <TeamDashboardSkeleton />;
}

