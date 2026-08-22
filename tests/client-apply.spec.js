// @vitest-environment jsdom
/**
 * Client-side regression tests for the One Dark Pro plugin.
 *
 * Loads the REAL lib/client.js bundle factory (the same `window.__ModuleLoader__`
 * contract DSH uses) and drives `apply(ctx)` against a fabricated theme/slots
 * face, so the two regression-prone behaviors are locked at the contract level:
 *   1. the theme registers with the One Dark Pro interactive-hover token that
 *      keeps the conversation-folding bar visible (regression #fold-bar);
 *   2. the appearance cube row shadows the builtin row via `priority:-1`
 *      so it is the single, durable 4-cube surface (regression #appearance).
 *
 * The restore path (fetch GET → setTheme) is exercised against a stubbed fetch.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createElement } from 'react'
import { act } from 'react-dom/test-utils'
import { createRoot } from 'react-dom/client'

// Tell React 18 that act() is in use so it doesn't warn about the testing env.
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// Capture the bundle descriptor DSH's ModuleLoader would consume.
let loaded = null
globalThis.window.__ModuleLoader__ = {
  load(descriptor) {
    loaded = descriptor
  },
}

// ---- load the real client bundle (runs window.__ModuleLoader__.load) ----
await import('../lib/client.js')

import { createRequire } from 'node:module'
const nodeRequire = createRequire(import.meta.url)

const factory = loaded.factory
const React = nodeRequire('react')
const mod = factory((name) => {
  if (name === 'react') return React
  throw new Error(`unexpected require("${name}")`)
})

/** A fabricated theme service the apply() path reads/writes. */
function fakeTheme(initialPreference = 'system') {
  let preference = initialPreference
  const registered = []
  const setCalls = []
  const theme = {
    register(def) {
      registered.push(def)
      return () => {}
    },
    getTheme() { return { preference, active: { id: preference }, themes: [], revision: 1 } },
    setTheme(id) { setCalls.push(id); preference = id },
    __getRegistered: () => registered,
    __getSetCalls: () => setCalls,
  }
  return theme
}

/** A fabricated slots face capturing the inject/register calls. */
function fakeSlots() {
  const injected = []
  const registered = []
  const slots = {
    inject(key, cb) {
      injected.push(key)
      // run the callback once (the real runtime does so after declaration);
      // the callback returns the register disposer — do not conflate it with
      // the record, which register() pushes separately.
      cb()
      return () => {}
    },
    register(spec, component) {
      const record = { spec, component }
      registered.push(record)
      return () => {}
    },
    __getInjected: () => injected,
    __getRegistered: () => registered,
  }
  return slots
}

/** A fabricated ctx with the effect/on surface the apply() path touches. */
function fakeCtx(theme, slots) {
  const effects = []
  const listeners = new Map()
  const ctx = {
    get(key) {
      if (key === 'theme') return theme
      if (key === 'slots') return slots
      return undefined
    },
    effect(fn) {
      const dispose = fn()
      if (typeof dispose === 'function') effects.push(dispose)
      return dispose
    },
    on(name, fn) {
      const group = listeners.get(name) ?? []
      group.push(fn)
      listeners.set(name, group)
      return () => {
        const current = listeners.get(name)
        if (current === undefined) return
        const index = current.indexOf(fn)
        if (index !== -1) current.splice(index, 1)
      }
    },
  }
  const emit = (name, payload) => {
    for (const fn of [...(listeners.get(name) ?? [])]) fn(payload)
  }
  return { ctx, effects, emit }
}

