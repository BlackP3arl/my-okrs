import assert from 'node:assert/strict';
import test from 'node:test';
import { divisionSelection, includesDivision, involvesDivision } from './model.js';

const objective = {
  divisionId: 'client-relations',
  supportingIds: ['public-relations'],
  initiatives: [{ divisionId: 'software-engineering' }],
};

test('an empty division selection keeps every objective', () => {
  assert.deepEqual(divisionSelection('all'), []);
  assert.deepEqual(divisionSelection([]), []);
  assert.equal(involvesDivision(objective, 'all', 'any'), true);
  assert.equal(involvesDivision(objective, [], 'responsible'), true);
});

test('a department filter matches any selected division', () => {
  assert.equal(includesDivision('client-relations', []), true);
  assert.equal(includesDivision('client-relations', 'all'), true);
  assert.equal(includesDivision('client-relations', ['client-relations', 'public-relations']), true);
  assert.equal(includesDivision('finance', ['client-relations', 'public-relations']), false);
});

test('several divisions match when any selected division is involved', () => {
  assert.equal(involvesDivision(objective, ['client-relations', 'finance'], 'responsible'), true);
  assert.equal(involvesDivision(objective, ['finance', 'legal-affairs'], 'responsible'), false);
  assert.equal(involvesDivision(objective, ['public-relations', 'finance'], 'supporting'), true);
  assert.equal(involvesDivision(objective, ['software-engineering', 'finance'], 'executing'), true);
  assert.equal(involvesDivision(objective, ['public-relations', 'finance'], 'any'), true);
  assert.equal(involvesDivision(objective, 'client-relations', 'responsible'), true);
});
