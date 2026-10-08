import { read, utils } from 'xlsx';
import { blankQuarters, slug } from './model.js';

export const IMPORT_YEAR = '2027';

const SEVEN_YEAR = new Set(['3.1', '3.2', '4.7']);
const DIVISION_TONES = [
  ['#010670', '#E6E7F4'],
  ['#4B56F9', '#EEEEFE'],
  ['#1C2A8A', '#E7E9F6'],
  ['#303FCF', '#E8EAFF'],
  ['#0B3A82', '#E5EEF8'],
  ['#2436C8', '#E9EBFD'],
];
const DEPARTMENT_ALIASES = new Map([
  ['investment research', 'investment and research'],
]);

const HEADER_FIELDS = [
  ['objective', /annual objectives/i],
  ['keyResult', /key result/i],
  ['pillar', /priority area/i],
  ['initiative', /team initiatives/i],
  ['means', /means of verification/i],
  ['budget', /require budget/i],
  ['q1', /^q1$/i],
  ['q2', /^q2$/i],
  ['q3', /^q3$/i],
  ['q4', /^q4$/i],
  ['department', /responsible department/i],
  ['related', /related department/i],
  ['accountable', /^accountable$/i],
  ['goal', /5 year goals/i],
];

function text(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function rawText(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\r\n/g, '\n').trim();
}

function normalizeName(value) {
  return text(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
}

function canonicalDepartment(value) {
  const normal = normalizeName(value);
  return DEPARTMENT_ALIASES.get(normal) || normal;
}

export function cleanObjectiveCode(value) {
  return text(value).replace(/\(new\)/ig, '').replace(/\s+/g, '').replace(/([a-z]+)$/i, letters => letters.toLowerCase());
}

function goalCodeFrom(objectiveCode, explicit) {
  const direct = text(explicit);
  if (/^\d+\.\d+$/.test(direct)) return direct;
  const match = cleanObjectiveCode(objectiveCode).match(/^(\d+\.\d+)/);
  return match ? match[1] : '';
}

function parseKeyResults(value) {
  const source = rawText(value);
  if (!source) return [];
  if (!/\bKR\s*\d+/i.test(source)) return [text(source)].filter(Boolean);
  return source
    .split(/\bKR\s*\d+\s*[:.)\-–—]?\s*/i)
    .map(part => text(part).replace(/[;]\s*$/, ''))
    .filter(Boolean);
}

function cleanInitiativeTitle(value) {
  return text(value).replace(/^(?:INI|INX|IN)\s*\d*\s*[:.)\-–—]\s*/i, '').trim();
}

function splitList(value) {
  return rawText(value)
    .split(/[,;\n]+/)
    .map(part => text(part))
    .filter(Boolean);
}

function parseBudget(value) {
  if (value === true) return true;
  if (value === false) return false;
  const flag = text(value).toLowerCase();
  if (flag === 'yes' || flag === 'y') return true;
  if (flag === 'no' || flag === 'n') return false;
  return null;
}

function isChecked(value) {
  if (value === true || value === 1) return true;
  const flag = text(value).toLowerCase();
  return flag === 'true' || flag === 'yes' || flag === 'y';
}

function sheetMatrix(sheet) {
  const ref = sheet['!ref'];
  if (!ref) return [];
  const range = utils.decode_range(ref);
  const matrix = [];
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    const values = [];
    for (let column = range.s.c; column <= range.e.c; column += 1) {
      const cell = sheet[utils.encode_cell({ r: row, c: column })];
      values.push(cell ? cell.v : null);
    }
    matrix.push(values);
  }
  (sheet['!merges'] || []).forEach(merge => {
    const value = matrix[merge.s.r - range.s.r]?.[merge.s.c - range.s.c];
    for (let row = merge.s.r; row <= merge.e.r; row += 1) {
      for (let column = merge.s.c; column <= merge.e.c; column += 1) {
        const rowIndex = row - range.s.r;
        const columnIndex = column - range.s.c;
        if (matrix[rowIndex] && columnIndex < matrix[rowIndex].length) matrix[rowIndex][columnIndex] = value;
      }
    }
  });
  return matrix;
}

function headerMap(row) {
  const labels = row.map(cell => text(cell));
  const columns = {};
  HEADER_FIELDS.forEach(([field, pattern]) => {
    const index = labels.findIndex(label => pattern.test(label));
    if (index >= 0) columns[field] = index;
  });
  if (columns.goal !== undefined) columns.goalCode = columns.goal - 1;
  if (columns.objective !== undefined) columns.objectiveCode = columns.objective - 1;
  return columns;
}

function cell(row, columns, field) {
  const index = columns[field];
  if (index === undefined || index < 0) return null;
  return row[index];
}

function isWorkPlanSheet(name) {
  const label = name.replace(/\s+/g, ' ').trim().toLowerCase();
  return label.includes('2027') && label.includes('working') && label.includes('work plan');
}

function chooseSheet(workbook) {
  const match = workbook.SheetNames.find(isWorkPlanSheet);
  if (!match) {
    throw new Error('The workbook has no sheet named like Annual Work Plan 2027_Working.');
  }
  return match;
}

