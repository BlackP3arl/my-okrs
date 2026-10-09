import { utils, write } from 'xlsx';

const KEY_RESULT_COLUMNS = 4;

function percent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  return Math.round(number);
}

function planned(quarters, quarter) {
  return Array.isArray(quarters) && quarters.includes(quarter) ? 'Yes' : '';
}

export function objectiveReportRows(objectives) {
  const header = [
    'Objective code',
    'Objective',
    'Year',
    'Priority area',
    'Goal',
    'Responsible division',
    'Objective completion %',
  ];
  for (let index = 1; index <= KEY_RESULT_COLUMNS; index += 1) {
    header.push(`KR${index}`, `KR${index} completion %`);
  }
  header.push(
    'Team initiative',
    'Executing division',
    'Initiative completion %',
    'Planned Q1',
    'Planned Q2',
    'Planned Q3',
    'Planned Q4',
  );

  const lines = [header];
  objectives.forEach(objective => {
    const keyResults = objective.keyResults || [];
    const shared = [
      objective.code || '',
      objective.title || '',
      objective.year || '',
      objective.pillar?.name || '',
      [objective.goal?.code, objective.goal?.title].filter(Boolean).join(' '),
      objective.division?.name || '',
      percent(objective.progress),
    ];
    for (let index = 0; index < KEY_RESULT_COLUMNS; index += 1) {
      const keyResult = keyResults[index];
      shared.push(keyResult?.title || '', keyResult ? percent(keyResult.progress) : '');
    }
    const initiatives = objective.initiatives?.length ? objective.initiatives : [null];
    initiatives.forEach(initiative => {
      lines.push([
        ...shared,
        initiative?.title || '',
        initiative?.division?.name || '',
        initiative ? percent(initiative.progress) : '',
        planned(initiative?.plannedQuarters, 'Q1'),
        planned(initiative?.plannedQuarters, 'Q2'),
        planned(initiative?.plannedQuarters, 'Q3'),
        planned(initiative?.plannedQuarters, 'Q4'),
      ]);
    });
  });
  return lines;
}

const WIDE_COLUMNS = new Set([1, 7, 9, 11, 13, 15]);

export function downloadObjectiveReport(objectives) {
  const rows = objectiveReportRows(objectives);
  const book = utils.book_new();
  const sheet = utils.aoa_to_sheet(rows);
  sheet['!cols'] = rows[0].map((label, index) => ({
    wch: WIDE_COLUMNS.has(index) ? 42 : Math.max(14, String(label).length + 2),
  }));
  utils.book_append_sheet(book, sheet, 'Objectives');
  const data = write(book, { bookType: 'xlsx', type: 'array' });
  const url = URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'objectives-report.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
