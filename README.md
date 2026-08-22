# dsh-one-dark-pro

DSH（DeepSeek Harness）主题插件：注册 **One Dark Pro** 配色，并把「外观」设置里的主题选择扩成 **浅色 / 深色 / 跟随系统 / One Dark Pro** 四宫格。

配色参考 VSCode 主题 [`zhuangtongfa.material-theme`](https://github.com/Binaryify/OneDark-Pro)（One Dark Pro），映射到 DSH 的 `--dsw-alias-*` / `--dsw-specific-*` 令牌层。

## 安装到 profile

在该插件仓库安装依赖：

```bash
pnpm install
```

然后在 DSH profile 的 `package.json` 中加入依赖（`link:` 指向本插件绝对路径），并把它加入 `dsh.profile.bundles`：

```json
{
  "dependencies": {
    "@the-heart-fickle/dsh-one-dark-pro": "link:<本插件绝对路径>"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "...",
        "@the-heart-fickle/dsh-one-dark-pro"
      ]
    }
  }
}
```

`pnpm install` 后重启 `dsh web`（本插件 host 半边有代码，需重启 host；仅 client 半边改动时硬刷新浏览器即可）。

说明：加入了 `dsh.profile.bundles` 后，插件的 `cordis.patch.yml`（`dsh.bundle.patch`）会自动应用，**无需**再在 profile 的 `cordis.patch.yml` 手动加挂载行。

## 使用

打开 **设置 → 常规 → 外观**，点选「One Dark Pro」应用；随时点 **浅色 / 深色 / 跟随系统** 切回。

选中 One Dark Pro 后，该选择会持久化到 DSH host 的 `~/.dsh/settings.yaml` 的 `dsh-one-dark-pro.preference`，重启后保持。

## 说明

- host 半边（`lib/index.js`）：注册 `dsh-one-dark-pro` settings 命名空间，并暴露 `/api/one-dark-pro/preference` 路由（DSH 的 settings RPC 只对白名单命名空间开放，第三方命名空间须走插件自有路由）。
- client 半边（`lib/client.js`）：注册 One Dark Pro 主题，并用 `priority: -1` shadow 自带的 `settings.general.item[appearance]` 行，渲染为 四宫格（固定尺寸、选中态用品牌色边框）。选中态来源 `theme.getTheme().preference`，并监听 `theme/change` 刷新。
- One Dark Pro 图标取自官方 `icon.svg` 的原子几何：三条 3D 轨道带路径 + 实心原子核圆点（24px）。

## License

MIT
