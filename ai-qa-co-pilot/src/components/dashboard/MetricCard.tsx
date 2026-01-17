import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  onClick?: () => void;
  clickable?: boolean;
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
  onClick,
  clickable = false,
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  const isClickable = clickable || !!onClick;

  // Get variant-specific border and background colors for uniform UX
  const getVariantStyles = () => {
    if (!isClickable) return '';
    switch (variant) {
      case 'success':
        return 'hover:border-success/40 hover:bg-gradient-to-br hover:from-card hover:to-success/5';
      case 'destructive':
        return 'hover:border-destructive/40 hover:bg-gradient-to-br hover:from-card hover:to-destructive/5';
      case 'info':
        return 'hover:border-info/40 hover:bg-gradient-to-br hover:from-card hover:to-info/5';
      case 'warning':
        return 'hover:border-warning/40 hover:bg-gradient-to-br hover:from-card hover:to-warning/5';
      default:
        return 'hover:border-primary/40 hover:bg-gradient-to-br hover:from-card hover:to-primary/5';
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 border-border bg-card p-6 transition-all group",
        isClickable && `cursor-pointer hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] ${getVariantStyles()}`,
        !isClickable && "card-hover gradient-card"
      )}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      title={isClickable ? `Click to view ${title.toLowerCase()}` : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
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
          {isClickable && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/10 border border-primary/20 group-hover:bg-primary/15 group-hover:border-primary/30 transition-all">
              <span className="text-xs font-semibold text-primary group-hover:text-primary transition-colors">
                Click to view details
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}
        </div>
        <div className={cn('rounded-lg p-3 flex-shrink-0', variantStyles[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
}
