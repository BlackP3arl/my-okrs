import { initialCompany, initialGoals, initialProfile, teamColors } from './workplan.js';

export const CURRENT_YEAR = 2026;
export const CURRENT_QUARTER = 'Q4';
export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
export const STORAGE_KEY = 'strategy-plan-v4';
export const KEY_RESULT_MIN = 3;
export const KEY_RESULT_MAX = 4;

export const STATUS_TONE = {
  Achieved: 'green',
  'On track': 'green',
  Done: 'green',
  Verified: 'green',
  'At risk': 'amber',
  'In progress': 'blue',
  'Off track': 'red',
  Blocked: 'red',
  'Not started': 'gray',
};

const TECH_DIVISIONS = new Set([
  'Innovation and Technology',
  'Software Engineering',
  'Data Services',
  'Cloud and Security',
]);

const TECH_RE = /\b(system|systems|platform|portal|software|application|app|automation|automated|digital|dashboard|database|api|crm|erp|kiosk|e-wallet|encryption|cloud|chatbot|lms|saas|ims|ticketing|integration|integrated|ai\/ml|ai-powered)\b/i;

const SEVEN_YEAR = new Set(['3.1', '3.2', '4.7']);

export const PILLARS = [
  {
    id: 'pa1',
    code: '1',
    name: 'Community and Member-Centric Service',
    intent: 'Service quality, public trust, and inclusive participation in the pension system.',
    color: '#010670',
    soft: '#E6E7F4',
  },
  {
    id: 'pa2',
    code: '2',
    name: 'Optimise and Innovate Solutions',
    intent: 'Platforms, automation, and shared services that raise quality for members and partners.',
    color: '#4B56F9',
    soft: '#EEEEFE',
  },
  {
    id: 'pa3',
    code: '3',
    name: 'Pension Sustainability',
    intent: 'A resilient fund, wider investment choice, and a stronger social-protection design.',
    color: '#010670',
    soft: '#F9E9CD',
  },
  {
    id: 'pa4',
    code: '4',
    name: 'Organizational Development and Resilience',
    intent: 'Governance, people, security, and the operating environment that keep the office dependable.',
    color: '#2430B0',
    soft: '#E8EAFC',
  },
];

const PILLAR_BY_NAME = Object.fromEntries(PILLARS.map(pillar => [pillar.name, pillar.id]));

