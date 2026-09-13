export default function MatchingScoreBar({ score = 0, size = 'md', showPercentage = true }) {
  const getScoreColor = (score) => {
    if (score >= 85) return 'from-green-500 to-emerald-500';
    if (score >= 70) return 'from-blue-500 to-cyan-500';
    if (score >= 55) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-orange-500';
  };

  const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Good Match';
    if (score >= 55) return 'Fair Match';
    return 'Poor Match';
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`${textClasses[size]} font-semibold text-slate-700`}>
          Match Score
        </span>
        {showPercentage && (
          <span className={`${textClasses[size]} font-bold text-indigo-600`}>
            {Math.round(score)}%
          </span>
        )}
      </div>
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full bg-gradient-to-r ${getScoreColor(score)} transition-all duration-500`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <p className={`${textClasses[size]} text-slate-500`}>
        {getScoreLabel(score)}
      </p>
    </div>
  );
}
