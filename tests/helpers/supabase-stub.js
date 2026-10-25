
/**
 * Stub klien Supabase deterministik untuk unit test (Fase 4 roadmap).
 *
 * Meniru antarmuka query builder PostgREST yang dipakai codebase
 * (from/select/insert/update/eq/gt/not/is/single/maybeSingle + thenable)
 * TANPA jaringan. Hasil query diambil dari antrean FIFO: setiap `await`
 * builder, `single()`, atau `maybeSingle()` mengambil satu hasil dari
 * `enqueue()`. Bila antrean kosong, dijawab `{ data: null, error: null }`.
 *
 * Pemakaian:
 *   stub.enqueue({ data: { id: 'u1' } });           // hasil berikutnya
 *   await service();                                 // modul memakai stub
 *   expect(stub.last('update')?.patch).toEqual(...); // asersi panggilan
 */

export function createSupabaseStub() {
  const calls = [];
  const queue = [];

  const push = (entry) => calls.push(entry);

  const shiftResult = () => {
    const next = queue.shift();
    const result = next === undefined ? { data: null, error: null } : next;
    push({ op: 'await', result });
    return Promise.resolve(result);
  };

  const makeBuilder = () => {
    const builder = {
      select: (...args) => { push({ op: 'select', args }); return builder; },
      insert: (rows) => { push({ op: 'insert', rows: Array.isArray(rows) ? rows : [rows] }); return builder; },
      update: (patch) => { push({ op: 'update', patch }); return builder; },
      delete: () => { push({ op: 'delete' }); return builder; },
      eq: (...args) => { push({ op: 'eq', args }); return builder; },
      neq: (...args) => builder,
      not: (...args) => { push({ op: 'not', args }); return builder; },
      gt: (...args) => { push({ op: 'gt', args }); return builder; },
      gte: (...args) => builder,
      lt: (...args) => { push({ op: 'lt', args }); return builder; },
      lte: (...args) => builder,
      is: (...args) => { push({ op: 'is', args }); return builder; },
      in: (...args) => builder,
      order: (...args) => builder,
      limit: (...args) => builder,
      range: (...args) => builder,
      single: () => shiftResult(),
      maybeSingle: () => shiftResult(),
      then: (onFulfilled, onRejected) => shiftResult().then(onFulfilled, onRejected),
      catch: (onRejected) => shiftResult().catch(onRejected),
      finally: (onFinally) => shiftResult().finally(onFinally)
    };
    return builder;
  };

  return {
    client: {
      from: (table) => { push({ op: 'from', table }); return makeBuilder(); }
    },
    calls,
    queue,
    enqueue: (result) => queue.push(result),
    reset: () => { calls.length = 0; queue.length = 0; },
    ops: (op) => calls.filter((c) => c.op === op),
    last: (op) => [...calls].reverse().find((c) => c.op === op) || null
  };
}
