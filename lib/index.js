// dsh-one-dark-pro — host 半边。
// 注册 dsh-one-dark-pro settings 命名空间（One Dark Pro 选择），并暴露
// /api/one-dark-pro/preference 路由，供 client 读写。
// DSH 的 settings RPC 只对白名单命名空间开放，故第三方命名空间必须走插件自有路由
// （settings 服务可选：缺失时 api 保持 null，路由返回 503，client 回退内置偏好）。
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'

const NS = settingsNamespace('dsh-one-dark-pro')
const ALLOWED = ['one-dark-pro', 'system']
const PREF_SCHEMA = z.object({ preference: z.any().default('system') })
const inject = ['webServer']
const MAX_BODY_BYTES = 1 << 20

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

function apply(ctx) {
  let api = null
  ctx.inject(['settings'], (sctx) => {
    sctx.settings.register(NS, PREF_SCHEMA)
    const read = () => {
      const info = sctx.settings.describe({ redactSecrets: true }).find(c => c.ns === NS)
      const p = info && info.value ? info.value.preference : 'system'
      return ALLOWED.indexOf(p) === -1 ? 'system' : p
    }
    const update = async (preference) => {
      await sctx.settings.update(NS, { preference })
      return read()
    }
    api = { read, update }
    // settings 服务是可选的；当它的注入 fiber 卸载/重载时，恢复“服务不可用”语义。
    sctx.effect(() => () => { api = null })
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
