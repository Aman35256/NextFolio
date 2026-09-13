import { Card, Badge } from '../../../components';
import { User, Award, Briefcase } from 'lucide-react';

export default function ProfileCard({ profile, atsScore }) {
  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {profile.fullName || 'Candidate Profile'}
          </h2>
          {profile.headline && (
            <p className="text-slate-600 mt-1">{profile.headline}</p>
          )}
        </div>
        <div className="text-right">
          {profile.profileImage && (
            <img
              src={profile.profileImage}
              alt={profile.fullName}
              className="w-16 h-16 rounded-lg object-cover border-2 border-indigo-200"
            />
          )}
        </div>
      </div>

      {/* ATS Score */}
      {atsScore !== undefined && (
        <div className="bg-gradient-subtle rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
            <Award size={16} />
            ATS Score
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-indigo-600">{Math.round(atsScore)}</span>
            <span className="text-sm text-slate-600">/100</span>
          </div>
          <p className="text-xs text-slate-600">
            {atsScore >= 80
              ? '✅ Excellent - Ready for applications'
              : atsScore >= 60
              ? '⚠️ Good - Consider improvements'
              : '❌ Needs improvement'}
          </p>
        </div>
      )}

      {/* Contact Info */}
      {(profile.email || profile.phone || profile.location) && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          {profile.email && (
            <div>
              <p className="text-slate-600 font-medium">Email</p>
              <p className="text-slate-900">{profile.email}</p>
            </div>
          )}
          {profile.phone && (
            <div>
              <p className="text-slate-600 font-medium">Phone</p>
              <p className="text-slate-900">{profile.phone}</p>
            </div>
          )}
          {profile.location && (
            <div className="col-span-2">
              <p className="text-slate-600 font-medium">Location</p>
              <p className="text-slate-900">{profile.location}</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">
            {profile.yearsOfExperience || 0}
          </p>
          <p className="text-xs text-slate-600">Years Exp.</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">
            {profile.skills?.length || 0}
          </p>
          <p className="text-xs text-slate-600">Skills</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">
            {profile.projects?.length || 0}
          </p>
          <p className="text-xs text-slate-600">Projects</p>
        </div>
      </div>

      {/* Top Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Briefcase size={16} className="text-indigo-600" />
            Top Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.skills.slice(0, 6).map((skill, idx) => (
              <Badge key={idx} variant="primary" size="sm">
                {skill}
              </Badge>
            ))}
            {profile.skills.length > 6 && (
              <Badge variant="ghost" size="sm">
                +{profile.skills.length - 6} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
