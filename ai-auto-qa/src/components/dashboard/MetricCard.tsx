import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
}

const variantStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
};

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  variant = 'default',
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6 card-hover gradient-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive && <TrendingUp className="h-4 w-4 text-success" />}
              {isNegative && <TrendingDown className="h-4 w-4 text-destructive" />}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive && 'text-success',
                  isNegative && 'text-destructive',
                  !isPositive && !isNegative && 'text-muted-foreground'
                )}
              >
                {isPositive && '+'}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-sm text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn('rounded-lg p-3', variantStyles[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
