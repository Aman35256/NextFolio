import { useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, TrendingUp, Zap } from 'lucide-react';
import { Card, Button, Badge } from '../../../components';
import { ProfileCard, MetricsCard, MatchingScoreBar } from '../shared';
import { useCareerAgentStore } from '../../../store/careerAgent';
import { useResumeStore } from '../../../store';
import ResumeUploadPanel from '../../../components/ResumeUpload';

export default function ResumeIntelligenceDashboard() {
  const [error, setError] = useState('');
  const resumeData = useResumeStore((state) => state.resumeData);
  const token = useResumeStore((state) => state.token);
  const atsScore = useResumeStore((state) => state.atsScore);
  const {
    candidateProfile,
    missingSkills,
    triggerOrchestration,
    orchestrationLoading,
    activeOrchestration,
    resumeSummary,
    skillRecommendations,
  } = useCareerAgentStore();

  const hasResumeData = Boolean(
    resumeData?.personal?.fullName
    || resumeData?.skills?.length
    || resumeData?.experience?.length
    || resumeData?.projects?.length
  );

  const handleAnalyzeResume = async () => {
    setError('');

    try {
      if (!hasResumeData) {
        throw new Error('Upload or build your resume in NextFolio before running Resume Intelligence.');
      }

      const data = await triggerOrchestration(
        "Analyze my resume for ATS scoring, keyword gaps, and professional improvements.",
        resumeData,
        "",
        token
      );
      
      if (!data || !data.success) {
        throw new Error('Failed to start multi-agent analysis');
      }
    } catch (err) {
      setError(err.message || 'Resume analysis failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Resume Intelligence
        </h2>
        <p className="text-gray-650">
          Analyze your NextFolio resume for ATS optimization, skill gaps, and job match potential.
        </p>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Analysis Error</p>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {orchestrationLoading && (
        <Card className="p-8 border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-slate-50/50 backdrop-blur-md shadow-soft-xl relative overflow-hidden animate-pulse">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-100 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 w-1/3 rounded-full" style={{
              animation: 'pulse 2s infinite ease-in-out'
            }} />
          </div>
          <div className="text-center space-y-6 max-w-md mx-auto py-8">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
              <Zap className="w-8 h-8 text-indigo-650 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-800 bg-gradient-brand bg-clip-text text-transparent">
                Running Multi-Agent Resume Intelligence
              </h3>
              <p className="text-slate-650 text-sm font-medium animate-pulse">
                {activeOrchestration?.reasoning || 'Connecting to local AI models...'}
              </p>
            </div>
            <div className="flex justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
            </div>
          </div>
        </Card>
      )}

      {!orchestrationLoading && !candidateProfile?.fullName && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Option A: Analyze Existing Resume */}
          <Card className="p-8 border border-slate-200 bg-white flex flex-col justify-between h-full shadow-soft-sm">
            <div className="text-center space-y-4">
              <FileText className="w-12 h-12 mx-auto text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Option A: Analyze Existing Resume
              </h3>
              <p className="text-slate-650 text-sm leading-relaxed">
                Use the resume data currently stored in your profile to run full ATS match scoring and skill recommendations.
              </p>
              <div className="pt-2">
                {!hasResumeData ? (
                  <Badge variant="glass" className="bg-amber-50 text-amber-800 border-amber-200 text-xs">
                    No active resume data found in profile
                  </Badge>
                ) : (
                  <Badge variant="glass" className="bg-green-50 text-green-800 border-green-200 text-xs">
                    Ready to analyze (data found in profile)
                  </Badge>
                )}
              </div>
            </div>
            <div className="pt-6">
              <Button
                onClick={handleAnalyzeResume}
                disabled={!hasResumeData}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 font-semibold"
              >
                {hasResumeData ? 'Analyze Existing Resume' : 'No Resume Data to Analyze'}
              </Button>
            </div>
          </Card>

          {/* Option B: Upload New Resume PDF */}
          <Card className="p-6 border border-slate-200 bg-white h-full shadow-soft-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                Option B: Upload New Resume PDF
              </h3>
              <p className="text-slate-500 text-xs text-center mt-1">
                Upload a PDF file to parse structured fields and populate your NextFolio profile.
              </p>
            </div>
            <ResumeUploadPanel />
          </Card>
        </div>
      )}

      {!orchestrationLoading && candidateProfile?.fullName && (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <ProfileCard profile={candidateProfile} atsScore={atsScore} />
            </div>

            <div className="space-y-4">
              <MetricsCard
                label="ATS Score"
                value={atsScore}
                icon={Zap}
                change={atsScore}
                changeType="positive"
              />
              <MetricsCard
                label="Top Skills"
                value={candidateProfile.topSkills?.length || 0}
                icon={TrendingUp}
                description="Professional skills identified"
              />
            </div>
          </div>

          {resumeSummary && (
            <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Resume Overview</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {resumeSummary.strengths?.map((strength) => (
                      <li key={strength} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-green-600">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Improvements
                  </h4>
                  <ul className="space-y-2">
                    {resumeSummary.improvements?.map((improvement) => (
                      <li key={improvement} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-blue-600">→</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-650 mb-2">Overall Profile Rating</p>
                <div className="flex items-center gap-3">
                  <MatchingScoreBar score={atsScore} size="lg" showPercentage />
                  <span className="text-lg font-semibold text-gray-900">
                    {resumeSummary.overallRating}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {skillRecommendations?.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Recommended Skills to Add
              </h3>

              <div className="space-y-4">
                {skillRecommendations.map((rec) => (
                  <div
                    key={rec.skill}
                    className="flex items-start justify-between p-3 rounded-lg bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{rec.skill}</p>
                      <p className="text-sm text-gray-650 mt-1">{rec.reason}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {missingSkills?.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Skills to Enhance
              </h3>

              <div className="flex flex-wrap gap-2">
                {missingSkills.map((skill) => (
                  <div
                    key={`${skill.skill || skill}-${skill.category || 'skill'}`}
                    className="px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg"
                  >
                    <span className="text-sm font-medium text-amber-900">
                      {typeof skill === 'string' ? skill : skill.skill || 'Skill'}
                    </span>
                    {typeof skill === 'object' && skill.priority && (
                      <span className="text-xs text-amber-755 ml-2">
                        {skill.priority} priority
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex gap-3 justify-center py-4">
            <Button
              variant="secondary"
              onClick={() => useCareerAgentStore.setState({ candidateProfile: null })}
            >
              Analyze Different Resume
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
