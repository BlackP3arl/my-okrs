import { use, useEffect, useMemo, useState } from 'react';
import {
  Building2, CalendarRange, ChevronRight, Download, FileText, Filter, GitBranch,
  LayoutDashboard, LogOut, Menu, Plus, Printer, Rocket, Search, Settings, Target, Users, X,
} from 'lucide-react';
import { useAuth } from './authContext.js';
import { UsersPage } from './UsersPage.jsx';
import {
  CURRENT_QUARTER, CURRENT_YEAR, KEY_RESULT_MAX, KEY_RESULT_MIN, blankQuarters, clamp, decorate,
  divisionSelection, includesDivision, involvesDivision, removeGoal, removeInitiative, removeObjective, uid,
} from './model.js';
import { getPlanPromise, persistPlan, planUsesDatabase, resetPlan } from './planClient.js';
import { AlignmentTree, GoalCascade, GoalModal, ObjectiveDrawer, ObjectiveModal } from './explore.jsx';
import { ImportDialog } from './ImportPanel.jsx';
import { DivisionTag, Empty, Field, Horizon, MultiSelectFilter, Progress, QuarterPips, Ring, SelectFilter, Status } from './ui.jsx';

const NAV = [
  ['Strategy', LayoutDashboard],
  ['Objectives', Target],
  ['Initiatives', Rocket],
  ['Reviews', CalendarRange],
  ['Alignment', GitBranch],
];
const WORKSPACE = [
  ['Divisions', Building2],
  ['Reports', FileText],
];
const STATUSES = ['Achieved', 'On track', 'At risk', 'Off track', 'Not started'];
const INIT_STATUSES = ['Done', 'In progress', 'Blocked', 'Not started'];
const YEARS = ['2025', '2026', '2027', '2028', '2029', '2030'];

const blankObjectives = { q: '', pillar: 'all', division: [], role: 'any', status: 'all', year: 'all' };
const blankInitiatives = { q: '', pillar: 'all', division: [], status: 'all', year: 'all', cross: false };

function initials(name) {
  return String(name || '?').split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}

function nextGoalCode(goals, pillar) {
  const numbers = goals.filter(goal => goal.pillarId === pillar.id).map(goal => Number(String(goal.code).split('.')[1]) || 0);
  return `${pillar.code}.${Math.max(0, ...numbers) + 1}`;
}

function nextObjectiveCode(objectives, goal) {
  const prefix = goal?.code || '0';
  const used = new Set(objectives.filter(item => item.goalId === goal?.id).map(item => item.code));
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  for (const letter of letters) {
    const code = `${prefix}.${letter}`;
    if (!used.has(code)) return code;
  }
  return `${prefix}.${used.size + 1}`;
}

function cleanExternal(external) {
  if (!external) return null;
  const system = external.system?.trim() || '';
  const key = external.key?.trim() || '';
  const url = external.url?.trim() || '';
  if (!system && !key && !url) return null;
  return { system, key, url };
}

