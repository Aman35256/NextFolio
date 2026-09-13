import { useEffect, useState, useRef } from 'react';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Flame,
  GitBranch,
  HelpCircle,
  Lightbulb,
  Milestone,
  Network,
  Play,
  RotateCw,
  Send,
  ShieldAlert,
  Sparkles,
  Trophy,
  User,
  Zap,
  RefreshCw,
  Terminal,
  UserCheck,
} from 'lucide-react';
import { Card, Button, Badge } from '../components';
import { useKnowledgeMapStore } from '../store/knowledgeMap';
import { useResumeStore } from '../store';

const TARGET_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'AI Engineer',
  'ML Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'Cloud Engineer',
  'Cybersecurity Engineer',
  'Product Manager',
];

const ROADMAP_SH_MAP = {
  'Frontend Developer': 'https://roadmap.sh/frontend',
  'Backend Developer': 'https://roadmap.sh/backend',
  'Full Stack Developer': 'https://roadmap.sh/full-stack',
  'AI Engineer': 'https://roadmap.sh/ai-engineer',
  'ML Engineer': 'https://roadmap.sh/ai-data-scientist',
  'Data Scientist': 'https://roadmap.sh/datascience',
  'DevOps Engineer': 'https://roadmap.sh/devops',
  'Cloud Engineer': 'https://roadmap.sh/cloud-architect',
  'Cybersecurity Engineer': 'https://roadmap.sh/cyber-security',
  'Product Manager': 'https://roadmap.sh/product-manager',
};

