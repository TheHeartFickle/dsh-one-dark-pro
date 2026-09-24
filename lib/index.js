// dsh-one-dark-pro — host 半边。
// 通过本插件自己的 Loader row 持久化 One Dark Pro 选择（dsh 0.1.7 起 settings
// 以 profile entry 为命名空间、以 profile patch 为存储），并暴露
// /api/one-dark-pro/preference 路由，供 client 读写。
// settings 服务可选：缺失时 api 保持 null，路由返回 503，client 回退内置偏好。
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import z from '@deepseek-ai/schemastery'

/** 本插件的 npm 包名，与其 Loader row 声明的 name 一致。 */
const PACKAGE_NAME = '@the-heart-fickle/dsh-one-dark-pro'
/** 退役的 settings.yaml 中文档段键：它是包名，而 settings 表单的 ns 是 entry id。 */
const LEGACY_SECTION = 'dsh-one-dark-pro'
const LEGACY_FILE = 'settings.yaml'
const ALLOWED = ['one-dark-pro', 'system']
const MAX_BODY_BYTES = 1 << 20

// settings 表单的来源 schema。字段必须声明 volatile：只有宿主构件的
// schemastery 会把 meta.volatile 字段在解析 config 时包成 cosmokit Volatile
// 引用，loader 的 volatile-commit 路径才能提交 live 写入（用公共 schemastery
// 包构建的 schema 会静默丢弃写入）。
export const Config = z.object({
  preference: z.union([z.const('one-dark-pro'), z.const('system')]).default('system').volatile(),
})

const inject = ['webServer']

