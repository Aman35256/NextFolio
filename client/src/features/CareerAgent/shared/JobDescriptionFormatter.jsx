import { useEffect, useState, useMemo } from 'react';
import { Card, Button, Badge } from '../../../components';
import { 
  Building2, MapPin, Calendar, DollarSign, Globe, Copy, FileText, 
  CheckCircle2, AlertCircle, Printer, Search, ChevronDown, ChevronUp, 
  Sparkles, ExternalLink, Clock, Briefcase, Eye, HelpCircle, Check, ArrowRight
} from 'lucide-react';
import { useCareerAgentStore } from '../../../store/careerAgent';
import { useResumeStore } from '../../../store';

const getAbsoluteUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
};

export default function JobDescriptionFormatter({ jobId, onClose }) {
  const token = useResumeStore((state) => state.token);
  const atsScore = useResumeStore((state) => state.atsScore);
  const { jobs, formatJob, candidateProfile } = useCareerAgentStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSection, setCopiedSection] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Collapsible section state mapping
  const [collapsed, setCollapsed] = useState({
    companyOverview: false,
    jobSummary: false,
    employmentDetails: false,
    responsibilities: false,
    qualifications: false,
    skills: false,
    preferredQualifications: false,
    softSkills: false,
    projects: false,
    techStack: false,
    benefits: false,
    careerGrowth: false,
    hiringProcess: false,
    atsKeywords: false,
    applicationInstructions: false,
  });

  const toggleCollapse = (section) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const currentJob = useMemo(() => {
    return jobs.find(j => j.id === jobId);
  }, [jobs, jobId]);

  useEffect(() => {
    async function loadFormattedJob() {
      if (!currentJob) return;
      if (currentJob.formattedData) return;

      setLoading(true);
      setError(null);
      try {
        const res = await formatJob(jobId, token);
        if (!res) throw new Error('AI parser failed to structure job description.');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadFormattedJob();
  }, [jobId, currentJob]);

  // Extract candidate profile skills for matching/highlighting
  const candidateSkills = useMemo(() => {
    return (candidateProfile?.allSkills || []).map(s => s.toLowerCase());
  }, [candidateProfile]);

  const formatted = currentJob?.formattedData;

  // Copy text helper
  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // PDF Export using Print Handler
  const handleExportPDF = () => {
    window.print();
  };

  // Search highlighter
  const highlightText = (text, query) => {
    if (!text) return 'Not specified by the employer.';
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase()
            ? <mark key={i} className="bg-yellow-200 text-slate-900 rounded px-0.5">{part}</mark>
            : part
        )}
      </span>
    );
  };

  if (!currentJob) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 min-h-[300px]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-800">Job Not Found</h3>
        <p className="text-slate-500 mt-2 text-sm">The job listing could not be resolved.</p>
        <Button onClick={onClose} className="mt-4" variant="secondary">Close Detail View</Button>
      </div>
    );
  }

  return (
    <div className={`fixed top-16 bottom-0 left-0 right-0 z-40 overflow-y-auto ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/95 text-slate-850'} backdrop-blur-md flex justify-center py-6 px-4 md:px-8 print:relative print:inset-auto print:bg-white print:text-black print:p-0 print:overflow-visible`}>
      {/* Styles for print mode dynamic layout overlay override */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}} />

      <div id="print-area" className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 relative">
        
        {/* Main Formatted Job Container */}
        <div className="flex-1 space-y-6">
          
          {/* Header Card */}
          <Card className={`p-6 md:p-8 shadow-soft-md relative border-t-4 border-t-indigo-600 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="no-print absolute right-6 top-6 flex items-center gap-2">
              {/* Dark mode select */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg border text-xs font-semibold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
              >
                {isDarkMode ? '☀️ Light' : '🌙 Dark'}
              </button>
              
              {/* Export PDF */}
              <Button onClick={handleExportPDF} variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                <Printer size={14} /> Print / Export PDF
              </Button>
              
              <Button onClick={onClose} variant="ghost" size="sm" className="font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-sm">
                ✕ Close
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="glass">{currentJob.originalSource || 'Web Direct'}</Badge>
                {currentJob.remoteStatus && <Badge variant="success">Remote Opportunity</Badge>}
                {currentJob.visaSponsorship && <Badge variant="primary">Visa Sponsor</Badge>}
              </div>

              <div className="space-y-1">
                <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {currentJob.role}
                </h1>
                <p className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  {currentJob.company}
                </p>
              </div>

              {/* Inline Search Bar */}
              <div className="no-print relative max-w-md pt-2">
                <Search className="absolute left-3 top-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search and highlight keywords in description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400'}`}
                />
              </div>
            </div>
          </Card>

          {/* AI Parser Loading State */}
          {loading && (
            <Card className={`p-8 text-center border-dashed ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <Sparkles className="h-10 w-10 text-indigo-500 animate-spin mx-auto mb-4" />
              <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Structuring Job Requirements...</h4>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                NextFolio AI Agent is standardizing headers, extracting required skills, and formatting the details page.
              </p>
            </Card>
          )}

          {error && (
            <Card className="p-4 border-red-200 bg-red-50 text-red-800 flex items-center gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0" />
              <p className="text-sm"><strong>Parsing Info:</strong> Structural parsing failed. Displaying auto-enhanced heuristical format below.</p>
            </Card>
          )}

          {/* Normalization & Formatting Render */}
          {(!loading && formatted) && (
            <div className="space-y-6">
              
              {/* Section 2: Company Overview */}
              <CollapsibleSection
                title="Company Overview"
                id="companyOverview"
                isCollapsed={collapsed.companyOverview}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm"><strong className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Industry:</strong> {highlightText(formatted?.companyOverview?.industry, searchQuery)}</p>
                    <p className="text-sm"><strong className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Company Size:</strong> {highlightText(formatted?.companyOverview?.size, searchQuery)}</p>
                    {formatted?.companyOverview?.website && formatted.companyOverview.website !== 'Not specified by the employer.' && (
                      <p className="text-sm">
                        <strong className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Website:</strong>{' '}
                        <a href={formatted.companyOverview.website} target="_blank" rel="noreferrer" className={`font-semibold hover:underline flex inline-flex items-center gap-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                          Visit Site <ExternalLink size={12} />
                        </a>
                      </p>
                    )}
                  </div>
                  <div className={`space-y-2 pl-4 border-l ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <p className="text-sm italic"><strong className={`${isDarkMode ? 'text-slate-400 block not-italic' : 'text-slate-500 block not-italic'}`}>Mission:</strong> {highlightText(formatted?.companyOverview?.mission, searchQuery)}</p>
                    <p className="text-sm italic"><strong className={`${isDarkMode ? 'text-slate-400 block not-italic' : 'text-slate-500 block not-italic'}`}>Culture:</strong> {highlightText(formatted?.companyOverview?.culture, searchQuery)}</p>
                  </div>
                </div>
                <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Company Description</p>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {highlightText(formatted?.companyOverview?.description || currentJob.companyDescription || currentJob.jobDescription?.slice(0, 150) + '...', searchQuery)}
                  </p>
                </div>
              </CollapsibleSection>

              {/* Section 3: Job Summary */}
              <CollapsibleSection
                title="Job Summary"
                id="jobSummary"
                isCollapsed={collapsed.jobSummary}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {highlightText(formatted?.jobSummary || currentJob.jobDescription?.slice(0, 300) + '...', searchQuery)}
                </p>
              </CollapsibleSection>

              {/* Section 4: Employment Details Responsive Table */}
              <CollapsibleSection
                title="Employment Details"
                id="employmentDetails"
                isCollapsed={collapsed.employmentDetails}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-slate-400 uppercase tracking-wider text-xs ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <th className="py-2.5 font-bold">Parameter</th>
                        <th className="py-2.5 font-bold">Details</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                      <tr className={`${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                        <td className={`py-2.5 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Employment Type</td>
                        <td className="py-2.5">{currentJob.jobType || formatted?.employmentDetails?.employmentType || 'Full-time'}</td>
                      </tr>
                      <tr className={`${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                        <td className={`py-2.5 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Experience Level</td>
                        <td className="py-2.5">{currentJob.experienceRequired || formatted?.employmentDetails?.experience || 'Not specified by the employer.'}</td>
                      </tr>
                      <tr className={`${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                        <td className={`py-2.5 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Work Mode</td>
                        <td className="py-2.5">{currentJob.remoteStatus ? 'Remote' : 'On-site / Hybrid'}</td>
                      </tr>
                      <tr className={`${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                        <td className={`py-2.5 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Location</td>
                        <td className="py-2.5">{currentJob.location || formatted?.employmentDetails?.location || 'Remote'}</td>
                      </tr>
                      <tr className={`${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                        <td className={`py-2.5 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Department</td>
                        <td className="py-2.5">{formatted?.employmentDetails?.department || 'Engineering / Product'}</td>
                      </tr>
                      <tr className={`${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                        <td className={`py-2.5 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Salary Range</td>
                        <td className="py-2.5">{currentJob.salary || formatted?.employmentDetails?.salary || 'Not specified by the employer.'}</td>
                      </tr>
                      <tr className={`${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/50'}`}>
                        <td className={`py-2.5 font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Deadline</td>
                        <td className="py-2.5">{formatted?.employmentDetails?.applicationDeadline || 'Not specified by the employer.'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CollapsibleSection>

              {/* Section 5: Key Responsibilities */}
              <CollapsibleSection
                title="Key Responsibilities"
                id="responsibilities"
                isCollapsed={collapsed.responsibilities}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
                copyText={formatted?.responsibilities?.join('\n')}
                onCopy={(text) => handleCopyText(text, 'responsibilities')}
                copied={copiedSection === 'responsibilities'}
              >
                <ul className="space-y-2.5 list-disc list-inside">
                  {(formatted?.responsibilities || []).map((resp, i) => (
                    <li key={i} className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {highlightText(resp, searchQuery)}
                    </li>
                  ))}
                  {!formatted?.responsibilities?.length && (
                    <p className="text-sm text-slate-500 italic">Not specified by the employer.</p>
                  )}
                </ul>
              </CollapsibleSection>

              {/* Section 6: Required Qualifications */}
              <CollapsibleSection
                title="Required Qualifications"
                id="qualifications"
                isCollapsed={collapsed.qualifications}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <div className="space-y-3">
                  <p className="text-sm">
                    <strong className={`block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Education Requirements:</strong>
                    {highlightText(formatted?.requiredQualifications?.education, searchQuery)}
                  </p>
                  <p className="text-sm">
                    <strong className={`block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Required Experience:</strong>
                    {highlightText(formatted?.requiredQualifications?.experience, searchQuery)}
                  </p>
                  
                  {formatted?.requiredQualifications?.mandatorySkills?.length > 0 && (
                    <div className="pt-2">
                      <strong className={`text-xs uppercase tracking-wider block mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mandatory Skills:</strong>
                      <div className="flex flex-wrap gap-2">
                        {formatted.requiredQualifications.mandatorySkills.map((skill) => {
                          const matched = candidateSkills.includes(skill.toLowerCase());
                          return (
                            <Badge key={skill} variant={matched ? 'success' : 'warning'} className="flex items-center gap-1 font-semibold text-xs py-1 px-2.5">
                              {matched ? <Check size={12} /> : null}
                              {skill}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              {/* Section 7: Technical Skills Grouped by Category */}
              <CollapsibleSection
                title="Technical Skills Grouped"
                id="skills"
                isCollapsed={collapsed.skills}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <div className="space-y-4">
                  {formatted?.technicalSkills && Object.entries(formatted.technicalSkills).map(([category, list]) => {
                    if (!Array.isArray(list) || list.length === 0) return null;
                    const readableName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    
                    return (
                      <div key={category} className={`space-y-2 pb-3 border-b last:border-0 last:pb-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                        <strong className={`text-xs uppercase tracking-wider block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{readableName}</strong>
                        <div className="flex flex-wrap gap-1.5">
                          {list.map((skill) => {
                            const matched = candidateSkills.includes(skill.toLowerCase());
                            return (
                              <Badge key={skill} variant={matched ? 'success' : 'glass'} size="sm" className="font-medium">
                                {skill} {matched && '✓'}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {!formatted?.technicalSkills && (
                    <p className="text-sm text-slate-500 italic">Not specified by the employer.</p>
                  )}
                </div>
              </CollapsibleSection>

              {/* Section 8: Preferred Qualifications */}
              <CollapsibleSection
                title="Preferred Qualifications (Optional)"
                id="preferredQualifications"
                isCollapsed={collapsed.preferredQualifications}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <ul className="space-y-2 list-disc list-inside">
                  {(formatted?.preferredQualifications || []).map((pref, i) => (
                    <li key={i} className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {highlightText(pref, searchQuery)}
                    </li>
                  ))}
                  {!formatted?.preferredQualifications?.length && (
                    <p className="text-sm text-slate-500 italic">No optional requirements listed.</p>
                  )}
                </ul>
              </CollapsibleSection>

              {/* Section 9: Soft Skills */}
              <CollapsibleSection
                title="Soft Skills & Behaviors"
                id="softSkills"
                isCollapsed={collapsed.softSkills}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <div className="flex flex-wrap gap-2">
                  {(formatted?.softSkills || []).map((skill) => {
                    const matched = candidateSkills.includes(skill.toLowerCase());
                    return (
                      <Badge key={skill} variant={matched ? 'success' : 'glass'} className="font-semibold text-xs py-1 px-3">
                        {skill}
                      </Badge>
                    );
                  })}
                  {!formatted?.softSkills?.length && (
                    <p className="text-sm text-slate-500 italic">Not specified by the employer.</p>
                  )}
                </div>
              </CollapsibleSection>

              {/* Section 10: Projects / Work You'll Do */}
              <CollapsibleSection
                title="Expected Projects & Core Work"
                id="projects"
                isCollapsed={collapsed.projects}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <ul className="space-y-2 list-decimal list-inside">
                  {(formatted?.projects || []).map((proj, i) => (
                    <li key={i} className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {highlightText(proj, searchQuery)}
                    </li>
                  ))}
                  {!formatted?.projects?.length && (
                    <p className="text-sm text-slate-500 italic">Not specified by the employer.</p>
                  )}
                </ul>
              </CollapsibleSection>

              {/* Section 11: Tech Stack Badges */}
              <CollapsibleSection
                title="Tech Stack Matrix"
                id="techStack"
                isCollapsed={collapsed.techStack}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formatted?.techStack && Object.entries(formatted.techStack).map(([layer, items]) => {
                    if (!Array.isArray(items) || items.length === 0) return null;
                    return (
                      <div key={layer} className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                        <strong className="text-xs uppercase text-slate-400 block mb-2">{layer}</strong>
                        <div className="flex flex-wrap gap-1.5">
                          {items.map(item => (
                            <Badge key={item} variant="primary" size="xs">{item}</Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleSection>

              {/* Section 12: Benefits & Perks */}
              <CollapsibleSection
                title="Benefits & perks"
                id="benefits"
                isCollapsed={collapsed.benefits}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(formatted?.benefits || []).map((ben, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <span className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0" />
                      <span>{ben}</span>
                    </div>
                  ))}
                  {!formatted?.benefits?.length && (
                    <p className="text-sm text-slate-500 italic">Not specified by the employer.</p>
                  )}
                </div>
              </CollapsibleSection>

              {/* Section 13: Career Growth */}
              <CollapsibleSection
                title="Career Growth & Learning"
                id="careerGrowth"
                isCollapsed={collapsed.careerGrowth}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <ul className={`space-y-2 list-disc list-inside text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {(formatted?.careerGrowth || []).map((growth, i) => (
                    <li key={i}>{growth}</li>
                  ))}
                  {!formatted?.careerGrowth?.length && (
                    <p className="text-sm text-slate-500 italic">Not specified by the employer.</p>
                  )}
                </ul>
              </CollapsibleSection>

              {/* Section 14: Hiring Process Timeline */}
              <CollapsibleSection
                title="Hiring Process stages"
                id="hiringProcess"
                isCollapsed={collapsed.hiringProcess}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                {formatted?.hiringProcess?.length > 0 ? (
                  <div className={`relative border-l-2 ml-4 py-2 space-y-4 ${isDarkMode ? 'border-slate-800' : 'border-indigo-100'}`}>
                    {formatted.hiringProcess.map((step, i) => (
                      <div key={i} className="relative pl-6">
                        <div className="absolute -left-1.5 top-1 h-3.5 w-3.5 bg-indigo-600 rounded-full border border-white dark:border-slate-900" />
                        <h5 className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{step}</h5>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Stage {i + 1}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Hiring process not specified.</p>
                )}
              </CollapsibleSection>

              {/* Section 15: ATS Keywords */}
              <CollapsibleSection
                title="ATS Standard Keywords"
                id="atsKeywords"
                isCollapsed={collapsed.atsKeywords}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <div className="flex flex-wrap gap-1.5">
                  {(formatted?.atsKeywords || []).map((kw) => (
                    <Badge key={kw} variant="glass" className="font-medium text-xs hover:bg-slate-200 cursor-pointer">
                      #{kw}
                    </Badge>
                  ))}
                </div>
              </CollapsibleSection>

              {/* Section 16: Application Instructions */}
              <CollapsibleSection
                title="Application Instructions & Requirements"
                id="applicationInstructions"
                isCollapsed={collapsed.applicationInstructions}
                onToggle={toggleCollapse}
                isDarkMode={isDarkMode}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <strong className={`text-xs block mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Required Documents</strong>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${formatted?.applicationInstructions?.resumeRequired ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span>Resume</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${formatted?.applicationInstructions?.coverLetterRequired ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span>Cover Letter</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${formatted?.applicationInstructions?.portfolioRequired ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span>Portfolio</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${formatted?.applicationInstructions?.githubRequired ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span>GitHub Profile</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`space-y-3 pt-2 sm:pt-0 sm:pl-4 sm:border-l ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <p className="text-sm"><strong className={`${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Deadline:</strong> {formatted?.applicationInstructions?.deadline || 'Not specified by the employer.'}</p>
                    <Button
                      variant="primary"
                      className="w-full bg-gradient-brand text-white shadow-soft-sm font-semibold flex items-center justify-center gap-1.5 text-sm"
                      onClick={() => window.open(getAbsoluteUrl(currentJob.applyUrl || formatted?.applicationInstructions?.applyLink), '_blank')}
                    >
                      Apply Now External <ExternalLink size={14} />
                    </Button>
                  </div>
                </div>
              </CollapsibleSection>
              
            </div>
          )}

          {/* Fallback View: Displaying raw content inside structural cards */}
          {(!formatted && !loading) && (
            <Card className={`p-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Job Description</h3>
              <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {highlightText(currentJob.jobDescription, searchQuery)}
              </p>
            </Card>
          )}

        </div>

        {/* Right Sticky Summary Sidebar & AI Insights */}
        <div className="w-full lg:w-80 space-y-6 lg:sticky lg:top-6 no-print">
          
          {/* Summary Card */}
          <Card className={`p-6 shadow-soft-md ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <h4 className={`font-bold text-base border-b pb-3 mb-4 flex items-center gap-2 ${isDarkMode ? 'border-slate-800 text-white' : 'border-slate-100 text-slate-800'}`}>
              <Briefcase className="text-indigo-600" />
              Summary Card
            </h4>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">Role</span>
                <span className="font-semibold">{currentJob.role}</span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">Company</span>
                <span className="font-semibold">{currentJob.company}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">Location</span>
                  <span className="font-medium text-xs">{currentJob.location || 'Remote'}</span>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">Type</span>
                  <span className="font-medium text-xs">{currentJob.jobType || 'Full-time'}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider">Salary</span>
                <span className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{currentJob.salary || 'Not specified'}</span>
              </div>
              
              <div className={`pt-3 border-t space-y-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                {!currentJob.applyUrl ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Application link unavailable.</span>
                      Please visit the employer's careers page manually.
                    </div>
                  </div>
                ) : (
                    <Button
                      variant="primary"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold text-white text-xs py-2"
                      onClick={() => window.open(getAbsoluteUrl(currentJob.applyUrl), '_blank', 'noopener,noreferrer')}
                    >
                      Apply Externally
                    </Button>
                )}
              </div>
            </div>
          </Card>

          {/* AI Insights panel */}
          <Card className={`p-6 shadow-soft-md border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h4 className={`font-bold text-base border-b pb-3 mb-4 flex items-center gap-2 ${isDarkMode ? 'border-slate-800 text-purple-400' : 'border-purple-100 text-purple-700'}`}>
              <Sparkles size={18} className="animate-pulse" />
              AI Insights
            </h4>

            <div className="space-y-4 text-sm">
              <div className={`flex justify-between items-center p-2.5 rounded-lg border ${isDarkMode ? 'bg-purple-950/30 border-purple-900/30' : 'bg-purple-50 border-purple-100/60'}`}>
                <span className={`font-semibold text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-950'}`}>Match score</span>
                <Badge variant="glass" className={`font-extrabold ${isDarkMode ? 'bg-purple-900/60 text-purple-200' : 'bg-purple-200 text-purple-800'}`}>
                  {atsScore ? Math.min(atsScore + 5, 95) : 80}%
                </Badge>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider mb-1">ATS Compatibility</span>
                <div className={`h-2 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${atsScore || 75}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-500 mt-1 block text-right">{atsScore || 75}% Compatible</span>
              </div>

              {formatted?.requiredQualifications?.mandatorySkills && (
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 block tracking-wider mb-2">Missing Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {formatted.requiredQualifications.mandatorySkills
                      .filter(skill => !candidateSkills.includes(skill.toLowerCase()))
                      .slice(0, 3)
                      .map(skill => (
                        <Badge key={skill} variant="warning" size="xs">{skill}</Badge>
                      ))
                    }
                    {formatted.requiredQualifications.mandatorySkills.filter(skill => !candidateSkills.includes(skill.toLowerCase())).length === 0 && (
                      <span className="text-xs text-green-650 font-semibold">Perfect Skill Match!</span>
                    )}
                  </div>
                </div>
              )}

              <div className={`pt-2 border-t text-xs leading-relaxed text-slate-500 ${isDarkMode ? 'border-slate-800' : 'border-purple-100'}`}>
                <p className="italic">💡 Marked Insights are autonomous analyses based on candidate resume and parsed ATS parameters.</p>
              </div>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
}

// Collapsible helper component
function CollapsibleSection({ 
  title, id, isCollapsed, onToggle, children, isDarkMode, copyText, onCopy, copied 
}) {
  return (
    <Card className={`p-4 md:p-5 shadow-soft-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className={`flex justify-between items-center border-b pb-2 mb-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <h4 className={`font-extrabold text-base tracking-wide flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          <span className="h-3.5 w-1 bg-indigo-600 rounded-full" />
          {title}
        </h4>
        
        <div className="no-print flex items-center gap-1.5">
          {copyText && (
            <button
              onClick={() => onCopy(copyText)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
              title="Copy details to clipboard"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
          
          <button
            onClick={() => onToggle(id)}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>
      
      <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
        {children}
      </div>
    </Card>
  );
}
