import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Search, Save, CheckCircle, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import NoCompanyBanner from '@/components/ui/NoCompanyBanner';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ── Section definitions ────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'overview',   label: 'Overview',    color: 'text-blue-600',   bg: 'bg-blue-500/10' },
  { id: 'product',    label: 'Product',     color: 'text-purple-600', bg: 'bg-purple-500/10' },
  { id: 'market',     label: 'Market',      color: 'text-cyan-600',   bg: 'bg-cyan-500/10' },
  { id: 'strategy',   label: 'Strategy',    color: 'text-orange-600', bg: 'bg-orange-500/10' },
  { id: 'finance',    label: 'Finance',     color: 'text-green-600',  bg: 'bg-green-500/10' },
  { id: 'team',       label: 'Team',        color: 'text-pink-600',   bg: 'bg-pink-500/10' },
  { id: 'risk',       label: 'Risk',        color: 'text-red-600',    bg: 'bg-red-500/10' },
  { id: 'goals',      label: 'Goals',       color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
];

const SECTIONS = [
  // Overview
  { type: 'executive_summary',   category: 'overview',  title: 'Executive Summary',    icon: '📋', hint: 'A concise overview of your entire business plan. Write 1-2 paragraphs covering who you are, what you do, who you serve, and why you will succeed.' },
  { type: 'company_overview',    category: 'overview',  title: 'Company Overview',     icon: '🏢', hint: 'Your company name, founding date, legal structure, location, and a brief description of what your business does.' },
  { type: 'mission_vision',      category: 'overview',  title: 'Mission & Vision',     icon: '🎯', hint: 'Mission: What your company does and why it exists today.\nVision: Where your company is headed in the long term.' },
  // Product
  { type: 'products_services',   category: 'product',   title: 'Products & Services',  icon: '📦', hint: 'Describe what you sell or offer. Include pricing, how it works, and what makes it valuable to customers.' },
  { type: 'key_features',        category: 'product',   title: 'Key Features',         icon: '✨', hint: 'List your core features and unique selling points. What can customers do with your product that they cannot do elsewhere?' },
  { type: 'product_roadmap',     category: 'product',   title: 'Product Roadmap',      icon: '🗺️', hint: 'Planned features, improvements, and launch timeline. What will you build next quarter? Next year?' },
  // Market
  { type: 'market_analysis',     category: 'market',    title: 'Market Analysis',      icon: '📊', hint: 'Market size (TAM/SAM/SOM), growth rate, trends, and opportunities. Use data to show the market is large and growing.' },
  { type: 'target_market',       category: 'market',    title: 'Target Market',        icon: '👥', hint: 'Who is your ideal customer? Define demographics, behaviors, pain points, and why they need your solution.' },
  { type: 'competitor_analysis', category: 'market',    title: 'Competitor Analysis',  icon: '🔍', hint: 'List key competitors, their strengths/weaknesses, your differentiation, and why customers will choose you.' },
  // Strategy
  { type: 'marketing_strategy',  category: 'strategy',  title: 'Marketing Strategy',   icon: '📣', hint: 'How will you reach customers? Channels (social, SEO, ads, partnerships), messaging, budget allocation.' },
  { type: 'sales_strategy',      category: 'strategy',  title: 'Sales Strategy',       icon: '💰', hint: 'Sales process, pricing model, sales channels, team structure, and targets for new customer acquisition.' },
  { type: 'operations_plan',     category: 'strategy',  title: 'Operations Plan',      icon: '⚙️', hint: 'Day-to-day operations, suppliers, technology stack, facilities, and key processes that run your business.' },
  // Finance
  { type: 'financial_plan',      category: 'finance',   title: 'Financial Plan',       icon: '💹', hint: 'Revenue projections, profit & loss forecast, break-even analysis, and financial goals for 1-3 years.' },
  { type: 'revenue_model',       category: 'finance',   title: 'Revenue Model',        icon: '💵', hint: 'How does your business make money? Subscriptions, one-time sales, commissions, licensing, ads?' },
  { type: 'expense_forecast',    category: 'finance',   title: 'Expense Forecast',     icon: '📉', hint: 'Expected monthly/annual costs: salaries, rent, software, marketing, operations, legal, and miscellaneous.' },
  { type: 'funding_requirements',category: 'finance',   title: 'Funding Requirements', icon: '🏦', hint: 'How much capital do you need? What will it be used for? When do you need it? Expected ROI for investors.' },
  // Team
  { type: 'team_management',     category: 'team',      title: 'Team & Management',    icon: '👤', hint: 'Founders, key executives, advisors. Their backgrounds, roles, and why this team can execute the plan.' },
  { type: 'org_structure',       category: 'team',      title: 'Org Structure',        icon: '🏗️', hint: 'Organizational chart, departments, hiring plan, and how the team will grow over the next 12-24 months.' },
  // Risk
  { type: 'risk_assessment',     category: 'risk',      title: 'Risk Assessment',      icon: '⚠️', hint: 'Key risks (market, operational, financial, regulatory) and your mitigation strategies for each.' },
  { type: 'contingency_plan',    category: 'risk',      title: 'Contingency Plan',     icon: '🛡️', hint: 'What happens if things go wrong? Backup plans for major failure scenarios.' },
  // Goals
  { type: 'milestones_goals',    category: 'goals',     title: 'Milestones & Goals',   icon: '🏆', hint: 'Key milestones, KPIs, and growth targets. What does success look like in 6 months, 1 year, 3 years?' },
  { type: 'exit_strategy',       category: 'goals',     title: 'Exit Strategy',        icon: '🚀', hint: 'Long-term plans: acquisition target, IPO, buyout, or founder-run. What does the end game look like?' },
];

