import { useEffect, useState } from 'react';
import { Card, Button, Badge } from '../../../components';
import {
  Play,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Loader,
  ShieldCheck,
  HelpCircle,
  Terminal,
  Clock,
  Sparkles,
  Brain,
  Cpu,
  Database,
  ChevronRight,
  Eye,
  Settings
} from 'lucide-react';
import { useCareerAgentStore } from '../../../store/careerAgent';
import { useResumeStore } from '../../../store';

export default function AgentHubDashboard() {
  const token = useResumeStore((state) => state.token);
  const resumeData = useResumeStore((state) => state.resumeData);
  const {
    orchestrationHistory,
    activeOrchestration,
    orchestrationLoading,
    triggerOrchestration,
    fetchOrchestrationHistory,
    fetchOrchestrationStatus,
  } = useCareerAgentStore();

  const [query, setQuery] = useState('Optimize my resume and suggest keywords for the job description.');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeTab, setActiveTab] = useState('runner'); // 'runner', 'history'

  useEffect(() => {
    if (token) {
      fetchOrchestrationHistory(token);
    }
    return () => {
      if (window.orchestrationPollInterval) {
        clearInterval(window.orchestrationPollInterval);
      }
    };
  }, [token]);

  const handleRunPipeline = async () => {
    if (!token) return;
    setSelectedAgent(null);
    await triggerOrchestration(query, resumeData, jobDescription, token);
    fetchOrchestrationHistory(token);
  };

  const handleLoadHistoryRun = async (orchestrationId) => {
    if (!token) return;
    const logs = await fetchOrchestrationStatus(orchestrationId, token);
    if (logs && logs.length > 0) {
      // Find the latest completed status details to set as active orchestration
      const mockActive = {
        orchestrationId,
        reasoning: 'Loaded from history logs.',
        pipeline: logs.map(log => ({
          agentName: log.agentName,
          status: log.status,
          progress: log.progress,
          reasoning: log.reasoning,
          planning: log.planning,
          validation: log.validation,
          confidence: log.confidence,
          executionTime: log.executionTime,
          output: log.output
        })),
        result: logs.reduce((acc, log) => {
          if (log.output) {
            acc[log.agentName] = log.output;
          }
          return acc;
        }, {})
      };
      useCareerAgentStore.setState({ activeOrchestration: mockActive });
      setActiveTab('runner');
    }
  };

  const agentIcons = {
    ResumeParsingAgent: Database,
    ProfileCompletionAgent: ShieldCheck,
    JobDescriptionAgent: Terminal,
    ATSAnalysisAgent: Brain,
    KeywordOptimizationAgent: Sparkles,
    ResumeImprovementAgent: Cpu,
    PortfolioGenerationAgent: Eye,
    CareerRecommendationAgent: Clock,
    InterviewPreparationAgent: HelpCircle,
    ContentQualityAgent: ShieldCheck,
    PDFGenerationAgent: Eye,
  };

  const activePipeline = activeOrchestration?.pipeline || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Multi-Agent Hub</h2>
        <p className="text-slate-600 mt-1">
          Coordinate local autonomous AI agents. Test, execute, and monitor agent pipelines in real-time.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('runner')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'runner' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Pipeline Runner
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Execution History
        </button>
      </div>

      {activeTab === 'runner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 space-y-4 shadow-soft-sm bg-white border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Play size={18} className="text-indigo-600" />
                Trigger Pipeline
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">User Objective / Query</label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Optimize my resume and suggest keywords for the job description."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50/50 focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuery("Analyze my resume strength, ATS score, and suggest improvements.")}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-semibold border border-slate-200 transition-colors"
                  >
                    📝 Audit Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuery("Evaluate my fit for the job description and suggest missing keywords.")}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-semibold border border-slate-200 transition-colors"
                  >
                    🎯 Job Match
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuery("Generate mock interview questions and structured prep guidelines.")}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-semibold border border-slate-200 transition-colors"
                  >
                    💬 Interview Prep
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600 uppercase">Target Job Description (Optional)</label>
                  <button
                    type="button"
                    onClick={() => setJobDescription(
                      "We are looking for a Software Engineer to join our team. \n\n" +
                      "Requirements:\n" +
                      "- 3+ years experience with React and Node.js\n" +
                      "- Strong understanding of SQL/NoSQL databases\n" +
                      "- Familiarity with Docker, AWS, and Git version control\n" +
                      "- Passion for clean code, system performance, and unit testing."
                    )}
                    className="text-[10px] text-indigo-650 hover:underline font-semibold"
                  >
                    Load Sample JD
                  </button>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description details here to enable ATS, keyword gap analysis, and interview prep..."
                  rows={5}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50/50 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleRunPipeline}
                  disabled={orchestrationLoading}
                  className="w-full bg-gradient-brand text-white flex items-center justify-center gap-2 font-semibold shadow-md py-2.5"
                >
                  {orchestrationLoading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Running Pipeline...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Execute Multi-Agent
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Short-term Memory Preview */}
            <Card className="p-6 space-y-4 shadow-soft-sm bg-slate-50/50 border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Brain size={16} className="text-indigo-600" />
                Short-term Memory Context
              </h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="font-medium text-slate-700">NextFolio Resume Data</span>
                  <Badge variant={resumeData ? 'success' : 'warning'} className="text-[10px]">
                    {resumeData ? 'Active Profile' : 'No Resume'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="font-medium text-slate-700">Target Job Specs</span>
                  <Badge variant={jobDescription ? 'success' : 'warning'} className="text-[10px]">
                    {jobDescription ? 'Active JD' : 'Empty'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Pipeline Visualizer & Logs */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 shadow-soft-sm bg-white border border-slate-100">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Execution Pipeline</h3>
                  {activeOrchestration?.orchestrationId && (
                    <p className="text-xs text-slate-400 mt-0.5">ID: {activeOrchestration.orchestrationId}</p>
                  )}
                </div>
                {orchestrationLoading && (
                  <Badge variant="glass" className="bg-indigo-50 border-indigo-100 text-indigo-700 flex items-center gap-1.5 animate-pulse text-xs">
                    <Loader size={12} className="animate-spin" />
                    Executing Agents...
                  </Badge>
                )}
              </div>

              {!orchestrationLoading && !activePipeline.length ? (
                <div className="text-center py-16 space-y-4">
                  <Cpu size={48} className="mx-auto text-slate-300 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-slate-800">Pipeline is Idle</h4>
                    <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
                      Type an objective in the objective field, add optional job specifications, and run the pipeline to visualize local agents executing in real-time.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePipeline.map((step, idx) => {
                    const IconComponent = agentIcons[step.agentName] || Cpu;
                    const isCompleted = step.status === 'completed';
                    const isRunning = step.status === 'running';
                    const isFailed = step.status === 'failed';

                    return (
                      <div
                        key={step.agentName}
                        onClick={() => setSelectedAgent(step)}
                        className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer hover:shadow-soft-sm ${
                          selectedAgent?.agentName === step.agentName
                            ? 'border-indigo-500 bg-indigo-50/10'
                            : isRunning
                            ? 'border-indigo-400 bg-indigo-50/20 animate-pulse'
                            : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${
                            isCompleted ? 'bg-green-50 text-green-600' : isFailed ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            <IconComponent size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                              {step.agentName.replace(/([A-Z])/g, ' $1').trim()}
                              {isCompleted && <CheckCircle2 size={14} className="text-green-500" />}
                              {isFailed && <AlertCircle size={14} className="text-red-500" />}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">{step.planning}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 md:mt-0 text-xs">
                          {step.executionTime > 0 && (
                            <span className="text-slate-400 font-semibold flex items-center gap-1">
                              <Clock size={12} />
                              {step.executionTime} ms
                            </span>
                          )}
                          
                          {isCompleted && (
                            <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-bold border border-green-100 flex items-center gap-1">
                              Confidence: {step.confidence}%
                            </span>
                          )}

                          {isRunning && (
                            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold border border-indigo-100 flex items-center gap-1.5">
                              <Loader size={12} className="animate-spin" />
                              Running
                            </span>
                          )}
                          
                          {isFailed && (
                            <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-bold border border-red-100">
                              Failed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Agent Detail / Inspection Panel */}
            {selectedAgent && (
              <Card className="p-6 border border-slate-200 bg-white shadow-soft-sm space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Agent Log: {selectedAgent.agentName.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Cpu size={12} />
                      Model size override: {selectedAgent.agentName.includes('Interview') || selectedAgent.agentName.includes('ATS') ? 'Qwen 7B (Medium)' : 'Phi-4 Mini (Small)'}
                    </p>
                  </div>
                  <Badge variant={selectedAgent.status === 'completed' ? 'success' : selectedAgent.status === 'failed' ? 'danger' : 'glass'} className="text-xs">
                    {selectedAgent.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Reasoning Summary</span>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed min-h-[80px]">
                      {selectedAgent.reasoning || 'No reasoning summary available for failed run.'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quality Validation checks</span>
                    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed min-h-[80px]">
                      {selectedAgent.validation === 'Passed' ? '✅ Validation check passed: Grammar, Tone, and Hallucination tests all verified successfully.' : selectedAgent.validation}
                    </p>
                  </div>
                </div>

                {selectedAgent.output && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Structured JSON Output</span>
                    <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded-lg overflow-x-auto max-h-[300px] border border-slate-800">
                      {JSON.stringify(selectedAgent.output, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* History Section */
        <div className="max-w-4xl">
          <Card className="p-6 shadow-soft-sm bg-white border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Database size={18} className="text-indigo-600" />
              Pipeline Run Logs
            </h3>

            {!orchestrationHistory || orchestrationHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No past agent executions found. Run a pipeline to populate history.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orchestrationHistory.map((run) => (
                  <div key={run.orchestrationId} className="py-4 flex justify-between items-center hover:bg-slate-50/50 px-3 rounded-lg transition-colors">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Pipeline execution: {run.orchestrationId.substring(0, 8)}...
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{new Date(run.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-indigo-600 font-semibold">{run.agents.length} agents executed</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={run.status === 'completed' ? 'success' : run.status === 'failed' ? 'danger' : 'glass'} className="text-[10px]">
                        {run.status}
                      </Badge>
                      <Button
                        variant="secondary"
                        onClick={() => handleLoadHistoryRun(run.orchestrationId)}
                        className="flex items-center gap-1 py-1 px-3 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200"
                      >
                        Inspect
                        <ChevronRight size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