function isOtherTask(pillar) {
  return /other key tasks/i.test(text(pillar));
}

function validObjectiveCode(code) {
  return /^\d+\.\d+\.?[a-z]{1,2}$/.test(code);
}

function pushInitiative(objective, row, columns) {
  const title = cleanInitiativeTitle(cell(row, columns, 'initiative'));
  if (!title) return;
  const quarters = ['q1', 'q2', 'q3', 'q4'].filter(field => isChecked(cell(row, columns, field))).map(field => field.toUpperCase());
  objective.initiatives.push({
    title,
    department: text(cell(row, columns, 'department')),
    means: splitList(cell(row, columns, 'means')),
    budget: parseBudget(cell(row, columns, 'budget')),
    quarters,
  });
}

function rememberRelated(objective, row, columns) {
  splitList(cell(row, columns, 'related')).forEach(name => {
    if (!objective.related.includes(name)) objective.related.push(name);
  });
  const accountable = text(cell(row, columns, 'accountable'));
  if (accountable && !objective.accountable) objective.accountable = accountable;
}

export function parseWorkbook(data) {
  const workbook = read(data, { type: 'array', cellDates: false });
  const sheetName = chooseSheet(workbook);
  const matrix = sheetMatrix(workbook.Sheets[sheetName]);
  const headerIndex = matrix.findIndex(row => {
    const columns = headerMap(row);
    return columns.keyResult !== undefined && columns.initiative !== undefined && columns.objective !== undefined;
  });
  if (headerIndex < 0) throw new Error(`${sheetName} does not use the annual work plan columns.`);
  const columns = headerMap(matrix[headerIndex]);
  const objectives = [];
  const goals = new Map();
  const skipped = [];
  const seenSkip = new Set();
  let currentGoal = { code: '', title: '', pillar: '' };
  let current = null;

  const skip = (label, reason) => {
    const key = `${label}:${reason}`;
    if (seenSkip.has(key)) return;
    seenSkip.add(key);
    skipped.push({ label, reason });
  };

  matrix.slice(headerIndex + 1).forEach(row => {
    const explicitGoal = text(cell(row, columns, 'goalCode'));
    const goalTitle = text(cell(row, columns, 'goal'));
    const pillar = text(cell(row, columns, 'pillar'));
    if (/^\d+\.\d+$/.test(explicitGoal)) {
      currentGoal = { code: explicitGoal, title: goalTitle || currentGoal.title, pillar: pillar || currentGoal.pillar };
    } else if (pillar && !isOtherTask(pillar)) {
      currentGoal = { ...currentGoal, pillar };
    }

    const code = cleanObjectiveCode(cell(row, columns, 'objectiveCode'));
    const title = text(cell(row, columns, 'objective'));
    if (!code) {
      if (isOtherTask(pillar) || (title && /\b2026\b/.test(title))) {
        if (title) skip(title, 'Not a 2027 objective');
        current = null;
        return;
      }
      if (current) {
        pushInitiative(current, row, columns);
        rememberRelated(current, row, columns);
      }
      return;
    }
    if (!validObjectiveCode(code)) {
      skip(code, 'Objective code was not recognised');
      current = null;
      return;
    }
    if (isOtherTask(pillar || currentGoal.pillar)) {
      skip(code, 'Other key tasks are not 2027 strategic objectives');
      current = null;
      return;
    }
    if (current?.code === code) {
      pushInitiative(current, row, columns);
      rememberRelated(current, row, columns);
      return;
    }
    if (!title) {
      skip(code, 'Objective has no title');
      current = null;
      return;
    }
    const goalCode = goalCodeFrom(code, currentGoal.code);
    const goal = {
      code: goalCode,
      title: currentGoal.title || `Goal ${goalCode}`,
      pillar: pillar || currentGoal.pillar,
    };
    if (goal.code) goals.set(goal.code, goal);
    current = {
      code,
      title,
      goalCode: goal.code,
      pillar: goal.pillar,
      department: text(cell(row, columns, 'department')),
      related: [],
      accountable: '',
      keyResults: parseKeyResults(cell(row, columns, 'keyResult')),
      initiatives: [],
    };
    rememberRelated(current, row, columns);
    pushInitiative(current, row, columns);
    objectives.push(current);
  });

  return {
    sheetName,
    year: IMPORT_YEAR,
    goals: [...goals.values()],
    objectives,
    skipped,
  };
}

function matchPillar(label, pillars) {
  const cleaned = text(label).replace(/^\d+\.\s*/, '').toLowerCase();
  if (!cleaned) return null;
  return pillars.find(pillar => pillar.name.toLowerCase() === cleaned)
    || pillars.find(pillar => cleaned.includes(pillar.name.toLowerCase()) || pillar.name.toLowerCase().includes(cleaned))
    || null;
}

function matchDivision(name, divisions) {
  const wanted = canonicalDepartment(name);
  if (!wanted) return null;
  return divisions.find(division => canonicalDepartment(division.name) === wanted) || null;
}

