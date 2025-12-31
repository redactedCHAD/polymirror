
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color = "text-blue-500" }) => {
  return (
    <div className="bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-900 rounded-xl p-5 shadow-sm dark:shadow-lg flex items-center justify-between transition hover:border-slate-300 dark:hover:border-slate-700">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
        {trend && (
          <p className="text-[10px] mt-1 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
            {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-slate-50 dark:bg-dark-900 border border-slate-100 dark:border-dark-800 ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};