export default function App() {
  const { user, canEdit, isAdmin, signOut } = useAuth();
  const initialPlan = use(getPlanPromise());
  const [state, setState] = useState(initialPlan);
  const [page, setPage] = useState('Strategy');
  const [goalId, setGoalId] = useState(null);
  const [focusObjective, setFocusObjective] = useState(null);
  const [objectiveId, setObjectiveId] = useState(null);
  const [sidebar, setSidebar] = useState(false);
  const [modal, setModal] = useState(null);
  const [objectiveFilters, setObjectiveFilters] = useState(blankObjectives);
  const [initiativeFilters, setInitiativeFilters] = useState(blankInitiatives);
  const [importOpen, setImportOpen] = useState(false);
  const view = useMemo(() => decorate(state), [state]);
  const goal = view.goals.find(item => item.id === goalId) || null;
  const objective = view.objectives.find(item => item.id === objectiveId) || null;

  useEffect(() => { if (canEdit) persistPlan(state); }, [state, canEdit]);
  useEffect(() => { document.title = `${state.company.name} · Strategy`; }, [state.company.name]);

  const go = next => { setPage(next); setSidebar(false); };
  const openGoal = (id, focus = null) => { setGoalId(id); setFocusObjective(focus); setPage('Goal'); setSidebar(false); };
  const actions = {
    saveGoal(id, patch) {
      setState(current => ({
        ...current,
        goals: current.goals.map(item => {
          if (item.id !== id) return item;
          const next = { ...item, ...patch };
          if (patch.pillarId && patch.pillarId !== item.pillarId) {
            const pillar = current.pillars.find(entry => entry.id === patch.pillarId);
            next.code = nextGoalCode(current.goals.filter(entry => entry.id !== id), pillar);
          }
          return next;
        }),
      }));
      setModal(null);
    },
    addGoal(form) {
      const pillar = state.pillars.find(item => item.id === form.pillarId) || state.pillars[0];
      const id = uid('goal');
      setState(current => ({ ...current, goals: [...current.goals, { id, code: nextGoalCode(current.goals, pillar), owner: form.owner || 'Strategy Office', ...form }] }));
      setModal(null);
      openGoal(id);
    },
    deleteGoal(id) {
      const match = state.goals.find(item => item.id === id);
      if (!match || !window.confirm(`Delete strategic goal ${match.code}? Its objectives, key results, means of verification, and initiatives will be removed.`)) return;
      setState(current => removeGoal(current, id));
      setGoalId(null);
      setPage('Strategy');
    },
    saveObjective(id, patch) {
      setState(current => ({ ...current, objectives: current.objectives.map(item => item.id === id ? { ...item, ...patch, quarters: item.quarters || blankQuarters() } : item) }));
    },
    addObjective(form) {
      const titles = (form.keyResults || []).map(title => title.trim()).filter(Boolean);
      if (titles.length < KEY_RESULT_MIN || titles.length > KEY_RESULT_MAX) return;
      const id = uid('obj');
      const { keyResults: _ignored, ...objective } = form;
      setState(current => {
        const goal = current.goals.find(item => item.id === form.goalId);
        return {
          ...current,
          objectives: [...current.objectives, { ...objective, id, code: nextObjectiveCode(current.objectives, goal) }],
          keyResults: [...(current.keyResults || []), ...titles.map(title => ({ id: uid('kr'), objectiveId: id, title, progress: 0 }))],
          initiatives: [...current.initiatives, { id: uid('init'), objectiveId: id, title: form.title, divisionId: form.divisionId, external: null, blocked: false }],
        };
      });
      setModal(null);
      openGoal(form.goalId, id);
      setObjectiveId(id);
    },
    deleteObjective(id) {
      if (!window.confirm('Delete this objective, its key results, means of verification, and initiatives?')) return;
      setState(current => removeObjective(current, id));
      setObjectiveId(null);
    },
    saveKeyResult(id, patch) {
      setState(current => ({
        ...current,
        keyResults: (current.keyResults || []).map(item => {
          if (item.id !== id) return item;
          const next = { ...item, ...patch };
          if (patch.progress !== undefined) next.progress = clamp(patch.progress);
          return next;
        }),
      }));
    },
    addKeyResult(objectiveId, title) {
      const clean = title.trim();
      if (!clean) return;
      setState(current => {
        const keyResults = current.keyResults || [];
        const count = keyResults.filter(item => item.objectiveId === objectiveId).length;
        if (count >= KEY_RESULT_MAX) return current;
        return { ...current, keyResults: [...keyResults, { id: uid('kr'), objectiveId, title: clean, progress: 0 }] };
      });
    },
    deleteKeyResult(id) {
      setState(current => {
        const keyResults = current.keyResults || [];
        const match = keyResults.find(item => item.id === id);
        if (!match) return current;
        const count = keyResults.filter(item => item.objectiveId === match.objectiveId).length;
        if (count <= KEY_RESULT_MIN) return current;
        return {
          ...current,
          keyResults: keyResults.filter(item => item.id !== id),
          krMeans: (current.krMeans || []).filter(item => item.keyResultId !== id),
        };
      });
    },
    saveKrMean(id, title) {
      setState(current => ({
        ...current,
        krMeans: (current.krMeans || []).map(item => item.id === id ? { ...item, title } : item),
      }));
    },
    addKrMean(keyResultId, title) {
      const clean = title.trim();
      if (!clean) return;
      setState(current => ({
        ...current,
        krMeans: [...(current.krMeans || []), { id: uid('krm'), keyResultId, title: clean }],
      }));
    },
    deleteKrMean(id) {
      setState(current => ({ ...current, krMeans: (current.krMeans || []).filter(item => item.id !== id) }));
    },
    addInitiative(initiative) { setState(current => ({ ...current, initiatives: [...current.initiatives, initiative] })); },
    saveInitiative(id, patch) {
      setState(current => ({
        ...current,
        initiatives: current.initiatives.map(item => item.id === id ? { ...item, ...patch, external: patch.external === undefined ? item.external : cleanExternal(patch.external) } : item),
      }));
    },
    deleteInitiative(id) {
      if (!window.confirm('Delete this team initiative and its verification checks?')) return;
      setState(current => removeInitiative(current, id));
    },
    saveVerification(id, progressOrPatch) {
      const patch = typeof progressOrPatch === 'number' ? { progress: clamp(progressOrPatch) } : progressOrPatch;
      if (patch.progress !== undefined) patch.progress = clamp(patch.progress);
      setState(current => ({ ...current, verifications: current.verifications.map(item => item.id === id ? { ...item, ...patch } : item) }));
    },
    deleteVerification(id) { setState(current => ({ ...current, verifications: current.verifications.filter(item => item.id !== id) })); },
    addVerification(initiativeId, title) {
      setState(current => ({ ...current, verifications: [...current.verifications, { id: uid('mov'), initiativeId, title, progress: 0 }] }));
    },
    saveQuarter(objectiveIdToSave, quarter, patch) {
      setState(current => ({
        ...current,
        objectives: current.objectives.map(item => {
          if (item.id !== objectiveIdToSave) return item;
          const quarters = item.quarters || blankQuarters();
          return { ...item, quarters: { ...quarters, [quarter]: { ...quarters[quarter], ...patch, progress: patch.progress === undefined ? quarters[quarter].progress : clamp(patch.progress) } } };
        }),
      }));
    },
  };
  if (!canEdit) {
    for (const key of Object.keys(actions)) actions[key] = () => {};
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebar} page={page} go={go} close={() => setSidebar(false)} user={user} isAdmin={isAdmin} canEdit={canEdit} signOut={signOut} reviewsDue={view.org.reviewsDue} />
      <main className="main">
        <header className="topbar">
          <button className="mobile-menu icon-button" type="button" onClick={() => setSidebar(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="crumb"><span>{state.company.name}</span><ChevronRight size={14} /><strong>{page === 'Goal' ? 'Strategic goal' : page}</strong></div>
          <label className="top-search">
            <Search size={15} />
            <input
              value={objectiveFilters.q}
              onChange={event => setObjectiveFilters(current => ({ ...current, q: event.target.value }))}
              onKeyDown={event => { if (event.key === 'Enter') go('Objectives'); }}
              placeholder="Search objectives and divisions"
            />
            {objectiveFilters.q && <button type="button" onClick={() => setObjectiveFilters(current => ({ ...current, q: '' }))} aria-label="Clear search"><X size={14} /></button>}
          </label>
          <button className="review-chip" type="button" onClick={() => go('Reviews')}>{view.org.reviewsDue} reviews due</button>
        </header>
        {page === 'Strategy' && <StrategyPage view={view} canEdit={canEdit} openGoal={openGoal} addGoal={() => setModal({ type: 'goal' })} showCross={() => { setInitiativeFilters({ ...blankInitiatives, cross: true, year: String(CURRENT_YEAR) }); go('Initiatives'); }} />}
        {page === 'Goal' && <GoalPage goal={goal} canEdit={canEdit} focusObjective={focusObjective} setFocusObjective={setFocusObjective} back={() => go('Strategy')} actions={actions} onManage={setObjectiveId} addObjective={() => setModal({ type: 'objective', goalId: goal?.id })} editGoal={() => setModal({ type: 'goal', goal })} />}
        {page === 'Objectives' && <ObjectivesPage view={view} canEdit={canEdit} filters={objectiveFilters} setFilters={setObjectiveFilters} onOpen={setObjectiveId} add={() => setModal({ type: 'objective' })} onImport={() => setImportOpen(true)} />}
        {page === 'Initiatives' && <InitiativesPage view={view} filters={initiativeFilters} setFilters={setInitiativeFilters} onOpen={setObjectiveId} />}
        {page === 'Reviews' && <ReviewsPage view={view} canEdit={canEdit} actions={actions} onOpen={setObjectiveId} />}
        {page === 'Alignment' && <AlignmentPage view={view} actions={actions} onManage={setObjectiveId} />}
        {page === 'Divisions' && <DivisionsPage view={view} openDivision={divisionId => { setObjectiveFilters({ ...blankObjectives, division: [divisionId], role: 'any' }); go('Objectives'); }} />}
        {page === 'Reports' && <ReportsPage view={view} onOpen={id => { const match = view.objectives.find(item => item.id === id); if (match) openGoal(match.goalId, id); }} />}
        {page === 'Users' && isAdmin && <UsersPage />}
        {page === 'Settings' && <SettingsPage state={state} setState={setState} canEdit={canEdit} user={user} onImport={() => setImportOpen(true)} />}
      </main>
      {sidebar && <div className="scrim" onClick={() => setSidebar(false)} />}
      {canEdit && modal?.type === 'goal' && <GoalModal pillars={state.pillars} goal={modal.goal} onClose={() => setModal(null)} onSave={form => modal.goal ? actions.saveGoal(modal.goal.id, form) : actions.addGoal(form)} />}
      {canEdit && modal?.type === 'objective' && <ObjectiveModal goals={view.goals} divisions={state.divisions} presetGoalId={modal.goalId} onClose={() => setModal(null)} onSave={actions.addObjective} />}
      {objective && <ObjectiveDrawer objective={objective} divisions={state.divisions} actions={actions} onClose={() => setObjectiveId(null)} />}
      {canEdit && importOpen && (
        <ImportDialog
          state={state}
          onClose={() => setImportOpen(false)}
          onApply={next => {
            setState(next);
            setImportOpen(false);
            setObjectiveFilters({ ...blankObjectives, year: '2027' });
            go('Objectives');
          }}
        />
      )}
    </div>
  );
}

function Sidebar({ open, page, go, close, user, isAdmin, canEdit, signOut, reviewsDue }) {
  const workspace = [...WORKSPACE, ...(isAdmin ? [['Users', Users]] : [])];
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <img className="brand-logo" src="/brand/mpao-logo-white.png" alt="Maldives Pension Office" />
        <button className="mobile-close" type="button" onClick={close} aria-label="Close menu"><X size={18} /></button>
      </div>
      {!canEdit && <div className="view-only-chip">View only</div>}
      <nav>
        {NAV.map(([label, Icon]) => (
          <button key={label} type="button" className={page === label || (page === 'Goal' && label === 'Strategy') ? 'active' : ''} onClick={() => go(label)}>
            <Icon size={18} /><span>{label}</span>{label === 'Reviews' && reviewsDue > 0 && <em>{reviewsDue}</em>}
          </button>
        ))}
      </nav>
      <div className="nav-label">ORGANISATION</div>
      <nav>
        {workspace.map(([label, Icon]) => (
          <button key={label} type="button" className={page === label ? 'active' : ''} onClick={() => go(label)}><Icon size={18} /><span>{label}</span></button>
        ))}
      </nav>
      <div className="sidebar-card">
        <b>How the plan links</b>
        <p>Priority areas hold the strategic goals. Each objective has three or four key results, and each key result has means of verification. Team initiatives connect that work to projects tracked outside this system.</p>
      </div>
      <img className="sidebar-forward" src="/brand/mpao-forward-white.png" alt="" />
      <div className="sidebar-foot">
        <button type="button" className={page === 'Settings' ? 'active' : ''} onClick={() => go('Settings')}><Settings size={18} />Settings</button>
        <div className="profile">
          <div className="avatar">{initials(user.fullName)}</div>
          <div><b>{user.fullName}</b><span>{canEdit ? 'Admin' : 'Viewer'}</span></div>
          <button type="button" className="icon-button" onClick={signOut} aria-label="Sign out"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}

function StrategyPage({ view, canEdit, openGoal, addGoal, showCross }) {
  const attention = view.goals.filter(goal => goal.status === 'Off track' || goal.status === 'At risk').slice().sort((a, b) => a.progress - b.progress).slice(0, 4);
  const crm = view.objectives.find(item => item.id === 'obj-crm');
  return (
    <section className="content strategy-page">
      <div className="hero">
        <div>
          <div className="eyebrow">STRATEGIC PERFORMANCE</div>
          <h1>Where the plan stands</h1>
          <p>Organisational performance is the overall progress of the strategic goals. Open a goal to reach its objectives and key results. Each key result has means of verification, and team initiatives show how the work is delivered.</p>
        </div>
        {canEdit && <button className="primary" type="button" onClick={addGoal}><Plus size={16} /> Strategic goal</button>}
      </div>
      <div className="score-row">
        <article className="org-score">
          <Ring value={view.org.progress} label="Organisational progress" />
          <div>
            <span>Organisation</span>
            <strong>{view.org.status}</strong>
            <small>{view.org.onTrack} of {view.org.goals} goals are on pace for their horizon.</small>
          </div>
        </article>
        {view.pillars.map(pillar => (
          <article key={pillar.id} className="pillar-score">
            <span style={{ background: pillar.soft, color: pillar.color }}>{pillar.code}</span>
            <b>{pillar.progress}%</b>
            <em>{pillar.name}</em>
            <small>{pillar.goals.length} goals · {pillar.status}</small>
          </article>
        ))}
      </div>
      <div className="strategy-board">
        {view.pillars.map(pillar => (
          <section key={pillar.id} className="pillar-col" style={{ '--accent': pillar.color, '--soft': pillar.soft }}>
            <header>
              <div className="pillar-index" style={{ background: pillar.badge || pillar.color, color: pillar.ink || '#fff' }}>{pillar.code}</div>
              <h2>{pillar.name}</h2>
              <p>{pillar.intent}</p>
            </header>
            {pillar.goals.map(goal => (
              <button key={goal.id} type="button" className="goal-tile" onClick={() => openGoal(goal.id)}>
                <div className="goal-tile-top"><span>{goal.code}</span><Horizon goal={goal} /></div>
                <strong>{goal.title}</strong>
                <Progress value={goal.progress} />
                <small>{goal.currentYearCount} objectives in {CURRENT_YEAR} · {goal.currentYearProgress}% this year · {goal.objectives.length} on the goal</small>
              </button>
            ))}
          </section>
        ))}
      </div>
      <div className="dash-split">
        <section className="module-card">
          <div className="module-card-head"><div><b>Goals that need attention</b><span>Lowest progress against the time already elapsed on the horizon.</span></div></div>
          <div className="attention-list">
            {attention.map(goal => (
              <button key={goal.id} type="button" onClick={() => openGoal(goal.id)}>
                <span>{goal.code}</span>
                <div><b>{goal.title}</b><small>{goal.pillar?.name}</small></div>
                <Progress value={goal.progress} compact />
                <Status value={goal.status} />
              </button>
            ))}
          </div>
        </section>
        <section className="module-card spotlight">
          <div className="module-card-head"><div><b>From objective to project</b><span>{view.org.cross} initiatives are executed by a division that does not own the objective.</span></div></div>
          {crm ? (
            <div className="spotlight-body">
              <p><b>{crm.code}</b> {crm.title}</p>
              <div className="chip-line"><DivisionTag division={crm.division} compact /><span className="link-arrow">supported by</span>{crm.supporting.map(division => <DivisionTag key={division.id} division={division} compact />)}</div>
              <p className="quiet">{crm.division.name} owns the service outcome. {crm.initiatives.find(item => item.crossDivision)?.division.name || 'A supporting division'} executes the system initiative, and that project stays in the external delivery system.</p>
              <div className="detail-actions">
                <button type="button" className="primary" onClick={() => openGoal(crm.goalId, crm.id)}>Drill into this objective</button>
                <button type="button" className="secondary" onClick={showCross}>All cross-division work</button>
              </div>
            </div>
          ) : <Empty title="No sample linkage" detail="Create an objective with an initiative owned by another division." />}
        </section>
      </div>
    </section>
  );
}

function GoalPage({ goal, canEdit, focusObjective, setFocusObjective, back, actions, onManage, addObjective, editGoal }) {
  const [year, setYear] = useState('all');
  useEffect(() => {
    if (!focusObjective) return;
    document.getElementById(`objective-${focusObjective}`)?.scrollIntoView({ block: 'center' });
  }, [focusObjective, goal?.id]);
  if (!goal) {
    return <section className="content"><Empty title="Goal not found" detail="It may have been deleted." /><button type="button" className="secondary" onClick={back}>Back to strategy</button></section>;
  }
  return (
    <section className="content">
      <button type="button" className="text-back" onClick={back}>Strategy</button>
      <div className="hero">
        <div>
          <div className="eyebrow" style={{ color: goal.pillar?.color }}>{goal.pillar?.name}</div>
          <h1>{goal.code} {goal.title}</h1>
          <p>{goal.description}</p>
        </div>
        {canEdit && (
          <div className="hero-actions">
            <button type="button" className="secondary" onClick={editGoal}>Edit goal</button>
            <button type="button" className="secondary" onClick={() => actions.deleteGoal(goal.id)}>Delete</button>
            <button type="button" className="primary" onClick={addObjective}><Plus size={16} /> Objective</button>
          </div>
        )}
      </div>
      <div className="goal-summary">
        <div><span>Horizon</span><Horizon goal={goal} /></div>
        <div><span>Progress to date</span><Progress value={goal.progress} /><Status value={goal.status} /></div>
        <div><span>{CURRENT_YEAR}</span><strong>{goal.currentYearProgress}%</strong><small>{goal.currentYearCount} objectives this year</small></div>
        <div><span>Full goal</span><strong>{goal.objectives.length}</strong><small>objectives across the horizon</small></div>
      </div>
      <div className="year-switch">
        {['all', ...YEARS.filter(item => goal.objectives.some(objective => objective.year === item))].map(item => (
          <button key={item} type="button" className={year === item ? 'active' : ''} onClick={() => setYear(item)}>{item === 'all' ? 'All years' : item}</button>
        ))}
      </div>
      <GoalCascade
        goal={goal}
        year={year}
        openObjective={focusObjective}
        setOpenObjective={setFocusObjective}
        onManage={onManage}
        onProgress={(id, progress) => actions.saveVerification(id, progress)}
        onAddVerification={actions.addVerification}
        onKeyResult={(id, progress) => actions.saveKeyResult(id, { progress })}
        onSaveMean={actions.saveKrMean}
        onAddMean={actions.addKrMean}
        onRemoveMean={actions.deleteKrMean}
      />
    </section>
  );
}

function ObjectivesPage({ view, canEdit, filters, setFilters, onOpen, add, onImport }) {
  const divisions = divisionSelection(filters.division);
  const rows = view.objectives.filter(objective => {
    if (filters.pillar !== 'all' && objective.pillar?.id !== filters.pillar) return false;
    if (filters.year !== 'all' && objective.year !== filters.year) return false;
    if (filters.status !== 'all' && objective.status !== filters.status) return false;
    if (!involvesDivision(objective, divisions, filters.role)) return false;
    const haystack = `${objective.code} ${objective.title} ${objective.division?.name} ${objective.goal?.title} ${objective.supporting.map(division => division.name).join(' ')} ${objective.keyResults.map(item => `${item.title} ${(item.means || []).map(mean => mean.title).join(' ')}`).join(' ')}`.toLowerCase();
    return haystack.includes(filters.q.toLowerCase());
  }).sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));
  const active = ['pillar', 'status', 'year'].filter(key => filters[key] !== 'all').length + (divisions.length ? 1 : 0) + (filters.role !== 'any' ? 1 : 0) + (filters.q ? 1 : 0);
  return (
    <section className="content">
      <div className="hero">
        <div>
          <div className="eyebrow">ANNUAL OBJECTIVES</div>
          <h1>Objectives</h1>
          <p>Filter the work divisions have committed to the strategic goals. Quarterly marks are the reported reviews. The percentage rolls up from key results.</p>
        </div>
        {canEdit && (
          <div className="hero-actions">
            <button className="secondary" type="button" onClick={onImport}>Import 2027</button>
            <button className="primary" type="button" onClick={add}><Plus size={16} /> Objective</button>
          </div>
        )}
      </div>
      <FilterBar>
        <SelectFilter label="Priority area" value={filters.pillar} onChange={pillar => setFilters({ ...filters, pillar })} options={[{ value: 'all', label: 'All priority areas' }, ...view.pillars.map(pillar => ({ value: pillar.id, label: pillar.name }))]} />
        <MultiSelectFilter label="Division" values={divisions} onChange={division => setFilters({ ...filters, division })} options={view.divisions.map(division => ({ value: division.id, label: division.name }))} emptyLabel="All divisions" />
        <SelectFilter label="Division role" value={filters.role} onChange={role => setFilters({ ...filters, role })} options={[{ value: 'any', label: 'Any role' }, { value: 'responsible', label: 'Responsible' }, { value: 'supporting', label: 'Supporting' }, { value: 'executing', label: 'Executing an initiative' }]} />
        <SelectFilter label="Status" value={filters.status} onChange={status => setFilters({ ...filters, status })} options={[{ value: 'all', label: 'All statuses' }, ...STATUSES.map(status => ({ value: status, label: status }))]} />
        <SelectFilter label="Year" value={filters.year} onChange={year => setFilters({ ...filters, year })} options={[{ value: 'all', label: 'All years' }, ...YEARS.map(year => ({ value: year, label: year }))]} />
        <button type="button" className="text-reset" disabled={!active} onClick={() => setFilters(blankObjectives)}>Reset{active ? ` (${active})` : ''}</button>
      </FilterBar>
      <p className="result-count">{rows.length} objective{rows.length === 1 ? '' : 's'}</p>
      <div className="register">
        <div className="register-row head"><span>Objective</span><span>Priority / goal</span><span>Responsible</span><span>Year</span><span>Quarters</span><span>Progress</span><span>Status</span></div>
        {rows.map(objective => (
          <button key={objective.id} type="button" className="register-row" onClick={() => onOpen(objective.id)}>
            <div><b>{objective.code} {objective.title}</b><small>{objective.keyResults.length} key results · {objective.initiatives.length} initiatives</small></div>
            <div><b>{objective.pillar?.code} · {objective.goal?.code}</b><small>{objective.goal?.title}</small></div>
            <div className="stack-tags"><DivisionTag division={objective.division} compact />{objective.supporting.slice(0, 2).map(division => <small key={division.id}>{division.name}</small>)}</div>
            <span>{objective.year}</span>
            <QuarterPips quarters={objective.quarters} year={objective.year} currentYear={CURRENT_YEAR} currentQuarter={CURRENT_QUARTER} />
            <Progress value={objective.progress} />
            <Status value={objective.status} />
          </button>
        ))}
        {!rows.length && <Empty title="No objectives match" detail="Adjust the priority area, division, status, or year." />}
      </div>
    </section>
  );
}

