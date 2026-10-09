import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, X } from 'lucide-react';
import { QUARTERS, STATUS_TONE, togglePlannedQuarter } from './model.js';

export function Progress({ value, compact }) {
  const score = Math.max(0, Math.min(100, Math.round(value || 0)));
  const color = score > 0 ? '#010670' : '#D5D8E6';
  return (
    <div className={`progress ${compact ? 'compact' : ''}`}>
      <div><i style={{ width: `${score}%`, background: color }} /></div>
      <b>{score}%</b>
    </div>
  );
}

export function Status({ value }) {
  return <span className={`status ${STATUS_TONE[value] || 'gray'}`}><i />{value}</span>;
}

export function Ring({ value, color = '#010670', label }) {
  const score = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div className="ring" style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #E6E7F4 0)` }} aria-label={label || `${score}%`}>
      <div><b>{score}%</b></div>
    </div>
  );
}

export function DivisionTag({ division, compact }) {
  if (!division) return null;
  return (
    <span className={`division-tag ${compact ? 'compact' : ''}`} style={{ color: division.color || '#3c4250', background: division.soft || '#f3f4f6' }}>
      <Building2 size={12} />
      {division.name}
    </span>
  );
}

export function QuarterTicks({ quarters, onChange, label = 'Planned quarters' }) {
  const selected = new Set(quarters || []);
  return (
    <div className="quarter-ticks" role="group" aria-label={label}>
      <span>{label}</span>
      {QUARTERS.map(quarter => (
        <label key={quarter}>
          <input type="checkbox" checked={selected.has(quarter)} onChange={() => onChange(togglePlannedQuarter(quarters, quarter))} />
          <span>{quarter}</span>
        </label>
      ))}
    </div>
  );
}

export function QuarterPips({ quarters, year, currentYear, currentQuarter }) {
  return (
    <div className="q-pips" aria-label="Quarterly reported progress">
      {QUARTERS.map(quarter => {
        const reported = quarters?.[quarter]?.progress || 0;
        const current = String(year) === String(currentYear) && quarter === currentQuarter;
        const color = reported >= 70 ? '#010670' : reported >= 45 ? '#4B56F9' : reported > 0 ? '#EA4927' : '#D5D8E6';
        return (
          <span key={quarter} className={current ? 'current' : ''} title={`${quarter} reported ${reported}%`}>
            <b><i style={{ height: `${reported}%`, background: color }} /></b>
            <em>{quarter}</em>
          </span>
        );
      })}
    </div>
  );
}

export function Horizon({ goal }) {
  return <span className="horizon-chip">{goal.horizonYears}-year · {goal.startYear}–{goal.endYear}</span>;
}

export function Field({ label, full, children }) {
  return <label className={full ? 'full' : ''}><span>{label}</span>{children}</label>;
}

export function Modal({ eyebrow, title, subtitle, onClose, children }) {
  return (
    <div className="modal-wrap">
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <div>
            <span className="drawer-label">{eyebrow}</span>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, detail }) {
  return <div className="empty"><b>{title}</b><span>{detail}</span></div>;
}

export function SelectFilter({ label, value, onChange, options }) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function MultiSelectFilter({ label, values, onChange, options, emptyLabel = 'All' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const selected = new Set(values);
  const visible = options.filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase()));
  const summary = values.length
    ? values.map(value => options.find(option => option.value === value)?.label).filter(Boolean).join(', ')
    : emptyLabel;

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = event => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = value => {
    onChange(selected.has(value) ? values.filter(item => item !== value) : [...values, value]);
  };

  return (
    <div className="filter-field multi-filter" ref={rootRef}>
      <span>{label}</span>
      <button type="button" className="multi-filter-button" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen(current => !current)}>
        <em>{summary}</em>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="multi-filter-menu" role="listbox" aria-multiselectable="true">
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a division" aria-label="Find a division" />
          <button type="button" className={!values.length ? 'selected' : ''} onClick={() => onChange([])}>{emptyLabel}</button>
          {visible.map(option => (
            <label key={option.value}>
              <input type="checkbox" checked={selected.has(option.value)} onChange={() => toggle(option.value)} />
              <span>{option.label}</span>
            </label>
          ))}
          {!visible.length && <p>No divisions match</p>}
        </div>
      )}
    </div>
  );
}
