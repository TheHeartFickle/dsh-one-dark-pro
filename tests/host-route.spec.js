/**
 * Host-side route tests for the dsh-one-dark-pro preference endpoint.
 *
 * Imports the REAL lib/index.js `apply()` and drives it against a fabricated
 * `ctx` (mirroring better-sidebar's sidechat-routes.spec.ts approach): the
 * settings seam is a captured callback, `webServer.register` captures the
 * route handler, and `effect` runs each effect synchronously to settle calls.
 *
 * Covers the contract the client relies on:
 *   GET  /api/one-dark-pro/preference  → the persisted preference
 *   POST /api/one-dark-pro/preference  → validate + persist + return
 *   invalid preference                 → 400
 *   malformed body                     → 400
 *   oversized body                     → 400 (MAX_BODY_BYTES guard)
 *   settings service absent            → 503
 *   unknown endpoint                   → 404
 *   read() fallback when value invalid → 'system'
 *   read() fallback when ns unregistered → 'system'
 *   empty body defaults to system      → 200 'system'
 */
import { describe, expect, it, vi } from 'vitest'
import { apply, inject } from '../lib/index.js'

/** A fabricated context the real `apply()` consumes. */
function fakeCtx() {
  const settingsCallback = { current: null }
  const route = { current: null }
  const disposers = []
  const settingsDisposers = []
  const effectOnSettings = (fn) => {
    const dispose = fn()
    if (typeof dispose === 'function') settingsDisposers.push(dispose)
    return dispose
  }
  const ctx = {
    inject(services, cb) {
      expect(services).toEqual(['settings'])
      settingsCallback.current = (env) => cb({ ...env, effect: effectOnSettings })
    },
    effect(fn) {
      const dispose = fn()
      disposers.push(dispose)
      return dispose
    },
    webServer: {
      register(reg) {
        expect(reg.kind).toBe('prefix')
        expect(reg.path).toBe('/api/one-dark-pro')
        route.current = reg.handler
        return () => {}
      },
    },
  }
  return { ctx, settingsCallback, route, disposers, settingsDisposers }
}

/** An async-iterable fake request the readJsonBody helper consumes. */
function fakeReq({ method, url, body = '' }) {
  return {
    method,
    url,
    async *[Symbol.asyncIterator]() {
      if (body !== '') yield body
    },
  }
}

/** A fake response that captures the status and JSON body. */
function fakeRes() {
  const out = { status: null, headers: null, body: null }
  out.writeHead = (status, headers) => { out.status = status; out.headers = headers }
  out.end = (body) => { out.body = body }
  return out
}

/** Call the registered route handler with fabricated req/res; await completion. */
async function callHandler(handler, req, res) {
  await handler(req, res)
}

/** A stub settings service the captured inject callback writes to. */
function settingsStub(initial, { missingNs = false } = {}) {
  let preference = initial
  return {
    register: vi.fn(),
    describe: vi.fn(({ redactSecrets } = {}) => {
      expect(redactSecrets).toBe(true)
      // missingNs simulates an unregistered namespace (describe has no row).
      if (missingNs) return []
      return [{ ns: 'dsh-one-dark-pro', value: { preference } }]
    }),
    update: vi.fn(async (_ns, patch) => {
      preference = patch.preference
      return { preference }
    }),
    get preference() { return preference },
  }
}

