'use client';
import { useEffect, useMemo, useState } from 'react';

export type QuerySpec = { collection: string; filters?: Record<string, string>; order?: string; direction?: string; limit?: number; path?: string };
export type DocSpec = { collection: string; id: string; path?: string };
export const collection = (_db: unknown, name: string): QuerySpec => ({ collection: name, path: name });
export const query = (base: QuerySpec, ...parts: Partial<QuerySpec>[]): QuerySpec => parts.reduce<QuerySpec>((next, part) => ({
  ...next,
  ...part,
  collection: next.collection,
  path: next.path,
  filters: { ...next.filters, ...part.filters },
}), { ...base });
export const where = (field: string, _op: string, value: string): Partial<QuerySpec> => ({ filters: { [field]: value } });
export const orderBy = (field: string, direction = 'asc'): Partial<QuerySpec> => ({ order: field, direction });
export const limit = (count: number): Partial<QuerySpec> => ({ limit: count });
export const doc = (_db: unknown, collectionName: string, id: string): DocSpec => ({ collection: collectionName, id, path: `${collectionName}/${id}` });
export const useMemoData = <T,>(factory: () => T, deps: any[]) => useMemo(factory, deps);
export const useDatabase = () => useMemo(() => ({}), []);
export const useUser = () => { const [user, setUser] = useState<any>(null); const [loading, setLoading] = useState(true); useEffect(() => { fetch('/api/auth/me').then(r => r.json()).then(x => setUser(x.user ? { uid: x.user.id, ...x.user } : null)).finally(() => setLoading(false)); }, []); return { user, loading }; };
export function useCollection<T = any>(spec: QuerySpec | null) { const [data, setData] = useState<T[] | null>(null); const [loading, setLoading] = useState(true); useEffect(() => { if (!spec) { setLoading(false); return; } const params = new URLSearchParams(); if (spec.order) params.set('order', spec.order); if (spec.direction) params.set('direction', spec.direction); if (spec.limit) params.set('limit', String(spec.limit)); Object.entries(spec.filters || {}).forEach(([key, value]) => params.append(`filter.${key}`, value)); const queryString = params.toString(); fetch(`/api/data/${spec.collection}${queryString ? `?${queryString}` : ''}`).then(r => r.json()).then(x => setData(x.data || [])).finally(() => setLoading(false)); }, [spec]); return { data, loading, error: null }; }
export function useDoc<T = any>(spec: DocSpec | null) { const [data, setData] = useState<T | null>(null); const [loading, setLoading] = useState(true); useEffect(() => { if (!spec) { setLoading(false); return; } fetch(`/api/data/${spec.collection}/${spec.id}`).then(r => r.ok ? r.json() : null).then(x => setData(x?.data || null)).finally(() => setLoading(false)); }, [spec]); return { data, loading, error: null }; }
export const addDoc = async (spec: QuerySpec, data: any) => { const r = await fetch('/api/data/' + spec.collection, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) }); return r.json(); };
export const updateDoc = async (spec: DocSpec, data: any) => { await fetch(`/api/data/${spec.collection}/${spec.id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) }); };
export const setDoc = async (spec: DocSpec, data: any, _options?: any) => updateDoc(spec, data);
export const serverTimestamp = () => new Date().toISOString();
export const arrayUnion = (...values: any[]) => values;
export const errorEmitter = { emit: (..._args: any[]) => undefined };
export class DatabasePermissionError extends Error { constructor(options?: any) { super(options?.message || 'Database operation failed'); } }
