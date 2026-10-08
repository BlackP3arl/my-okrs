import { buildSeed, loadState, saveState, STORAGE_KEY } from './model.js';

let remote = false;
let saveTimer;

function isPlan(value) {
  return Boolean(
    value?.pillars?.length
    && value?.goals?.length
    && value?.objectives
    && value?.keyResults
    && Array.isArray(value.krMeans),
  );
}

export function planUsesDatabase() {
  return remote;
}

async function writePlan(plan) {
  const response = await fetch('/api/plan', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(plan),
    keepalive: true,
  });
  if (!response.ok) throw new Error('Could not save the strategy plan.');
}

export function loadPlan() {
  if (!import.meta.env.PROD) return Promise.resolve(loadState());
  return fetch('/api/plan', { headers: { accept: 'application/json' } })
    .then(async response => {
      const type = response.headers.get('content-type') || '';
      if (!response.ok || !type.includes('application/json')) return loadState();
      const body = await response.json();
      remote = true;
      if (isPlan(body.plan)) return body.plan;
      const seed = buildSeed();
      await writePlan(seed);
      return seed;
    })
    .catch(() => loadState());
}

let planPromise;
export function getPlanPromise() {
  if (!planPromise) planPromise = loadPlan();
  return planPromise;
}

export function persistPlan(state) {
  if (!remote) {
    saveState(state);
    return;
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    writePlan(state).catch(() => {});
  }, 400);
}

export async function resetPlan() {
  const seed = buildSeed();
  if (!remote) {
    localStorage.removeItem(STORAGE_KEY);
    return seed;
  }
  clearTimeout(saveTimer);
  await writePlan(seed);
  return seed;
}
