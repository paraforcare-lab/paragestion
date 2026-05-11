import React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  change?: { value: string; positive: boolean; label?: string };
  iconContainerClass?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, change, iconContainerClass }: KPICardProps) {
  return (
    <div className="rounded-[6px] bg-white p-5 border border-slate-200">
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "h-10 w-10 rounded-[6px] flex items-center justify-center shrink-0",
          iconContainerClass || "bg-emerald-50 text-emerald-600"
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-xs font-medium text-gray-500 tracking-wide uppercase">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-1.5">
        {change && (
          <span className={cn(
            "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-[4px]",
            change.positive ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
          )}>
            {change.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change.value}
          </span>
        )}
        <span className="text-xs text-gray-400">{change?.label || subtitle}</span>
      </div>
    </div>
  );
}
