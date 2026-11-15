'use client';
// Package comparison: which packages the visitor ticked «قارن» on.
// Only the package ids are kept (localStorage key "qs-compare"), so the
// compared data is always read fresh from the packages list.
import { useSyncExternalStore } from 'react';

export const COMPARE_KEY = 'qs-compare';
export const COMPARE_MAX = 3;

const EMPTY = [];
let ids = EMPTY;
let loaded = false;
const subs = new Set();
const fullSubs = new Set();

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
    if (!Array.isArray(raw)) return EMPTY;
    const out = [...new Set(raw.map((x) => String(x)).filter(Boolean))].slice(0, COMPARE_MAX);
    return out.length ? out : EMPTY;
  } catch {
    return EMPTY;
  }
}

function commit(next) {
  ids = next.length ? next : EMPTY;
  try { localStorage.setItem(COMPARE_KEY, JSON.stringify(ids)); } catch { /* private mode: keep it in memory */ }
  subs.forEach((fn) => fn());
}

function snapshot() {
  if (!loaded && typeof window !== 'undefined') {
    loaded = true;
    ids = read();
    // Another tab changed the selection.
    window.addEventListener('storage', (e) => {
      if (e.key !== COMPARE_KEY) return;
      ids = read();
      subs.forEach((fn) => fn());
    });
  }
  return ids;
}

function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

/** The selected package ids (strings), in the order they were picked. */
export function useCompareIds() {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/** Adds or removes a package. Returns 'added', 'removed' or 'full'. */
export function toggleCompare(id) {
  const key = String(id);
  const cur = snapshot();
  if (cur.includes(key)) { commit(cur.filter((x) => x !== key)); return 'removed'; }
  if (cur.length >= COMPARE_MAX) { fullSubs.forEach((fn) => fn()); return 'full'; }
  commit([...cur, key]);
  return 'added';
}

export function removeCompare(id) {
  const key = String(id);
  const cur = snapshot();
  if (cur.includes(key)) commit(cur.filter((x) => x !== key));
}

export function clearCompare() {
  if (snapshot().length) commit([]);
}

/** Drops ids of packages that are no longer offered. */
export function pruneCompare(validIds) {
  const ok = new Set((validIds || []).map((x) => String(x)));
  const cur = snapshot();
  const next = cur.filter((x) => ok.has(x));
  if (next.length !== cur.length) commit(next);
}

/** Called when a visitor tries to add a 4th package. */
export function onCompareFull(fn) {
  fullSubs.add(fn);
  return () => fullSubs.delete(fn);
}
