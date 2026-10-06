import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { CURRENT_QUARTER, CURRENT_YEAR, KEY_RESULT_MAX, KEY_RESULT_MIN, QUARTERS, blankQuarters, uid } from './model.js';
import { DivisionTag, Empty, Field, Horizon, Modal, Progress, QuarterPips, Status } from './ui.jsx';

function MovEditor({ mov, onProgress, onDelete }) {
  return (
    <div className="mov-row">
      <div className="mov-copy">
        <Status value={mov.state} />
        <b>{mov.title}</b>
      </div>
      <div className="mov-score">
        <input aria-label={`Progress for ${mov.title}`} type="range" min="0" max="100" value={mov.progress} onChange={event => onProgress(mov.id, Number(event.target.value))} />
        <strong>{mov.progress}%</strong>
        {onDelete && <button type="button" className="delete-small" onClick={() => onDelete(mov.id)} aria-label="Remove means of verification"><Trash2 size={14} /></button>}
      </div>
    </div>
  );
}

function KeyResultList({ keyResults, onProgress }) {
  return (
    <section className="kr-block">
      <div className="section-head"><b>Key results</b><span>{keyResults.length} results score this objective</span></div>
      {keyResults.map((item, index) => (
        <div className="kr-row" key={item.id}>
          <span className="kr-code">KR{index + 1}</span>
          <b>{item.title}</b>
          <div className="mov-score">
            <input aria-label={`Progress for ${item.title}`} type="range" min="0" max="100" value={item.progress} onChange={event => onProgress(item.id, Number(event.target.value))} />
            <strong>{item.progress}%</strong>
          </div>
        </div>
      ))}
    </section>
  );
}

export function InitiativePanel({ initiative, onProgress, onAdd, showAdd = true }) {
  const [title, setTitle] = useState('');
  return (
    <article className={`initiative-panel ${initiative.crossDivision ? 'cross' : ''}`}>
      <header>
        <div>
          <span>{initiative.crossDivision ? 'Executed by another division' : 'Team initiative'}</span>
          <h4>{initiative.title}</h4>
        </div>
        <DivisionTag division={initiative.division} />
        <Status value={initiative.status} />
      </header>
      {initiative.crossDivision && (
        <p className="cross-note">
          {initiative.responsibleDivision?.name} owns the objective. {initiative.division.name} executes this initiative.
          {initiative.external ? ` Delivery is tracked in ${initiative.external.system}.` : ' Delivery can be tracked in an external project system.'}
        </p>
      )}
      <div className="initiative-meta">
        <span>{initiative.verified}/{initiative.movs.length} means of verification complete</span>
        {initiative.external?.url ? (
          <a href={initiative.external.url} target="_blank" rel="noreferrer">
            <ExternalLink size={13} />
            {initiative.external.system || 'External project'}{initiative.external.key ? ` · ${initiative.external.key}` : ''}
          </a>
        ) : initiative.external?.system ? <span>{initiative.external.system}{initiative.external.key ? ` · ${initiative.external.key}` : ''}</span> : null}
      </div>
      <div className="mov-list">
        {initiative.movs.map(mov => <MovEditor key={mov.id} mov={mov} onProgress={onProgress} />)}
        {!initiative.movs.length && <p className="quiet">No means of verification yet.</p>}
      </div>
      {showAdd && (
        <form className="inline-create" onSubmit={event => { event.preventDefault(); if (!title.trim()) return; onAdd(initiative.id, title.trim()); setTitle(''); }}>
          <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Add a means of verification" />
          <button type="submit"><Plus size={14} /> Add</button>
        </form>
      )}
    </article>
  );
}

