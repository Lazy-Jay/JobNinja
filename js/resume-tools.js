/**
 * JobNinja — resume-tools.js
 * 本地简历修改工具箱：动词库、表达升级、排版优化、避坑指南
 * 纯前端，无需API
 */
(function () {
  if (!window.JobNinja) return;
  var JN = window.JobNinja;

  // ================================================================
  //  简历动词库（100+ 按功能分类）
  // ================================================================
  var VERB_LIBRARY = {
    manage: {
      label: '管理/领导', icon: 'fa-crown', color: '#f59e0b',
      verbs: ['主导', '负责', '带领', '统筹', '协调', '管理', '组织', '推进', '督办', '把控',
              '掌舵', '指挥', '调度', '部署', '规划', '制定', '建立', '搭建体系', '组建团队']
    },
    analyze: {
      label: '分析/研究', icon: 'fa-chart-line', color: '#6366f1',
      verbs: ['分析', '研究', '洞察', '挖掘', '诊断', '评估', '预测', '调研', '梳理',
              '剖析', '论证', '测算', '建模', '归因', '复盘', '对标', '审计']
    },
    create: {
      label: '创造/设计', icon: 'fa-lightbulb', color: '#8b5cf6',
      verbs: ['设计', '搭建', '创建', '构建', '打造', '开发', '研发', '创新', '重塑',
              '发明', '首创', '研制', '孵化', '开创', '奠基', '从0到1搭建']
    },
    improve: {
      label: '优化/提升', icon: 'fa-arrow-trend-up', color: '#10b981',
      verbs: ['优化', '提升', '改进', '改善', '增强', '精简', '重构', '升级', '迭代',
              '突破', '倍增', '翻番', '跃升', '质变', '提效', '降本', '提速', '加固']
    },
    execute: {
      label: '执行/交付', icon: 'fa-check-circle', color: '#06b6d4',
      verbs: ['执行', '实施', '落地', '交付', '完成', '达成', '实现', '推动', '促成',
              '攻克', '突破', '拿下', '保质', '如期', '提前', '超额']
    },
    collaborate: {
      label: '协作/沟通', icon: 'fa-users', color: '#ec4899',
      verbs: ['协作', '配合', '联动', '对接', '沟通', '协调', '促成', '拉通',
              '跨部门协作', '向上管理', '对齐', '同步', '赋能', '培训', '指导']
    },
    quantify: {
      label: '量化成果', icon: 'fa-percent', color: '#f97316',
      verbs: ['提升X%', '增长X倍', '降低X%', '节省X万', '缩短X天', '覆盖X用户',
              '支撑X万日活', '服务X客户', '管理X人团队', '预算X万', '营收X万']
    }
  };

  // ================================================================
  //  表达升级映射表（普通 → 专业）
  // ================================================================
  var EXPRESSION_UPGRADES = [
    // 参与类
    { from: /参与了?(\S*项目)/g, to: '主导$1' },
    { from: /帮(?:助|忙)/g, to: '协助' },
    { from: /做了?一些/g, to: '完成' },
    { from: /打杂/g, to: '支持多线条工作' },
    { from: /跟着/g, to: '配合' },
    // 成果类
    { from: /做了?很多/g, to: '高效完成多项' },
    { from: /做得?不错/g, to: '出色完成' },
    { from: /做得?好/g, to: '达成预期目标' },
    { from: /完成了?任务/g, to: '达成关键目标' },
    { from: /按时完成/g, to: '提前交付' },
    // 能力类
    { from: /(?:会|懂|知道)(?:一点|一些)/g, to: '熟练掌握' },
    { from: /(?:学过|了解)/g, to: '具备' },
    { from: /比较熟/g, to: '精通' },
    { from: /能(?:够|做)/g, to: '擅长' },
    { from: /还行/g, to: '具备扎实的' },
    // 规模类
    { from: /小项目/g, to: '创新项目' },
    { from: /日常工作/g, to: '核心业务' },
    { from: /写(?:了|过)(?:一些)?代码/g, to: '完成核心模块开发' },
    { from: /改(?:了|过)?bug/g, to: '修复关键缺陷' },
    { from: /加(?:了|些)?功能/g, to: '迭代核心功能' },
    // 模糊表达
    { from: /差不多/g, to: '' },
    { from: /大概/g, to: '' },
    { from: /基本(?:上)?/g, to: '' },
    { from: /等等/g, to: '等' },
    { from: /各种/g, to: '多元' },
    // 弱化词
    { from: /(?:只是|仅仅|只不过)/g, to: '' },
    { from: /(?:可能|也许|大概|似乎)/g, to: '' },
    { from: /(?:我觉得|我认为|个人认为)/g, to: '' }
  ];

  // ================================================================
  //  简历避坑指南
  // ================================================================
  var PITFALLS_GUIDE = [
    { title: '避免空话套话',
      content: '「工作认真负责」「具有良好的团队合作精神」这些空话无法证明任何能力。用具体成果替代：' +
               '「通过建立代码评审机制，团队Bug率下降40%」。',
      bad: '我工作认真负责，积极完成领导交办的各项任务。',
      good: '独立负责3条业务线的前端开发，Q4按期交付率100%，并获得年度最佳项目奖。' },
    { title: '量化你的成果',
      content: '面试官无法从「提升系统性能」判断你的贡献。用数字说话：' +
               '「将API响应时间从800ms优化至120ms，支撑日均100万次调用」。',
      bad: '优化了系统性能，提升了用户体验。',
      good: '通过引入缓存策略和SQL优化，将首页加载时间从3.2s降至0.8s，用户跳出率降低25%。' },
    { title: '使用STAR法则',
      content: '每条经历遵循：Situation（背景）→ Task（任务）→ Action（行动）→ Result（结果）。' +
               '重点是Action和Result——你做了什么，带来了什么改变。',
      bad: '参与了公司数据平台的建设。',
      good: '（S）公司业务数据分散在5个系统，（T）需要统一数据看板，（A）主导搭建数据中台，' +
             '设计30+核心指标看板，（R）管理层决策效率提升60%，月度复盘时间从3天缩短至2小时。' },
    { title: '避免流水账',
      content: '不要罗列日常工作职责，HR已经知道一个"前端开发"做什么。' +
               '写你超出预期的贡献、你独有的成果。',
      bad: '负责公司官网的日常维护和页面开发，使用HTML/CSS/JS技术栈。',
      good: '主导官网重构项目，页面性能Lighthouse评分从45提升至92，SEO流量增长180%，' +
             '搭建组件库减少50%重复开发工时。' },
    { title: '控制篇幅',
      content: '简历1-2页为宜。应届生1页，3年+经验可2页。每段经历3-5条要点，每条1-2行。' +
               'HR平均看一份简历只有6-10秒。',
      bad: '写满4页简历，包含所有课程名称和无关兼职。',
      good: '精选与目标岗位最相关的3-4段经历，每段3-4条量化要点，总篇幅控制在1页半。' },
    { title: '避免第一人称',
      content: '简历是专业文档，应使用无主语句式，以动词开头。',
      bad: '我负责搭建了公司的CI/CD流水线，我通过自动化部署提升了效率。',
      good: '搭建公司CI/CD流水线，实现自动化构建-测试-部署，发布效率提升200%，回滚时间从30分钟降至30秒。' },
    { title: '技能列表要诚实',
      content: '不要写「精通」你只用了3个月的技术。技能熟练度分级：了解 < 熟悉 < 熟练 < 精通。' +
               '面试官会按照你写的「精通」来深度追问。',
      bad: '精通：Java、Python、Go、Rust、TypeScript、Kubernetes、TensorFlow、Flink...（写了20项）',
      good: '精通：TypeScript/React/Node.js（3年深度使用）\n熟练：Python/Go（有实际项目经验）\n了解：Rust/K8s（业余学习）' },
    { title: '模板简洁，排版统一',
      content: '使用统一的字体、字号、间距。日期格式一致（如统一用2020.06 - 2022.12）。' +
               '避免花哨的图表、进度条、技能百分比——这些在ATS系统中无法解析。',
      bad: '简历用了3种字体、5种颜色、技能用进度条显示"React 85%"。',
      good: '统一的黑色字体，分段清晰，技能用标签形式展示，无图形元素。' },
    { title: '针对岗位定制',
      content: '同一份简历投所有岗位 = 投了等于没投。根据JD关键词调整经历的侧重点。' +
               '如果JD要求"性能优化经验"，就把性能优化相关的经历放前面、写详细。',
      bad: '同一份简历投了前端、后端、产品经理三个方向。',
      good: '投前端岗位突出React/性能优化/组件库经历；投全栈岗位增加Node.js/数据库相关内容。' }
  ];

  // ================================================================
  //  排版优化规则
  // ================================================================
  var FORMAT_RULES = [
    { name: '统一日期格式', desc: '将所有日期统一为 YYYY.MM - YYYY.MM 格式，如 2020.06 - 2022.12' },
    { name: '统一项目符号', desc: '使用统一的圆点（•）或短横（-）作为列表符号，每行一条要点' },
    { name: '精简换行', desc: '段落间保留一个空行，删除多余空行。要点之间不留空行' },
    { name: '对齐公司/职位', desc: '职位名加粗，公司名紧跟其后，日期右对齐，保持视觉统一' },
    { name: '控制要点长度', desc: '每条要点不超过2行。超过的自动提示拆分建议' },
    { name: '关键词加粗', desc: '将JD中出现的技能关键词在简历中适当加粗，便于HR快速扫描' },
    { name: '字体统一', desc: '正文使用统一的字体和字号（推荐11-12pt），标题14-16pt' },
    { name: '页边距', desc: '上下左右各留2cm页边距，确保打印效果良好' }
  ];

  function render() {
    var el = document.createElement('div');

    el.innerHTML =
      // 标题
      '<div style="margin-bottom:16px;">' +
        '<h2 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">' +
          '<i class="fa-solid fa-screwdriver-wrench" style="color:#f59e0b;margin-right:8px;"></i>简历工具' +
        '</h2>' +
        '<p style="font-size:13px;color:#64748b;margin:0;">动词库 · 表达升级 · 排版优化 · 避坑指南</p>' +
      '</div>' +

      // ===== 标签页切换 =====
      '<div style="display:flex;gap:0;margin-bottom:0;flex-wrap:wrap;">' +
        '<button id="rtTabVerb" class="rt-tab active" style="padding:8px 16px;background:#12121a;border:1px solid #1a1a26;border-bottom:none;border-radius:8px 8px 0 0;color:#d1d5db;font-size:12px;font-weight:600;cursor:pointer;">' +
          '<i class="fa-solid fa-crown" style="margin-right:5px;color:#f59e0b;"></i>动词库</button>' +
        '<button id="rtTabUpgrade" class="rt-tab" style="padding:8px 16px;background:transparent;border:1px solid transparent;border-bottom:none;border-radius:8px 8px 0 0;color:#4a4a6a;font-size:12px;font-weight:500;cursor:pointer;">' +
          '<i class="fa-solid fa-arrow-up" style="margin-right:5px;color:#4a4a6a;"></i>表达升级</button>' +
        '<button id="rtTabFormat" class="rt-tab" style="padding:8px 16px;background:transparent;border:1px solid transparent;border-bottom:none;border-radius:8px 8px 0 0;color:#4a4a6a;font-size:12px;font-weight:500;cursor:pointer;">' +
          '<i class="fa-solid fa-text-height" style="margin-right:5px;color:#4a4a6a;"></i>排版优化</button>' +
        '<button id="rtTabPitfall" class="rt-tab" style="padding:8px 16px;background:transparent;border:1px solid transparent;border-bottom:none;border-radius:8px 8px 0 0;color:#4a4a6a;font-size:12px;font-weight:500;cursor:pointer;">' +
          '<i class="fa-solid fa-triangle-exclamation" style="margin-right:5px;color:#4a4a6a;"></i>避坑指南</button>' +
        '<button id="rtTabCover" class="rt-tab" style="padding:8px 16px;background:transparent;border:1px solid transparent;border-bottom:none;border-radius:8px 8px 0 0;color:#4a4a6a;font-size:12px;font-weight:500;cursor:pointer;">' +
          '<i class="fa-solid fa-envelope" style="margin-right:5px;color:#4a4a6a;"></i>求职信</button>' +
        '<div style="flex:1;border-bottom:1px solid #1a1a26;"></div>' +
      '</div>' +

      // ===== 动词库面板 =====
      '<div id="rtPanelVerb" style="background:#12121a;border:1px solid #1a1a26;border-top:none;border-radius:0 0 10px 10px;padding:16px;margin-bottom:14px;">' +
        renderVerbLibrary() +
      '</div>' +

      // ===== 表达升级面板（默认隐藏） =====
      '<div id="rtPanelUpgrade" style="display:none;background:#12121a;border:1px solid #1a1a26;border-top:none;border-radius:0 0 10px 10px;padding:16px;margin-bottom:14px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
          // 左侧：输入
          '<div>' +
            '<div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">' +
              '<i class="fa-solid fa-pen-to-square" style="color:#64748b;margin-right:4px;"></i>输入原始描述</div>' +
            '<textarea id="rtUpgradeInput" class="ninja-input" rows="8" placeholder="输入你的经历描述，如：&#10;参与了公司官网项目，帮忙写了一些页面，改了一些bug，做得还不错..." style="font-size:12px;line-height:1.6;"></textarea>' +
            '<button id="btnUpgrade" class="btn btn-primary" style="font-size:12px;width:100%;margin-top:8px;">' +
              '<i class="fa-solid fa-wand-magic-sparkles" style="font-size:11px;"></i> 一键升级表达</button>' +
            '<div style="margin-top:10px;padding:10px 12px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;">' +
              '<div style="font-size:10px;color:#64748b;margin-bottom:4px;">快速输入示例（点击填入）</div>' +
              '<button class="rt-example-btn" data-text="参与公司官网改版项目，写了一些页面，改了一些bug，做得还不错" style="font-size:10px;padding:3px 8px;margin:2px;background:#1a1a26;border:1px solid #252536;border-radius:4px;color:#94a3b8;cursor:pointer;">示例1：日常描述</button>' +
              '<button class="rt-example-btn" data-text="负责后台管理系统维护，日常处理用户反馈的问题，修修补补" style="font-size:10px;padding:3px 8px;margin:2px;background:#1a1a26;border:1px solid #252536;border-radius:4px;color:#94a3b8;cursor:pointer;">示例2：维护描述</button>' +
            '</div>' +
          '</div>' +
          // 右侧：结果
          '<div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
              '<span style="font-size:12px;font-weight:600;color:#34d399;">' +
                '<i class="fa-solid fa-sparkles" style="margin-right:4px;"></i>升级后表达</span>' +
              '<button id="btnCopyUpgrade" class="btn btn-outline" style="font-size:10px;padding:3px 10px;display:none;">' +
                '<i class="fa-solid fa-copy"></i> 复制</button>' +
            '</div>' +
            '<div id="rtUpgradeResult" style="min-height:200px;padding:12px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:8px;color:#64748b;font-size:13px;line-height:1.8;white-space:pre-wrap;">点击左侧「一键升级表达」查看结果</div>' +
            '<div id="rtUpgradeHints" style="margin-top:8px;font-size:11px;color:#4a4a6a;line-height:1.6;"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // ===== 排版优化面板（默认隐藏） =====
      '<div id="rtPanelFormat" style="display:none;background:#12121a;border:1px solid #1a1a26;border-top:none;border-radius:0 0 10px 10px;padding:16px;margin-bottom:14px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
          '<div>' +
            '<div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">' +
              '<i class="fa-solid fa-text-height" style="color:#64748b;margin-right:4px;"></i>排版优化规则</div>' +
            '<div style="max-height:400px;overflow-y:auto;" class="custom-scrollbar">' +
              FORMAT_RULES.map(function(rule, i) {
                return '<div style="padding:10px 12px;margin-bottom:6px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;">' +
                  '<div style="display:flex;align-items:center;gap:8px;">' +
                    '<span style="width:20px;height:20px;background:#312e81;color:#a5b4fc;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;">' + (i+1) + '</span>' +
                    '<div>' +
                      '<span style="font-size:12px;font-weight:600;color:#e2e8f0;">' + rule.name + '</span>' +
                      '<p style="font-size:11px;color:#64748b;margin:2px 0 0;">' + rule.desc + '</p>' +
                    '</div>' +
                  '</div>' +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">' +
              '<i class="fa-solid fa-align-left" style="color:#64748b;margin-right:4px;"></i>文本格式化工具</div>' +
            '<textarea id="rtFormatInput" class="ninja-input" rows="10" placeholder="粘贴简历文本，自动优化排版..." style="font-size:12px;line-height:1.6;"></textarea>' +
            '<div style="display:flex;gap:6px;margin-top:8px;">' +
              '<button id="btnAutoFormat" class="btn btn-primary" style="font-size:12px;flex:1;">' +
                '<i class="fa-solid fa-wand-magic-sparkles"></i> 自动排版</button>' +
              '<button id="btnCopyFormat" class="btn btn-outline" style="font-size:12px;">' +
                '<i class="fa-solid fa-copy"></i> 复制结果</button>' +
            '</div>' +
            '<div id="rtFormatResult" style="margin-top:8px;min-height:120px;padding:12px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:8px;color:#64748b;font-size:12px;line-height:1.8;white-space:pre-wrap;"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // ===== 避坑指南面板（默认隐藏） =====
      '<div id="rtPanelPitfall" style="display:none;background:#12121a;border:1px solid #1a1a26;border-top:none;border-radius:0 0 10px 10px;padding:16px;margin-bottom:14px;">' +
        PITFALLS_GUIDE.map(function(p, i) {
          return '<div class="panel-card" style="margin-bottom:12px;padding:16px;">' +
            '<div style="display:flex;align-items:flex-start;gap:10px;">' +
              '<span style="width:24px;height:24px;background:#3b1414;color:#fca5a5;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">' + (i+1) + '</span>' +
              '<div style="flex:1;">' +
                '<h4 style="font-size:14px;color:#fca5a5;margin:0 0 6px;">' + p.title + '</h4>' +
                '<p style="font-size:12px;color:#94a3b8;line-height:1.7;margin:0 0 10px;">' + p.content + '</p>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
                  '<div style="padding:8px 10px;background:#3b1414;border:1px solid #7f1d1d;border-radius:6px;">' +
                    '<span style="font-size:9px;color:#f87171;display:block;margin-bottom:3px;">' +
                      '<i class="fa-solid fa-xmark"></i> 常见错误写法</span>' +
                    '<p style="font-size:11px;color:#fca5a5;margin:0;line-height:1.5;">' + p.bad + '</p>' +
                  '</div>' +
                  '<div style="padding:8px 10px;background:#064e3b;border:1px solid #065f46;border-radius:6px;">' +
                    '<span style="font-size:9px;color:#34d399;display:block;margin-bottom:3px;">' +
                      '<i class="fa-solid fa-check"></i> 优化后写法</span>' +
                    '<p style="font-size:11px;color:#6ee7b7;margin:0;line-height:1.5;">' + p.good + '</p>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +

      // ===== 求职信面板（默认隐藏） =====
      '<div id="rtPanelCover" style="display:none;background:#12121a;border:1px solid #1a1a26;border-top:none;border-radius:0 0 10px 10px;padding:16px;margin-bottom:14px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
          '<div>' +
            '<div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">' +
              '<i class="fa-solid fa-user" style="color:#64748b;margin-right:4px;"></i>自我介绍</div>' +
            '<button id="btnGenIntro" class="btn btn-primary" style="font-size:12px;width:100%;margin-bottom:8px;">' +
              '<i class="fa-solid fa-wand-magic-sparkles"></i> 自动生成自我介绍</button>' +
            '<textarea id="rtIntroOutput" class="ninja-input" rows="6" placeholder="点击生成..." style="font-size:12px;line-height:1.6;"></textarea>' +
            '<button id="btnCopyIntro" class="btn btn-outline" style="font-size:10px;padding:3px 10px;margin-top:6px;">' +
              '<i class="fa-solid fa-copy"></i> 复制</button>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:6px;">' +
              '<i class="fa-solid fa-file-lines" style="color:#64748b;margin-right:4px;"></i>求职信</div>' +
            '<button id="btnGenCover" class="btn btn-primary" style="font-size:12px;width:100%;margin-bottom:8px;">' +
              '<i class="fa-solid fa-wand-magic-sparkles"></i> 自动生成求职信</button>' +
            '<textarea id="rtCoverOutput" class="ninja-input" rows="10" placeholder="点击生成..." style="font-size:12px;line-height:1.6;"></textarea>' +
            '<button id="btnCopyCover" class="btn btn-outline" style="font-size:10px;padding:3px 10px;margin-top:6px;">' +
              '<i class="fa-solid fa-copy"></i> 复制</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div style="font-size:10px;color:#252536;text-align:right;">所有工具均在浏览器本地运行，不上传数据</div>';

    // ===== 标签页切换 =====
    var tabs = {
      'rtTabVerb': 'rtPanelVerb',
      'rtTabUpgrade': 'rtPanelUpgrade',
      'rtTabFormat': 'rtPanelFormat',
      'rtTabPitfall': 'rtPanelPitfall',
      'rtTabCover': 'rtPanelCover'
    };

    for (var tabId in tabs) {
      el.querySelector('#' + tabId).addEventListener('click', function() {
        var clickedTabId = this.id;
        // 更新所有标签页样式
        for (var tid in tabs) {
          var t = el.querySelector('#' + tid);
          var p = el.querySelector('#' + tabs[tid]);
          if (tid === clickedTabId) {
            t.classList.add('active');
            t.style.background = '#12121a';
            t.style.borderColor = '#1a1a26';
            t.style.color = '#d1d5db';
            t.style.borderBottomColor = '#12121a';
            p.style.display = 'block';
          } else {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.borderColor = 'transparent';
            t.style.color = '#4a4a6a';
            t.style.borderBottomColor = 'transparent';
            p.style.display = 'none';
          }
        }
      });
    }

    // ===== 表达升级功能 =====
    el.querySelector('#btnUpgrade').addEventListener('click', function() {
      var input = el.querySelector('#rtUpgradeInput').value.trim();
      if (!input) { JN.showToast('请先输入需要升级的描述', 'warning'); return; }

      var result = input;
      var changes = [];

      EXPRESSION_UPGRADES.forEach(function(rule) {
        var before = result;
        result = result.replace(rule.from, rule.to);
        if (before !== result) {
          changes.push(rule.from.toString().replace(/\\/g, ''));
        }
      });

      // 额外优化
      result = result.replace(/\s+/g, ' ').trim();

      var resultEl = el.querySelector('#rtUpgradeResult');
      resultEl.textContent = result;
      resultEl.style.color = '#d1d5db';

      var hintsEl = el.querySelector('#rtUpgradeHints');
      if (changes.length > 0) {
        hintsEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#10b981;margin-right:4px;"></i>已应用 ' + changes.length + ' 处优化。' +
          '<span style="color:#94a3b8;">提示：如需进一步优化（如添加量化数据），请手动调整。</span>';
      } else {
        hintsEl.innerHTML = '<i class="fa-solid fa-circle-info" style="color:#f59e0b;margin-right:4px;"></i>未检测到可优化的表达。如果原始内容已经比较专业，则无需修改。';
      }

      el.querySelector('#btnCopyUpgrade').style.display = 'inline-flex';
    });

    // 复制升级结果
    el.querySelector('#btnCopyUpgrade').addEventListener('click', function() {
      var text = el.querySelector('#rtUpgradeResult').textContent;
      copyText(text);
    });

    // 示例按钮
    el.querySelectorAll('.rt-example-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        el.querySelector('#rtUpgradeInput').value = this.getAttribute('data-text');
      });
    });

    // ===== 排版优化 =====
    el.querySelector('#btnAutoFormat').addEventListener('click', function() {
      var input = el.querySelector('#rtFormatInput').value;
      if (!input.trim()) { JN.showToast('请先粘贴需要格式化的文本', 'warning'); return; }

      var result = autoFormat(input);
      var resultEl = el.querySelector('#rtFormatResult');
      resultEl.textContent = result;
      resultEl.style.color = '#d1d5db';
    });

    el.querySelector('#btnCopyFormat').addEventListener('click', function() {
      var text = el.querySelector('#rtFormatResult').textContent;
      if (!text.trim()) { JN.showToast('请先执行自动排版', 'warning'); return; }
      copyText(text);
    });

    // 求职信生成
    el.querySelector('#btnGenIntro').addEventListener('click', function() {
      var info = (function() { try { return JSON.parse(localStorage.getItem('jobninja_basic')) || {}; } catch(_) { return {}; } })();
      var blocks = (function() { try { return JSON.parse(localStorage.getItem('jobninja_blocks')) || []; } catch(_) { return []; } })();
      el.querySelector('#rtIntroOutput').value = generateCoverLetter(info, blocks, 'intro');
    });
    el.querySelector('#btnGenCover').addEventListener('click', function() {
      var info = (function() { try { return JSON.parse(localStorage.getItem('jobninja_basic')) || {}; } catch(_) { return {}; } })();
      var blocks = (function() { try { return JSON.parse(localStorage.getItem('jobninja_blocks')) || []; } catch(_) { return []; } })();
      el.querySelector('#rtCoverOutput').value = generateCoverLetter(info, blocks, 'cover');
    });
    el.querySelector('#btnCopyIntro').addEventListener('click', function() { copyText(el.querySelector('#rtIntroOutput').value); });
    el.querySelector('#btnCopyCover').addEventListener('click', function() { copyText(el.querySelector('#rtCoverOutput').value); });

    return el;
  }

  function renderVerbLibrary() {
    var html = '';
    for (var key in VERB_LIBRARY) {
      var cat = VERB_LIBRARY[key];
      html += '<div style="margin-bottom:14px;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
          '<div style="width:28px;height:28px;border-radius:8px;background:' + cat.color + '15;display:flex;align-items:center;justify-content:center;">' +
            '<i class="fa-solid ' + cat.icon + '" style="color:' + cat.color + ';font-size:13px;"></i>' +
          '</div>' +
          '<span style="font-size:13px;font-weight:600;color:#e2e8f0;">' + cat.label + '</span>' +
          '<span style="font-size:10px;color:#4a4a6a;">' + cat.verbs.length + '个动词</span>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:5px;">' +
          cat.verbs.map(function(v) {
            return '<button class="rt-verb-btn" data-verb="' + v + '" style="font-size:11px;padding:4px 10px;background:#0f0f17;border:1px solid #1a1a26;border-radius:6px;color:#94a3b8;cursor:pointer;transition:all 0.12s;"' +
              ' onmouseenter="this.style.borderColor=\'' + cat.color + '40\';this.style.color=\'' + cat.color + '\'"' +
              ' onmouseleave="this.style.borderColor=\'#1a1a26\';this.style.color=\'#94a3b8\'"' +
              ' onclick="navigator.clipboard&&navigator.clipboard.writeText(\'' + v + '\');this.style.background=\'' + cat.color + '20\';this.style.borderColor=\'' + cat.color + '\';var t=this;setTimeout(function(){t.style.background=\'#0f0f17\';t.style.borderColor=\'#1a1a26\';},600);">' + v + '</button>';
          }).join('') +
        '</div>' +
      '</div>';
    }
    return html;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        JN.showToast('已复制到剪贴板', 'success');
      }).catch(function() {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); JN.showToast('已复制到剪贴板', 'success'); }
    catch (_) { JN.showToast('复制失败，请手动选择文本', 'error'); }
    document.body.removeChild(ta);
  }

  function autoFormat(text) {
    var result = text;

    // 1. 统一换行符
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 2. 合并多个连续换行为最多两个（保留段落边界）
    result = result.replace(/\n{3,}/g, '\n\n');

    // 3. 去除每行首尾空格
    result = result.split('\n').map(function(line) { return line.trim(); }).join('\n');

    // 4. 中文和英文/数字之间加空格
    result = result.replace(/([一-鿿])([a-zA-Z0-9])/g, '$1 $2');
    result = result.replace(/([a-zA-Z0-9])([一-鿿])/g, '$1 $2');

    // 5. 统一项目符号
    result = result.replace(/^[•·●○◆◇▪▸►▻]\s*/gm, '• ');
    result = result.replace(/^[\-\–—]\s*/gm, '• ');
    result = result.replace(/^(\d+)[\.\)、．]\s*/gm, '• ');

    // 6. 中文标点规范化
    result = result.replace(/,/g, '，');
    result = result.replace(/;/g, '；');

    // 7. 去除末尾空白
    result = result.trim();

    return result;
  }

  // ================================================================
  //  求职信/自我介绍生成器
  // ================================================================
  function generateCoverLetter(basicInfo, blocks, type) {
    var info = basicInfo || {};
    var name = info.name || '***';
    var workBlocks = (blocks || []).filter(function(b) { return b.type === 'work'; });
    var projBlocks = (blocks || []).filter(function(b) { return b.type === 'project'; });
    var skills = [];
    (blocks || []).forEach(function(b) { if (b.tags) skills = skills.concat(b.tags); });
    skills = skills.filter(function(v,i,a) { return a.indexOf(v)===i; }).slice(0,8);

    if (type === 'intro') {
      // 自我介绍
      var lines = [];
      lines.push('您好，我是' + name + '，');
      if (workBlocks.length > 0) {
        var latest = workBlocks[0];
        var years = latest.date ? (latest.date.match(/20\d{2}/g) || []).length : 0;
        lines.push('有' + (years >= 2 ? '多年' : '') + (latest.title || '相关领域') + '经验。');
        lines.push('曾' + ((latest.description||'').substring(0, 60).replace(/\n/g, ' ')) + '。');
      }
      if (projBlocks.length > 0) {
        lines.push('主导过' + (projBlocks[0].title || '核心项目') + '，积累了丰富的实战经验。');
      }
      if (skills.length > 0) {
        lines.push('擅长' + skills.slice(0, 5).join('、') + '等技术。');
      }
      lines.push('希望有机会深入交流，谢谢！');
      return lines.join('');
    } else {
      // 求职信
      var lines2 = [];
      lines2.push('尊敬的招聘负责人：');
      lines2.push('');
      lines2.push('您好！我是' + name + '，看到贵公司的招聘信息，非常感兴趣，特此申请。');
      lines2.push('');
      if (workBlocks.length > 0) {
        var w = workBlocks[0];
        lines2.push('我有' + (w.title || '相关领域') + '的工作经验，曾在' + (w.org || '某公司') + '负责' + ((w.description||'').substring(0,80).replace(/\n/g, ' ')) + '。');
      }
      if (projBlocks.length > 0) {
        lines2.push('此外，我还主导了' + (projBlocks[0].title || '重要项目') + '，积累了扎实的实战能力。');
      }
      if (skills.length > 0) {
        lines2.push('我的核心技能包括：' + skills.slice(0,6).join('、') + '。');
      }
      lines2.push('');
      lines2.push('我相信我的经验与能力能够为贵公司创造价值。期待有机会进一步沟通。');
      lines2.push('');
      lines2.push('此致');
      lines2.push('敬礼');
      lines2.push('');
      lines2.push(name);
      if (info.email) lines2.push(info.email);
      if (info.phone) lines2.push(info.phone);
      lines2.push(new Date().toISOString().slice(0,10));
      return lines2.join('\n');
    }
  }

  // 注册面板
  JN.registerPanel({
    id: 'resumetools',
    title: '简历工具',
    icon: 'fa-screwdriver-wrench',
    render: render
  });

})();