export function slug(name) {
  return String(name).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function hash(value) {
  let h = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function clamp(value, min = 0, max = 100) {
  const number = Math.round(Number(value) || 0);
  return Math.min(max, Math.max(min, number));
}

export function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 7)}`;
}

function group(items, key) {
  return items.reduce((map, item) => {
    const id = item[key];
    if (!map[id]) map[id] = [];
    map[id].push(item);
    return map;
  }, {});
}

function splitCode(title) {
  const match = String(title).match(/^(\d+\.\d+(?:\.[a-z])?)\s+([\s\S]+)$/i);
  if (!match) return { code: '', title: String(title).trim() };
  return { code: match[1], title: match[2].trim() };
}

function parseDescription(description) {
  let text = description || '';
  const aspirational = /\bAspirational\./.test(text);
  text = text.replace(/\s*Aspirational\./, '');
  let supporting = [];
  const match = text.match(/\s*Related departments: ([^.]+)\./);
  if (match) {
    supporting = match[1].split(',').map(part => part.trim()).filter(Boolean);
    text = text.replace(match[0], '');
  }
  return { description: text.trim(), supporting, aspirational };
}

export function objectiveStatus(progress, year) {
  const value = clamp(progress);
  const numericYear = Number(year);
  if (value >= 100) return 'Achieved';
  if (value <= 0) return 'Not started';
  if (numericYear < CURRENT_YEAR) return value >= 90 ? 'Achieved' : value >= 70 ? 'At risk' : 'Off track';
  if (numericYear > CURRENT_YEAR) return 'On track';
  const pace = value / 76;
  if (pace >= 0.9) return 'On track';
  if (pace >= 0.65) return 'At risk';
  return 'Off track';
}

export function paceStatus(progress, startYear, horizonYears) {
  const value = clamp(progress);
  if (value >= 100) return 'Achieved';
  if (value <= 0) return 'Not started';
  const elapsed = Math.min(horizonYears, Math.max(1, CURRENT_YEAR - startYear + 1));
  const expected = (elapsed / horizonYears) * 100;
  const pace = value / expected;
  if (pace >= 0.9) return 'On track';
  if (pace >= 0.65) return 'At risk';
  return 'Off track';
}

export function verificationState(progress) {
  if (progress >= 100) return 'Verified';
  if (progress > 0) return 'In progress';
  return 'Not started';
}

export function initiativeStatus(progress, blocked) {
  if (blocked) return 'Blocked';
  if (progress >= 100) return 'Done';
  if (progress > 0) return 'In progress';
  return 'Not started';
}

function targetFor(id, year) {
  const seed = hash(`${id}:${year}`);
  if (year === '2025') return 78 + (seed % 23);
  if (year === '2027') return seed % 6 === 0 ? 8 : 0;
  const band = seed % 10;
  if (band < 5) return 68 + (seed % 20);
  if (band < 8) return 50 + (seed % 17);
  return 18 + (seed % 28);
}

function spread(target, count, seed) {
  if (count <= 0) return [];
  const base = clamp(target);
  if (count === 1 || base === 0) return Array(count).fill(base);
  const values = [];
  for (let i = 0; i < count - 1; i += 1) {
    const jitter = (hash(`${seed}:${i}`) % 21) - 10;
    values.push(clamp(base + jitter));
  }
  const used = values.reduce((sum, value) => sum + value, 0);
  values.push(clamp(base * count - used));
  return values;
}

function quarterSnapshots(target, year, code) {
  const reported = (quarter, progress) => {
    const value = clamp(progress);
    const currentAndOpen = year === '2026' && quarter === 'Q4' && hash(`${code}:${quarter}`) % 5 > 1;
    const note = year === '2027' || value === 0 || currentAndOpen
      ? ''
      : `${quarter} ${year}: ${code} reported at ${value}% against the annual objective.`;
    return { progress: value, note };
  };
  if (year === '2025') {
    return {
      Q1: reported('Q1', target * 0.32),
      Q2: reported('Q2', target * 0.55),
      Q3: reported('Q3', target * 0.8),
      Q4: reported('Q4', target),
    };
  }
  if (year === '2026') {
    return {
      Q1: reported('Q1', target * 0.34),
      Q2: reported('Q2', target * 0.58),
      Q3: reported('Q3', target * 0.82),
      Q4: reported('Q4', target),
    };
  }
  return { Q1: reported('Q1', 0), Q2: reported('Q2', 0), Q3: reported('Q3', 0), Q4: reported('Q4', 0) };
}

function externalRef(id, technical) {
  const seed = hash(id);
  if (!technical && seed % 3 === 0) return null;
  const number = 1400 + (seed % 700);
  if (technical) {
    if (seed % 2 === 0) {
      return { system: 'Jira', key: `STRAT-${number}`, url: `https://jira.pension.gov.mv/browse/STRAT-${number}` };
    }
    return { system: 'Azure DevOps', key: String(number), url: `https://dev.azure.com/pensionoffice/workplan/_workitems/edit/${number}` };
  }
  return { system: 'MS Planner', key: `Plan-${number}`, url: 'https://planner.cloud.microsoft/pensionoffice' };
}

function preferredTech(names) {
  const order = ['Innovation and Technology', 'Software Engineering', 'Data Services', 'Cloud and Security'];
  return order.find(name => names.includes(name)) || null;
}

export function blankQuarters() {
  return { Q1: { progress: 0, note: '' }, Q2: { progress: 0, note: '' }, Q3: { progress: 0, note: '' }, Q4: { progress: 0, note: '' } };
}

const DIVISION_TONES = [
  ['#010670', '#E6E7F4'],
  ['#4B56F9', '#EEEEFE'],
  ['#1C2A8A', '#E7E9F6'],
  ['#303FCF', '#E8EAFF'],
  ['#0B3A82', '#E5EEF8'],
  ['#2436C8', '#E9EBFD'],
];

export function buildDivisions() {
  return Object.entries(teamColors)
    .filter(([name]) => name !== 'Pension Office')
    .map(([name], index) => {
      const [color, soft] = DIVISION_TONES[index % DIVISION_TONES.length];
      return { id: slug(name), name, color, soft };
    });
}

