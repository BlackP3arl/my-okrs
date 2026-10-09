import assert from 'node:assert/strict';
import test from 'node:test';
import { read, utils, write } from 'xlsx';
import { objectiveReportRows } from './exportPlan.js';
import { togglePlannedQuarter } from './model.js';

const objective = {
  code: '1.1.c',
  title: 'Serve members',
  year: '2027',
  progress: 40.4,
  pillar: { name: 'Community and Member-Centric Service' },
  goal: { code: '1.1', title: 'Service quality' },
  division: { name: 'Client Relations' },
  keyResults: [
    { title: 'Raise satisfaction', progress: 50 },
    { title: 'Cut waiting time', progress: 30.2 },
  ],
  initiatives: [
    { title: 'Conduct research', progress: 10.6, division: { name: 'Public Relations' }, plannedQuarters: ['Q1', 'Q3'] },
    { title: 'Publish findings', progress: 0, division: { name: 'Client Relations' }, plannedQuarters: [] },
  ],
};

test('the filtered report lists each initiative with key results and completion', () => {
  const rows = objectiveReportRows([objective, {
    code: '1.2.c',
    title: 'No projects yet',
    year: '2027',
    progress: 0,
    pillar: { name: 'Community and Member-Centric Service' },
    goal: { code: '1.2', title: 'Awareness' },
    division: { name: 'Public Relations' },
    keyResults: [{ title: 'Reach members', progress: 0 }],
    initiatives: [],
  }]);
  const header = rows[0];
  const research = rows[1];
  const publish = rows[2];
  const empty = rows[3];
  assert.equal(rows.length, 4);
  assert.equal(research[header.indexOf('Objective code')], '1.1.c');
  assert.equal(research[header.indexOf('Objective completion %')], 40);
  assert.equal(research[header.indexOf('KR1')], 'Raise satisfaction');
  assert.equal(research[header.indexOf('KR1 completion %')], 50);
  assert.equal(research[header.indexOf('KR2 completion %')], 30);
  assert.equal(research[header.indexOf('KR3')], '');
  assert.equal(research[header.indexOf('Team initiative')], 'Conduct research');
  assert.equal(research[header.indexOf('Executing division')], 'Public Relations');
  assert.equal(research[header.indexOf('Initiative completion %')], 11);
  assert.equal(research[header.indexOf('Planned Q1')], 'Yes');
  assert.equal(research[header.indexOf('Planned Q2')], '');
  assert.equal(research[header.indexOf('Planned Q3')], 'Yes');
  assert.equal(publish[header.indexOf('Team initiative')], 'Publish findings');
  assert.equal(publish[header.indexOf('KR1')], 'Raise satisfaction');
  assert.equal(empty[header.indexOf('Team initiative')], '');
  assert.equal(empty[header.indexOf('Objective code')], '1.2.c');

  const book = utils.book_new();
  utils.book_append_sheet(book, utils.aoa_to_sheet(rows), 'Objectives');
  const written = read(write(book, { bookType: 'xlsx', type: 'buffer' }));
  const sheet = utils.sheet_to_json(written.Sheets.Objectives);
  assert.equal(sheet[0]['Planned Q1'], 'Yes');
  assert.equal(sheet[0]['Planned Q3'], 'Yes');
  assert.equal(sheet[0]['Initiative completion %'], 11);
  assert.equal(sheet.length, 3);
});

test('a team initiative can be planned in more than one quarter', () => {
  assert.deepEqual(togglePlannedQuarter([], 'Q2'), ['Q2']);
  assert.deepEqual(togglePlannedQuarter(['Q2'], 'Q4'), ['Q2', 'Q4']);
  assert.deepEqual(togglePlannedQuarter(['Q1', 'Q4'], 'Q1'), ['Q4']);
  assert.deepEqual(togglePlannedQuarter(['Q4', 'Q1'], 'Q2'), ['Q1', 'Q2', 'Q4']);
});