function InitiativesPage({ view, filters, setFilters, onOpen }) {
  const divisions = divisionSelection(filters.division);
  const rows = view.initiatives.filter(initiative => {
    if (filters.cross && !initiative.crossDivision) return false;
    if (filters.pillar !== 'all' && initiative.pillarId !== filters.pillar) return false;
    if (!includesDivision(initiative.divisionId, divisions)) return false;
    if (filters.status !== 'all' && initiative.status !== filters.status) return false;
    if (filters.year !== 'all' && initiative.objectiveYear !== filters.year) return false;
    const haystack = `${initiative.title} ${initiative.objectiveTitle} ${initiative.division?.name} ${initiative.external?.key || ''} ${initiative.external?.system || ''}`.toLowerCase();
    return haystack.includes(filters.q.toLowerCase());
  });
  return (
    <section className="content">
      <div className="hero">
        <div>
          <div className="eyebrow">TEAM INITIATIVES</div>
          <h1>Initiatives</h1>
          <p>These are the projects divisions execute for an objective. Task management stays in Jira, Azure DevOps, or Planner. This register keeps the link.</p>
        </div>
      </div>
      <FilterBar>
        <label className="filter-field search-field"><span>Search</span><input value={filters.q} onChange={event => setFilters({ ...filters, q: event.target.value })} placeholder="Initiative, objective, or project key" /></label>
        <SelectFilter label="Priority area" value={filters.pillar} onChange={pillar => setFilters({ ...filters, pillar })} options={[{ value: 'all', label: 'All priority areas' }, ...view.pillars.map(pillar => ({ value: pillar.id, label: pillar.name }))]} />
        <MultiSelectFilter label="Executing division" values={divisions} onChange={division => setFilters({ ...filters, division })} options={view.divisions.map(division => ({ value: division.id, label: division.name }))} emptyLabel="All divisions" />
        <SelectFilter label="Status" value={filters.status} onChange={status => setFilters({ ...filters, status })} options={[{ value: 'all', label: 'All statuses' }, ...INIT_STATUSES.map(status => ({ value: status, label: status }))]} />
        <SelectFilter label="Objective year" value={filters.year} onChange={year => setFilters({ ...filters, year })} options={[{ value: 'all', label: 'All years' }, ...YEARS.map(year => ({ value: year, label: year }))]} />
        <label className="check-line filter-check"><input type="checkbox" checked={filters.cross} onChange={event => setFilters({ ...filters, cross: event.target.checked })} /><span>Cross-division only</span></label>
      </FilterBar>
      <p className="result-count">{rows.length} initiatives</p>
      <div className="initiative-register">
        {rows.map(initiative => (
          <button key={initiative.id} type="button" className={`initiative-row ${initiative.crossDivision ? 'cross' : ''}`} onClick={() => onOpen(initiative.objectiveId)}>
            <div>
              <b>{initiative.title}</b>
              <small>{initiative.objectiveCode} · {initiative.objectiveTitle}</small>
            </div>
            <div className="stack-tags">
              <span>Executes</span>
              <DivisionTag division={initiative.division} compact />
              {initiative.crossDivision && <small>for {initiative.responsibleDivision?.name}</small>}
            </div>
            <div><b>{initiative.verified}/{initiative.movs.length}</b><small>verified</small></div>
            <div><b>{initiative.external?.system || 'Not linked'}</b><small>{initiative.external?.key || 'No external project'}</small></div>
            <Progress value={initiative.progress} compact />
            <Status value={initiative.status} />
          </button>
        ))}
        {!rows.length && <Empty title="No initiatives match" detail="Clear the cross-division filter or choose another division." />}
      </div>
    </section>
  );
}

