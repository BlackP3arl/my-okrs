import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { utils, write } from 'xlsx';
import { buildSeed } from './model.js';
import { applyWorkPlanImport, parseWorkbook } from './importPlan.js';

const workbookPath = '/home/ubuntu/.cursor/projects/workspace/uploads/_Working_Sheet_Annual_Work_Plan_2027_-_Draft__1__ca3b.xlsx';

function workbook(rows) {
  const sheet = utils.aoa_to_sheet(rows);
  const book = utils.book_new();
  utils.book_append_sheet(book, sheet, 'Annual Work Plan 2027_Working');
  return write(book, { type: 'array', bookType: 'xlsx' });
}

const header = ['', '5 Year Goals', '', 'Annual Objectives (OKRs)', 'Key Result', 'Priority Area', 'Team Initiatives ', 'Means of Verification', 'Require Budget', 'Q1', 'Q2', 'Q3', 'Q4', 'Responsible Department', 'Related Department(s) ', 'Accountable'];

test('reads 2027 objectives and leaves other plan years untouched', () => {
  const parsed = parseWorkbook(workbook([
    header,
    ['1.1', 'Improve the member experience', '1.1.c', 'Embed a client-centred culture.', 'KR1: Culture programme started\nKR2: Satisfaction up\nKR3: Personas covered', '1. Community and Member-Centric Service', '', '', '', false, false, false, false, 'Client Relations', '', ''],
    ['1.1', 'Improve the member experience', '1.1.c', 'Embed a client-centred culture.', 'KR1: Culture programme started\nKR2: Satisfaction up\nKR3: Personas covered', '1. Community and Member-Centric Service', 'INX: Prepare communication plans', 'Plans prepared; Framework agreed', 'NO', true, false, false, false, 'Public Relations', 'Stakeholder Relations', ''],
    ['', '', '', 'Finance Forum 2026', '', 'Other Key Tasks', 'Arrange the venue', '', '', false, false, false, false, 'General Services', '', ''],
    ['2.2', 'Improve digital services', '2.2e (NEW)', 'Rebuild the collateral workflow.', 'KR1: Redesign KR2: Rebuild KR3: Train users', '2. Optimise and Innovate Solutions', 'IN1: Rebuild the workflow', 'Workflow live', 'YES', false, true, false, false, 'Investment Research', 'Portfolio Analysis', ''],
    ['4.1', 'Digitise operations', '4.1.ab (NEW)', '', '', '4. Organizational Development and Resilience', '', '', '', false, false, false, false, '', '', ''],
  ]));

  assert.equal(parsed.objectives.length, 2);
  assert.equal(parsed.objectives[0].code, '1.1.c');
  assert.equal(parsed.objectives[0].department, 'Client Relations');
  assert.deepEqual(parsed.objectives[0].keyResults, ['Culture programme started', 'Satisfaction up', 'Personas covered']);
  assert.equal(parsed.objectives[0].initiatives.length, 1);
  assert.equal(parsed.objectives[0].initiatives[0].department, 'Public Relations');
  assert.deepEqual(parsed.objectives[0].initiatives[0].quarters, ['Q1']);
  assert.equal(parsed.objectives[0].initiatives[0].budget, false);
  assert.deepEqual(parsed.objectives[0].initiatives[0].means, ['Plans prepared', 'Framework agreed']);
  assert.deepEqual(parsed.objectives[0].related, ['Stakeholder Relations']);
  assert.equal(parsed.objectives[1].code, '2.2e');
  assert.equal(parsed.skipped.some(item => item.label === 'Finance Forum 2026'), true);
  assert.equal(parsed.skipped.some(item => item.label === '4.1.ab'), true);

  const before = buildSeed();
  const kept = before.objectives.filter(item => item.year !== '2027').length;
  const { state, summary } = applyWorkPlanImport(before, parsed);
  assert.equal(state.objectives.filter(item => item.year !== '2027').length, kept);
  assert.equal(state.objectives.filter(item => item.year === '2027').length, 2);
  assert.equal(summary.createdDivisions.includes('Portfolio Analysis'), true);
  assert.equal(summary.createdDivisions.includes('Investment and Research'), false);
  const imported = state.objectives.find(item => item.code === '2.2e');
  assert.equal(state.divisions.find(item => item.id === imported.divisionId).name, 'Investment and Research');
});

test('imports the Pension Office 2027 working sheet', { skip: existsSync(workbookPath) ? false : 'sample workbook is not on this machine' }, () => {
  const parsed = parseWorkbook(readFileSync(workbookPath));
  assert.equal(parsed.sheetName, 'Annual Work Plan 2027_Working D');
  assert.equal(parsed.objectives.length, 51);
  assert.equal(parsed.objectives.find(item => item.code === '1.2.c').initiatives.length, 7);
  assert.equal(parsed.objectives.find(item => item.code === '4.7.c').initiatives.length, 3);
  assert.equal(parsed.objectives.some(item => item.code === '2.2.e'), true);
  assert.equal(parsed.objectives.some(item => item.code === '2.2e'), true);
  assert.equal(parsed.objectives.find(item => item.code === '4.3.h').goalCode, '4.3');
  const { state } = applyWorkPlanImport(buildSeed(), parsed);
  assert.equal(state.objectives.filter(item => item.year === '2027').length, 51);
  assert.equal(state.objectives.some(item => item.year === '2026'), true);
});
