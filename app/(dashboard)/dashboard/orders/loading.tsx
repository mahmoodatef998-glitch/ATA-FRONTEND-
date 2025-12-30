import { OrdersSkeleton } from "@/components/loading-skeletons/orders-skeleton";

/**
 * Loading component for Orders page
 * Shows skeleton UI while data is being fetched
 */
export default function Loading() {
  return <OrdersSkeleton />;
}

