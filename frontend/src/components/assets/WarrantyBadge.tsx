/**
 * WarrantyBadge Component
 * Displays color-coded warranty status badge based on expiration date
 */

import { Badge } from '@/components/ui/badge';

interface WarrantyBadgeProps {
  warrantyExpirationDate: Date | null;
}

type WarrantyColor = 'red' | 'yellow' | 'green' | 'gray';

/**
 * Calculate warranty color based on days remaining
 * - Red: Expired or <30 days
 * - Yellow: 30-180 days
 * - Green: >180 days
 * - Gray: No warranty date
 */
function getWarrantyColor(date: Date | null): WarrantyColor {
  if (!date) return 'gray';

  const daysRemaining = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return 'red'; // Expired
  if (daysRemaining < 30) return 'red'; // <30 days
  if (daysRemaining < 180) return 'yellow'; // 30-180 days
  return 'green'; // >180 days
}

/**
 * Get warranty badge text
 */
function getWarrantyText(date: Date | null): string {
  if (!date) return 'Unknown';

  const daysRemaining = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return 'Expired';
  }

  if (daysRemaining === 0) {
    return 'Expires today';
  }

  if (daysRemaining < 30) {
    return `${daysRemaining} days left`;
  }

  // Format date as "MMM DD, YYYY"
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get Tailwind CSS classes for warranty badge colors
 */
function getBadgeClassName(color: WarrantyColor): string {
  const colorClasses: Record<WarrantyColor, string> = {
    red: 'bg-red-100 text-red-800 border border-red-300',
    yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    green: 'bg-green-100 text-green-800 border border-green-300',
    gray: 'bg-gray-100 text-gray-800',
  };

  return colorClasses[color];
}

export function WarrantyBadge({ warrantyExpirationDate }: WarrantyBadgeProps) {
  const color = getWarrantyColor(warrantyExpirationDate);
  const text = getWarrantyText(warrantyExpirationDate);
  const className = getBadgeClassName(color);

  return (
    <Badge className={className} variant="outline">
      {text}
    </Badge>
  );
}
