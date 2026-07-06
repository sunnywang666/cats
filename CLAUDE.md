# cats (Meow-moku 喵子棋)

疗愈禅意风格的纯前端五子棋单机游戏,玩家对战三档 AI,棋子是 SVG 陶瓷猫。由 Google AI Studio 生成的原型,部署为 GitHub Pages。已归档完结。

## 技术栈

TypeScript ~5.8 + React 19 + Vite 6(ESM)。Tailwind 走 index.html 里的 CDN 脚本(非 npm 依赖,配置内联在 HTML)。lucide-react 图标。无测试/lint。CI 用 Node 18。

## 常用命令

- `npm install` / `npm run dev` — 开发服务器(端口 3000,自动开浏览器)
- `npm run build` — 产出 dist/;`npm run preview` — 预览产物
- 部署:push 到 main 后 `.github/workflows/deploy.yml` 自动发布 GitHub Pages
- 无 test/lint/typecheck 脚本;手动 `tsc` 检查类型(未验证)

## 目录导览

- `App.tsx`(~940 行)— 唯一大组件:全部状态、三个屏幕(HOME/MATCHING/GAME)、三个弹窗(商店/日记/回放),靠 screen 状态切换,无路由
- `services/gameLogic.ts` — 纯函数游戏/AI 逻辑(无 React 依赖):checkWinner、三档 AI、猫姿态判定
- `components/` — Board(15×15 SVG 棋盘)、CatPiece(内联 SVG 猫棋子)、Button
- `constants.ts` / `types.ts` — 棋盘尺寸、段位、皮肤、全部 enum/interface
- `index.html` — Tailwind CDN + 主题配置 + importmap

## 架构要点

- UI 与逻辑分离:改棋规/AI 只动 gameLogic.ts;改界面动 App.tsx 的 renderXxx();改主题色/动画改 index.html 内联 tailwind.config
- 持久化 localStorage,key `meow-moku-save-v1`(金币/皮肤/段位/最多 50 局历史)
- 统一计时器 useEffect 驱动回合:玩家 30s、AI 3s,超时自动代落子
- 回放:每局存 MoveRecord[],getReplayBoard(record, step) 重建任意步

## 约定与雷区

- **GEMINI_API_KEY 是 AI Studio 模板残留**:vite.config 和 README 都提它,但代码无任何调用,不需要 key 也能跑,别去"接上"
- 双重依赖来源:npm 装了 react/lucide,index.html importmap 又指向 aistudiocdn CDN,改版本两处都要看
- vite.config 的 `base: "/cats/"` 与仓库名绑定,改名会导致 Pages 资源 404
- .gitignore 忽略 node_modules 但跟踪状态存在不一致,动依赖前先 `git status` 核实
