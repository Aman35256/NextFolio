import { Card } from '../../../components';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricsCard({
  label,
  value,
  icon: Icon,
  change = null,
  changeType = 'positive',
  description = '',
  className = '',
}) {
  const isPositiveChange = changeType === 'positive';

  return (
    <Card className={`p-6 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Icon size={24} className="text-indigo-600" />
          </div>
        )}
      </div>

      {/* Change */}
      {change !== null && (
        <div className="flex items-center gap-2">
          {isPositiveChange ? (
            <TrendingUp size={16} className="text-green-500" />
          ) : (
            <TrendingDown size={16} className="text-red-500" />
          )}
          <span
            className={`text-sm font-semibold ${
              isPositiveChange ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isPositiveChange ? '+' : ''}{change}
          </span>
          <span className="text-xs text-slate-500">this month</span>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-xs text-slate-600">{description}</p>
      )}
    </Card>
  );
}