describe('dsh-one-dark-pro host route', () => {
  it('declares the webServer inject dependency', () => {
    expect(inject).toEqual(['webServer'])
  })

  it('GET /preference returns the persisted preference', async () => {
    const { ctx, settingsCallback, route } = fakeCtx()
    apply(ctx)
    settingsCallback.current({ settings: settingsStub('one-dark-pro') })

    const res = fakeRes()
    await callHandler(route.current, fakeReq({ method: 'GET', url: '/api/one-dark-pro/preference' }), res)

    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, preference: 'one-dark-pro' })
  })

  it('POST /preference persists and returns the new value', async () => {
    const { ctx, settingsCallback, route } = fakeCtx()
    apply(ctx)
    const settings = settingsStub('system')
    settingsCallback.current({ settings })

    const res = fakeRes()
    await callHandler(route.current, fakeReq({
      method: 'POST',
      url: '/api/one-dark-pro/preference',
      body: JSON.stringify({ preference: 'one-dark-pro' }),
    }), res)

    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, preference: 'one-dark-pro' })
    expect(settings.update).toHaveBeenCalledWith('dsh-one-dark-pro', { preference: 'one-dark-pro' })
  })

  it('POST with an invalid preference rejects with 400 and never persists', async () => {
    const { ctx, settingsCallback, route } = fakeCtx()
    apply(ctx)
    const settings = settingsStub('system')
    settingsCallback.current({ settings })

    const res = fakeRes()
    await callHandler(route.current, fakeReq({
      method: 'POST',
      url: '/api/one-dark-pro/preference',
      body: JSON.stringify({ preference: 'blue' }),
    }), res)

    expect(res.status).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ ok: false, error: 'invalid-preference' })
    expect(settings.update).not.toHaveBeenCalled()
  })

  it('POST with a malformed body rejects with 400', async () => {
    const { ctx, settingsCallback, route } = fakeCtx()
    apply(ctx)
    settingsCallback.current({ settings: settingsStub('system') })

    const res = fakeRes()
    await callHandler(route.current, fakeReq({
      method: 'POST',
      url: '/api/one-dark-pro/preference',
      body: '{not json',
    }), res)

    expect(res.status).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ ok: false, error: 'invalid-json' })
  })

  it('POST with an empty body defaults to system', async () => {
    const { ctx, settingsCallback, route } = fakeCtx()
    apply(ctx)
    const settings = settingsStub('system')
    settingsCallback.current({ settings })

    const res = fakeRes()
    await callHandler(route.current, fakeReq({
      method: 'POST',
      url: '/api/one-dark-pro/preference',
      body: '',
    }), res)

    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, preference: 'system' })
  })

  it('returns 503 when the settings service never mounted', async () => {
    const { ctx, route } = fakeCtx()
    apply(ctx)
    // deliberately do NOT run settingsCallback

    const res = fakeRes()
    await callHandler(route.current, fakeReq({ method: 'GET', url: '/api/one-dark-pro/preference' }), res)

    expect(res.status).toBe(503)
    expect(JSON.parse(res.body)).toEqual({ ok: false, error: 'settings-unavailable' })
  })

  it('returns 404 for an unknown endpoint', async () => {
    const { ctx, settingsCallback, route } = fakeCtx()
    apply(ctx)
    settingsCallback.current({ settings: settingsStub('system') })

    const res = fakeRes()
    await callHandler(route.current, fakeReq({ method: 'GET', url: '/api/one-dark-pro/nope' }), res)

    expect(res.status).toBe(404)
    expect(JSON.parse(res.body)).toEqual({ ok: false, error: 'unknown-endpoint' })
  })

  it('read() falls back to system when the stored value is invalid', async () => {
    const { ctx, settingsCallback, route } = fakeCtx()
    apply(ctx)
    // A stored value outside ALLOWED (e.g. stale 'dark') must not leak through.
    settingsCallback.current({ settings: settingsStub('unexpected') })

    const res = fakeRes()
    await callHandler(route.current, fakeReq({ method: 'GET', url: '/api/one-dark-pro/preference' }), res)

    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, preference: 'system' })
  })

  it('read() falls back to system when the namespace is not registered', async () => {
    const { ctx, settingsCallback, route } = fakeCtx()
    apply(ctx)
    // describe() returns no row for this ns → info is undefined → 'system'.
    settingsCallback.current({ settings: settingsStub('one-dark-pro', { missingNs: true }) })

    const res = fakeRes()
    await callHandler(route.current, fakeReq({ method: 'GET', url: '/api/one-dark-pro/preference' }), res)

    expect(res.status).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, preference: 'system' })
  })

  it('POST rejects an oversized body with 400', async () => {
    const { ctx, settingsCallback, route } = fakeCtx()
    apply(ctx)
    const settings = settingsStub('system')
    settingsCallback.current({ settings })

    // 1 MiB + 1 byte exceeds MAX_BODY_BYTES (1 << 20). Build it lazily so the
    // test does not allocate a gigantic literal at parse time.
    const big = 'x'.repeat((1 << 20) + 1)
    const res = fakeRes()
    await callHandler(route.current, fakeReq({
      method: 'POST',
      url: '/api/one-dark-pro/preference',
      body: big,
    }), res)

    expect(res.status).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ ok: false, error: 'request-body-too-large' })
    expect(settings.update).not.toHaveBeenCalled()
  })

  it('POST with a non-object JSON body rejects with 400', async () => {
    const { ctx, settingsCallback, route } = fakeCtx()
    apply(ctx)
    const settings = settingsStub('system')
    settingsCallback.current({ settings })

    const res = fakeRes()
    await callHandler(route.current, fakeReq({
      method: 'POST',
      url: '/api/one-dark-pro/preference',
      body: JSON.stringify(null),
    }), res)

    expect(res.status).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ ok: false, error: 'invalid-preference' })
    expect(settings.update).not.toHaveBeenCalled()
  })

  it('GET returns a controlled 500 when reading settings throws', async () => {
    const { ctx, settingsCallback, route } = fakeCtx()
    apply(ctx)
    const settings = settingsStub('one-dark-pro')
    settings.describe.mockImplementation(() => { throw new Error('settings-broken') })
    settingsCallback.current({ settings })

    const res = fakeRes()
    await callHandler(route.current, fakeReq({ method: 'GET', url: '/api/one-dark-pro/preference' }), res)

    expect(res.status).toBe(500)
    expect(JSON.parse(res.body)).toEqual({ ok: false, error: 'settings-broken' })
  })

  it('returns 503 after the settings inject fiber is disposed', async () => {
    const { ctx, settingsCallback, route, settingsDisposers } = fakeCtx()
    apply(ctx)
    settingsCallback.current({ settings: settingsStub('one-dark-pro') })

    // Simulate the optional settings service being unmounted/reloaded.
    for (const dispose of settingsDisposers) dispose()

    const res = fakeRes()
    await callHandler(route.current, fakeReq({ method: 'GET', url: '/api/one-dark-pro/preference' }), res)

    expect(res.status).toBe(503)
    expect(JSON.parse(res.body)).toEqual({ ok: false, error: 'settings-unavailable' })
  })
})