function headlineKeyResults(titles) {
  const clean = titles.map(title => String(title).trim()).filter(Boolean);
  if (clean.length > KEY_RESULT_MAX) return clean.slice(0, KEY_RESULT_MAX);
  const padded = [...clean];
  const fillers = [
    'Responsible division confirms the annual outcome against the approved work plan.',
    'Evidence for this objective is reviewed and accepted in the quarterly cycle.',
  ];
  let index = 0;
  while (padded.length < KEY_RESULT_MIN) {
    padded.push(fillers[index] || fillers[0]);
    index += 1;
  }
  return padded;
}

function keyResultRecords(objectiveId, titles, target) {
  const selected = headlineKeyResults(titles);
  const progresses = spread(target, selected.length, `${objectiveId}:kr`);
  return selected.map((title, index) => ({
    id: `${objectiveId}-kr${index + 1}`,
    objectiveId,
    title,
    progress: progresses[index] ?? 0,
  }));
}

function evidenceSentence(title) {
  return `Quarterly review accepts evidence that: ${title}`;
}

function krMeanRecords(keyResults, sourceTitles) {
  const used = new Set(keyResults.map(item => item.title));
  const extras = sourceTitles.map(title => String(title).trim()).filter(title => title && !used.has(title));
  const means = [];
  keyResults.forEach((keyResult, index) => {
    const statements = [keyResult.title];
    statements.push(extras[index] || evidenceSentence(keyResult.title));
    statements.forEach((title, movIndex) => {
      means.push({
        id: `${keyResult.id}-mov-${movIndex + 1}`,
        keyResultId: keyResult.id,
        title,
      });
    });
  });
  extras.slice(keyResults.length).forEach((title, index) => {
    const keyResult = keyResults[index % keyResults.length];
    const count = means.filter(item => item.keyResultId === keyResult.id).length + 1;
    means.push({
      id: `${keyResult.id}-mov-${count}`,
      keyResultId: keyResult.id,
      title,
    });
  });
  return means;
}

function meansForRemainingKeyResults(means, keyResults) {
  const ids = new Set((keyResults || []).map(item => item.id));
  return (means || []).filter(item => ids.has(item.keyResultId));
}

function makeInitiative({ id, objectiveId, title, divisionId, technical, movTitles, target }) {
  const progresses = spread(target, movTitles.length, id);
  return {
    initiative: {
      id,
      objectiveId,
      title,
      divisionId,
      external: externalRef(id, technical),
      blocked: false,
    },
    verifications: movTitles.map((movTitle, index) => ({
      id: `${id}-mov-${index + 1}`,
      initiativeId: id,
      title: movTitle,
      progress: progresses[index] ?? 0,
    })),
  };
}

function initiativesFor(objective, movTitles, divisionIdByName) {
  const techName = TECH_DIVISIONS.has(objective.divisionName) ? null : preferredTech(objective.supportingNames);
  const technical = [];
  const business = [];
  movTitles.forEach(title => {
    if (techName && TECH_RE.test(title)) technical.push(title);
    else business.push(title);
  });
  const bundles = [];
  if (technical.length) {
    bundles.push(makeInitiative({
      id: `${objective.id}-tech`,
      objectiveId: objective.id,
      title: `${objective.title} — system delivery`,
      divisionId: divisionIdByName[techName],
      technical: true,
      movTitles: technical,
      target: objective.target,
    }));
  }
  if (business.length || bundles.length === 0) {
    bundles.push(makeInitiative({
      id: `${objective.id}-delivery`,
      objectiveId: objective.id,
      title: technical.length ? `${objective.title} — divisional delivery` : objective.title,
      divisionId: objective.divisionId,
      technical: false,
      movTitles: business,
      target: objective.target,
    }));
  }
  return bundles;
}