export function ObjectiveCard({ objective, open, onToggle, onManage, onProgress, onAddVerification, onKeyResult }) {
  return (
    <article className={`objective-card ${open ? 'open' : ''}`} id={`objective-${objective.id}`}>
      <button type="button" className="objective-main" onClick={onToggle}>
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <div className="objective-copy">
          <div className="meta-line">
            <span>{objective.code}</span>
            <span>{objective.year}</span>
            {objective.aspirational && <em>Aspirational</em>}
          </div>
          <h3>{objective.title}</h3>
          <div className="chip-line">
            <DivisionTag division={objective.division} compact />
            {objective.supporting.length > 0 && <small>{objective.supporting.length} supporting</small>}
            <small>{objective.keyResults.length} key results</small>
            <small>{objective.initiatives.length} initiatives</small>
          </div>
        </div>
        <QuarterPips quarters={objective.quarters} year={objective.year} currentYear={CURRENT_YEAR} currentQuarter={CURRENT_QUARTER} />
        <Progress value={objective.progress} />
        <Status value={objective.status} />
      </button>
      {open && (
        <div className="objective-detail">
          {objective.description && <p>{objective.description}</p>}
          <div className="accountability">
            <div><span>Responsible division</span><DivisionTag division={objective.division} /></div>
            <div>
              <span>Supporting divisions</span>
              <div className="chip-line">
                {objective.supporting.length ? objective.supporting.map(division => <DivisionTag key={division.id} division={division} compact />) : <em>None</em>}
              </div>
            </div>
          </div>
          <KeyResultList keyResults={objective.keyResults} onProgress={onKeyResult} />
          {objective.initiatives.map(initiative => (
            <InitiativePanel key={initiative.id} initiative={initiative} onProgress={onProgress} onAdd={onAddVerification} />
          ))}
          <div className="detail-actions">
            <button type="button" className="secondary" onClick={onManage}>Manage objective</button>
          </div>
        </div>
      )}
    </article>
  );
}

export function GoalCascade({ goal, year, openObjective, setOpenObjective, onManage, onProgress, onAddVerification, onKeyResult }) {
  const objectives = goal.objectives.filter(item => year === 'all' || item.year === year);
  return (
    <div className="cascade-list">
      {objectives.map(objective => (
        <ObjectiveCard
          key={objective.id}
          objective={objective}
          open={openObjective === objective.id}
          onToggle={() => setOpenObjective(openObjective === objective.id ? null : objective.id)}
          onManage={() => onManage(objective.id)}
          onProgress={onProgress}
          onAddVerification={onAddVerification}
          onKeyResult={onKeyResult}
        />
      ))}
      {!objectives.length && <Empty title="No objectives in this year" detail="Add an objective for the selected year, or choose another year." />}
    </div>
  );
}

