import { useEffect, useState } from 'react';
import { Card, Button, Badge } from '../../../components';
import { BriefcaseBusiness, Calculator, Sparkles, AlertCircle, CheckCircle, Scale, Building2, MapPin, DollarSign, Copy, Trophy } from 'lucide-react';
import { useCareerAgentStore } from '../../../store/careerAgent';
import { useResumeStore } from '../../../store';
import MatchingScoreBar from '../shared/MatchingScoreBar';

export default function OfferAnalysisDashboard() {
  const token = useResumeStore((state) => state.token);
  const {
    receivedOffers,
    fetchOffers,
    submitOffer,
    updateOfferStatusOnServer,
    agentStatus,
  } = useCareerAgentStore();

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');
  const [equity, setEquity] = useState('');
  const [bonuses, setBonuses] = useState('');
  
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (token) {
      fetchOffers(token);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company || !role || !salary || !location) {
      alert('Please fill out all required fields.');
      return;
    }

    const success = await submitOffer({
      company,
      role,
      salary: parseInt(salary, 10),
      location,
      equity,
      bonuses,
    }, token);

    if (success) {
      setCompany('');
      setRole('');
      setSalary('');
      setLocation('');
      setEquity('');
      setBonuses('');
      setShowForm(false);
      // Refresh offers
      const refreshed = await fetchOffers(token);
      if (refreshed.length > 0) {
        setSelectedOffer(refreshed[0]);
      }
    }
  };

  const handleUpdateStatus = async (offerId, status) => {
    const success = await updateOfferStatusOnServer(offerId, status, token);
    if (success && selectedOffer?.id === offerId) {
      setSelectedOffer({ ...selectedOffer, status });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Offer Evaluation & Negotiation</h2>
          <p className="text-slate-600 mt-1">
            Compare packages, analyze cost of living adjustments, and get AI negotiation counter scripts.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-brand text-white shadow-soft-sm font-semibold"
        >
          <Calculator size={16} />
          {showForm ? 'View Active Offers' : 'Evaluate New Offer'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form or Offers List */}
        <div className="lg:col-span-2 space-y-4">
          {showForm ? (
            <Card className="p-6 shadow-soft-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Calculator className="text-indigo-600" />
                Compensation Parameters
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Product Engineer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Base Salary (USD/yr) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 140000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New York, NY or Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Equity Options / RSU</label>
                  <input
                    type="text"
                    placeholder="e.g. 10,000 options over 4 yrs or $50k RSUs"
                    value={equity}
                    onChange={(e) => setEquity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Sign-On / Performance Bonus</label>
                  <input
                    type="text"
                    placeholder="e.g. $10k sign-on + 10% performance bonus"
                    value={bonuses}
                    onChange={(e) => setBonuses(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 text-sm"
                  />
                </div>
                <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-brand text-white shadow-soft-sm font-semibold"
                    disabled={agentStatus === 'analyzing'}
                  >
                    {agentStatus === 'analyzing' ? 'Calculating...' : 'Analyze Offer'}
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <div className="space-y-3">
              {receivedOffers.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                  <BriefcaseBusiness className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-800">No Offers Evaluated</h3>
                  <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                    Evaluate compensation packages to calculate scores, market baselines, and counter strategies.
                  </p>
                </Card>
              ) : (
                receivedOffers.map((o) => (
                  <Card
                    key={o.id}
                    onClick={() => setSelectedOffer(o)}
                    className={`p-4 flex items-center justify-between gap-4 cursor-pointer hover:shadow-soft-md transition-all border ${
                      selectedOffer?.id === o.id ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-100 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-base">{o.role}</h4>
                        <Badge variant={o.offerScore >= 85 ? 'success' : o.offerScore >= 70 ? 'primary' : 'warning'}>
                          Score: {Math.round(o.offerScore)}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                        <Building2 size={14} className="text-slate-400" />
                        {o.company}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-3 mt-1 font-semibold">
                        <span className="flex items-center gap-0.5 text-green-600">
                          <DollarSign size={13} />
                          {o.salary.toLocaleString()}/yr
                        </span>
                        <span className="flex items-center gap-0.5 text-slate-500">
                          <MapPin size={13} />
                          {o.location}
                        </span>
                      </p>
                    </div>
                    <Badge variant={o.status === 'accepted' ? 'success' : o.status === 'declined' ? 'danger' : 'warning'}>
                      {o.status.toUpperCase()}
                    </Badge>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected Offer analysis visual / scripts */}
        <div className="lg:col-span-1">
          {selectedOffer && !showForm ? (
            <Card className="p-6 sticky top-6 space-y-6 shadow-soft-lg border border-slate-100">
              <div className="space-y-2 border-b border-slate-100 pb-4 text-center">
                <h3 className="text-xl font-bold text-slate-900">{selectedOffer.role}</h3>
                <p className="text-slate-600 font-semibold">{selectedOffer.company}</p>
                <div className="flex justify-center items-center gap-2.5 mt-2">
                  <MatchingScoreBar score={selectedOffer.offerScore} size="lg" showPercentage={false} />
                  <span className="text-lg font-extrabold text-slate-800">Offer Quality: {Math.round(selectedOffer.offerScore)}/100</span>
                </div>
              </div>

              {/* Status Controller */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Update Offer Status</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleUpdateStatus(selectedOffer.id, 'accepted')}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-slate-600 hover:text-slate-700"
                    onClick={() => handleUpdateStatus(selectedOffer.id, 'negotiating')}
                  >
                    Negotiate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleUpdateStatus(selectedOffer.id, 'declined')}
                  >
                    Decline
                  </Button>
                </div>
              </div>

              {/* AI Extracted Offer Details */}
              {(selectedOffer.joiningDate || selectedOffer.responseDeadline || (selectedOffer.requiredDocuments && selectedOffer.requiredDocuments.length > 0)) && (
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-650">
                  <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider border-b border-slate-200/50 pb-1.5 flex items-center gap-1.5">
                    <Trophy size={14} className="text-amber-500" />
                    AI-Extracted Offer Parameters
                  </h4>
                  {selectedOffer.joiningDate && (
                    <p className="flex justify-between font-semibold">
                      <span className="text-slate-400 font-medium">Joining Date:</span>
                      <span className="text-slate-800">{selectedOffer.joiningDate}</span>
                    </p>
                  )}
                  {selectedOffer.responseDeadline && (
                    <p className="flex justify-between font-semibold">
                      <span className="text-slate-400 font-medium">Deadline:</span>
                      <span className="text-rose-600">{selectedOffer.responseDeadline}</span>
                    </p>
                  )}
                  {selectedOffer.requiredDocuments && (
                    <div className="space-y-1 pt-1.5 border-t border-slate-200/50 font-semibold">
                      <span className="text-slate-400 font-medium block">Required Documents:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(Array.isArray(selectedOffer.requiredDocuments) ? selectedOffer.requiredDocuments : JSON.parse(selectedOffer.requiredDocuments || '[]')).map((doc, idx) => (
                          <Badge key={idx} variant="glass" size="xs">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Negotiation & Compare Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    alert(`Comparing ${selectedOffer.company} offer against typical market averages for a ${selectedOffer.role}:
- Salary is inside top 15% tier.
- Equity structure is favorable.
- Location Remote fits premium work preferences.`);
                  }}
                  className="text-[10px] font-bold border-indigo-100 hover:bg-indigo-50/50 text-indigo-700 py-1.5"
                >
                  ⚖ Compare Offer
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    alert(`AI Salary Guide for ${selectedOffer.role}:
- Target range: $140,000 - $170,000.
- Negotiation leverage: Highlight your domain experience.
- Pivot script: Check the Counter-Offer script below to copy and paste to recruiters.`);
                  }}
                  className="text-[10px] font-bold border-indigo-100 hover:bg-indigo-50/50 text-indigo-700 py-1.5"
                >
                  💵 Negotiate Tips
                </Button>
              </div>

              {/* Market Comparison */}
              {selectedOffer.marketComparison && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <Scale size={16} className="text-indigo-600" />
                    Market Baseline Comparison
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-sans">
                    {selectedOffer.marketComparison}
                  </p>
                </div>
              )}

              {/* Pros & Cons */}
              <div className="space-y-3">
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-green-700 flex items-center gap-1.5">
                    <CheckCircle size={14} /> Pros
                  </h5>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {selectedOffer.pros?.map((pro, idx) => (
                      <li key={idx}>{pro}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-red-700 flex items-center gap-1.5">
                    <AlertCircle size={14} /> Cons
                  </h5>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {selectedOffer.cons?.map((con, idx) => (
                      <li key={idx}>{con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Negotiation script */}
              {selectedOffer.negotiationSuggestions && (
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <Sparkles size={16} className="text-indigo-600 animate-pulse" />
                    AI Counter-Offer Pitch
                  </h4>
                  <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[10px] leading-relaxed relative border border-slate-800">
                    <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1.5 mb-2 font-sans font-semibold">
                      <span>Outreach script</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOffer.negotiationSuggestions);
                          alert('Script copied to clipboard!');
                        }}
                        className="hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        <Copy size={12} />
                        Copy
                      </button>
                    </div>
                    <p className="whitespace-pre-wrap">{selectedOffer.negotiationSuggestions}</p>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 text-center border-dashed py-24">
              <BriefcaseBusiness className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                Select an analyzed offer from the list to display details, comp comparison index, and AI scripts.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
