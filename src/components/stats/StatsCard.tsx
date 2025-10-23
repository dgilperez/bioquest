import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color?: 'blue' | 'green' | 'purple' | 'yellow';
}

const colorClasses = {
  blue: 'from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800',
  green: 'from-green-500/10 to-green-600/10 border-green-200 dark:border-green-800',
  purple: 'from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800',
  yellow: 'from-yellow-500/10 to-yellow-600/10 border-yellow-200 dark:border-yellow-800',
};

export function StatsCard({ title, value, icon, color = 'blue' }: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-gradient-to-br p-6',
        colorClasses[color]
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
