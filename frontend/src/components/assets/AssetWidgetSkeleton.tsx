/**
 * AssetWidgetSkeleton Component
 * Loading skeleton UI for AssetWidget
 * Displays placeholder content while asset data is being fetched
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetWidgetSkeleton() {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <Skeleton className="h-6 w-48" /> {/* Title skeleton */}
        <Skeleton className="h-8 w-8" /> {/* Chevron button skeleton */}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Asset row 1 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" /> {/* Hostname skeleton */}
            <Skeleton className="h-5 w-24" /> {/* Warranty badge skeleton */}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Skeleton className="h-10 w-full sm:w-48" /> {/* ScreenConnect button skeleton */}
            <Skeleton className="h-10 w-full sm:w-44" /> {/* PDQ button skeleton */}
          </div>
        </div>

        {/* Asset row 2 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" /> {/* Hostname skeleton */}
            <Skeleton className="h-5 w-28" /> {/* Warranty badge skeleton */}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Skeleton className="h-10 w-full sm:w-48" /> {/* ScreenConnect button skeleton */}
            <Skeleton className="h-10 w-full sm:w-44" /> {/* PDQ button skeleton */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