function ReviewsPage({ view, canEdit, actions, onOpen }) {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [quarter, setQuarter] = useState(CURRENT_QUARTER);
  const [dueOnly, setDueOnly] = useState(true);
  const [division, setDivision] = useState([]);
  const divisions = divisionSelection(division);
  const rows = view.objectives.filter(objective => objective.year === year && includesDivision(objective.divisionId, divisions) && (!dueOnly || !objective.quarters?.[quarter]?.note));
  return (
    <section className="content">
      <div className="hero">
        <div>
          <div className="eyebrow">QUARTERLY CADENCE</div>
          <h1>{quarter} {year} reviews</h1>
          <p>Objectives are reviewed each quarter. Filing a note records the quarter. The strategic score continues to roll up from the key results.</p>
        </div>
      </div>
      <div className="review-toolbar">
        <SelectFilter label="Year" value={year} onChange={setYear} options={YEARS.map(item => ({ value: item, label: item }))} />
        <div className="year-switch">{['Q1', 'Q2', 'Q3', 'Q4'].map(item => <button key={item} type="button" className={quarter === item ? 'active' : ''} onClick={() => setQuarter(item)}>{item}</button>)}</div>
        <MultiSelectFilter label="Responsible division" values={divisions} onChange={setDivision} options={view.divisions.map(item => ({ value: item.id, label: item.name }))} emptyLabel="All divisions" />
        <label className="check-line filter-check"><input type="checkbox" checked={dueOnly} onChange={event => setDueOnly(event.target.checked)} /><span>Due only</span></label>
      </div>
      <div className="review-list">
        {rows.map(objective => <ReviewRow key={`${objective.id}-${quarter}`} objective={objective} quarter={quarter} canEdit={canEdit} actions={actions} onOpen={() => onOpen(objective.id)} />)}
        {!rows.length && <Empty title="Nothing waiting in this quarter" detail="Turn off Due only to see reviews that have already been filed." />}
      </div>
    </section>
  );
}

