/**
 * Asset Helper Utilities
 *
 * Shared utility functions for asset management operations.
 */

/**
 * Calculate asset age in whole years from in-service date to current date
 *
 * @param inServiceDate - The date the asset was put into service
 * @returns Age in whole years (rounded down), minimum 0
 *
 * @example
 * calculateAssetAge(new Date('2021-10-16')) // Returns 4 (if current year is 2025)
 * calculateAssetAge(new Date('2025-06-01')) // Returns 0
 * calculateAssetAge(new Date('2026-01-01')) // Returns 0 (future date)
 */
export function calculateAssetAge(inServiceDate: Date | string | null): number {
  if (!inServiceDate) {
    return 0;
  }

  const serviceDate = typeof inServiceDate === 'string' ? new Date(inServiceDate) : inServiceDate;
  const today = new Date();

  // Calculate age in years using 365.25 to account for leap years
  const ageInYears = Math.floor(
    (today.getTime() - serviceDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );

  // Prevent negative age if in_service_date is in the future
  return Math.max(0, ageInYears);
}