function DivisionButtons({ divisions, selected, onChange }) {
  const [query, setQuery] = useState('');
  const visible = divisions.filter(division => division.name.toLowerCase().includes(query.toLowerCase()));
  const toggle = id => onChange(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id]);
  return (
    <div className="picker-block">
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a division" />
      <div className="division-picker">
        {visible.map(division => (
          <button type="button" key={division.id} className={selected.includes(division.id) ? 'selected' : ''} onClick={() => toggle(division.id)}>
            {division.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GoalModal({ pillars, goal, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    pillarId: goal?.pillarId || pillars[0]?.id || 'pa1',
    title: goal?.title || '',
    description: goal?.description || '',
    horizonYears: goal?.horizonYears || 5,
    startYear: goal?.startYear || 2024,
    owner: goal?.owner || 'Strategy Office',
  }));
  const set = event => setForm(current => ({ ...current, [event.target.name]: event.target.name === 'horizonYears' || event.target.name === 'startYear' ? Number(event.target.value) : event.target.value }));
  return (
    <Modal eyebrow={goal ? 'STRATEGIC GOAL' : 'NEW STRATEGIC GOAL'} title={goal ? 'Edit strategic goal' : 'Add a strategic goal'} subtitle="Organisational goals sit under a priority area and usually run for five or seven years." onClose={onClose}>
      <form onSubmit={event => { event.preventDefault(); if (!form.title.trim()) return; onSave({ ...form, title: form.title.trim(), description: form.description.trim() }); }}>
        <Field label="Priority area" full>
          <select name="pillarId" value={form.pillarId} onChange={set}>{pillars.map(pillar => <option key={pillar.id} value={pillar.id}>{pillar.code} · {pillar.name}</option>)}</select>
        </Field>
        <Field label="Goal" full><input required name="title" value={form.title} onChange={set} placeholder="What must the organisation achieve?" /></Field>
        <Field label="Description" full><textarea name="description" value={form.description} onChange={set} placeholder="Why this goal matters over the planning horizon" /></Field>
        <Field label="Horizon">
          <select name="horizonYears" value={form.horizonYears} onChange={set}><option value={5}>5 years</option><option value={7}>7 years</option></select>
        </Field>
        <Field label="Starts">
          <input name="startYear" type="number" min="2020" max="2040" value={form.startYear} onChange={set} />
        </Field>
        <Field label="Accountable office" full><input name="owner" value={form.owner} onChange={set} /></Field>
        <div className="form-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" type="submit">{goal ? 'Save goal' : 'Create goal'}</button></div>
      </form>
    </Modal>
  );
}

export function ObjectiveModal({ goals, divisions, presetGoalId, onClose, onSave }) {
  const [form, setForm] = useState({
    goalId: presetGoalId || goals[0]?.id || '',
    title: '',
    description: '',
    year: String(CURRENT_YEAR),
    divisionId: divisions[0]?.id || '',
    supportingIds: [],
    aspirational: false,
    keyResults: ['', '', ''],
  });
  const set = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const grouped = useMemo(() => goals.slice().sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true })), [goals]);
  const setKeyResult = (index, title) => setForm(current => ({ ...current, keyResults: current.keyResults.map((item, itemIndex) => itemIndex === index ? title : item) }));
  const titles = form.keyResults.map(title => title.trim());
  const keyResultsReady = titles.length >= KEY_RESULT_MIN && titles.length <= KEY_RESULT_MAX && titles.every(Boolean);
  return (
    <Modal eyebrow="NEW OBJECTIVE" title="Add an objective" subtitle="A division owns the objective for a plan year, with three or four key results. Supporting divisions can contribute, and the work is delivered through team initiatives." onClose={onClose}>
      <form onSubmit={event => { event.preventDefault(); if (!form.title.trim() || !form.goalId || !form.divisionId || !keyResultsReady) return; onSave({ ...form, title: form.title.trim(), description: form.description.trim(), keyResults: titles, quarters: blankQuarters() }); }}>
        <Field label="Strategic goal" full>
          <select name="goalId" value={form.goalId} onChange={set}>{grouped.map(goal => <option key={goal.id} value={goal.id}>{goal.code} · {goal.title}</option>)}</select>
        </Field>
        <Field label="Objective" full><input required name="title" value={form.title} onChange={set} placeholder="What will this division achieve this year?" /></Field>
        <Field label="Description" full><textarea name="description" value={form.description} onChange={set} /></Field>
        <Field label="Year"><select name="year" value={form.year} onChange={set}>{['2025', '2026', '2027', '2028', '2029', '2030'].map(year => <option key={year}>{year}</option>)}</select></Field>
        <Field label="Responsible division"><select name="divisionId" value={form.divisionId} onChange={set}>{divisions.map(division => <option key={division.id} value={division.id}>{division.name}</option>)}</select></Field>
        <div className="full picker-field"><span>Supporting divisions</span><DivisionButtons divisions={divisions.filter(division => division.id !== form.divisionId)} selected={form.supportingIds} onChange={supportingIds => setForm(current => ({ ...current, supportingIds }))} /></div>
        <div className="full kr-fields">
          <span>Key results</span>
          {form.keyResults.map((title, index) => (
            <label key={index}>
              <em>KR{index + 1}</em>
              <input required value={title} onChange={event => setKeyResult(index, event.target.value)} placeholder="Measurable result for this objective" />
              {form.keyResults.length > KEY_RESULT_MIN && (
                <button type="button" className="delete-small" aria-label={`Remove KR${index + 1}`} onClick={() => setForm(current => ({ ...current, keyResults: current.keyResults.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={14} /></button>
              )}
            </label>
          ))}
          {form.keyResults.length < KEY_RESULT_MAX && (
            <button type="button" className="secondary" onClick={() => setForm(current => ({ ...current, keyResults: [...current.keyResults, ''] }))}><Plus size={14} /> Fourth key result</button>
          )}
        </div>
        <label className="check-line full"><input type="checkbox" checked={form.aspirational} onChange={event => setForm(current => ({ ...current, aspirational: event.target.checked }))} /><span>Aspirational objective</span></label>
        <div className="form-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" type="submit"><Plus size={16} /> Create objective</button></div>
      </form>
    </Modal>
  );
}

function snapshot(objective) {
  return {
    title: objective.title,
    description: objective.description || '',
    year: objective.year,
    divisionId: objective.divisionId,
    supportingIds: objective.supportingIds || [],
    aspirational: Boolean(objective.aspirational),
  };
}

export function ObjectiveDrawer({ objective, divisions, actions, onClose }) {
  const [draft, setDraft] = useState(() => snapshot(objective));
  const [initiative, setInitiative] = useState({ title: '', divisionId: objective.divisionId, system: '', key: '', url: '' });
  const seen = useRef(objective.id);
  useEffect(() => {
    if (seen.current === objective.id) return;
    seen.current = objective.id;
    setDraft(snapshot(objective));
    setInitiative({ title: '', divisionId: objective.divisionId, system: '', key: '', url: '' });
  }, [objective]);

  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!draft) return null;
  const set = event => setDraft(current => ({ ...current, [event.target.name]: event.target.value }));
  const save = event => {
    event.preventDefault();
    actions.saveObjective(objective.id, { ...draft, title: draft.title.trim(), description: draft.description.trim(), supportingIds: draft.supportingIds.filter(id => id !== draft.divisionId) });
  };
  const addInitiative = event => {
    event.preventDefault();
    if (!initiative.title.trim()) return;
    const external = initiative.system ? { system: initiative.system, key: initiative.key.trim(), url: initiative.url.trim() } : null;
    actions.addInitiative({ id: uid('init'), objectiveId: objective.id, title: initiative.title.trim(), divisionId: initiative.divisionId, external, blocked: false });
    setInitiative({ title: '', divisionId: objective.divisionId, system: '', key: '', url: '' });
  };

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer wide" role="dialog" aria-label="Objective">
        <div className="drawer-head">
          <span className="drawer-label">OBJECTIVE {objective.code}</span>
          <div className="drawer-actions">
            <button type="button" className="icon-button danger-icon" aria-label="Delete objective" onClick={() => actions.deleteObjective(objective.id)}><Trash2 size={16} /></button>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
        </div>
        <form className="drawer-form" onSubmit={save}>
          <Field label="Objective" full><input name="title" value={draft.title} onChange={set} required /></Field>
          <Field label="Description" full><textarea name="description" value={draft.description} onChange={set} /></Field>
          <Field label="Year"><select name="year" value={draft.year} onChange={set}>{['2025', '2026', '2027', '2028', '2029', '2030'].map(year => <option key={year}>{year}</option>)}</select></Field>
          <Field label="Responsible division"><select name="divisionId" value={draft.divisionId} onChange={set}>{divisions.map(division => <option key={division.id} value={division.id}>{division.name}</option>)}</select></Field>
          <label className="check-line full"><input type="checkbox" checked={draft.aspirational} onChange={event => setDraft(current => ({ ...current, aspirational: event.target.checked }))} /><span>Aspirational</span></label>
          <div className="full picker-field"><span>Supporting divisions</span><DivisionButtons divisions={divisions.filter(division => division.id !== draft.divisionId)} selected={draft.supportingIds} onChange={supportingIds => setDraft(current => ({ ...current, supportingIds }))} /></div>
          <div className="form-actions"><button className="primary" type="submit">Save objective</button></div>
        </form>

        <section className="drawer-section">
          <div className="section-head"><div><b>Key results</b><span>Three or four measurable results. Their average is this objective’s progress.</span></div></div>
          <div className="kr-edit">
            {objective.keyResults.map((item, index) => (
              <div className="kr-edit-row" key={item.id}>
                <span className="kr-code">KR{index + 1}</span>
                <input aria-label={`KR${index + 1} title`} value={item.title} onChange={event => actions.saveKeyResult(item.id, { title: event.target.value })} />
                <div className="mov-score">
                  <input aria-label={`KR${index + 1} progress`} type="range" min="0" max="100" value={item.progress} onChange={event => actions.saveKeyResult(item.id, { progress: Number(event.target.value) })} />
                  <strong>{item.progress}%</strong>
                </div>
                <button type="button" className="delete-small" disabled={objective.keyResults.length <= KEY_RESULT_MIN} aria-label={`Remove KR${index + 1}`} onClick={() => actions.deleteKeyResult(item.id)}><Trash2 size={14} /></button>
              </div>
            ))}
            {objective.keyResults.length < KEY_RESULT_MAX && <AddKeyResult onAdd={title => actions.addKeyResult(objective.id, title)} />}
          </div>
        </section>

        <section className="drawer-section">
          <div className="section-head"><div><b>Quarterly reviews</b><span>Reported progress for {objective.year}. The live score rolls up from the key results.</span></div></div>
          <div className="quarter-edit">
            {QUARTERS.map(quarter => {
              const report = objective.quarters?.[quarter] || { progress: 0, note: '' };
              return (
                <label key={quarter}>
                  <span>{quarter}</span>
                  <input type="number" min="0" max="100" value={report.progress} onChange={event => actions.saveQuarter(objective.id, quarter, { progress: Number(event.target.value) })} />
                  <input value={report.note} placeholder="Review note" onChange={event => actions.saveQuarter(objective.id, quarter, { note: event.target.value })} />
                </label>
              );
            })}
          </div>
        </section>

        <section className="drawer-section">
          <div className="section-head"><div><b>Team initiatives</b><span>Projects that deliver this objective. Execution can sit with a different division, and the tasks stay in the external system.</span></div></div>
          {objective.initiatives.map(item => (
            <article key={item.id} className="drawer-initiative">
              <div className="drawer-initiative-head">
                <strong>{item.title}</strong>
                <button type="button" className="delete-small" onClick={() => actions.deleteInitiative(item.id)} aria-label="Delete initiative"><Trash2 size={14} /></button>
              </div>
              <label><span>Title</span><input value={item.title} onChange={event => actions.saveInitiative(item.id, { title: event.target.value })} /></label>
              <label><span>Executing division</span>
                <select value={item.divisionId} onChange={event => actions.saveInitiative(item.id, { divisionId: event.target.value })}>
                  {divisions.map(division => <option key={division.id} value={division.id}>{division.name}</option>)}
                </select>
              </label>
              <label className="check-line"><input type="checkbox" checked={Boolean(item.blocked)} onChange={event => actions.saveInitiative(item.id, { blocked: event.target.checked })} /><span>Blocked</span></label>
              <div className="external-edit">
                <label><span>External system</span><input value={item.external?.system || ''} placeholder="Jira, Azure DevOps, MS Planner" onChange={event => actions.saveInitiative(item.id, { external: { system: event.target.value, key: item.external?.key || '', url: item.external?.url || '' } })} /></label>
                <label><span>Key</span><input value={item.external?.key || ''} onChange={event => actions.saveInitiative(item.id, { external: { system: item.external?.system || '', key: event.target.value, url: item.external?.url || '' } })} /></label>
                <label><span>URL</span><input value={item.external?.url || ''} onChange={event => actions.saveInitiative(item.id, { external: { system: item.external?.system || '', key: item.external?.key || '', url: event.target.value } })} /></label>
              </div>
              {item.movs.map(mov => (
                <MovEditor key={mov.id} mov={mov} onProgress={actions.saveVerification} onDelete={actions.deleteVerification} />
              ))}
              <AddMov onAdd={title => actions.addVerification(item.id, title)} />
            </article>
          ))}
          <form className="new-initiative" onSubmit={addInitiative}>
            <b>New team initiative</b>
            <input value={initiative.title} onChange={event => setInitiative(current => ({ ...current, title: event.target.value }))} placeholder="Name the project or programme" />
            <select value={initiative.divisionId} onChange={event => setInitiative(current => ({ ...current, divisionId: event.target.value }))}>
              {divisions.map(division => <option key={division.id} value={division.id}>{division.name}</option>)}
            </select>
            <input value={initiative.system} onChange={event => setInitiative(current => ({ ...current, system: event.target.value }))} placeholder="External system" />
            <input value={initiative.key} onChange={event => setInitiative(current => ({ ...current, key: event.target.value }))} placeholder="Project key" />
            <input value={initiative.url} onChange={event => setInitiative(current => ({ ...current, url: event.target.value }))} placeholder="https://" />
            <button className="primary" type="submit"><Plus size={15} /> Add initiative</button>
          </form>
        </section>
      </aside>
    </>
  );
}

function AddKeyResult({ onAdd }) {
  const [title, setTitle] = useState('');
  return (
    <form className="inline-create" onSubmit={event => { event.preventDefault(); if (!title.trim()) return; onAdd(title.trim()); setTitle(''); }}>
      <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Add a fourth key result" />
      <button type="submit"><Plus size={14} /> Add</button>
    </form>
  );
}

function AddMov({ onAdd }) {
  const [title, setTitle] = useState('');
  return (
    <form className="inline-create" onSubmit={event => { event.preventDefault(); if (!title.trim()) return; onAdd(title.trim()); setTitle(''); }}>
      <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Add a means of verification" />
      <button type="submit"><Plus size={14} /> Add</button>
    </form>
  );
}

export function AlignmentTree({ pillars, year, onProgress, onAddVerification, onManage, onKeyResult }) {
  const [openGoal, setOpenGoal] = useState(null);
  const [openObjective, setOpenObjective] = useState(null);
  return (
    <div className="alignment-tree">
      {pillars.map(pillar => (
        <section key={pillar.id} className="alignment-pillar">
          <header style={{ '--accent': pillar.color }}>
            <span>{pillar.code}</span>
            <div><b>{pillar.name}</b><small>{pillar.goals.length} strategic goals · {pillar.progress}%</small></div>
            <Progress value={pillar.progress} />
            <Status value={pillar.status} />
          </header>
          {pillar.goals.map(goal => {
            const open = openGoal === goal.id;
            const objectives = goal.objectives.filter(item => year === 'all' || item.year === year);
            return (
              <div key={goal.id} className="alignment-goal">
                <button type="button" onClick={() => { setOpenGoal(open ? null : goal.id); setOpenObjective(null); }}>
                  {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="code">{goal.code}</span>
                  <strong>{goal.title}</strong>
                  <Horizon goal={goal} />
                  <Progress value={goal.progress} compact />
                  <Status value={goal.status} />
                </button>
                {open && objectives.map(objective => (
                  <ObjectiveCard
                    key={objective.id}
                    objective={objective}
                    open={openObjective === objective.id}
                    onToggle={() => setOpenObjective(openObjective === objective.id ? null : objective.id)}
                    onManage={() => onManage(objective.id)}
                    onProgress={onProgress}
                    onAddVerification={onAddVerification}
                    onKeyResult={onKeyResult}
                  />
                ))}
                {open && !objectives.length && <Empty title="No objectives for this year" detail="Change the year filter to see the rest of the goal." />}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
