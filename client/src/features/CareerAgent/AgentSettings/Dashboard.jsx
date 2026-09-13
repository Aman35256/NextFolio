import { useEffect, useState } from 'react';
import { Card, Button, Badge } from '../../../components';
import { Settings, Brain, Trash2, Plus, X, Globe, Save } from 'lucide-react';
import { useCareerAgentStore } from '../../../store/careerAgent';
import { useResumeStore } from '../../../store';

export default function AgentSettingsDashboard() {
  const token = useResumeStore((state) => state.token);
  const {
    fetchSettings,
    updateSettings,
    resetCareerAgent,
  } = useCareerAgentStore();

  const [preferredRoles, setPreferredRoles] = useState([]);
  const [preferredLocations, setPreferredLocations] = useState([]);
  const [preferredIndustries, setPreferredIndustries] = useState([]);
  const [learnings, setLearnings] = useState({ roles: [], locations: [], industries: [] });

  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');

  useEffect(() => {
    if (token) {
      fetchSettings(token).then((settings) => {
        if (settings) {
          setPreferredRoles(settings.preferredRoles || []);
          setPreferredLocations(settings.preferredLocations || []);
          setPreferredIndustries(settings.preferredIndustries || []);
          setLearnings(settings.agentLearnings || { roles: [], locations: [], industries: [] });
        }
      });
    }
  }, [token]);

  const handleSave = async () => {
    const success = await updateSettings({
      preferredRoles,
      preferredLocations,
      preferredIndustries,
    }, token);

    if (success) {
      alert('Preferences saved successfully!');
    }
  };

  const handleResetAgent = () => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset the agent? This will clear all memory records, matches, and logs.'
    );
    if (confirmReset) {
      resetCareerAgent();
      alert('Career Agent has been reset.');
    }
  };

  const addItem = (type, value, setter, currentList) => {
    if (value.trim() && !currentList.includes(value.trim())) {
      setter([...currentList, value.trim()]);
    }
  };

  const removeItem = (item, setter, currentList) => {
    setter(currentList.filter((i) => i !== item));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Career Agent Settings</h2>
        <p className="text-slate-600 mt-1">
          Customize target jobs, location parameters, and manage the agent memory layer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules & preferences configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-6 shadow-soft-sm">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Settings className="text-indigo-600" />
              Target Job Settings
            </h3>

            <div className="space-y-4">
              {/* Roles */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Target Job Titles / Roles</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (addItem('role', roleInput, setPreferredRoles, preferredRoles), setRoleInput(''))}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 text-sm"
                  />
                  <Button variant="secondary" onClick={() => { addItem('role', roleInput, setPreferredRoles, preferredRoles); setRoleInput(''); }}>
                    <Plus size={16} />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {preferredRoles.map((role) => (
                    <span key={role} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-3 py-1 text-xs font-semibold">
                      {role}
                      <X size={12} className="cursor-pointer" onClick={() => removeItem(role, setPreferredRoles, preferredRoles)} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Target Locations / Cities</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Remote, San Francisco, New York"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (addItem('location', locationInput, setPreferredLocations, preferredLocations), setLocationInput(''))}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 text-sm"
                  />
                  <Button variant="secondary" onClick={() => { addItem('location', locationInput, setPreferredLocations, preferredLocations); setLocationInput(''); }}>
                    <Plus size={16} />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {preferredLocations.map((loc) => (
                    <span key={loc} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-3 py-1 text-xs font-semibold">
                      {loc}
                      <X size={12} className="cursor-pointer" onClick={() => removeItem(loc, setPreferredLocations, preferredLocations)} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Industries */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Target Industries</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Fintech, AI, SaaS, Healthtech"
                    value={industryInput}
                    onChange={(e) => setIndustryInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (addItem('industry', industryInput, setPreferredIndustries, preferredIndustries), setIndustryInput(''))}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 text-sm"
                  />
                  <Button variant="secondary" onClick={() => { addItem('industry', industryInput, setPreferredIndustries, preferredIndustries); setIndustryInput(''); }}>
                    <Plus size={16} />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {preferredIndustries.map((ind) => (
                    <span key={ind} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-3 py-1 text-xs font-semibold">
                      {ind}
                      <X size={12} className="cursor-pointer" onClick={() => removeItem(ind, setPreferredIndustries, preferredIndustries)} />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button onClick={handleSave} className="bg-gradient-brand text-white shadow-soft-sm font-semibold flex items-center gap-2">
                <Save size={16} />
                Save Preferences
              </Button>
            </div>
          </Card>
        </div>

        {/* Memory Layer Side panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Memory display */}
          <Card className="p-6 space-y-6 shadow-soft-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Brain className="text-indigo-600" />
              Agent Memory Layer
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              The agent continuously learns from your profile analysis, target searches, and application history. These learned weights optimize future searches.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Auto-Learned Roles</span>
                <div className="flex flex-wrap gap-1.5">
                  {learnings.roles?.map((r) => (
                    <Badge key={r} variant="glass" size="xs">{r}</Badge>
                  ))}
                  {!learnings.roles?.length && <span className="text-xs text-slate-400">Learning roles in progress...</span>}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Auto-Learned Locations</span>
                <div className="flex flex-wrap gap-1.5">
                  {learnings.locations?.map((l) => (
                    <Badge key={l} variant="glass" size="xs">{l}</Badge>
                  ))}
                  {!learnings.locations?.length && <span className="text-xs text-slate-400">Learning locations in progress...</span>}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={handleResetAgent}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Reset Agent Memory
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