const COLORS = ['blue', 'green', 'purple', 'orange', 'pink', 'yellow'];
const COLOR_DOT = {
  blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
  orange: 'bg-orange-500', pink: 'bg-pink-500', yellow: 'bg-yellow-500',
};
const COVER_GRADIENTS = {
  blue: 'from-blue-200 to-cyan-100',
  green: 'from-green-200 to-teal-100',
  purple: 'from-purple-200 to-pink-100',
  orange: 'from-orange-200 to-yellow-100',
  pink: 'from-pink-200 to-rose-100',
  yellow: 'from-yellow-200 to-orange-100',
};

function getCatStyle(catId) {
  return CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
}

export default function BusinessPlan() {
  const { activeCompany, companies, currentUser } = useOutletContext();
  const companyId = activeCompany?.id;
  const queryClient = useQueryClient();

  const [selectedType, setSelectedType] = useState(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsedCats, setCollapsedCats] = useState({});
  const [filterCat, setFilterCat] = useState('all');

  if (!companyId) return <NoCompanyBanner hasNoCompanies={!companies?.length} />;

  // Load all saved sections for this company
  const { data: savedSections = [] } = useQuery({
    queryKey: ['business-plan', companyId],
    queryFn: () => api.entities.BusinessPlan.filter({ company_id: companyId }),
    initialData: [],
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => api.entities.BusinessPlan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-plan'] });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => {
      setSaving(false);
      toast.error('Failed to save');
    },
  });

  // Helper: get saved data for a section_type
  const getSaved = (type) => savedSections.find(s => s.section_type === type);

  // When a section is selected, load its saved content
  const selectSection = (type) => {
    if (selectedType && content !== (getSaved(selectedType)?.content || '')) {
      handleSave(selectedType, content);
    }
    setSelectedType(type);
    setContent(getSaved(type)?.content || '');
    setSaved(false);
  };

  const handleSave = useCallback((type, text) => {
    if (!type) return;
    const def = SECTIONS.find(s => s.type === type);
    setSaving(true);
    saveMutation.mutate({
      company_id: companyId,
      section_type: type,
      category: def?.category || 'overview',
      title: def?.title || type,
      content: text,
    });
  }, [companyId, saveMutation]);

  const handleSaveClick = () => handleSave(selectedType, content);

  const toggleCat = (id) => setCollapsedCats(prev => ({ ...prev, [id]: !prev[id] }));

  const selectedDef = SECTIONS.find(s => s.type === selectedType);
  const selectedSaved = getSaved(selectedType);
  const catStyle = selectedDef ? getCatStyle(selectedDef.category) : null;
  const dotColor = selectedSaved?.color ? COLOR_DOT[selectedSaved.color] : 'bg-blue-500';
  const coverGradient = selectedSaved?.color ? COVER_GRADIENTS[selectedSaved.color] : COVER_GRADIENTS.blue;

  // Sections grouped by category
  const groupedSections = CATEGORIES.map(cat => ({
    ...cat,
    sections: SECTIONS.filter(s => {
      if (s.category !== cat.id) return false;
      if (filterCat !== 'all' && s.category !== filterCat) return false;
      if (search) return s.title.toLowerCase().includes(search.toLowerCase());
      return true;
    }),
  })).filter(g => g.sections.length > 0);

  const totalWritten = SECTIONS.filter(s => getSaved(s.type)?.content?.trim()).length;

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6 bg-background overflow-hidden">

      {/* ── LEFT PANEL ──────────────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-card">

        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">📁</span>
            <span className="text-sm font-bold">Business Plan</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {totalWritten}/{SECTIONS.length} sections written
          </p>
          {/* Progress bar */}
          <div className="h-1 bg-muted rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(totalWritten / SECTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Category filter pills */}
        <div className="px-3 pt-2 pb-1 border-b border-border flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterCat('all')}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${filterCat === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.id)}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${filterCat === c.id ? `bg-primary text-primary-foreground` : `bg-muted text-muted-foreground hover:bg-muted/80`}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sections..."
              className="pl-8 h-8 text-xs bg-muted border-0"
            />
          </div>
        </div>

        {/* Sections list */}
        <div className="flex-1 overflow-y-auto">
          {groupedSections.map(group => {
            const isCollapsed = collapsedCats[group.id];
            return (
              <div key={group.id}>
                {/* Category header */}
                <button
                  onClick={() => toggleCat(group.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                >
                  {isCollapsed
                    ? <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${group.color}`}>{group.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {group.sections.filter(s => getSaved(s.type)?.content?.trim()).length}/{group.sections.length}
                  </span>
                </button>

                {/* Section rows */}
                {!isCollapsed && group.sections.map(section => {
                  const saved = getSaved(section.type);
                  const isActive = selectedType === section.type;
                  const hasContent = !!saved?.content?.trim();
                  return (
                    <button
                      key={section.type}
                      onClick={() => selectSection(section.type)}
                      className={`w-full text-left px-4 py-2.5 border-b border-border/50 transition-colors hover:bg-muted/50 flex items-center gap-3
                        ${isActive ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
                    >
                      <span className="text-base flex-shrink-0">{section.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{section.title}</p>
                        {hasContent
                          ? <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {saved.content.slice(0, 45)}...
                            </p>
                          : <p className="text-[10px] text-muted-foreground/50 mt-0.5">Not written yet</p>
                        }
                      </div>
                      {hasContent
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        : <Circle className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
                      }
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedDef ? (
          <>
            {/* Cover strip */}
            <div className={`h-28 flex-shrink-0 bg-gradient-to-r ${coverGradient}`} />

            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-border bg-card flex-shrink-0">
              {/* Color pickers */}
              <div className="flex items-center gap-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      const saved = getSaved(selectedType);
                      if (saved) {
                        api.entities.BusinessPlan.update(saved.id, { color: c }).then(() =>
                          queryClient.invalidateQueries({ queryKey: ['business-plan'] })
                        );
                      } else {
                        handleSave(selectedType, content);
                      }
                    }}
                    className={`w-4 h-4 rounded-full transition-transform hover:scale-110 ${COLOR_DOT[c]}
                      ${(selectedSaved?.color || 'blue') === c ? 'ring-2 ring-offset-1 ring-foreground scale-110' : ''}`}
                  />
                ))}
              </div>

              {/* Save button */}
              <div className="flex items-center gap-2">
                {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
                {saved && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Saved</span>}
                <button
                  onClick={handleSaveClick}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-foreground text-background rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto px-10 py-6">
              {/* Creator */}
              {currentUser && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold">
                    {currentUser.full_name?.[0] || currentUser.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Created by <strong>{currentUser.full_name || currentUser.email}</strong>
                    {selectedSaved?.updated_date ? ` · ${format(new Date(selectedSaved.updated_date), 'MMM d, yyyy')}` : ''}
                  </span>
                </div>
              )}

              {/* Section title */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{selectedDef.icon}</span>
                <h1 className="text-2xl font-bold">{selectedDef.title}</h1>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ml-1 ${getCatStyle(selectedDef.category).bg} ${getCatStyle(selectedDef.category).color}`}>
                  {getCatStyle(selectedDef.category).label}
                </span>
              </div>

              {/* Hint */}
              <p className="text-xs text-muted-foreground italic mb-5 leading-relaxed border-l-2 border-border pl-3 whitespace-pre-line">
                {selectedDef.hint}
              </p>

              {/* Text editor */}
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={`Start writing your ${selectedDef.title}...`}
                className="w-full min-h-[380px] bg-transparent border-0 outline-none text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 resize-none font-sans"
                onKeyDown={e => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                    e.preventDefault();
                    handleSaveClick();
                  }
                }}
              />
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 px-8">
            <span className="text-6xl opacity-40">📁</span>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Select a section</p>
              <p className="text-sm mt-1 max-w-sm">
                Choose any section from the left panel to start writing your business plan.
                {totalWritten === 0 && ' Start with the Executive Summary.'}
              </p>
            </div>
            {totalWritten === 0 && (
              <button
                onClick={() => selectSection('executive_summary')}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                📋 Start with Executive Summary
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
