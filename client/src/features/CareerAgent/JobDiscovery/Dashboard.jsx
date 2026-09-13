import { useEffect, useState } from 'react';
import { Card, Button, Badge } from '../../../components';
import { Search, SlidersHorizontal, RefreshCw, Eye, Sparkles, MapPin, DollarSign, Calendar, Building, Briefcase, Globe, AlertCircle } from 'lucide-react';
import { useCareerAgentStore } from '../../../store/careerAgent';
import { useResumeStore } from '../../../store';
import JobCard from '../shared/JobCard';
import JobDescriptionFormatter from '../shared/JobDescriptionFormatter';

export default function JobDiscoveryDashboard() {
  const [roleQuery, setRoleQuery] = useState('');
  const [companyQuery, setCompanyQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState('all'); // 'all', 'remote', 'onsite'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'fulltime', 'parttime', 'internship', 'contract'
  const [visaOnly, setVisaOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [formatJobId, setFormatJobId] = useState(null);
  
  const token = useResumeStore((state) => state.token);
  const {
    jobs,
    jobsLoading,
    jobsError,
    discoverJobs,
    fetchJobs,
    agentStatus,
    agentMessage,
    matchJobs,
  } = useCareerAgentStore();

  useEffect(() => {
    if (token) {
      fetchJobs(token);
    }
  }, [token]);

  const handleDiscover = async () => {
    await discoverJobs({
      remote: siteFilter === 'remote' ? true : siteFilter === 'onsite' ? false : null,
    }, token);
    // Also trigger evaluation
    await matchJobs(token);
  };



  const filteredJobs = jobs.filter((job) => {
    const matchesRole = !roleQuery || job.role.toLowerCase().includes(roleQuery.toLowerCase());
    const matchesCompany = !companyQuery || job.company.toLowerCase().includes(companyQuery.toLowerCase());
    const matchesLocation = !locationQuery || job.location.toLowerCase().includes(locationQuery.toLowerCase());
    
    const matchesSite =
      siteFilter === 'all' ||
      (siteFilter === 'remote' && job.remoteStatus === true) ||
      (siteFilter === 'onsite' && job.remoteStatus === false);

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'fulltime' && (job.jobType || '').toLowerCase() === 'full-time') ||
      (typeFilter === 'parttime' && (job.jobType || '').toLowerCase() === 'part-time') ||
      (typeFilter === 'internship' && (job.jobType || '').toLowerCase() === 'internship') ||
      (typeFilter === 'contract' && (job.jobType || '').toLowerCase() === 'contract');

    const matchesVisa = !visaOnly || job.visaSponsorship;

    return matchesRole && matchesCompany && matchesLocation && matchesSite && matchesType && matchesVisa;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Global Job Discovery</h2>
          <p className="text-slate-600 mt-1">
            Autonomous crawlers searching live portfolios and public job boards worldwide.
          </p>
        </div>
        <Button
          onClick={handleDiscover}
          disabled={jobsLoading || agentStatus !== 'idle'}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold"
        >
          <RefreshCw className={`h-4 w-4 ${jobsLoading ? 'animate-spin' : ''}`} />
          {jobsLoading ? 'Crawling...' : 'Trigger Crawler Search'}
        </Button>
      </div>

      {/* Advanced Search & Filters Grid */}
      <Card className="p-5 shadow-soft-sm bg-white border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Advanced Search & Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Job Role Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Role</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="e.g. Engineer, React..."
                value={roleQuery}
                onChange={(e) => setRoleQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Company Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="e.g. Google, Mitre..."
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Location Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="e.g. Remote, Europe..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Job Site Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Site</label>
            <div className="relative animate-fade-in">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 cursor-pointer text-slate-700 font-medium appearance-none"
              >
                <option value="all">All Sites</option>
                <option value="remote">Remote Only</option>
                <option value="onsite">On-Site Only</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          {/* Job Type Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Type</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 cursor-pointer text-slate-700 font-medium appearance-none"
              >
                <option value="all">All Types</option>
                <option value="fulltime">Full-Time</option>
                <option value="parttime">Part-Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 border-t border-slate-100 gap-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={visaOnly}
                onChange={(e) => setVisaOnly(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              Requires Visa Sponsorship
            </label>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <span>{filteredJobs.length} Jobs Found</span>
          </div>
        </div>
      </Card>

      {/* Main Layout: List and details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredJobs.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Search className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No Jobs Discovered</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                No jobs match your filters. Try triggering a crawler search to find live postings.
              </p>
              <Button onClick={handleDiscover} className="mt-4" variant="secondary">
                Trigger Search Now
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => {
                // Parse salary range
                const salaryStr = job.salary || '';
                let salMin = null, salMax = null;
                const numbers = salaryStr.match(/\d+/g);
                if (numbers) {
                  salMin = parseInt(numbers[0]) * 1000;
                  salMax = numbers[1] ? parseInt(numbers[1]) * 1000 : null;
                }

                const mappedJob = {
                  ...job,
                  title: job.role,
                  remote: job.remoteStatus,
                  jobType: job.jobType || 'Full-Time',
                  salary: salMin ? { min: salMin, max: salMax } : null,
                };

                return (
                  <JobCard
                    key={job.id}
                    job={mappedJob}
                    onView={() => setSelectedJob(job)}
                    onSave={() => alert('Job saved to favorites!')}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Job Description Detail panel */}
        <div className="lg:col-span-1">
          {selectedJob ? (
            <Card className="p-6 sticky top-6 space-y-6 shadow-soft-md border-l-4 border-l-indigo-600">
              <div className="space-y-2">
                <Badge variant="glass">{selectedJob.originalSource || 'Web'}</Badge>
                <h3 className="text-2xl font-bold text-slate-900">{selectedJob.role}</h3>
                <p className="text-lg font-medium text-slate-600">{selectedJob.company}</p>
                <Button
                  onClick={() => setFormatJobId(selectedJob.id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold flex items-center justify-center gap-1.5 mt-2"
                >
                  <Sparkles size={16} /> View Recruiter Format (ATS)
                </Button>
              </div>

              <div className="space-y-3 py-4 border-y border-slate-100 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin size={18} className="text-indigo-500" />
                  <span>{selectedJob.location}</span>
                  {selectedJob.remoteStatus && (
                    <Badge variant="success" size="sm">Remote</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Briefcase size={18} className="text-indigo-500" />
                  <span className="capitalize">{selectedJob.jobType || 'Full-Time'}</span>
                </div>
                {selectedJob.salary && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <DollarSign size={18} className="text-green-500" />
                    <span>{selectedJob.salary}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar size={18} className="text-amber-500" />
                  <span>Discovered {new Date(selectedJob.dateDiscovered).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Job Description</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {selectedJob.jobDescription}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                {!selectedJob.applyUrl ? (
                  <div className="bg-red-55 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Application link unavailable.</span>
                      Please visit the employer's careers page manually.
                    </div>
                  </div>
                ) : (
                    <Button
                      variant="primary"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold text-white text-sm py-2"
                      onClick={() => window.open(selectedJob.applyUrl, '_blank', 'noopener,noreferrer')}
                    >
                      Apply Externally
                    </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center border-dashed py-16">
              <Eye className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                Select a job from the list to view its full description and parameters.
              </p>
            </Card>
          )}
        </div>
      </div>
      {formatJobId && (
        <JobDescriptionFormatter jobId={formatJobId} onClose={() => setFormatJobId(null)} />
      )}
    </div>
  );
}

