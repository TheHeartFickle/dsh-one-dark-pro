window.__ModuleLoader__.load({
	id: "@the-heart-fickle/dsh-one-dark-pro",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var React = require("react");

		// ---------- One Dark Pro 配色（映射到 DSH 的 --dsw-alias-* / --dsw-specific-* 令牌层） ----------
		var TOKENS = {
			'--dsw-alias-bg-base': '#282c34',
			'--dsw-alias-bg-layer-1': '#2c313c',
			'--dsw-alias-bg-layer-2': '#21252b',
			'--dsw-alias-bg-layer-3': '#1e2127',
			'--dsw-alias-bg-overlay': '#21252b',
			'--dsw-alias-bg-skeleton': '#2c313c',
			'--dsw-alias-bg-multi-select': '#1e2127',
			'--dsw-alias-bg-module-platform': '#2c313c',
			'--dsw-alias-border-l1': '#3e4451',
			'--dsw-alias-border-l2': '#4b5263',
			'--dsw-alias-border-l3': '#5c6370',
			'--dsw-alias-border-l2-darkmode-thin': '#3e4451',
			'--dsw-alias-border-inverted': '#3e4451',
			'--dsw-alias-border-inverted2': '#4b5263',
			'--dsw-alias-brand-primary': '#61afef',
			'--dsw-alias-brand-primary-new-colorprimary-new-color': '#61afef',
			'--dsw-alias-label-primary': '#abb2bf',
			'--dsw-alias-label-secondary': '#9da5b4',
			'--dsw-alias-label-tertiary': '#7f848e',
			'--dsw-alias-label-caption': '#5c6370',
			'--dsw-alias-label-dimmed': '#5c6370',
			'--dsw-alias-label-primary-dimmed': '#7f848e',
			'--dsw-alias-label-primary-bluish': '#c8ccd4',
			'--dsw-alias-state-business-primary': '#61afef',
			'--dsw-alias-state-business-tertiary': '#2c313c',
			'--dsw-alias-state-error-primary': '#e06c75',
			'--dsw-alias-state-error-secondary': '#e06c75',
			'--dsw-alias-state-success-primary': '#98c379',
			'--dsw-alias-state-success-secondary': '#98c379',
			'--dsw-alias-state-success-tertiary': '#26322c',
			'--dsw-alias-state-warn-primary': '#e5c07b',
			'--dsw-alias-state-warn-label': '#d19a66',
			'--dsw-alias-state-warn-secondary': '#d19a66',
			'--dsw-alias-state-warn-tertiary': '#3a3226',
			'--dsw-alias-interactive-bg-hover': '#2c313c',
			'--dsw-alias-interactive-bg-active': '#3e4451',
			'--dsw-alias-interactive-bg-hover-solid': '#3e4451',
			'--dsw-alias-markdown-code-block': '#21252b',
			'--dsw-alias-markdown-code-block-banner': '#1e2127',
			'--dsw-alias-markdown-inline-code': '#21252b',
			'--dsw-alias-markdown-tag': '#21252b',
			'--dsw-alias-markdown-placeholder': '#21252b',
			'--dsw-alias-markdown-citation': '#2c313c',
			'--dsw-alias-markdown-code-segment-selected': '#2c313c',
			'--dsw-alias-markdown-code-segment-unselected': '#21252b',
			'--dsw-alias-button-primary-fill': '#61afef',
			'--dsw-alias-button-primary-hover': '#7fc1f3',
			'--dsw-alias-button-primary-dimmed': '#3e4451',
			'--dsw-alias-button-info-fill': '#61afef',
			'--dsw-alias-button-info-hover': '#7fc1f3',
			'--dsw-alias-button-floating-fill': '#21252b',
			'--dsw-alias-button-floating-hover': '#2c313c',
			'--dsw-alias-button-ghost-active-fill': '#2c313c',
			'--dsw-alias-button-ghost-active-hover': '#3e4451',
			'--dsw-alias-button-ghost-active-border': '#3e4451',
			'--dsw-alias-button-elevated-fill': '#2c313c',
			'--dsw-alias-button-tool-bar-fill': '#3e4451',
			'--dsw-alias-button-tool-bar-hover': '#4b5263',
			'--dsw-alias-toast-bg': '#21252b',
			'--dsw-alias-tooltip-bg': '#21252b',
			'--dsw-alias-scrollbar-bg-l1': '#3e4451',
			'--dsw-alias-scrollbar-bg-l2': '#4b5263',
			'--dsw-alias-scrollbar-hover-l1': '#5c6370',
			'--dsw-alias-scrollbar-hover-l2': '#828997',
			'--dsw-specific-sidebar-fill': '#21252b',
			'--dsw-specific-sidebar-nav-item-active': '#2c313c',
			'--dsw-specific-sidebar-nav-item-hover': '#2c313c',
			'--dsw-specific-sidebar-nav-item-active-accent': '#61afef',
			'--dsw-specific-menu': '#1e2127',
			'--dsw-specific-selector': '#21252b',
			'--dsw-specific-tip': '#21252b',
			'--dsw-specific-bubble': '#21252b',
			'--dsw-specific-bubble-highlight': '#2c313c',
			'--dsw-specific-input-major': '#21252b',
			'--dsw-specific-login-input': '#21252b'
		};

		// ---------- 外观四宫格样式（复刻自带 AppearanceRow 卡片，固定尺寸不拉伸） ----------
		var CSS = [
			'.odp-app-group{border-bottom:1px solid var(--dsw-alias-border-l2);flex-direction:column;gap:8px;padding:16px 0;display:flex}',
			'.odp-app-title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}',
			'.odp-app-cubeRow{flex-wrap:wrap;align-items:stretch;gap:8px;display:flex}',
			'.odp-app-cube{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border-radius:16px;flex-direction:column;flex:0 0 180px;height:82px;justify-content:center;align-items:center;gap:4px;padding:0 32px;font-size:14px;line-height:22px;display:flex}',
			'.odp-app-cube:hover:not(.odp-app-selected){background:var(--dsw-alias-interactive-bg-hover)}',
			'.odp-app-selected{background:var(--dsw-alias-bg-module-platform);border-color:var(--dsw-alias-brand-primary)}',
			'.odp-app-icon{color:var(--dsw-alias-label-primary);display:inline-flex}'
		].join('');

		// ---------- 图标（线性风格；One Dark Pro 用官方原子几何） ----------
		function IconSun() {
			return React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' },
				React.createElement('circle', { cx: 8, cy: 8, r: 3 }),
				React.createElement('line', { x1: 8, y1: 1.5, x2: 8, y2: 3 }),
				React.createElement('line', { x1: 8, y1: 13, x2: 8, y2: 14.5 }),
				React.createElement('line', { x1: 1.5, y1: 8, x2: 3, y2: 8 }),
				React.createElement('line', { x1: 13, y1: 8, x2: 14.5, y2: 8 }),
				React.createElement('line', { x1: 3.4, y1: 3.4, x2: 4.4, y2: 4.4 }),
				React.createElement('line', { x1: 11.6, y1: 11.6, x2: 12.6, y2: 12.6 }),
				React.createElement('line', { x1: 3.4, y1: 12.6, x2: 4.4, y2: 11.6 }),
				React.createElement('line', { x1: 11.6, y1: 4.4, x2: 12.6, y2: 3.4 })
			);
		}
		function IconMoon() {
			return React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' },
				React.createElement('path', { d: 'M10.5 2.6a5.3 5.3 0 1 0 2.9 9.3 4.7 4.7 0 0 1-2.9-9.3Z' })
			);
		}
		function IconSystem() {
			return React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' },
				React.createElement('rect', { x: 2, y: 3, width: 12, height: 8, rx: 1.4 }),
				React.createElement('line', { x1: 8, y1: 11, x2: 8, y2: 13.2 }),
				React.createElement('line', { x1: 5.5, y1: 13.2, x2: 10.5, y2: 13.2 })
			);
		}
		// One Dark Pro 官方原子：三条 3D 轨道带路径 + 实心原子核圆点（取自 icon.svg，24px）。
		function IconPro() {
			return React.createElement('svg', { width: 24, height: 24, viewBox: '0 0 512 512', fill: 'none' },
				React.createElement('path', { d: 'M165 170c4 32 16 72 38 113 21 42 46 76 70 97 12 11 24 18 34 22s18 3 24 0c5-3 10-9 13-18 3-10 3-23 2-38-3-31-14-69-34-109a6 6 0 0111-5c20 41 32 81 35 113 1 16 1 30-3 42-3 11-9 21-19 26s-22 4-34 0c-11-4-24-13-37-24-25-23-51-58-73-100s-35-84-39-118c-2-17-1-32 2-44s9-22 20-27c9-6 21-5 33-1 11 5 24 13 36 24a6 6 0 01-8 9c-11-11-23-18-32-21-10-4-18-4-24-1s-11 10-13 20c-3 10-4 24-2 40z', fill: 'currentColor', fillRule: 'evenodd' }),
				React.createElement('path', { d: 'M100 268c6 7 16 14 29 20a6 6 0 01-5 11c-14-7-25-14-33-23-8-8-12-18-12-29 1-11 7-21 17-29s23-14 39-20c33-10 76-15 124-13 47 2 90 12 121 26 16 7 29 15 38 23 8 9 14 20 13 31 0 10-6 20-14 27-9 8-20 14-34 19a6 6 0 11-5-11c14-5 24-10 31-17 7-6 10-12 10-19 1-6-2-14-10-21-7-8-19-15-34-21-29-13-70-23-117-25-46-2-88 3-119 13-15 5-27 11-35 18-9 6-12 13-13 20 0 6 3 13 9 20z', fill: 'currentColor', fillRule: 'evenodd' }),
				React.createElement('path', { d: 'M189 396c10-3 22-9 35-18a6 6 0 116 10c-13 10-26 16-38 19s-24 2-33-4-14-16-16-29c-2-12-1-28 2-44 8-33 26-73 52-113s56-72 84-92c13-9 27-16 39-19 12-4 24-3 34 3 9 6 14 17 16 29 2 13 1 28-3 44a6 6 0 01-12-2c4-16 5-29 3-40-2-10-5-17-11-21s-14-4-24-2c-10 3-22 9-35 18-26 19-56 50-81 89-26 38-43 77-50 109-3 15-4 29-3 39 2 11 6 18 12 21 5 4 13 5 23 3z', fill: 'currentColor', fillRule: 'evenodd' }),
				React.createElement('circle', { cx: 256, cy: 256, r: 28, fill: 'currentColor' })
			);
		}

		var CUBES = [
			{ id: 'light', label: '浅色', icon: IconSun },
			{ id: 'dark', label: '深色', icon: IconMoon },
			{ id: 'system', label: '跟随系统', icon: IconSystem },
			{ id: 'one-dark-pro', label: 'One Dark Pro', icon: IconPro }
		];

		// ---------- apply ----------
		function apply(ctx) {
			var theme = ctx.get('theme');
			if (theme === undefined) return;
			var slots = ctx.get('slots');
			if (slots === undefined) return;

			// 注册 One Dark Pro 主题（disposer 交回 fiber，卸载时自动回收）。
			ctx.effect(function () {
				return theme.register({ id: 'one-dark-pro', colorScheme: 'dark', tokens: TOKENS });
			});

			// 主题服务只把 light/dark/system 写入 settings；自定义主题选择由 host 的
			// dsh-one-dark-pro 命名空间持久化（写到 ~/.dsh/settings.yaml），经插件自有路由读写。
			var persistChain = Promise.resolve();
			function persistTheme(id) {
				try {
					persistChain = persistChain.then(function () {
						try {
							return fetch('/api/one-dark-pro/preference', {
								method: 'POST',
								headers: { 'content-type': 'application/json' },
								body: JSON.stringify({ preference: id === 'one-dark-pro' ? 'one-dark-pro' : 'system' })
							}).catch(function () {});
						} catch (e) {}
					});
				} catch (e) {}
			}
			// 装载时恢复：settings 里是 one-dark-pro 才切过去（内置偏好由主题服务自行恢复）。
			// 绑定一个 fiber 卸载守卫，避免迟到的恢复在插件卸载后仍执行；再记一个用户已
			// 主动选择标记，避免迟到的恢复覆盖用户之后的点击（恢复只在用户尚未选择时生效）。
			var disposed = false;
			var userChose = false;
			// 插件自己的持久化意图。One Dark Pro 不是 DSH 内建偏好（theme.setTheme 不会
			// 写入 ui-theme 命名空间），因此任何无关 settings 写入触发 theme 服务 adopt 时，
			// 会把内存中的自定义偏好重置为最近的某个内建偏好（默认 system）；这里用它识别并恢复。
			var preferred = null;
			ctx.effect(function () { return function () { disposed = true; }; });
			ctx.effect(function () {
				return ctx.on('theme/change', function (snap) {
					if (disposed) return;
					if (preferred === 'one-dark-pro' && snap.preference !== 'one-dark-pro') {
						theme.setTheme('one-dark-pro');
					}
				});
			});
			try {
				fetch('/api/one-dark-pro/preference').then(function (r) { return r.json(); }).then(function (d) {
					if (disposed || userChose) return;
					preferred = d && d.ok ? d.preference : 'system';
					if (preferred === 'one-dark-pro') theme.setTheme('one-dark-pro');
				}).catch(function () {});
			} catch (e) {}

			// 注入外观四宫格样式（带唯一 data-plugin-css 标记，避免重复插入）。
			ctx.effect(function () {
				if (typeof document === 'undefined') return;
				var tagId = 'dsh-one-dark-pro/styles';
				var existing = document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']');
				if (existing !== null) return;
				var tag = document.createElement('style');
				tag.dataset.plugin = 'dsh-one-dark-pro';
				tag.dataset.pluginCss = tagId;
				tag.textContent = CSS;
				document.head.appendChild(tag);
				return function () { tag.remove(); };
			});

			// 接管自带 appearance 行：profile 插件不经 guardedSlots，同名行需显式
			// 更低优先级的 priority: -1 来 shadow 自带 appearance 的 priority 0 （最低渲染）。
			slots.inject('settings.general.item', function () {
				return slots.register(
					{ name: 'settings.general.item', id: 'appearance', order: 10, priority: -1 },
					function Appearance() {
						var prefState = React.useState(theme.getTheme().preference);
						var preference = prefState[0];
						var setPreference = prefState[1];
						React.useEffect(function () {
							return ctx.on('theme/change', function (snap) { setPreference(snap.preference); });
						}, []);
						return React.createElement('div', { className: 'odp-app-group' },
							React.createElement('div', { className: 'odp-app-title' }, '外观'),
							React.createElement('div', { className: 'odp-app-cubeRow' },
								CUBES.map(function (cube) {
									var selected = preference === cube.id;
									return React.createElement('button', {
										key: cube.id,
										type: 'button',
										className: selected ? 'odp-app-cube odp-app-selected' : 'odp-app-cube',
										'aria-pressed': selected,
										onClick: function () {
											userChose = true;
											preferred = cube.id === 'one-dark-pro' ? 'one-dark-pro' : 'system';
											persistTheme(cube.id);
											theme.setTheme(cube.id);
										}
									},
										React.createElement('span', { className: 'odp-app-icon' }, React.createElement(cube.icon)),
										React.createElement('span', null, cube.label)
									);
								})
							)
						);
					}
				);
			});
		}

		exports.apply = apply;
		exports.inject = ['theme', 'slots'];
		return module.exports;
	}
});
