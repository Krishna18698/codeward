import { CatalogSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return <CatalogSkeleton filterRows={2} cards={5} />;
}
