import { cn } from '@/lib/utils';

interface StateBadgeProps {
  state: 'open' | 'closed';
  size?: 'sm' | 'md';
}

export const StateBadge = ({ state, size = 'md' }: StateBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        state === 'open'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
      )}
    >
      {state === 'open' ? 'Open' : 'Closed'}
    </span>
  );
};
