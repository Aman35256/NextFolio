import { Card, Badge, Button } from '../../../components';
import { Briefcase, MapPin, DollarSign, Zap } from 'lucide-react';

export default function JobCard({
  job,
  matchScore,
  onView,
  onSave,
}) {
  const {
    title,
    company,
    location,
    salary,
    jobType,
    remote,
    appliedAt,
  } = job;

  const getMatchColor = (score) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'primary';
    if (score >= 55) return 'warning';
    return 'danger';
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    return `$${(min || max).toLocaleString()}+`;
  };

  return (
    <Card interactive className="p-5 space-y-4 hover:shadow-soft-lg">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 line-clamp-2">
              {title}
            </h3>
            <p className="text-sm text-slate-600">{company}</p>
          </div>
          {matchScore !== undefined && (
            <Badge variant={getMatchColor(matchScore)} size="sm">
              {Math.round(matchScore)}% Match
            </Badge>
          )}
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-200">
        {location && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={16} className="text-indigo-500" />
            <span>{location}</span>
          </div>
        )}
        {formatSalary(salary?.min, salary?.max) && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <DollarSign size={16} className="text-green-500" />
            <span>{formatSalary(salary?.min, salary?.max)}</span>
          </div>
        )}
        {jobType && (
          <Badge variant="glass" size="sm">
            {jobType}
          </Badge>
        )}
        {remote && (
          <Badge variant="glass" size="sm">
            {remote === true ? '🌍 Remote' : remote}
          </Badge>
        )}
      </div>

      {/* Match Details */}
      {matchScore !== undefined && matchScore >= 55 && (
        <div className="bg-gradient-subtle rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-indigo-700 flex items-center gap-2">
            <Zap size={14} />
            Why this role matches
          </p>
          <div className="flex flex-wrap gap-2">
            {job.matchingSkills?.slice(0, 3).map((skill, idx) => (
              <Badge key={idx} variant="primary" size="sm">
                ✓ {skill}
              </Badge>
            ))}
            {job.matchingSkills?.length > 3 && (
              <Badge variant="primary" size="sm">
                +{job.matchingSkills.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Applied Status */}
      {appliedAt && (
        <div className="text-xs text-slate-500 bg-slate-100 rounded-lg px-3 py-2">
          ✓ Applied on {new Date(appliedAt).toLocaleDateString()}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => onView?.(job)}
        >
          View Details
        </Button>
        {!appliedAt && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave?.(job)}
          >
            Save
          </Button>
        )}
      </div>
    </Card>
  );
}