function crmExample(divisionIdByName) {
  const objectiveId = 'obj-crm';
  const objective = {
    id: objectiveId,
    goalId: 'g-2-2',
    code: '2.2.j',
    title: 'Introduce a member CRM so pension services can manage every service relationship in one place.',
    description: 'Pension Services owns the service outcome. Innovation and Technology designs and implements the CRM in the external delivery system. Client Relations supports adoption across service channels.',
    divisionId: divisionIdByName['Pension Services'],
    supportingIds: ['Innovation and Technology', 'Client Relations'].map(name => divisionIdByName[name]).filter(Boolean),
    year: '2026',
    aspirational: false,
    quarters: quarterSnapshots(62, '2026', '2.2.j'),
  };
  const keyResults = keyResultRecords(objectiveId, [
    'Pension service journeys are managed from one member record.',
    'Service teams use the CRM for day-to-day case handling.',
    'Member and employer data needed for service is available in the CRM.',
    'The CRM is live on the channels pension services use with members.',
  ], 62);
  const business = makeInitiative({
    id: 'init-crm-service',
    objectiveId,
    title: 'Prepare pension service operations to adopt the member CRM',
    divisionId: divisionIdByName['Pension Services'],
    technical: false,
    movTitles: [
      'Current pension-service journeys mapped and signed off by Pension Services.',
      'Service scripts, roles, and handover criteria approved for CRM go-live.',
      'Frontline staff completed CRM adoption sessions.',
    ],
    target: 70,
  });
  const technology = makeInitiative({
    id: 'init-crm-build',
    objectiveId,
    title: 'Design and implement the member CRM',
    divisionId: divisionIdByName['Innovation and Technology'],
    technical: true,
    movTitles: [
      'CRM solution selected and implementation partner contracted.',
      'Member, employer, and case data migrated into the CRM.',
      'CRM integrated with pension service channels and launched for operational use.',
    ],
    target: 54,
  });
  return { objective, keyResults, parts: [business, technology] };
}

export function buildSeed() {
  const divisions = buildDivisions();
  const divisionIdByName = Object.fromEntries(divisions.map(division => [division.name, division.id]));
  const goals = [];
  const objectives = [];
  const initiatives = [];
  const verifications = [];
  const keyResults = [];
  const krMeans = [];

  initialGoals.forEach(record => {
    const parsed = splitCode(record.title);
    const description = parseDescription(record.description);
    if (!record.parentId) {
      const horizonYears = SEVEN_YEAR.has(parsed.code) ? 7 : 5;
      goals.push({
        id: record.id,
        pillarId: PILLAR_BY_NAME[record.division] || 'pa1',
        code: parsed.code,
        title: parsed.title,
        description: description.description,
        horizonYears,
        startYear: 2024,
        owner: 'Strategy Office',
      });
      return;
    }
    const year = String(record.period || CURRENT_YEAR);
    const divisionName = record.team;
    const objective = {
      id: record.id,
      goalId: record.parentId,
      code: parsed.code,
      title: parsed.title,
      description: description.description,
      divisionId: divisionIdByName[divisionName] || slug(divisionName),
      divisionName,
      supportingNames: description.supporting,
      supportingIds: description.supporting.map(name => divisionIdByName[name]).filter(Boolean),
      year,
      aspirational: description.aspirational,
      target: targetFor(record.id, year),
    };
    objective.quarters = quarterSnapshots(objective.target, year, objective.code || objective.id);
    const sourceTitles = (record.keyResults || []).map(item => item.title);
    const parts = initiativesFor(objective, sourceTitles, divisionIdByName);
    const records = keyResultRecords(objective.id, sourceTitles, objective.target);
    keyResults.push(...records);
    krMeans.push(...krMeanRecords(records, sourceTitles));
    objectives.push({
      id: objective.id,
      goalId: objective.goalId,
      code: objective.code,
      title: objective.title,
      description: objective.description,
      divisionId: objective.divisionId,
      supportingIds: objective.supportingIds,
      year: objective.year,
      aspirational: objective.aspirational,
      quarters: objective.quarters,
    });
    parts.forEach(part => {
      initiatives.push(part.initiative);
      verifications.push(...part.verifications);
    });
  });

  const example = crmExample(divisionIdByName);
  objectives.push(example.objective);
  keyResults.push(...example.keyResults);
  krMeans.push(...krMeanRecords(example.keyResults, example.keyResults.map(item => item.title)));
  example.parts.forEach(part => {
    initiatives.push(part.initiative);
    verifications.push(...part.verifications);
  });

  return {
    pillars: PILLARS,
    divisions,
    goals,
    objectives,
    keyResults,
    krMeans,
    initiatives,
    verifications,
    company: { ...initialCompany, name: 'Maldives Pension Office', tagline: 'Secure Your Tomorrow' },
    profile: { ...initialProfile, role: 'Strategy Office', title: 'Strategic performance' },
  };
}

