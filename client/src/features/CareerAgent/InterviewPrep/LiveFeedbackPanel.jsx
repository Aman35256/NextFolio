import { useState } from 'react';
import { Card, Badge } from '../../../components';
import {
  Heart,
  Brain,
  Zap,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  Activity,
  Lightbulb,
} from 'lucide-react';

function SVGPitchChart({ pitchHistory, timestamps, nervousMoments }) {
  const validPitches = (pitchHistory || []).filter(p => p !== null && p > 0);
  if (validPitches.length === 0) {
    return (
      <div className="text-center text-xs text-slate-400 py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
        No voice pitch data captured. Please speak into your microphone.
      </div>
    );
  }
  
  const minP = 50;
  const maxP = 400;
  const width = 300;
  const height = 120;
  
  // Construct line path points
  const points = pitchHistory.map((p, idx) => {
    if (p === null || p <= 0) return null;
    const x = (idx / (pitchHistory.length - 1 || 1)) * (width - 20) + 10;
    const y = height - ((p - minP) / (maxP - minP)) * (height - 20) - 10;
    return `${x},${y}`;
  }).filter(p => p !== null).join(' ');

  const maxTime = timestamps && timestamps.length > 0 ? timestamps[timestamps.length - 1] : 0;

  return (
    <div className="space-y-2">
      <div className="relative p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Grid lines */}
          <line x1="10" y1={height / 4} x2={width - 10} y2={height / 4} stroke="#1e293b" strokeWidth="1" />
          <line x1="10" y1={height / 2} x2={width - 10} y2={height / 2} stroke="#1e293b" strokeWidth="1" />
          <line x1="10" y1={(height * 3) / 4} x2={width - 10} y2={(height * 3) / 4} stroke="#1e293b" strokeWidth="1" />
          
          {/* Pitch line */}
          {points && (
            <polyline
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          )}

          {/* Highlight nervous moments */}
          {nervousMoments && nervousMoments.map((moment, idx) => {
            const timeRatio = moment.time / (maxTime || 1);
            const x = timeRatio * (width - 20) + 10;
            if (x < 10 || x > width - 10) return null;
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1="10"
                  x2={x}
                  y2={height - 10}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
                <circle cx={x} cy="10" r="3" fill="#ef4444" />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 px-1 font-medium">
        <span>0s</span>
        <span className="text-rose-500 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
          Red: Nervous Moments
        </span>
        <span>{Math.round(maxTime)}s</span>
      </div>
    </div>
  );
}

function SVGConfidenceHistoryChart({ history, duration }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center text-xs text-slate-400 py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
        No confidence progression data.
      </div>
    );
  }
  const width = 300;
  const height = 120;
  const maxVal = 100;
  const minVal = 0;
  
  const points = history.map((val, idx) => {
    const x = (idx / (history.length - 1 || 1)) * (width - 20) + 10;
    const y = height - ((val - minVal) / (maxVal - minVal)) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-2">
      <div className="relative p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <line x1="10" y1="10" x2={width - 10} y2="10" stroke="#1e293b" strokeWidth="1" />
          <line x1="10" y1={height / 2} x2={width - 10} y2={height / 2} stroke="#1e293b" strokeWidth="1" />
          
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 px-1 font-medium">
        <span>0s</span>
        <span>Confidence Level Trend</span>
        <span>{Math.round(duration || 0)}s</span>
      </div>
    </div>
  );
}

export default function LiveFeedbackPanel({ analysis, isAnalyzing }) {
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics', 'charts', 'report'

  const getScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'amber';
    return 'red';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const ScoreCard = ({ label, value, icon: Icon, color }) => (
    <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
      <Icon size={16} className={`text-${color}-600 mx-auto mb-1`} />
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-black text-${color}-600`}>{Math.round(value || 0)}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{getScoreLabel(value || 0)}</p>
      <div className="w-full bg-slate-200 rounded-full h-1 mt-2">
        <div
          className={`h-1 bg-${color}-600 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, (value || 0) / 100) * 100}%` }}
        />
      </div>
    </div>
  );

  if (isAnalyzing) {
    return (
      <Card className="p-6 h-full flex items-center justify-center border border-slate-100 shadow-soft-sm bg-white/80 backdrop-blur">
        <div className="text-center space-y-3">
          <div className="relative flex items-center justify-center w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            <Activity size={20} className="text-indigo-600 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-800">Processing Audio & Response...</p>
            <p className="text-xs text-slate-400 mt-1">Executing SpeakSmart AI models</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-6 h-full flex items-center justify-center border border-slate-100 shadow-soft-sm bg-white">
        <div className="text-center space-y-2.5">
          <div className="p-3 bg-indigo-50 rounded-full w-fit mx-auto text-indigo-600">
            <MessageCircle size={22} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-700">Awaiting Response</p>
            <p className="text-xs text-slate-400 max-w-[200px] mx-auto mt-1">
              Start recording your answer to generate live voice & communication reports.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4 h-full overflow-y-auto max-h-[calc(100vh-200px)] border border-slate-100 shadow-soft-sm bg-white flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
          <Activity className="text-indigo-600" size={16} />
          AI Speech Analysis
        </h3>
        {analysis.nervousnessScore !== undefined && (
          <Badge variant={analysis.nervousnessScore > 50 ? 'danger' : 'success'} size="xs" className="font-bold">
            {analysis.nervousnessScore > 50 ? `Nervous (${analysis.nervousnessScore}%)` : `Composed`}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 gap-1">
        {[
          { id: 'metrics', label: 'Metrics', icon: Heart },
          { id: 'charts', label: 'Speech Pitch', icon: Activity },
          { id: 'report', label: 'Suggestions', icon: Lightbulb },
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <TabIcon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {activeTab === 'metrics' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Top Score */}
            <div className="grid grid-cols-2 gap-2">
              <ScoreCard
                label="Communication"
                value={analysis.communicationScore}
                icon={Heart}
                color={getScoreColor(analysis.communicationScore)}
              />
              <ScoreCard
                label="Nervousness"
                value={100 - (analysis.nervousnessScore !== undefined ? analysis.nervousnessScore : 0)}
                icon={Zap}
                color={getScoreColor(100 - (analysis.nervousnessScore !== undefined ? analysis.nervousnessScore : 0))}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ScoreCard
                label="Clarity"
                value={analysis.clarityScore}
                icon={MessageCircle}
                color={getScoreColor(analysis.clarityScore)}
              />
              <ScoreCard
                label="Confidence"
                value={analysis.confidenceScore}
                icon={TrendingUp}
                color={getScoreColor(analysis.confidenceScore)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ScoreCard
                label="Fluency"
                value={analysis.fluencyScore}
                icon={Activity}
                color={getScoreColor(analysis.fluencyScore)}
              />
              <ScoreCard
                label="Grammar"
                value={analysis.grammarScore}
                icon={Brain}
                color={getScoreColor(analysis.grammarScore)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ScoreCard
                label="STAR Structure"
                value={analysis.starFrameworkScore}
                icon={Award}
                color={getScoreColor(analysis.starFrameworkScore)}
              />
              <ScoreCard
                label="Vocabulary"
                value={analysis.vocabularyScore}
                icon={CheckCircle}
                color={getScoreColor(analysis.vocabularyScore)}
              />
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Voice Pitch Over Time (SpeakSmart AI)
              </h4>
              <SVGPitchChart
                pitchHistory={analysis.pitchHistory || []}
                timestamps={analysis.timestamps || []}
                nervousMoments={analysis.nervousMoments || []}
              />
              {analysis.metrics && (
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase">Avg Pitch</p>
                    <p className="text-xs font-bold text-slate-700">{analysis.metrics.averagePitch || 0} Hz</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase">Stability</p>
                    <p className="text-xs font-bold text-slate-700">{analysis.metrics.pitchStability || 0}%</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase">Range</p>
                    <p className="text-xs font-bold text-slate-700">{analysis.metrics.pitchRange || 0} Hz</p>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-slate-100" />

            <div>
              <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Confidence Level Progression
              </h4>
              <SVGConfidenceHistoryChart
                history={analysis.confidenceHistory || []}
                duration={analysis.metrics?.duration || (analysis.timestamps && analysis.timestamps[analysis.timestamps.length - 1]) || 0}
              />
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-4 animate-fadeIn text-xs">
            {/* suggestions */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <Lightbulb className="text-amber-500" size={14} />
                Coaching Suggestions
              </h4>
              {analysis.suggestions && analysis.suggestions.length > 0 ? (
                <ul className="space-y-1.5 pl-1.5">
                  {analysis.suggestions.map((tip, idx) => (
                    <li key={idx} className="flex gap-1.5 text-slate-600 leading-relaxed">
                      <span className="text-indigo-500 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic">No recommendations. Excellent speaking composure!</p>
              )}
            </div>

            <div className="h-px bg-slate-100" />

            {/* Filler Words */}
            {analysis.fillers && analysis.fillers.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-700 flex items-center gap-1.5">
                  <AlertCircle className="text-rose-500" size={14} />
                  Hesitation & Filler Words
                </h4>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {analysis.fillers.map((filler, idx) => (
                    <Badge key={idx} variant="outline" size="xs" className="font-bold border-rose-100 bg-rose-50 text-rose-600">
                      "{filler.word}": {filler.count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-slate-100" />

            {/* Speaking Pace */}
            {analysis.speakingPace && (
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-700">Speaking Pace (WPM)</h4>
                <p className="font-bold text-slate-800 text-sm">{analysis.speakingPace.wpm} WPM</p>
                <p className="text-slate-500 text-[10px]">
                  Pace is <span className="font-bold text-indigo-600">{analysis.speakingPace.pace}</span> (Optimal: 120-160 WPM).
                </p>
              </div>
            )}

            {/* Grammar issues */}
            {analysis.grammarIssues && analysis.grammarIssues.length > 0 && (
              <>
                <div className="h-px bg-slate-100" />
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-700 flex items-center gap-1.5">
                    <AlertCircle className="text-rose-500" size={14} />
                    Grammar Insights
                  </h4>
                  <ul className="space-y-1 pl-1.5 text-slate-600">
                    {analysis.grammarIssues.map((issue, idx) => (
                      <li key={idx}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