function ensureDivision(name, divisions) {
  const existing = matchDivision(name, divisions);
  if (existing) return { division: existing, created: false };
  const [color, soft] = DIVISION_TONES[divisions.length % DIVISION_TONES.length];
  const division = { id: slug(text(name)), name: text(name), color, soft };
  divisions.push(division);
  return { division, created: true };
}

function removeYear(state, year) {
  const objectiveIds = new Set(state.objectives.filter(item => item.year === year).map(item => item.id));
  const keyResultIds = new Set((state.keyResults || []).filter(item => objectiveIds.has(item.objectiveId)).map(item => item.id));
  const initiativeIds = new Set(state.initiatives.filter(item => objectiveIds.has(item.objectiveId)).map(item => item.id));
  return {
    objectives: state.objectives.filter(item => !objectiveIds.has(item.id)),
    keyResults: (state.keyResults || []).filter(item => !objectiveIds.has(item.objectiveId)),
    krMeans: (state.krMeans || []).filter(item => !keyResultIds.has(item.keyResultId)),
    initiatives: state.initiatives.filter(item => !objectiveIds.has(item.objectiveId)),
    verifications: state.verifications.filter(item => !initiativeIds.has(item.initiativeId)),
    replaced: objectiveIds.size,
  };
}

export function applyWorkPlanImport(state, parsed) {
  const removed = removeYear(state, parsed.year || IMPORT_YEAR);
  const divisions = state.divisions.map(division => ({ ...division }));
  const goals = state.goals.map(goal => ({ ...goal }));
  const createdDivisions = [];
  let createdGoals = 0;

  const divisionId = name => {
    if (!text(name)) return '';
    const result = ensureDivision(name, divisions);
    if (result.created) createdDivisions.push(result.division.name);
    return result.division.id;
  };

  parsed.goals.forEach(incoming => {
    if (!incoming.code) return;
    const pillar = matchPillar(incoming.pillar, state.pillars);
    const existing = goals.find(goal => goal.code === incoming.code);
    if (existing) {
      if (incoming.title) existing.title = incoming.title;
      if (pillar) existing.pillarId = pillar.id;
      return;
    }
    createdGoals += 1;
    goals.push({
      id: `goal-${slug(incoming.code)}`,
      pillarId: pillar?.id || state.pillars[0]?.id,
      code: incoming.code,
      title: incoming.title || `Goal ${incoming.code}`,
      description: '',
      horizonYears: SEVEN_YEAR.has(incoming.code) ? 7 : 5,
      startYear: 2024,
      owner: 'Strategy Office',
    });
  });

  const objectives = [];
  const keyResults = [];
  const initiatives = [];
  const verifications = [];

  parsed.objectives.forEach(incoming => {
    const goal = goals.find(item => item.code === incoming.goalCode);
    if (!goal) return;
    const responsibleId = divisionId(incoming.department);
    const supportingIds = [];
    incoming.related.forEach(name => {
      const id = divisionId(name);
      if (id && id !== responsibleId && !supportingIds.includes(id)) supportingIds.push(id);
    });
    const objectiveId = `obj-${parsed.year}-${slug(incoming.code)}`;
    objectives.push({
      id: objectiveId,
      goalId: goal.id,
      code: incoming.code,
      title: incoming.title,
      description: '',
      divisionId: responsibleId || divisions[0]?.id,
      supportingIds,
      year: parsed.year || IMPORT_YEAR,
      aspirational: false,
      quarters: blankQuarters(),
      accountable: incoming.accountable || '',
    });
    incoming.keyResults.forEach((title, index) => {
      keyResults.push({ id: `${objectiveId}-kr${index + 1}`, objectiveId, title, progress: 0 });
    });
    incoming.initiatives.forEach((item, index) => {
      const initiativeId = `${objectiveId}-init${index + 1}`;
      const executingId = divisionId(item.department) || responsibleId || divisions[0]?.id;
      initiatives.push({
        id: initiativeId,
        objectiveId,
        title: item.title,
        divisionId: executingId,
        external: null,
        blocked: false,
        budget: item.budget,
        plannedQuarters: item.quarters,
      });
      item.means.forEach((mean, meanIndex) => {
        verifications.push({ id: `${initiativeId}-mov${meanIndex + 1}`, initiativeId, title: mean, progress: 0 });
      });
    });
  });

  return {
    state: {
      ...state,
      divisions,
      goals,
      objectives: [...removed.objectives, ...objectives],
      keyResults: [...removed.keyResults, ...keyResults],
      krMeans: removed.krMeans,
      initiatives: [...removed.initiatives, ...initiatives],
      verifications: [...removed.verifications, ...verifications],
    },
    summary: {
      year: parsed.year || IMPORT_YEAR,
      sheetName: parsed.sheetName,
      objectives: objectives.length,
      keyResults: keyResults.length,
      initiatives: initiatives.length,
      verifications: verifications.length,
      replaced: removed.replaced,
      createdGoals,
      createdDivisions,
      skipped: parsed.skipped,
    },
  };
}