export function loadState() {
  if (typeof localStorage === 'undefined') return buildSeed();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.pillars?.length && saved?.goals?.length && saved?.objectives?.length && saved?.keyResults?.length && Array.isArray(saved.krMeans)) return saved;
  } catch {
    /* use the sample plan */
  }
  return buildSeed();
}

export function saveState(state) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function decorate(state) {
  const divisionById = Object.fromEntries(state.divisions.map(division => [division.id, division]));
  const goalById = Object.fromEntries(state.goals.map(goal => [goal.id, goal]));
  const pillarById = Object.fromEntries(state.pillars.map(pillar => [pillar.id, pillar]));
  const verificationsByInitiative = group(state.verifications, 'initiativeId');
  const keyResultsByObjective = group(state.keyResults || [], 'objectiveId');
  const meansByKeyResult = group(state.krMeans || [], 'keyResultId');

  const initiatives = state.initiatives.map(initiative => {
    const movs = (verificationsByInitiative[initiative.id] || []).map(item => ({
      ...item,
      state: verificationState(item.progress),
    }));
    const progress = average(movs.map(item => item.progress));
    const objective = state.objectives.find(item => item.id === initiative.objectiveId);
    const goal = objective ? goalById[objective.goalId] : null;
    const pillar = goal ? pillarById[goal.pillarId] : null;
    return {
      ...initiative,
      movs,
      progress,
      status: initiativeStatus(progress, initiative.blocked),
      division: divisionById[initiative.divisionId] || { id: initiative.divisionId, name: 'Unassigned', color: '#64748b', soft: '#f1f5f9' },
      responsibleDivision: objective ? divisionById[objective.divisionId] : null,
      crossDivision: Boolean(objective && objective.divisionId !== initiative.divisionId),
      objectiveCode: objective?.code || '',
      objectiveTitle: objective?.title || 'Objective removed',
      objectiveYear: objective?.year || '',
      goalId: goal?.id || '',
      goalCode: goal?.code || '',
      pillarId: pillar?.id || '',
      pillarName: pillar?.name || '',
      verified: movs.filter(item => item.progress >= 100).length,
    };
  });

  const initiativesByObjective = group(initiatives, 'objectiveId');
  const objectives = state.objectives.map(objective => {
    const children = initiativesByObjective[objective.id] || [];
    const keyResults = (keyResultsByObjective[objective.id] || []).map(item => ({
      ...item,
      means: meansByKeyResult[item.id] || [],
    }));
    const progress = keyResults.length ? average(keyResults.map(item => item.progress)) : average(children.map(item => item.progress));
    const goal = goalById[objective.goalId];
    const pillar = goal ? pillarById[goal.pillarId] : null;
    return {
      ...objective,
      progress,
      status: objectiveStatus(progress, objective.year),
      keyResults,
      initiatives: children,
      division: divisionById[objective.divisionId] || { id: objective.divisionId, name: 'Unassigned', color: '#64748b', soft: '#f1f5f9' },
      supporting: (objective.supportingIds || []).map(id => divisionById[id]).filter(Boolean),
      goal,
      pillar,
      verified: children.reduce((sum, item) => sum + item.verified, 0),
      movCount: children.reduce((sum, item) => sum + item.movs.length, 0),
    };
  });

  const objectivesByGoal = group(objectives, 'goalId');
  const goals = state.goals.map(goal => {
    const children = (objectivesByGoal[goal.id] || []).slice().sort((a, b) => String(a.code).localeCompare(String(b.code)));
    const due = children.filter(item => Number(item.year) <= CURRENT_YEAR);
    const current = children.filter(item => Number(item.year) === CURRENT_YEAR);
    const progress = average((due.length ? due : children).map(item => item.progress));
    const endYear = goal.startYear + goal.horizonYears - 1;
    return {
      ...goal,
      endYear,
      progress,
      status: due.length ? paceStatus(progress, goal.startYear, goal.horizonYears) : (progress > 0 ? 'On track' : 'Not started'),
      objectives: children,
      pillar: pillarById[goal.pillarId],
      currentYearProgress: average(current.map(item => item.progress)),
      currentYearCount: current.length,
    };
  });

  const goalsByPillar = group(goals, 'pillarId');
  const pillars = state.pillars.map(pillar => {
    const children = (goalsByPillar[pillar.id] || []).slice().sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));
    const progress = average(children.map(item => item.progress));
    return {
      ...pillar,
      goals: children,
      progress,
      status: paceStatus(progress, 2024, 5),
    };
  });

  const divisions = state.divisions.map(division => {
    const owned = objectives.filter(item => item.divisionId === division.id);
    const supporting = objectives.filter(item => item.divisionId !== division.id && (item.supportingIds || []).includes(division.id));
    const executing = initiatives.filter(item => item.divisionId === division.id);
    const cross = executing.filter(item => item.crossDivision);
    return {
      ...division,
      owned,
      supporting,
      executing,
      cross,
      progress: average(owned.map(item => item.progress)),
      status: objectiveStatus(average(owned.map(item => item.progress)), String(CURRENT_YEAR)),
    };
  }).sort((a, b) => b.owned.length - a.owned.length || a.name.localeCompare(b.name));

  const orgProgress = average(goals.map(goal => goal.progress));
  return {
    pillars,
    goals,
    objectives,
    initiatives,
    divisions,
    company: state.company,
    profile: state.profile,
    org: {
      progress: orgProgress,
      status: paceStatus(orgProgress, 2024, 5),
      goals: goals.length,
      objectives: objectives.length,
      initiatives: initiatives.length,
      keyResults: (state.keyResults || []).length,
      verifications: state.verifications.length,
      onTrack: goals.filter(goal => goal.status === 'On track' || goal.status === 'Achieved').length,
      cross: initiatives.filter(item => item.crossDivision).length,
      reviewsDue: objectives.filter(item => item.year === String(CURRENT_YEAR) && !item.quarters?.[CURRENT_QUARTER]?.note).length,
    },
  };
}