function ReviewRow({ objective, quarter, canEdit, actions, onOpen }) {
  const report = objective.quarters?.[quarter] || { progress: 0, note: '' };
  const [progress, setProgress] = useState(report.progress);
  const [note, setNote] = useState(report.note || '');
  return (
    <article className="review-row">
      <button type="button" className="review-title" onClick={onOpen}><b>{objective.code}</b><span>{objective.title}</span><DivisionTag division={objective.division} compact /></button>
      <div className="review-live"><span>Live roll-up</span><Progress value={objective.progress} compact /><Status value={objective.status} /></div>
      {canEdit ? (
        <form onSubmit={event => { event.preventDefault(); actions.saveQuarter(objective.id, quarter, { progress: Number(progress), note: note.trim() }); }}>
          <label><span>{quarter} reported %</span><input type="number" min="0" max="100" value={progress} onChange={event => setProgress(event.target.value)} /></label>
          <label className="grow"><span>Review note</span><input value={note} onChange={event => setNote(event.target.value)} placeholder="What changed this quarter?" required /></label>
          <button className="secondary" type="button" onClick={() => setProgress(objective.progress)}>Use live</button>
          <button className="primary" type="submit">File review</button>
        </form>
      ) : (
        <div className="review-readonly">
          <span>{quarter} reported {report.progress}%</span>
          <p>{report.note || 'No review note yet.'}</p>
        </div>
      )}
    </article>
  );
}