// 有界读取 JSON 请求体(参考 better-sidebar 的 readJsonBody):用流式 async 迭代
// 而非 req.on('data') —— 客户端中途断开时请求流会 emit 'error',无监听会打到
// 宿主进程;同时用字节上限防止无界缓冲。返回 { ok:true, value } 或 { ok:false, error }。
async function readJsonBody(req) {
  const chunks = []
  let total = 0
  try {
    for await (const chunk of req) {
      const buf = Buffer.from(chunk)
      total += buf.length
      if (total > MAX_BODY_BYTES) return { ok: false, error: 'request-body-too-large' }
      chunks.push(buf)
    }
  } catch (err) {
    return { ok: false, error: 'request-body-read-failed' }
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (text.trim() === '') return { ok: true, value: {} }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (err) {
    return { ok: false, error: 'invalid-json' }
  }
}

/**
 * 本插件 Loader row 的 entry id（即 settings 表单的命名空间）。
 * entry id 是挂载选择而不是包属性（bundle 里写包名、patch 里按 id 覆盖），
 * 故按包名 + fiber 身份定位，同名的启用行作为 fiber 挂上前的回退。
 */
function ownEntryId(ctx) {
  let fallback
  try {
    for (const entry of ctx.loader.entries()) {
      const id = entry.options.id
      if (entry.options.name !== PACKAGE_NAME || typeof id !== 'string' || id === '') continue
      if (entry.fiber === ctx.fiber) return id
      if (entry.disabled !== true && fallback === undefined) fallback = id
    }
  } catch {
    return undefined
  }
  return fallback
}

/**
 * 从退役的 settings.yaml 文本中取本插件段里的 preference。
 * 只读取 `dsh-one-dark-pro:` 段下 2 空格缩进的 scalar `preference:`（settings
 * 服务写出的固定形状），故用最小行解析而不引入 YAML 依赖。返回段内合法的偏好，或 undefined。
 */
export function parseLegacyPreference(text) {
  let inSection = false
  for (const line of text.split(/\r?\n/)) {
    if (/^\S/.test(line)) {
      inSection = line.trim() === `${LEGACY_SECTION}:`
      continue
    }
    if (!inSection) continue
    const match = /^ {2}preference:\s*(\S+)\s*$/.exec(line)
    if (match !== null) return ALLOWED.indexOf(match[1]) === -1 ? undefined : match[1]
  }
  return undefined
}

/** 读取退役 settings.yaml 里本插件的偏好（沿用 settings 服务的先 .imported 后原文件的顺序）。 */
async function readLegacyPreference(home) {
  for (const name of [`${LEGACY_FILE}.imported`, LEGACY_FILE]) {
    let text
    try {
      text = await readFile(join(home, name), 'utf8')
    } catch {
      continue
    }
    const preference = parseLegacyPreference(text)
    if (preference !== undefined) return preference
  }
  return undefined
}

/**
 * 一次性导入 0.1.7 之前经 settings.yaml 持久化的偏好。
 * dsh 0.1.7 的自动迁移按段键（包名）找同名 entry，而本插件的 entry id 是
 * `one-dark-pro`，故该段被留在 .imported 文件里；不做这一步，升级后偏好静默
 * 回到 system。仅在该 row 的用户层仍为空时导入，绝不覆盖升级后写入的值。
 */
async function importLegacyPreference(ctx, settings, ns) {
  const home = ctx.profileContext?.home
  if (home === undefined) return 'no-profile-home'
  const row = settings.describe().find((candidate) => candidate.ns === ns)
  if (row === undefined) return 'no-form'
  const user = row.user
  if (user !== null && typeof user === 'object' && Object.keys(user).length > 0) return 'already-configured'
  const preference = await readLegacyPreference(home)
  if (preference === undefined) return 'no-legacy-section'
  await settings.update(ns, { preference })
  return 'imported'
}

function apply(ctx) {
  let api = null
  ctx.inject(['settings'], (sctx) => {
    const ns = ownEntryId(ctx)
    if (ns === undefined) {
      ctx.logger?.warn?.('dsh-one-dark-pro: no loader row for this package; preference stays at defaults')
      return
    }
    const read = () => {
      const descriptor = sctx.settings.describe({ redactSecrets: true }).find(c => c.ns === ns)
      const p = descriptor && descriptor.value ? descriptor.value.preference : 'system'
      return ALLOWED.indexOf(p) === -1 ? 'system' : p
    }
    const update = async (preference) => {
      await sctx.settings.update(ns, { preference })
      return read()
    }
    api = { read, update }
    // settings 服务是可选的；当它的注入 fiber 卸载/重载时，恢复“服务不可用”语义。
    sctx.effect(() => () => { api = null })
    Promise.resolve(ctx.loader?.await?.()).then(() => importLegacyPreference(ctx, sctx.settings, ns)).then((outcome) => {
      if (outcome === 'imported') ctx.logger.info('dsh-one-dark-pro: imported legacy preference from %s', LEGACY_FILE)
    }).catch((error) => {
      ctx.logger?.warn?.('dsh-one-dark-pro: legacy preference import was rejected')
      ctx.logger?.warn?.(error)
    })
  })

  // 路由必须绑定到 fiber：webServer.register 返回的 disposer 需交给 ctx.effect，
  // 否则宿主半边 stop/update 时前缀路由泄漏，重载 apply 会因重复注册而崩溃。
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: '/api/one-dark-pro',
    handler: (req, res) => {
      const url = new URL(req.url ?? '/', 'http://x')
      const sub = url.pathname.replace(/^\/api\/one-dark-pro\/?/, '').replace(/\/$/, '')
      const write = (status, body) => {
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(body))
      }
      if (api === null) { write(503, { ok: false, error: 'settings-unavailable' }); return }
      if (req.method === 'GET' && sub === 'preference') {
        try {
          write(200, { ok: true, preference: api.read() })
        } catch (e) {
          write(500, { ok: false, error: String(e && e.message || e) })
        }
        return
      }
      if (req.method === 'POST' && sub === 'preference') {
        return readJsonBody(req).then(({ ok: bodyOk, value, error: bodyError }) => {
          if (!bodyOk) { write(400, { ok: false, error: bodyError }); return }
          const parsed = value
          if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            write(400, { ok: false, error: 'invalid-preference' })
            return
          }
          const preference = typeof parsed.preference === 'string' ? parsed.preference : 'system'
          if (ALLOWED.indexOf(preference) === -1) { write(400, { ok: false, error: 'invalid-preference' }); return }
          return api.update(preference).then(p => write(200, { ok: true, preference: p })).catch(e => write(500, { ok: false, error: String(e && e.message || e) }))
        })
      }
      write(404, { ok: false, error: 'unknown-endpoint' })
    }
  }))
}

export { apply, inject }