export function involvesDivision(objective, divisionId, role) {
  if (!divisionId || divisionId === 'all') return true;
  const responsible = objective.divisionId === divisionId;
  const supporting = (objective.supportingIds || []).includes(divisionId);
  const executing = objective.initiatives?.some(item => item.divisionId === divisionId);
  if (role === 'responsible') return responsible;
  if (role === 'supporting') return supporting;
  if (role === 'executing') return executing;
  return responsible || supporting || executing;
}

export function removeGoal(state, goalId) {
  const objectiveIds = new Set(state.objectives.filter(item => item.goalId === goalId).map(item => item.id));
  const initiativeIds = new Set(state.initiatives.filter(item => objectiveIds.has(item.objectiveId)).map(item => item.id));
  const keyResults = (state.keyResults || []).filter(item => !objectiveIds.has(item.objectiveId));
  return {
    ...state,
    goals: state.goals.filter(item => item.id !== goalId),
    objectives: state.objectives.filter(item => item.goalId !== goalId),
    keyResults,
    krMeans: meansForRemainingKeyResults(state.krMeans, keyResults),
    initiatives: state.initiatives.filter(item => !objectiveIds.has(item.objectiveId)),
    verifications: state.verifications.filter(item => !initiativeIds.has(item.initiativeId)),
  };
}

export function removeObjective(state, objectiveId) {
  const initiativeIds = new Set(state.initiatives.filter(item => item.objectiveId === objectiveId).map(item => item.id));
  const keyResults = (state.keyResults || []).filter(item => item.objectiveId !== objectiveId);
  return {
    ...state,
    objectives: state.objectives.filter(item => item.id !== objectiveId),
    keyResults,
    krMeans: meansForRemainingKeyResults(state.krMeans, keyResults),
    initiatives: state.initiatives.filter(item => item.objectiveId !== objectiveId),
    verifications: state.verifications.filter(item => !initiativeIds.has(item.initiativeId)),
  };
}

export function removeInitiative(state, initiativeId) {
  return {
    ...state,
    initiatives: state.initiatives.filter(item => item.id !== initiativeId),
    verifications: state.verifications.filter(item => item.initiativeId !== initiativeId),
  };
}