function AlignmentPage({ view, actions, onManage }) {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  return (
    <section className="content">
      <div className="hero">
        <div>
          <div className="eyebrow">ALIGNMENT</div>
          <h1>From priority to proof</h1>
          <p>Open a priority area, then a goal, then an objective. Means of verification are recorded on each key result. Initiatives show who executes the work.</p>
        </div>
        <div className="year-switch">{['all', '2025', '2026', '2027'].map(item => <button key={item} type="button" className={year === item ? 'active' : ''} onClick={() => setYear(item)}>{item === 'all' ? 'All years' : item}</button>)}</div>
      </div>
      <AlignmentTree pillars={view.pillars} year={year} onManage={onManage} onProgress={(id, progress) => actions.saveVerification(id, progress)} onAddVerification={actions.addVerification} onKeyResult={(id, progress) => actions.saveKeyResult(id, { progress })} onSaveMean={actions.saveKrMean} onAddMean={actions.addKrMean} onRemoveMean={actions.deleteKrMean} />
    </section>
  );
}

function DivisionsPage({ view, openDivision }) {
  return (
    <section className="content">
      <div className="hero">
        <div>
          <div className="eyebrow">DIVISIONS</div>
          <h1>Who is accountable</h1>
          <p>A division can own objectives, support another division, or execute an initiative for an objective it does not own.</p>
        </div>
      </div>
      <div className="division-grid">
        {view.divisions.filter(division => division.owned.length || division.executing.length || division.supporting.length).map(division => (
          <article key={division.id} className="division-card">
            <header><DivisionTag division={division} /><Status value={division.status} /></header>
            <strong>{division.owned.length ? `${division.progress}%` : '—'}</strong>
            <p>{division.owned.length ? 'Average progress of objectives this division owns.' : 'Supports or executes work owned by other divisions.'}</p>
            <dl>
              <div><dt>Owns</dt><dd>{division.owned.length}</dd></div>
              <div><dt>Supports</dt><dd>{division.supporting.length}</dd></div>
              <div><dt>Executes</dt><dd>{division.executing.length}</dd></div>
              <div><dt>For others</dt><dd>{division.cross.length}</dd></div>
            </dl>
            <button type="button" className="secondary" onClick={() => openDivision(division.id)}>View objectives</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReportsPage({ view, onOpen }) {
  const [pillar, setPillar] = useState('all');
  const [year, setYear] = useState('all');
  const rows = view.objectives.filter(objective => (pillar === 'all' || objective.pillar?.id === pillar) && (year === 'all' || objective.year === year));
  const goals = view.goals.filter(goal => pillar === 'all' || goal.pillarId === pillar);
  const exportCsv = () => {
    const header = ['Priority area', 'Goal', 'Horizon', 'Objective', 'Year', 'Responsible division', 'Supporting divisions', 'Progress', 'Status', 'Key results', 'Key result progress', 'Key result means of verification', 'Q1', 'Q2', 'Q3', 'Q4', 'Initiative', 'Executing division', 'Cross division', 'External system', 'External key', 'Initiative verification', 'Initiative verification progress'];
    const lines = [header];
    rows.forEach(objective => {
      const keyResultTitles = objective.keyResults.map((item, index) => `KR${index + 1}: ${item.title}`).join(' | ');
      const keyResultProgress = objective.keyResults.map(item => item.progress).join(' | ');
      const keyResultMeans = objective.keyResults.map((item, index) => `KR${index + 1}: ${(item.means || []).map(mean => mean.title).filter(Boolean).join('; ')}`).join(' | ');
      const base = [objective.pillar?.name, `${objective.goal?.code} ${objective.goal?.title}`, `${objective.goal?.horizonYears}-year`, `${objective.code} ${objective.title}`, objective.year, objective.division?.name, objective.supporting.map(division => division.name).join('; '), objective.progress, objective.status, keyResultTitles, keyResultProgress, keyResultMeans, objective.quarters?.Q1?.progress, objective.quarters?.Q2?.progress, objective.quarters?.Q3?.progress, objective.quarters?.Q4?.progress];
      if (!objective.initiatives.length) lines.push([...base, '', '', '', '', '', '', '']);
      objective.initiatives.forEach(initiative => {
        const initiativeCells = [initiative.title, initiative.division?.name, initiative.crossDivision ? 'Yes' : 'No', initiative.external?.system || '', initiative.external?.key || ''];
        if (!initiative.movs.length) lines.push([...base, ...initiativeCells, '', '']);
        initiative.movs.forEach(mov => lines.push([...base, ...initiativeCells, mov.title, mov.progress]));
      });
    });
    const csv = lines.map(line => line.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'strategy-plan.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="content report-page">
      <div className="hero">
        <div>
          <div className="eyebrow">REPORT</div>
          <h1>Strategy report</h1>
          <p>A slice of the plan for leadership review. The export keeps every objective, its key results, the means of verification on each key result, and each initiative.</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="secondary" onClick={() => window.print()}><Printer size={16} /> Print</button>
          <button type="button" className="primary" onClick={exportCsv}><Download size={16} /> Export CSV</button>
        </div>
      </div>
      <FilterBar>
        <SelectFilter label="Priority area" value={pillar} onChange={setPillar} options={[{ value: 'all', label: 'All priority areas' }, ...view.pillars.map(item => ({ value: item.id, label: item.name }))]} />
        <SelectFilter label="Year" value={year} onChange={setYear} options={[{ value: 'all', label: 'All years' }, ...YEARS.map(item => ({ value: item, label: item }))]} />
      </FilterBar>
      <div className="metrics">
        <article className="metric"><div><span>Goals in view</span><strong>{goals.length}</strong><small>Strategic goals</small></div></article>
        <article className="metric"><div><span>Objectives</span><strong>{rows.length}</strong><small>Matching filters</small></div></article>
        <article className="metric"><div><span>Average progress</span><strong>{rows.length ? Math.round(rows.reduce((sum, item) => sum + item.progress, 0) / rows.length) : 0}%</strong><small>Objective roll-up</small></div></article>
        <article className="metric"><div><span>Cross-division</span><strong>{rows.reduce((sum, item) => sum + item.initiatives.filter(initiative => initiative.crossDivision).length, 0)}</strong><small>Initiatives executed elsewhere</small></div></article>
      </div>
      <div className="register">
        <div className="register-row head report-head"><span>Goal</span><span>Progress</span><span>Status</span><span>{CURRENT_YEAR}</span><span>Objectives</span></div>
        {goals.map(goal => (
          <button key={goal.id} type="button" className="register-row report-head" onClick={() => onOpen(goal.objectives[0]?.id)}>
            <div><b>{goal.code} {goal.title}</b><small>{goal.pillar?.name} · {goal.horizonYears}-year</small></div>
            <Progress value={goal.progress} />
            <Status value={goal.status} />
            <span>{goal.currentYearProgress}%</span>
            <span>{goal.objectives.length}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SettingsPage({ state, setState, canEdit, user, onImport }) {
  const [company, setCompany] = useState(state.company);
  const [note, setNote] = useState('');
  const flash = message => { setNote(message); window.setTimeout(() => setNote(''), 2200); };
  return (
    <section className="content">
      <div className="hero">
        <div>
          <div className="eyebrow">SETTINGS</div>
          <h1>Workspace</h1>
          <p>{canEdit
            ? (planUsesDatabase() ? 'The strategy plan is stored in the Cloudflare database for this site. Restoring the sample replaces that shared plan.' : 'The sample plan is stored in this browser. Restoring it replaces any goals, objectives, and reviews you have edited.')
            : 'You have view-only access. An admin can change the plan and manage who is allowed to sign in.'}</p>
        </div>
        {note && <div className="settings-saved">{note}</div>}
      </div>
      <div className="settings-grid">
        <article className="module-card">
          <div className="module-card-head"><div><b>Signed in</b><span>Google account matched to the user list.</span></div></div>
          <div className="settings-form">
            <Field label="Full name"><input value={user.fullName} readOnly /></Field>
            <Field label="Google email"><input value={user.email} readOnly /></Field>
            <Field label="Role" full><input value={canEdit ? 'Admin' : 'Viewer'} readOnly /></Field>
          </div>
        </article>
        {canEdit && (
          <article className="module-card">
            <div className="module-card-head"><div><b>Organisation</b><span>Shown in the sidebar and report heading.</span></div></div>
            <form className="settings-form" onSubmit={event => { event.preventDefault(); setState(current => ({ ...current, company })); flash('Organisation saved'); }}>
              <Field label="Name"><input value={company.name} onChange={event => setCompany({ ...company, name: event.target.value })} required /></Field>
              <Field label="Tagline"><input value={company.tagline} onChange={event => setCompany({ ...company, tagline: event.target.value })} /></Field>
              <div className="form-actions"><button className="primary" type="submit">Save organisation</button></div>
            </form>
          </article>
        )}
      </div>
      {canEdit && (
        <>
          <article className="module-card restore-card">
            <div>
              <b>Import the 2027 annual work plan</b>
              <p>Bring in objectives, key results, team initiatives, and responsible departments from the Annual Work Plan 2027_Working sheet.</p>
            </div>
            <button type="button" className="secondary" onClick={onImport}>Import 2027</button>
          </article>
          <article className="module-card restore-card">
            <div>
              <b>Restore the sample plan</b>
              <p>Brings back the Pension Office priority areas, strategic goals, objectives, key results, initiatives, and means of verification.</p>
            </div>
            <button type="button" className="secondary" onClick={() => { if (window.confirm('Replace the current plan with the sample strategy?')) { resetPlan().then(seed => { setState(seed); flash('Sample plan restored'); }).catch(() => flash('Could not restore the plan')); } }}>Restore sample plan</button>
          </article>
        </>
      )}
    </section>
  );
}

function FilterBar({ children }) {
  return <div className="filter-bar"><Filter size={15} />{children}</div>;
}
