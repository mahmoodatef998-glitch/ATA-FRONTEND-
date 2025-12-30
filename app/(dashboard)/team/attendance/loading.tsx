import { AttendanceSkeleton } from "@/components/loading-skeletons/attendance-skeleton";

/**
 * Loading component for Attendance page
 * Shows skeleton UI while data is being fetched
 */
export default function Loading() {
  return <AttendanceSkeleton />;
}