export default function KnowledgeMapPage() {
  const token = useResumeStore((state) => state.token);
  const {
    skills,
    roadmap,
    dailyPlan,
    loading,
    fetchSkills,
    fetchRoadmap,
    fetchDailyPlan,
    generateRoadmap,
    completeTask,
    updateMastery,
    extractSkills,
  } = useKnowledgeMapStore();

  const [activeTab, setActiveTab] = useState('skills');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['skills', 'paths', 'gap', 'roadmap', 'recommendations', 'progress', 'resources'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (token) {
      fetchSkills(token);
      fetchRoadmap(token);
      fetchDailyPlan(token);
    }
  }, [token]);

  const handleSelectRole = async (role) => {
    if (token) {
      await generateRoadmap(role, token);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'paths':
        return <LearningPathsTab skills={skills} roadmap={roadmap} />;
      case 'gap':
        return <SkillGapTab skills={skills} roadmap={roadmap} handleSelectRole={handleSelectRole} />;
      case 'roadmap':
        return <RoadmapTab roadmap={roadmap} handleSelectRole={handleSelectRole} updateMastery={updateMastery} token={token} />;
      case 'recommendations':
        return <RecommendationsTab skills={skills} roadmap={roadmap} />;
      case 'progress':
        return <ProgressTrackerTab roadmap={roadmap} dailyPlan={dailyPlan} completeTask={completeTask} token={token} />;
      case 'resources':
        return <LearningResourcesTab />;
      case 'skills':
      default:
        return <InteractiveGraphTab skills={skills} updateMastery={updateMastery} extractSkills={extractSkills} token={token} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-brand bg-clip-text text-transparent">
            NextFolio Knowledge Map
          </h1>
          <p className="text-slate-600 mt-2">
            AI-powered interactive skills visualization, career roadmaps, and micro-learning tutor.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">Career Goal:</span>
            <select
              value={roadmap?.targetRole || ''}
              onChange={(e) => handleSelectRole(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
            >
              <option value="" disabled>Select target career role...</option>
              {TARGET_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
        {roadmap && (
          <div className="flex items-center gap-6 bg-white px-5 py-3 rounded-2xl shadow-soft-sm border border-slate-100">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Streak</p>
                <p className="text-lg font-extrabold text-slate-800">{roadmap.streak || 0} Days</p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Level</p>
                <p className="text-lg font-extrabold text-slate-800">Lvl {roadmap.level || 1}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-indigo-500" />
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">XP Points</p>
                <p className="text-lg font-extrabold text-slate-800">{roadmap.xp || 0} XP</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Tab Controller Container */}
      <div className="space-y-6">
        {loading ? (
          <Card className="p-16 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">AI Agent generating custom knowledge graph...</p>
          </Card>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
}

/* ==================== SUB-COMPONENTS ==================== */

// 1. Interactive Graph Tab
function InteractiveGraphTab({ skills, updateMastery, extractSkills, token }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [editingMastery, setEditingMastery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // SVG Size parameters
  const width = 800;
  const height = 750;

  // Zoom & Pan state (zoom scale 'k' removed, only track translate 'x' and 'y')
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState(null);

  // Node physics refs to prevent state re-renders from killing animation frame loop
  const nodeRefs = useRef([]);
  const [tick, setTick] = useState(0);
  const [alpha, setAlpha] = useState(1.0); // Temperature decay for simulation settling

  // Synchronize incoming skills with local node coordinates
  useEffect(() => {
    if (!skills || skills.length === 0) return;
    
    nodeRefs.current = skills.map((skill, idx) => {
      const existing = nodeRefs.current.find(n => n.id === skill.id);
      if (existing) {
        return { ...existing, ...skill };
      }
      
      // Position categories in bands vertically, but spread out horizontally
      const categories = ['Programming', 'Frontend', 'Backend', 'Cloud/DevOps', 'Databases/Infrastructure', 'Data Science/AI', 'General Tech', 'General'];
      const catIdx = categories.indexOf(skill.category || 'General');
      const baseRowY = 100 + (catIdx >= 0 ? catIdx : 7) * 80;
      
      // Spread nodes along row
      const sameCategoryNodes = skills.filter(s => (s.category || 'General') === (skill.category || 'General'));
      const N = sameCategoryNodes.length;
      const indexInCat = sameCategoryNodes.findIndex(s => s.id === skill.id);
      
      let x = 400;
      if (N > 1) {
        const step = Math.min(100, 600 / (N - 1));
        const totalW = (N - 1) * step;
        x = 400 - (totalW / 2) + indexInCat * step;
      }
      
      return {
        ...skill,
        x: x + (Math.random() - 0.5) * 30, // Slight stagger
        y: baseRowY + (idx % 2 === 1 ? 25 : 0),
        vx: 0,
        vy: 0,
        fx: null,
        fy: null
      };
    });
    
    setAlpha(1.0); // Restart simulation on content sync
  }, [skills]);

  // Newtonian Physics Simulation Ticker loop
  useEffect(() => {
    let animId;
    const runSimulation = () => {
      const nodes = nodeRefs.current;
      const n = nodes.length;
      if (n === 0) {
        animId = requestAnimationFrame(runSimulation);
        return;
      }

      // 1. Repulsion force between all nodes (Many-body gravity)
      const chargeStrength = -750;
      for (let i = 0; i < n; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < n; j++) {
          const nodeB = nodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distSq = dx * dx + dy * dy + 1e-4;
          const dist = Math.sqrt(distSq);
          if (dist < 350) {
            const force = (chargeStrength * alpha) / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (nodeA.fx === null) { nodeA.vx += fx; nodeA.vy += fy; }
            if (nodeB.fx === null) { nodeB.vx -= fx; nodeB.vy -= fy; }
          }
        }
      }

      // 2. Attraction spring force along prerequisite paths
      const linkStrength = 0.05;
      const targetDist = 130;
      nodes.forEach((node) => {
        if (node.prerequisites && node.prerequisites.length > 0) {
          node.prerequisites.forEach((prereqName) => {
            const parent = nodes.find(n => n.name.toLowerCase() === prereqName.toLowerCase());
            if (parent) {
              const dx = node.x - parent.x;
              const dy = node.y - parent.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1e-4;
              const force = (dist - targetDist) * linkStrength * alpha;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              if (node.fx === null) { node.vx -= fx; node.vy -= fy; }
              if (parent.fx === null) { parent.vx += fx; parent.vy += fy; }
            }
          });
        }
      });

      // 3. Gravity pulling nodes back toward container center (400, 375)
      const gravity = 0.015;
      nodes.forEach((node) => {
        if (node.fx === null) {
          node.vx += (400 - node.x) * gravity * alpha;
          node.vy += (375 - node.y) * gravity * alpha;
        }
      });

      // 4. Stiff collision push (Radius: 65px to completely separate nodes + text labels)
      const collisionRadius = 65;
      const minDist = collisionRadius * 2;
      for (let i = 0; i < n; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < n; j++) {
          const nodeB = nodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1e-4;
          if (dist < minDist) {
            const overlap = minDist - dist;
            const force = overlap * 0.45;
            const pushX = (dx / dist) * force;
            const pushY = (dy / dist) * force;

            if (nodeA.fx === null) { nodeA.x -= pushX; nodeA.y -= pushY; }
            if (nodeB.fx === null) { nodeB.x += pushX; nodeB.y += pushY; }
          }
        }
      }

      // 5. Apply velocity and friction constraints
      const friction = 0.85;
      const padding = 50;
      nodes.forEach((node) => {
        if (node.fx !== null) {
          node.x = node.fx;
          node.y = node.fy;
          node.vx = 0;
          node.vy = 0;
        } else {
          node.x += node.vx;
          node.y += node.vy;
          node.vx *= friction;
          node.vy *= friction;

          // Keep nodes inside canvas bounds
          node.x = Math.max(padding, Math.min(width - padding, node.x));
          node.y = Math.max(padding, Math.min(height - padding, node.y));
        }
      });

      // Decay simulation temperature
      if (alpha > 0.05) {
        setAlpha(a => a * 0.99);
      }

      setTick(t => t + 1); // Trigger React re-render of SVG
      animId = requestAnimationFrame(runSimulation);
    };

    animId = requestAnimationFrame(runSimulation);
    return () => cancelAnimationFrame(animId);
  }, [alpha]);

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.id === 'bg-rect') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setTransform({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    } else if (isDragging && draggedNodeId !== null) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - transform.x;
      const mouseY = e.clientY - rect.top - transform.y;

      const node = nodeRefs.current.find(n => n.id === draggedNodeId);
      if (node) {
        node.fx = mouseX;
        node.fy = mouseY;
        setAlpha(1.0); // Keep physics active during drag
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging && draggedNodeId !== null) {
      const node = nodeRefs.current.find(n => n.id === draggedNodeId);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
    }
    setIsDragging(false);
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    setIsDragging(true);
    setDraggedNodeId(node.id);
    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - transform.x;
    const mouseY = e.clientY - rect.top - transform.y;
    node.fx = mouseX;
    node.fy = mouseY;
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setEditingMastery(node.mastery.toString());
  };

  const handleSaveMastery = async () => {
    if (selectedNode && token) {
      setIsUpdating(true);
      await updateMastery(selectedNode.id, parseInt(editingMastery), token);
      setSelectedNode({
        ...selectedNode,
        mastery: parseInt(editingMastery),
        status: parseInt(editingMastery) >= 80 ? 'mastered' : 'in_progress',
      });
      setIsUpdating(false);
    }
  };

  const handleResetCenter = () => {
    setTransform({ x: 0, y: 0 });
    setAlpha(1.0); // Rekindle simulation forces
  };

  const handleFitToScreen = () => {
    const nodes = nodeRefs.current;
    if (nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newX = width / 2 - centerX;
    const newY = height / 2 - centerY;

    setTransform({ x: newX, y: newY });
  };

  const handleSearchNode = (node) => {
    setSearchQuery(node.name);
    setShowSuggestions(false);
    
    // Center directly on the selected node without scaling
    const newX = width / 2 - node.x;
    const newY = height / 2 - node.y;
    
    setTransform({ x: newX, y: newY });
    setSelectedNode(node);
    setEditingMastery(node.mastery.toString());
  };

  const isConnected = (nodeA, nodeB) => {
    if (!nodeA || !nodeB) return false;
    if (nodeA.id === nodeB.id) return true;
    const nameA = nodeA.name.toLowerCase();
    const nameB = nodeB.name.toLowerCase();
    
    const aPrereqs = (nodeA.prerequisites || []).map(p => p.toLowerCase());
    const bPrereqs = (nodeB.prerequisites || []).map(p => p.toLowerCase());
    
    return aPrereqs.includes(nameB) || bPrereqs.includes(nameA);
  };

  const filteredSuggestions = searchQuery.trim() === ''
    ? []
    : nodeRefs.current.filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Card className="p-6 bg-white border border-slate-100 shadow-soft-sm relative space-y-6 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <GitBranch className="text-indigo-600" />
          Skills Knowledge Graph
        </h3>
        
        {/* Search & Sync Actions Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search skill..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-44"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto z-50 text-xs">
                {filteredSuggestions.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleSearchNode(n)}
                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-slate-700 capitalize font-medium border-b border-slate-100 last:border-none"
                  >
                    {n.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            size="xs"
            variant="secondary"
            className="flex items-center gap-1.5 text-[11px] py-1.5 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
            onClick={() => extractSkills(token)}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Resume Skills
          </Button>
          <Badge variant="glass">Interactive Canvas</Badge>
        </div>
      </div>

      {/* SVG Container wrapper */}
      <div
        className="relative border border-slate-205 rounded-2xl bg-slate-50/50 overflow-hidden shadow-inner h-[750px] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg className="w-full h-full" id="graph-svg">
          {/* Background rect to capture drags */}
          <rect width="100%" height="100%" fill="transparent" id="bg-rect" />
          
          <g transform={`translate(${transform.x}, ${transform.y})`}>
            {/* Draw Link Connection Lines */}
            {nodeRefs.current.map((node) => {
              if (node.prerequisites && node.prerequisites.length > 0) {
                return node.prerequisites.map((prereqName) => {
                  const parent = nodeRefs.current.find(
                    (n) => n.name.toLowerCase() === prereqName.toLowerCase()
                  );
                  if (parent) {
                    const isHovered = hoveredNodeId !== null;
                    const hoveredNode = isHovered ? nodeRefs.current.find(n => n.id === hoveredNodeId) : null;
                    
                    const isPathHighlighted = isHovered && (
                      (node.id === hoveredNodeId && parent.name.toLowerCase() === prereqName.toLowerCase()) ||
                      (parent.id === hoveredNodeId && node.prerequisites.map(p=>p.toLowerCase()).includes(parent.name.toLowerCase()))
                    );

                    let opacity = 'opacity-40';
                    if (isHovered) {
                      opacity = isPathHighlighted ? 'opacity-100 stroke-indigo-600 stroke-[3px]' : 'opacity-10';
                    }

                    // Draw smooth curved connecting path
                    const dx = node.x - parent.x;
                    const dy = node.y - parent.y;
                    const cx1 = parent.x + dx * 0.5;
                    const cy1 = parent.y;
                    const cx2 = parent.x + dx * 0.5;
                    const cy2 = node.y;

                    return (
                      <path
                        key={`${node.id}-${parent.id}`}
                        d={`M ${parent.x} ${parent.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${node.x} ${node.y}`}
                        fill="none"
                        stroke={node.mastery > 0 ? '#6366f1' : '#94a3b8'}
                        strokeWidth={isPathHighlighted ? '3.5' : '2'}
                        strokeDasharray={node.mastery === 0 ? '4 4' : 'none'}
                        className={`transition-all duration-300 ${opacity}`}
                      />
                    );
                  }
                  return null;
                });
              }
              return null;
            })}

            {/* Draw Interactive Circles for Nodes */}
            {nodeRefs.current.map((node) => {
              const isMastered = node.status === 'mastered';
              const isInProgress = node.status === 'in_progress';
              const isSelected = selectedNode?.id === node.id;
              
              let circleColor = 'fill-slate-100 stroke-slate-350';
              if (isMastered) circleColor = 'fill-green-50 stroke-green-500';
              else if (isInProgress) circleColor = 'fill-indigo-50 stroke-indigo-500';

              const isHovered = hoveredNodeId !== null;
              const isNodeHighlighted = !isHovered || isConnected(node, nodeRefs.current.find(n => n.id === hoveredNodeId));
              const nodeOpacity = isNodeHighlighted ? 'opacity-100' : 'opacity-20';

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className={`cursor-pointer select-none group transition-opacity duration-300 ${nodeOpacity}`}
                  onClick={() => handleNodeClick(node)}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Outer glow ring */}
                  <circle
                    r="26"
                    className="fill-transparent stroke-transparent group-hover:fill-indigo-500/10 group-hover:stroke-indigo-500/15 transition-all duration-300"
                  />
                  
                  {/* Mastery Progress Circle */}
                  <circle
                    r="18"
                    strokeWidth={isSelected ? "4" : "2.5"}
                    className={`${circleColor} transition-all duration-300 ${isSelected ? 'stroke-indigo-600 shadow-lg' : ''}`}
                  />
                  
                  {/* Skill Label - Horizontal & Repositioned to avoid overlaps */}
                  <text
                    y="36"
                    textAnchor="middle"
                    className={`text-[11px] font-extrabold fill-slate-700 capitalize tracking-wide transition-colors ${
                      isSelected ? 'fill-indigo-700 font-black text-[12px]' : 'group-hover:fill-indigo-600'
                    }`}
                  >
                    {node.name}
                  </text>

                  {/* Mastery Percentage overlay inside circle */}
                  <text
                    y="4"
                    textAnchor="middle"
                    className="text-[9px] font-black fill-slate-650"
                  >
                    {node.mastery}%
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Skill Details Box */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in z-30">
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 capitalize">
                {selectedNode.name}
                <Badge
                  variant={
                    selectedNode.status === 'mastered'
                      ? 'success'
                      : selectedNode.status === 'in_progress'
                      ? 'primary'
                      : 'secondary'
                  }
                >
                  {selectedNode.status.replace('_', ' ')}
                </Badge>
              </h4>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Category: {selectedNode.category} | Career Importance: {selectedNode.careerImportance}%
              </p>
              {selectedNode.prerequisites?.length > 0 && (
                <p className="text-xs text-slate-600">
                  Prerequisites: <span className="font-semibold">{selectedNode.prerequisites.join(', ')}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 font-medium">Mastery:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingMastery}
                  onChange={(e) => setEditingMastery(e.target.value)}
                  className="w-16 px-2 py-1 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-600">%</span>
              </div>
              <Button
                size="sm"
                onClick={handleSaveMastery}
                disabled={isUpdating}
                className="bg-indigo-600 text-white text-xs px-4"
              >
                Update
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedNode(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// 2. Learning Paths Tab
function LearningPathsTab({ skills, roadmap }) {
  const categories = [...new Set(skills.map((s) => s.category))];
  return (
    <Card className="p-6 bg-white border border-slate-100 shadow-soft-sm space-y-6">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Network className="text-indigo-600" />
        Skill Learning Paths
      </h3>

      <div className="space-y-6">
        {categories.map((category) => {
          const categorySkills = skills.filter((s) => s.category === category);
          return (
            <div key={category} className="space-y-3">
              <h4 className="font-bold text-indigo-600 text-sm uppercase tracking-wider">{category}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categorySkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800 capitalize">{skill.name}</p>
                      <p className="text-xs text-slate-500 mt-1 capitalize">Status: {skill.status.replace('_', ' ')}</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-500">
                        <span>Mastery</span>
                        <span>{skill.mastery}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${skill.mastery}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// 3. Skill Gap Tab
function SkillGapTab({ skills, roadmap, handleSelectRole }) {
  const missingSkills = roadmap ? (roadmap.roadmapData || []).filter(s => s.isMissing) : [];
  return (
    <Card className="p-6 bg-white border border-slate-100 shadow-soft-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="text-red-500" />
          Skill Gap Analysis
        </h3>
        <div className="flex items-center gap-2">
          {roadmap && (
            <a
              href={ROADMAP_SH_MAP[roadmap.targetRole] || 'https://roadmap.sh'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 hover:bg-indigo-100 shadow-sm transition-all"
            >
              <span>roadmap.sh</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
          {roadmap && (
            <Badge variant="glass" className="bg-red-50 text-red-800 border-red-200">
              {missingSkills.length} Gaps Detected
            </Badge>
          )}
        </div>
      </div>

      {!roadmap ? (
        <div className="text-center py-12">
          <Milestone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="font-bold text-slate-800 text-lg">Select a Target Role to Scan for Gaps</h4>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto mb-6">
            Compare your profile skills against global tech roles to see what skills are missing.
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto mb-6">
            {TARGET_ROLES.map((r) => (
              <button
                key={r}
                onClick={() => handleSelectRole(r)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all bg-white"
              >
                {r}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-6 mt-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Powered by industry-standard guides:</p>
            <a
              href="https://roadmap.sh"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-600 hover:text-indigo-600 text-xs font-bold text-slate-700 shadow-sm transition-all"
            >
              Explore roadmap.sh
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Target Career Goal</p>
              <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {roadmap.targetRole}
                <a
                  href={ROADMAP_SH_MAP[roadmap.targetRole] || 'https://roadmap.sh'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-xs text-indigo-600 hover:underline font-bold"
                >
                  (roadmap.sh)
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </h4>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-500">Job Readiness</p>
              <p className="text-3xl font-extrabold text-indigo-600">{roadmap.readinessScore}%</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-700 text-sm">Gaps to Bridge</h4>
            {missingSkills.length === 0 ? (
              <Card className="p-8 border-dashed text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <h5 className="font-bold text-slate-800">You are Job-Ready!</h5>
                <p className="text-slate-500 text-sm mt-1">No skill gaps found for this target role.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {missingSkills.map((gap) => (
                  <div
                    key={gap.name}
                    className="p-4 rounded-xl border border-red-100 bg-red-50/20 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800 capitalize">{gap.name}</p>
                      <p className="text-xs text-red-700 mt-1 font-semibold flex items-center gap-1">
                        Priority High
                      </p>
                    </div>
                    <Badge variant="glass" className="bg-red-100 text-red-800 border-none">
                      {gap.mastery}% Mastered
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// 4. Roadmap Tab
function RoadmapTab({ roadmap, handleSelectRole, updateMastery, token }) {
  const handleUpgradeMastery = async (id, name) => {
    if (token) {
      await updateMastery(id, 85, token);
      alert(`Mastered ${name}! Earned 50 XP points.`);
    }
  };

  return (
    <Card className="p-6 bg-white border border-slate-100 shadow-soft-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Milestone className="text-indigo-600" />
          Career Roadmap Timeline
        </h3>
        <div className="flex items-center gap-2">
          {roadmap && (
            <a
              href={ROADMAP_SH_MAP[roadmap.targetRole] || 'https://roadmap.sh'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 hover:bg-indigo-100 shadow-sm transition-all"
            >
              <span>roadmap.sh</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
          {roadmap && <Badge variant="glass">{roadmap.targetRole}</Badge>}
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-4">
        {TARGET_ROLES.map((role) => (
          <button
            key={role}
            onClick={() => handleSelectRole(role)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              roadmap?.targetRole === role
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-600'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {!roadmap ? (
        <div className="text-center py-12 text-slate-500 space-y-4">
          <p>Select a role above to generate a roadmap.</p>
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Or explore industry-standard roadmaps directly:</p>
            <a
              href="https://roadmap.sh"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:border-indigo-600 hover:text-indigo-600 text-xs font-bold text-slate-700 shadow-sm transition-all"
            >
              Visit roadmap.sh
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <div className="relative border-l-2 border-indigo-100 ml-4 pl-8 space-y-8 py-2">
          {(roadmap.roadmapData || []).map((step) => {
            const isCompleted = step.mastery >= 80;
            const isInProgress = step.mastery > 0 && step.mastery < 80;
            
            let color = 'bg-slate-200 border-slate-300';
            if (isCompleted) color = 'bg-green-500 border-green-600';
            else if (isInProgress) color = 'bg-indigo-500 border-indigo-600';

            return (
              <div key={step.name} className="relative group">
                {/* Timeline circle badge */}
                <div className={`absolute -left-[41px] top-1.5 w-6 h-6 rounded-full border-4 ${color} flex items-center justify-center transition-all duration-300`} />

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Step {step.step}</p>
                      <h4 className="text-base font-bold text-slate-800 capitalize mt-0.5">{step.name}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 font-semibold">Mastery: {step.mastery}%</span>
                      </div>
                      {!isCompleted && (
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3"
                          onClick={() => handleUpgradeMastery(step.id || step.name, step.name)}
                        >
                          Mark Mastered
                        </Button>
                      )}
                      {isCompleted && (
                        <span className="text-green-600 font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// 5. Recommendations Tab
function RecommendationsTab({ skills, roadmap }) {
  const missing = roadmap ? (roadmap.roadmapData || []).filter(s => s.isMissing).slice(0, 3) : [];
  return (
    <Card className="p-6 bg-white border border-slate-100 shadow-soft-sm space-y-6">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Sparkles className="text-indigo-600" />
        AI Learning & Project Recommendations
      </h3>

      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-slate-700 text-sm mb-3">Recommended Learning Paths</h4>
          {missing.length === 0 ? (
            <p className="text-sm text-slate-500">No missing skills detected. You are good to go!</p>
          ) : (
            <div className="space-y-3">
              {missing.map((rec) => (
                <div key={rec.name} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0 mt-0.5">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 capitalize">Learn {rec.name}</h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Prerequisites: Git, Programming basics. Follow courses on Coursera, YouTube tutorials, and complete exercises on LeetCode.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(rec.name + ' tutorial courses')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        Find Courses <ChevronRight size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-bold text-slate-700 text-sm mb-3">Recommended Real-World Projects</h4>
          {missing.length === 0 ? (
            <p className="text-sm text-slate-500 font-medium">No missing projects needed.</p>
          ) : (
            <div className="space-y-3">
              {missing.map((rec) => (
                <div key={`${rec.name}-project`} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100 flex items-start gap-4 border-l-4 border-l-indigo-600">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0 mt-0.5">
                    <Award size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 capitalize">Build a {rec.name} Micro-Project</h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Challenge: Design and configure a mini repository incorporating {rec.name}. Integrate unit testing and secure authorization tokens.
                    </p>
                    <p className="text-[11px] font-bold text-indigo-600 mt-2">
                      Adds to NextFolio portfolio automatically on Git push.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// 6. Progress Tracker Tab
function ProgressTrackerTab({ roadmap, dailyPlan, completeTask, token }) {
  const handleCheckTask = async (taskId) => {
    if (token) {
      await completeTask(taskId, token);
    }
  };

  return (
    <Card className="p-6 bg-white border border-slate-100 shadow-soft-sm space-y-6">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Trophy className="text-yellow-500" />
        Daily Learning & Progress Tracker
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's learning plan checklists */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            <Flame className="text-orange-500" />
            Today's Learning Plan
          </h4>

          {!dailyPlan ? (
            <p className="text-sm text-slate-500">Plan loading or already complete...</p>
          ) : (
            <div className="space-y-3">
              {(dailyPlan.tasks || []).map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                    task.completed
                      ? 'border-green-100 bg-green-50/20'
                      : 'border-slate-100 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      disabled={task.completed}
                      onChange={() => handleCheckTask(task.id)}
                      className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <div>
                      <p className={`text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {task.text}
                      </p>
                      <span className="text-[11px] text-slate-500 font-semibold">{task.duration} mins</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gamified rewards overview */}
        <div className="space-y-4">
          <h4 className="font-bold text-slate-700 text-sm">Achievements & Badges</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 text-center space-y-2">
              <Zap className="w-8 h-8 text-indigo-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Fast Learner</p>
              <p className="text-[10px] text-slate-400">Complete tasks on time</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 text-center space-y-2">
              <Flame className="w-8 h-8 text-orange-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Consistent</p>
              <p className="text-[10px] text-slate-400">Keep up a 3+ day streak</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 text-center space-y-2">
              <Award className="w-8 h-8 text-green-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Mastery</p>
              <p className="text-[10px] text-slate-400">Reach 90% in any skill</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 text-center space-y-2">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800">First Steps</p>
              <p className="text-[10px] text-slate-400">Generate your first roadmap</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// 7. Learning Resources Tab
function LearningResourcesTab() {
  const genericResources = [
    { title: 'MDN Web Docs - JavaScript Guide', url: 'https://developer.mozilla.org', type: 'documentation' },
    { title: 'W3Schools Online Tutorials', url: 'https://www.w3schools.com', type: 'article' },
    { title: 'freeCodeCamp Interactive Lessons', url: 'https://www.freecodecamp.org', type: 'coding_platform' },
    { title: 'LeetCode Interview Practice', url: 'https://leetcode.com', type: 'coding_platform' },
    { title: 'Docker Official Guides', url: 'https://docs.docker.com', type: 'documentation' },
    { title: 'AWS Cloud Foundations Learning', url: 'https://aws.amazon.com', type: 'video' },
  ];

  return (
    <Card className="p-6 bg-white border border-slate-100 shadow-soft-sm space-y-6">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Bookmark className="text-indigo-600" />
        Curated Learning Resources
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {genericResources.map((res) => (
          <a
            key={res.title}
            href={res.url}
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-600 transition-all block space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{res.type}</span>
              <Play size={12} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm">{res.title}</h4>
          </a>
        ))}
      </div>
    </Card>
  );
}

// Helper to render basic markdown and code blocks in chat messages
function renderMarkdown(text) {
  if (!text) return null;

  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      // It's a code block
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const lang = match ? match[1] : '';
      const code = match ? match[2] : part.slice(3, -3);

      return (
        <div key={index} className="my-3 rounded-xl overflow-hidden border border-slate-750 bg-slate-900 shadow-lg font-mono text-[11px] text-slate-100">
          <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800 border-b border-slate-800 text-slate-400 text-[10px] font-sans">
            <span className="uppercase font-bold">{lang || 'code'}</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(code)}
              className="hover:text-white transition-colors font-semibold"
            >
              Copy
            </button>
          </div>
          <pre className="p-4 overflow-x-auto whitespace-pre"><code>{code.trim()}</code></pre>
        </div>
      );
    }

    // Process inline elements (bold, inline code, and line breaks)
    const lines = part.split('\n');
    return (
      <span key={index}>
        {lines.map((line, lineIdx) => {
          const formatted = line.split(/(\*\*.*?\*\*|`.*?`)/g).map((inlinePart, inlineIdx) => {
            if (inlinePart.startsWith('**') && inlinePart.endsWith('**')) {
              return <strong key={inlineIdx} className="font-extrabold text-slate-900">{inlinePart.slice(2, -2)}</strong>;
            }
            if (inlinePart.startsWith('`') && inlinePart.endsWith('`')) {
              return <code key={inlineIdx} className="px-1.5 py-0.5 rounded bg-slate-200/60 font-mono text-[10px] text-indigo-700 font-semibold">{inlinePart.slice(1, -1)}</code>;
            }
            return inlinePart;
          });

          return (
            <span key={lineIdx}>
              {formatted}
              {lineIdx < lines.length - 1 && <br />}
            </span>
          );
        })}
      </span>
    );
  });
}