describe('dsh-one-dark-pro client apply()', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('registers the One Dark Pro theme with the correct dark tokens', () => {
    const theme = fakeTheme()
    const slots = fakeSlots()
    const { ctx } = fakeCtx(theme, slots)

    mod.apply(ctx)

    const registered = theme.__getRegistered()
    expect(registered).toHaveLength(1)
    const def = registered[0]
    expect(def.id).toBe('one-dark-pro')
    expect(def.colorScheme).toBe('dark')
    // The fold-bar fix: the interactive-hover-solid token must be a clear
    // lighter layer, not the near-base value that made the bar disappear.
    expect(def.tokens['--dsw-alias-interactive-bg-hover-solid']).toBe('#3e4451')
    // Brand color for the selected-cube border.
    expect(def.tokens['--dsw-alias-brand-primary']).toBe('#61afef')
  })

  it('shadows the builtin appearance row with priority:-1', () => {
    const theme = fakeTheme()
    const slots = fakeSlots()
    const { ctx } = fakeCtx(theme, slots)

    mod.apply(ctx)

    expect(slots.__getInjected()).toContain('settings.general.item')
    const records = slots.__getRegistered()
    // The injected callback returns the register result; the 4-cube surface.
    const appearance = records.find(r => r.spec && r.spec.id === 'appearance')
    expect(appearance).toBeDefined()
    expect(appearance.spec.order).toBe(10)
    expect(appearance.spec.priority).toBe(-1)
  })

  it('restores One Dark Pro from the persisted preference on load', async () => {
    const theme = fakeTheme('system')
    const slots = fakeSlots()
    const { ctx } = fakeCtx(theme, slots)

    globalThis.fetch.mockResolvedValue({
      json: async () => ({ ok: true, preference: 'one-dark-pro' }),
    })
    mod.apply(ctx)

    // let the restore microtask settle
    await new Promise(r => setTimeout(r, 0))
    expect(theme.__getSetCalls()).toContain('one-dark-pro')
  })

  it('does NOT restore One Dark Pro when the persisted preference is system', async () => {
    const theme = fakeTheme('system')
    const slots = fakeSlots()
    const { ctx } = fakeCtx(theme, slots)

    globalThis.fetch.mockResolvedValue({
      json: async () => ({ ok: true, preference: 'system' }),
    })
    mod.apply(ctx)

    await new Promise(r => setTimeout(r, 0))
    expect(theme.__getSetCalls()).toEqual([])
  })

  it('a late restore does not override the user’s own later choice (userChose guard)', async () => {
    const theme = fakeTheme('system')
    const slots = fakeSlots()
    const { ctx } = fakeCtx(theme, slots)

    // The restore GET resolves LATE (after the user has already clicked a cube).
    let resolveRestore
    globalThis.fetch.mockImplementation((url, init) => {
      if (url === '/api/one-dark-pro/preference' && (!init || !init.method)) {
        // The initial restore GET: deferred so the user's click can happen first.
        return new Promise(resolve => { resolveRestore = resolve })
      }
      return Promise.resolve({ ok: true })
    })
    mod.apply(ctx)

    // User clicks "深色" — a built-in preference (persists as 'system').
    const appearance = slots.__getRegistered().find(r => r.spec && r.spec.id === 'appearance')
    const container = document.createElement('div')
    document.body.appendChild(container)
    let root
    await act(async () => {
      root = createRoot(container)
      root.render(createElement(appearance.component))
      await new Promise(r => setTimeout(r, 0))
    })
    const darkButton = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent.includes('深色'))
    await act(async () => {
      darkButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(async () => {
      root.unmount()
    })

    // Now a LATE restore arrives claiming one-dark-pro. userChose is already
    // true, so it must NOT override the user's selection.
    resolveRestore({ json: async () => ({ ok: true, preference: 'one-dark-pro' }) })
    await new Promise(r => setTimeout(r, 0))

    expect(theme.__getSetCalls()).not.toContain('one-dark-pro')
  })

  it('a restore after fiber disposal is a no-op (disposed guard)', async () => {
    const theme = fakeTheme('system')
    const slots = fakeSlots()
    const { ctx, effects } = fakeCtx(theme, slots)

    let resolveRestore
    globalThis.fetch.mockImplementation((url) => {
      if (url === '/api/one-dark-pro/preference') {
        return new Promise(resolve => { resolveRestore = resolve })
      }
      return Promise.resolve({ ok: true })
    })
    mod.apply(ctx)

    // Simulate the fiber being torn down (DMR/update): run every ctx.effect
    // disposer. Cordis treats a non-function effect return as a no-op disposer.
    for (const dispose of effects) if (typeof dispose === 'function') dispose()

    // A late restore resolving after disposal must not setTheme.
    resolveRestore({ json: async () => ({ ok: true, preference: 'one-dark-pro' }) })
    await new Promise(r => setTimeout(r, 0))

    expect(theme.__getSetCalls()).toEqual([])
  })

  it('re-applies One Dark Pro after an unrelated settings write resets the built-in preference', async () => {
    const theme = fakeTheme('system')
    const slots = fakeSlots()
    const { ctx, emit } = fakeCtx(theme, slots)
    globalThis.fetch.mockResolvedValue({ ok: true })

    mod.apply(ctx)

    const appearance = slots.__getRegistered().find(r => r.spec && r.spec.id === 'appearance')
    expect(appearance).toBeDefined()

    // Select One Dark Pro through the four-cube surface.
    const container = document.createElement('div')
    document.body.appendChild(container)
    let root
    await act(async () => {
      root = createRoot(container)
      root.render(createElement(appearance.component))
      await new Promise(r => setTimeout(r, 0))
    })
    const proButton = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent.includes('One Dark Pro'))
    expect(proButton).toBeDefined()
    await act(async () => {
      proButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    // The theme service adopts the built-in namespace on any settings change;
    // because One Dark Pro is not a built-in preference it comes back as system.
    await act(async () => {
      emit('theme/change', { preference: 'system', active: { id: 'system' }, themes: [], revision: 2 })
    })

    // The plugin must restore the custom theme instead of letting the UI fall
    // back to 跟随系统.
    expect(theme.__getSetCalls().slice(-1)).toEqual(['one-dark-pro'])

    // The same protection applies when the last built-in preference was dark.
    await act(async () => {
      emit('theme/change', { preference: 'dark', active: { id: 'dark' }, themes: [], revision: 3 })
    })
    expect(theme.__getSetCalls().slice(-1)).toEqual(['one-dark-pro'])

    await act(async () => {
      root.unmount()
    })
  })

  it('does not re-apply One Dark Pro after the user explicitly chooses system', async () => {
    const theme = fakeTheme('system')
    const slots = fakeSlots()
    const { ctx, emit } = fakeCtx(theme, slots)
    globalThis.fetch.mockResolvedValue({ ok: true })

    mod.apply(ctx)

    const appearance = slots.__getRegistered().find(r => r.spec && r.spec.id === 'appearance')
    expect(appearance).toBeDefined()

    const container = document.createElement('div')
    document.body.appendChild(container)
    let root
    await act(async () => {
      root = createRoot(container)
      root.render(createElement(appearance.component))
      await new Promise(r => setTimeout(r, 0))
    })
    const systemButton = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent.includes('跟随系统'))
    expect(systemButton).toBeDefined()
    await act(async () => {
      systemButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const before = theme.__getSetCalls().length
    await act(async () => {
      emit('theme/change', { preference: 'system', active: { id: 'system' }, themes: [], revision: 3 })
    })
    expect(theme.__getSetCalls().length).toBe(before)

    await act(async () => {
      root.unmount()
    })
  })

  it('persists One Dark Pro to the route when its cube is clicked', async () => {
    const theme = fakeTheme('system')
    const slots = fakeSlots()
    const { ctx } = fakeCtx(theme, slots)
    globalThis.fetch.mockResolvedValue({ ok: true })

    mod.apply(ctx)

    const appearance = slots.__getRegistered().find(r => r.spec && r.spec.id === 'appearance')
    expect(appearance).toBeDefined()

    // Render the real Appearance component and click the One Dark Pro cube,
    // so the click → persistTheme POST path (not just registration) is proven.
    const container = document.createElement('div')
    document.body.appendChild(container)
    let root
    await act(async () => {
      root = createRoot(container)
      root.render(createElement(appearance.component))
      await new Promise(r => setTimeout(r, 0))
    })

    const clickable = Array.from(container.querySelectorAll('button'))
      .find(b => b.textContent.includes('One Dark Pro'))
    expect(clickable).toBeDefined()

    await act(async () => {
      clickable.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(async () => {
      root.unmount()
    })

    const postCall = globalThis.fetch.mock.calls
      .find(([url, init]) => url === '/api/one-dark-pro/preference' && init?.method === 'POST')
    expect(postCall).toBeDefined()
    expect(JSON.parse(postCall[1].body)).toEqual({ preference: 'one-dark-pro' })
    // The theme also switched through the real setTheme.
    expect(theme.__getSetCalls()).toContain('one-dark-pro')
  })

  it('declares theme and slots as client inject dependencies', () => {
    expect(mod.inject).toEqual(['theme', 'slots'])
  })
})
