<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1PjQP1tYSM9DnBEcjZncawlCfN3jkrjed

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

> 注:无需配置任何 API key。游戏 AI 是纯本地算法,vite.config 里的 GEMINI_API_KEY 是 AI Studio 模板残留,代码中没有任何调用。

### 实时预览功能

运行 `npm run dev` 后：
- 开发服务器会自动在浏览器中打开（通常是 http://localhost:3000）
- **支持热模块替换（HMR）**：当你修改任何文件（HTML、TSX、CSS等）时，页面会自动刷新，无需手动刷新浏览器
- 修改代码后，保存文件即可立即看到更新效果
- 如果浏览器没有自动打开，请手动访问终端中显示的本地地址