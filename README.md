# JobNinja — 求职军师 🥷

> 永远做你的军师，不做平台。一站式求职助手，覆盖「找工作 + 改简历 + 管进度」全流程。

## ✨ 核心功能

### 🎯 岗位搜索
- 聚合 18+ 主流招聘平台，一键跨平台搜索
- 智能关键词联想与城市联动
- 岗位收藏、对比与批量管理，支持导出求职数据

### 📄 简历优化
- 基于 JD 智能匹配，自动检测套话并给出修改建议
- STAR 法则自检，量化工作经历，提升简历通过率
- 多场景模板库（应届生 / 社招 / 转行），支持拖拽自定义模块
- 一键导出 Word / PDF / 纯文本

### 📊 求职进度管理
- 面试提醒与日程管理
- 投递记录可视化统计
- 本地数据存储，支持导出备份

### 🤖 AI 增强（可选）
- 支持接入 DeepSeek / Claude 等多模态模型
- AI 简历分析 + 岗位匹配度评估
- 无 API 时所有基础功能 **100% 可用**

## 🚀 快速开始

### 本地运行

直接双击 `index.html` 在浏览器中打开即可使用。

或者用任意本地服务器：

```bash
# Python 3
python -m http.server 8080

# Node.js (需要先安装 http-server)
npx http-server -p 8080

# VS Code Live Server 插件
右键 index.html → Open with Live Server
```

然后打开 `http://localhost:8080`

### Vercel 部署

项目已包含 `vercel.json` 配置文件，可直接部署：

```bash
npm i -g vercel
vercel
```

## 📁 项目结构

```
ai-job-assistant/
├── index.html              # 主页面
├── manifest.json           # PWA 配置
├── sw.js                   # Service Worker（离线支持）
├── vercel.json             # Vercel 部署配置
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── app.js              # 主控制器（面板注册、路由、状态管理）
│   ├── i18n.js             # 国际化
│   ├── settings.js         # 设置面板
│   ├── job-search.js       # 岗位搜索
│   ├── job-tracker.js      # 求职进度管理
│   ├── resume.js           # 简历优化（核心处理）
│   ├── resume-tools.js     # 简历实用工具
│   ├── resume-templates.js # 简历模板
│   ├── template-community.js # 模板社区
│   ├── interview.js        # AI 模拟面试
│   ├── interview-exp.js    # 面试经验分享
│   ├── evaluate.js         # 岗位匹配度评估
│   ├── channel.js          # 招聘渠道推荐
│   └── industry-db.js      # 行业数据库
└── api/
    └── proxy.js            # API 代理（用于 Vercel Serverless）
```

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | 原生 JavaScript（无框架依赖） |
| UI 样式 | Tailwind CSS v3 (CDN) |
| 图标 | Font Awesome 6 (CDN) |
| PWA | Service Worker + Web App Manifest |
| 部署 | Vercel（静态 + Serverless 代理） |

## 📝 使用说明

1. **首页（简历优化）**：粘贴你的简历和岗位 JD，系统自动分析匹配度并给出修改建议
2. **岗位搜索**：输入职位和城市，跨平台一键搜索
3. **进度管理**：记录面试、投递进度，看板式管理
4. **AI 设置**：在设置面板配置 API Key（可选），开启 AI 增强功能
5. **更多工具**：点击侧边栏「更多」展开简历工具、模板社区、面试经验等

## 🔒 隐私

所有数据存储在浏览器本地（localStorage / IndexedDB），不会上传到任何服务器。即使离线也能正常使用。

## 📄 License

MIT License
