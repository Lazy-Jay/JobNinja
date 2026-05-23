/**
 * JobNinja — evaluate.js
 * 岗位六维评估 + 多岗位对比雷达图
 * 纯本地计算，不依赖外部 API，不阻塞流程
 */
(function () {
  if (!window.JobNinja) return;

  var JN = window.JobNinja;

  // ================================================================
  //  内置数据表
  // ================================================================

  /** 城市-年限-月薪参考表（单位：K/月，2026年行情） */
  var SALARY_TABLE = {
    '北京':   { fresh: [8,14],   j3: [18,30],  j5: [28,45],  j8: [38,60],  senior: [50,90] },
    '上海':   { fresh: [8,14],   j3: [18,28],  j5: [26,42],  j8: [36,58],  senior: [50,85] },
    '深圳':   { fresh: [7,13],   j3: [16,28],  j5: [25,40],  j8: [35,55],  senior: [45,80] },
    '杭州':   { fresh: [7,12],   j3: [15,26],  j5: [24,38],  j8: [32,52],  senior: [42,75] },
    '广州':   { fresh: [6,11],   j3: [14,24],  j5: [22,35],  j8: [30,48],  senior: [40,68] },
    '成都':   { fresh: [5,10],   j3: [12,20],  j5: [18,30],  j8: [25,40],  senior: [35,55] },
    '南京':   { fresh: [6,10],   j3: [12,20],  j5: [18,28],  j8: [25,40],  senior: [35,55] },
    '武汉':   { fresh: [5,9],    j3: [10,18],  j5: [16,26],  j8: [22,36],  senior: [30,50] },
    '西安':   { fresh: [5,9],    j3: [10,17],  j5: [15,25],  j8: [20,34],  senior: [28,45] },
    '长沙':   { fresh: [5,9],    j3: [10,17],  j5: [15,24],  j8: [20,32],  senior: [28,42] },
    '苏州':   { fresh: [6,10],   j3: [12,20],  j5: [18,28],  j8: [24,38],  senior: [32,50] },
    '合肥':   { fresh: [5,8],    j3: [10,16],  j5: [14,24],  j8: [20,32],  senior: [26,42] },
    '郑州':   { fresh: [4,8],    j3: [9,15],   j5: [14,22],  j8: [18,30],  senior: [25,40] },
    '重庆':   { fresh: [5,9],    j3: [10,17],  j5: [15,25],  j8: [22,35],  senior: [30,48] },
    'default':{ fresh: [5,9],    j3: [10,18],  j5: [16,28],  j8: [24,38],  senior: [32,55] }
  };

  /** 通勤时间-评分映射 */
  function commuteScore(minutes) {
    if (minutes <= 15) return 10;
    if (minutes <= 30) return 8;
    if (minutes <= 45) return 6;
    if (minutes <= 60) return 4;
    if (minutes <= 90) return 2;
    return 1;
  }

  /** 技术保鲜期评分表（2026视角） */
  var TECH_FRESHNESS = {
    // 热门/上升期 — 高保鲜分
    'AI':10,'人工智能':10,'大模型':10,'LLM':10,'RAG':9,'Agent':9,'AIGC':9,'深度学习':9,'机器学习':9,
    'Rust':9,'Go':9,'Golang':9,'TypeScript':9,'Python':9,
    'Kubernetes':9,'K8s':9,'Docker':8,'Terraform':8,'云原生':9,
    'React':8,'Vue':8,'Next.js':9,'Nuxt':8,'Tailwind':8,
    'GraphQL':7,'gRPC':7,'WebSocket':7,'微服务':7,'微前端':7,
    // 稳定期 — 中等保鲜分
    'Java':6,'Spring':6,'MySQL':6,'PostgreSQL':7,'Redis':7,
    'C++':5,'C#':5,'.NET':5,'PHP':4,'Ruby':4,
    'Node.js':7,'Express':5,'Django':6,'Flask':6,'FastAPI':8,
    'JavaScript':6,'HTML':5,'CSS':5,'Sass':5,'Bootstrap':4,
    'Git':6,'CI/CD':7,'DevOps':7,'Jenkins':5,'GitHub Actions':7,
    // 衰退期 — 低保鲜分
    'jQuery':2,'Angular.js':2,'Backbone':1,'jsp':1,'ASP':1,'Flash':1,
    'ActionScript':1,'Silverlight':1,'Struts':1,'Hibernate':3,
    // 通用
    'Linux':6,'Nginx':6,'AWS':7,'Azure':7,'GCP':7,'阿里云':6,
    'Elasticsearch':6,'Kafka':7,'RabbitMQ':6,'MongoDB':6,
    'Flutter':7,'React Native':6,'小程序':6,'Electron':5
  };

  /** JD 技术栈关键词提取（复用 resume.js 中部分逻辑的简化版） */
  function extractTechFromJD(jdText) {
    var found = [];
    var keys = Object.keys(TECH_FRESHNESS);
    keys.forEach(function (kw) {
      var escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp('\\b' + escaped + '\\b', 'gi');
      if (re.test(jdText) && found.indexOf(kw) === -1) {
        found.push(kw);
      }
    });
    return found;
  }

  // ================================================================
  //  六维评分引擎
  // ================================================================

  /**
   * 根据用户背景推断经验档位
   */
  function getUserLevel() {
    try {
      var settings = JSON.parse(localStorage.getItem('jobninja_settings')) || {};
      var y = settings.years ? parseInt(settings.years) : null;
      if (!y) {
        var blocks = JSON.parse(localStorage.getItem('jobninja_blocks')) || [];
        var dates = [];
        blocks.forEach(function (b) {
          if (b.type === 'work' && b.date) {
            var yrs = b.date.match(/20\d{2}/g);
            if (yrs && yrs.length >= 1) dates.push(parseInt(yrs[0]));
          }
        });
        if (dates.length > 0) {
          y = new Date().getFullYear() - Math.min.apply(null, dates);
        }
      }
      if (!y || y < 0) return 'fresh';
      if (y <= 2)  return 'j3';
      if (y <= 5)  return 'j5';
      if (y <= 8)  return 'j8';
      return 'senior';
    } catch (_) { return 'j5'; }
  }

  /**
   * 计算单个岗位的六维评分
   * @param {Object} job - { company, title, salary, city, jdText, commuteMinutes, isRemote, fundingStage, employees, teamReputation, growthSpace }
   */
  function calculateScores(job) {
    var level = getUserLevel();
    var cityRef = SALARY_TABLE[job.city] || SALARY_TABLE['default'];
    var range = cityRef[level] || cityRef['j5'];

    // ---- 1. 薪酬健康度 ----
    var salaryScore = 5;
    if (job.salary) {
      var salNum = parseFloat(job.salary);
      if (!isNaN(salNum) && salNum > 0) {
        if (salNum >= range[1])        salaryScore = 10;
        else if (salNum >= range[0])   salaryScore = 7 + Math.round(3 * (salNum - range[0]) / (range[1] - range[0]));
        else if (salNum >= range[0]*0.7) salaryScore = 4 + Math.round(3 * (salNum - range[0]*0.7) / (range[0]*0.3));
        else                           salaryScore = Math.max(1, Math.round(4 * salNum / (range[0]*0.7)));
      }
    }
    salaryScore = Math.min(10, Math.max(1, salaryScore));

    // ---- 2. 通勤弹性 ----
    var commuteScoreVal = 5;
    if (job.isRemote) {
      commuteScoreVal = 10;
    } else if (job.commuteMinutes !== null && job.commuteMinutes !== undefined && !isNaN(job.commuteMinutes)) {
      commuteScoreVal = commuteScore(parseInt(job.commuteMinutes));
    } else {
      commuteScoreVal = 5; // 默认中等
    }
    // 混合办公加分
    if (/(远程|remote|hybrid|混合办公|灵活办公)/i.test(job.jdText || '')) {
      commuteScoreVal = Math.min(10, commuteScoreVal + 2);
    }

    // ---- 3. 技能保鲜期 ----
    var techScore = 5;
    if (job.jdText && job.jdText.trim()) {
      var techs = extractTechFromJD(job.jdText);
      if (techs.length > 0) {
        var totalFresh = 0;
        techs.forEach(function (t) {
          totalFresh += (TECH_FRESHNESS[t] || 5);
        });
        techScore = Math.round(totalFresh / techs.length);
      }
    }
    techScore = Math.min(10, Math.max(1, techScore));

    // ---- 4. 公司稳定度 ----
    var stabilityScore = 5;
    if (job.fundingStage) {
      var stageMap = { '已上市':10, 'D轮及以上':9, 'C轮':8, 'B轮':7, 'A轮':6, '天使轮':4, '未融资':3, 'pre-IPO':9 };
      stabilityScore = stageMap[job.fundingStage] || 5;
    }
    if (job.employees) {
      var empNum = parseInt(job.employees);
      if (!isNaN(empNum)) {
        if (empNum >= 10000) stabilityScore = Math.max(stabilityScore, 10);
        else if (empNum >= 1000) stabilityScore = Math.max(stabilityScore, 8);
        else if (empNum >= 100) stabilityScore = Math.max(stabilityScore, 6);
        else if (empNum >= 20) stabilityScore = Math.max(stabilityScore, 4);
        else stabilityScore = Math.max(stabilityScore, 2);
      }
    }
    stabilityScore = Math.min(10, Math.max(1, stabilityScore));

    // ---- 5. 团队风评 ----
    var teamScore = job.teamReputation || 5;
    teamScore = Math.min(10, Math.max(1, parseInt(teamScore) || 5));

    // ---- 6. 成长空间 ----
    var growthScore = job.growthSpace || 5;
    growthScore = Math.min(10, Math.max(1, parseInt(growthScore) || 5));

    return {
      salary:      salaryScore,
      commute:     commuteScoreVal,
      techFresh:   techScore,
      stability:   stabilityScore,
      team:        teamScore,
      growth:      growthScore
    };
  }

  /**
   * 加权总分
   */
  function weightedTotal(scores, weights) {
    var sum = 0, wSum = 0;
    var keys = ['salary','commute','techFresh','stability','team','growth'];
    keys.forEach(function (k) {
      sum += (scores[k] || 5) * (weights[k] || 1);
      wSum += (weights[k] || 1);
    });
    return wSum > 0 ? Math.round(sum / wSum * 10) / 10 : 5;
  }

  // ================================================================
  //  Canvas 雷达图
  // ================================================================

  function drawRadar(canvas, evaluations, weights) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width;
    var H = canvas.height;
    var cx = W / 2;
    var cy = H / 2;
    var radius = Math.min(cx, cy) - 40;
    var labels = ['薪酬', '通勤', '技术保鲜', '稳定度', '团队风评', '成长'];
    var keys   = ['salary','commute','techFresh','stability','team','growth'];
    var colors = ['#6366f1','#10b981','#f59e0b','#ef4444'];

    ctx.clearRect(0, 0, W, H);

    // 背景网格（5层）
    for (var level = 1; level <= 5; level++) {
      var r = (radius / 5) * level;
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
        var x = cx + r * Math.cos(angle);
        var y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = level === 5 ? '#252536' : '#1a1a26';
      ctx.lineWidth = level === 5 ? 1.5 : 0.5;
      ctx.stroke();
    }

    // 轴线
    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      ctx.strokeStyle = '#1a1a26';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // 标签
    ctx.fillStyle = '#64748b';
    ctx.font = '11px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < 6; i++) {
      var angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
      var lx = cx + (radius + 22) * Math.cos(angle);
      var ly = cy + (radius + 22) * Math.sin(angle);
      ctx.fillText(labels[i], lx, ly);
    }

    // 绘制每个评估的数据多边形
    evaluations.forEach(function (evalObj, idx) {
      var scores = evalObj.scores;
      if (!scores) return;
      var color = colors[idx % colors.length];

      // 填充区域
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
        var val = (scores[keys[i]] || 5) / 10;
        var x = cx + radius * val * Math.cos(angle);
        var y = cy + radius * val * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = color + '15';
      ctx.fill();

      // 描边
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var angle2 = (Math.PI * 2 / 6) * i - Math.PI / 2;
        var val2 = (scores[keys[i]] || 5) / 10;
        var x2 = cx + radius * val2 * Math.cos(angle2);
        var y2 = cy + radius * val2 * Math.sin(angle2);
        if (i === 0) ctx.moveTo(x2, y2);
        else ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 数据点
      for (var j = 0; j < 6; j++) {
        var angle3 = (Math.PI * 2 / 6) * j - Math.PI / 2;
        var val3 = (scores[keys[j]] || 5) / 10;
        var x3 = cx + radius * val3 * Math.cos(angle3);
        var y3 = cy + radius * val3 * Math.sin(angle3);
        ctx.beginPath();
        ctx.arc(x3, y3, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    });

    // 图例
    var legendY = H - 20;
    var legendX = 10;
    evaluations.forEach(function (evalObj, idx) {
      var color = colors[idx % colors.length];
      ctx.fillStyle = color;
      ctx.fillRect(legendX, legendY - 6, 10, 10);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px -apple-system, "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      var label = (evalObj.company || '岗位' + (idx + 1)).substring(0, 8);
      ctx.fillText(label + ' (' + (evalObj.total || '?') + ')', legendX + 14, legendY);
      legendX += ctx.measureText(label + ' (?.?)').width + 30;
    });
  }

  // ================================================================
  //  AI岗位深度分析
  // ================================================================

  function callAIJobAnalysis(job, userResumeSummary, callbacks) {
    var cfg = JN.getApiConfig ? JN.getApiConfig() : {};
    if (!cfg.apiKey || !cfg.endpoint) {
      callbacks.onError && callbacks.onError('请先在「设置」中配置API Key以使用AI分析功能');
      return;
    }

    var prompt = [
      '你是一位资深职业规划师和行业分析师。请对以下岗位进行深度分析：',
      '',
      '【岗位信息】',
      '公司：' + (job.company || '未知'),
      '岗位：' + (job.title || '未知'),
      '城市：' + (job.city || '未知'),
      '月薪：' + (job.salary || '未知') + 'K',
      'JD摘要：' + (job.jdText || '未提供').substring(0, 1500),
      '融资阶段：' + (job.fundingStage || '未知'),
      '公司规模：' + (job.employees || '未知'),
      '',
      '【候选人概要】' + userResumeSummary,
      '',
      '请从以下4个维度进行分析，每个维度2-4句话，使用中文：',
      '1. 发展前景：该岗位所在行业和公司的发展潜力',
      '2. 薪资水平：基于城市和岗位的薪资竞争力评估',
      '3. 技能匹配：候选人当前技能与岗位要求的差距分析',
      '4. 面试策略：针对该岗位的3条面试准备建议',
      '',
      '输出格式（纯文本，每段以维度标题开头）：',
      '【发展前景】...',
      '【薪资水平】...',
      '【技能匹配】...',
      '【面试策略】...'
    ].join('\n');

    callbacks.onStart && callbacks.onStart();

    fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({
        model: cfg.textModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5, max_tokens: 2000
      })
    })
    .then(function(res) {
      if (!res.ok) return res.json().then(function(e) { throw new Error(e.error ? e.error.message : 'API错误(' + res.status + ')'); });
      return res.json();
    })
    .then(function(data) {
      var content = (data.choices && data.choices[0] && data.choices[0].message.content) || '';
      callbacks.onDone && callbacks.onDone(content.trim());
    })
    .catch(function(err) { callbacks.onError && callbacks.onError(err.message || '网络错误'); });
  }

  /** 生成本地竞争力分析（无API降级） */
  function generateLocalAnalysis(job) {
    var config = (function() {
      try { return JSON.parse(localStorage.getItem('jobninja_settings')) || {}; } catch(_) { return {}; }
    })();
    var userYears = config.years || '?';
    var userCity = config.city || '未知';
    var userSalary = (config.salaryMin || '?') + '-' + (config.salaryMax || '?') + 'K';

    var lines = [];
    lines.push('【发展前景】');
    if (job.fundingStage && ['已上市','pre-IPO','D轮及以上','C轮'].indexOf(job.fundingStage) !== -1) {
      lines.push('该公司处于' + job.fundingStage + '阶段，发展较为成熟，平台稳定性较高。');
    } else if (job.fundingStage) {
      lines.push('该公司处于' + job.fundingStage + '阶段，具有一定的发展潜力但也伴随风险。');
    } else {
      lines.push('建议通过天眼查等平台了解公司的融资和发展情况，辅助判断岗位稳定性。');
    }

    lines.push('');
    lines.push('【薪资水平】');
    if (job.salary) {
      var salNum = parseFloat(job.salary);
      if (!isNaN(salNum)) {
        if (salNum >= 30) lines.push('该岗位月薪' + job.salary + 'K，在' + (job.city||'当地') + '属于较高水平。');
        else if (salNum >= 15) lines.push('该岗位月薪' + job.salary + 'K，在' + (job.city||'当地') + '属于中等水平。');
        else lines.push('该岗位月薪' + job.salary + 'K，建议评估综合福利和年终奖金。');
      }
    } else {
      lines.push('未提供薪资信息，建议在面试中主动了解薪资结构和福利待遇。');
    }

    lines.push('');
    lines.push('【技能匹配】');
    lines.push('你目前有' + userYears + '年经验，期望薪资' + userSalary + '。');
    lines.push('请在简历管理面板粘贴JD，使用匹配度报告功能查看详细的技能匹配分析。');

    lines.push('');
    lines.push('【面试策略】');
    lines.push('1. 提前研究目标公司的产品、技术栈和近期动态');
    lines.push('2. 准备3-5个能体现核心能力的STAR案例');
    lines.push('3. 针对JD中的关键技术要求准备深度回答');

    return lines.join('\n');
  }

  // ================================================================
  //  识图填表（Vision API）
  // ================================================================

  /**
   * 调用视觉模型 API 识别岗位截图，返回结构化信息
   * @param {string} base64 - 图片 base64（不含 data:xxx;base64, 前缀）
   * @param {string} mimeType - 如 'image/png' 'image/jpeg'
   * @param {Object} callbacks - { onStart, onDone(data), onError(msg) }
   */
  function scanJobImage(base64, mimeType, callbacks) {
    var cfg = JN.getApiConfig ? JN.getApiConfig() : {};
    if (!cfg.apiKey) {
      callbacks.onError && callbacks.onError('请先在「设置」中配置 API Key');
      return;
    }
    if (!cfg.visionModel) {
      callbacks.onError && callbacks.onError('请先在「设置」中配置视觉模型名称（如 gpt-4o / qwen-vl-max）');
      return;
    }

    var prompt = [
      '你是一个精准的招聘信息提取器。分析这张截图，从中提取以下字段，以 JSON 格式返回。',
      '如果某个字段在截图中没有出现，将其值设为空字符串。',
      '',
      '要求返回的 JSON 格式（不要markdown代码块标记，只输出纯JSON）：',
      '{',
      '  "company": "公司全称",',
      '  "title": "岗位名称",',
      '  "salary": "薪资范围（数字，单位K/月，如截图中是年薪请除以12）",',
      '  "city": "工作城市",',
      '  "jdText": "岗位描述和要求的完整文本（尽可能保留原文）",',
      '  "funding": "融资阶段（如能识别，值为：已上市/pre-IPO/D轮及以上/C轮/B轮/A轮/天使轮/未融资/空）",',
      '  "employees": "公司规模或参保人数（纯数字，如识别不到为空）",',
      '  "isRemote": "是否远程办公（true或false）"',
      '}',
      '',
      '注意：salary 只输出数字（如截图写15-25K输出25，如写20K*15薪输出20），单位是K/月。',
      '注意：不要输出 markdown 代码块标记（```json```），只输出纯 JSON 字符串。'
    ].join('\n');

    callbacks.onStart && callbacks.onStart();

    fetch(cfg.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify({
        model: cfg.visionModel,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: 'data:' + mimeType + ';base64,' + base64 } }
          ]
        }],
        temperature: 0.1,
        max_tokens: 2000
      })
    })
    .then(function (res) {
      if (!res.ok) {
        return res.json().then(function (e) {
          throw new Error(e.error ? e.error.message : 'API 请求失败 (' + res.status + ')');
        });
      }
      return res.json();
    })
    .then(function (data) {
      var content = (data.choices && data.choices[0] && data.choices[0].message.content) || '';
      // 尝试解析 JSON（兼容可能包裹在 ``` 中的情况）
      var json = content.trim();
      var codeMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeMatch) json = codeMatch[1].trim();

      try {
        var parsed = JSON.parse(json);
        callbacks.onDone && callbacks.onDone(parsed);
      } catch (e) {
        // 解析失败，原样返回
        callbacks.onDone && callbacks.onDone({ _raw: content });
      }
    })
    .catch(function (err) {
      callbacks.onError && callbacks.onError(err.message || '识图失败，请检查网络和 API Key');
    });
  }

  // ================================================================
  //  STATE
  // ================================================================

  function loadEvaluations() {
    try { return JSON.parse(localStorage.getItem('jobninja_evaluations')) || []; }
    catch (_) { return []; }
  }

  function saveEvaluations(list) {
    localStorage.setItem('jobninja_evaluations', JSON.stringify(list));
  }

  var evaluations = loadEvaluations();
  var compareSet = []; // 最多3个评估ID用于对比

  // ================================================================
  //  RENDER
  // ================================================================

  function render() {
    var el = document.createElement('div');

    // 默认权重
    var defWeights = { salary: 2, commute: 1, techFresh: 2, stability: 2, team: 1, growth: 3 };

    el.innerHTML =
      // 标题
      '<div style="margin-bottom:16px;">' +
        '<h2 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">' +
          '<i class="fa-solid fa-magnifying-glass-chart" style="color:#f59e0b;margin-right:8px;"></i>岗位评估' +
        '</h2>' +
        '<p style="font-size:13px;color:#64748b;margin:0;">六维深度评估，雷达图可视化对比</p>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +

        // ===== 左栏：岗位表单 =====
        '<div>' +
          '<div class="panel-card" style="margin-bottom:12px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #1a1a26;">' +
              '<i class="fa-solid fa-clipboard-list" style="color:#818cf8;"></i>' +
              '<span style="font-size:13px;font-weight:600;color:#d1d5db;">岗位信息</span>' +
            '</div>' +

            // 基本字段
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
              '<input id="evalCompany" class="ninja-input" placeholder="公司名称" style="font-size:12px;">' +
              '<input id="evalTitle" class="ninja-input" placeholder="岗位名称" style="font-size:12px;">' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
              '<div><input id="evalSalary" class="ninja-input" type="number" placeholder="月薪（K）" style="font-size:12px;"></div>' +
              '<div><input id="evalCity" class="ninja-input" placeholder="城市（如：北京）" style="font-size:12px;"></div>' +
            '</div>' +

            // JD 文本
            '<textarea id="evalJD" class="ninja-input" rows="4" placeholder="粘贴 JD 文本（可选，用于分析技术栈保鲜期）" style="font-size:12px;margin-bottom:8px;"></textarea>' +

            // ---- 识图填表 ----
            '<div id="ocrArea" style="margin-bottom:8px;padding:10px 12px;' +
              'background:#0f0f17;border:1px dashed #252536;border-radius:8px;transition:border-color 0.15s;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                '<span style="font-size:11px;font-weight:600;color:#a5b4fc;">' +
                  '<i class="fa-solid fa-camera" style="margin-right:5px;"></i>截图识图 · 一键填表</span>' +
                '<span style="font-size:10px;color:#4a4a6a;">支持粘贴 / 拖拽 / 点击上传</span>' +
              '</div>' +
              '<div id="ocrDropZone" style="text-align:center;padding:14px;border-radius:6px;' +
                'cursor:pointer;background:#0a0a0f;transition:background 0.12s;position:relative;">' +
                '<input type="file" id="ocrFileInput" accept="image/*" style="display:none;">' +
                '<div id="ocrPlaceholder">' +
                  '<i class="fa-solid fa-image" style="font-size:22px;color:#252536;display:block;margin-bottom:4px;"></i>' +
                  '<span style="font-size:11px;color:#4a4a6a;">粘贴招聘页面截图或点击上传</span>' +
                  '<span style="font-size:10px;color:#252536;display:block;margin-top:2px;">Ctrl+V / 拖拽图片</span>' +
                '</div>' +
                '<img id="ocrPreview" src="" style="display:none;max-width:100%;max-height:120px;border-radius:4px;object-fit:contain;">' +
                '<button id="ocrRemoveImg" style="display:none;position:absolute;top:4px;right:4px;' +
                  'width:20px;height:20px;border-radius:10px;background:rgba(0,0,0,0.6);border:none;color:#f87171;' +
                  'cursor:pointer;font-size:12px;line-height:20px;text-align:center;">&times;</button>' +
              '</div>' +
              '<div id="ocrActions" style="display:none;margin-top:6px;display:flex;gap:6px;">' +
                '<button id="btnOCRScan" class="btn btn-primary" style="font-size:11px;padding:5px 14px;">' +
                  '<i class="fa-solid fa-wand-magic-sparkles" style="font-size:10px;"></i> 开始识别</button>' +
                '<span id="ocrStatus" style="font-size:10px;color:#4a4a6a;display:flex;align-items:center;"></span>' +
              '</div>' +
            '</div>' +

            // 通勤
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
              '<input id="evalCommute" class="ninja-input" type="number" placeholder="通勤时间（分钟）" style="font-size:12px;flex:1;">' +
              '<label style="font-size:11px;color:#64748b;display:flex;align-items:center;gap:4px;white-space:nowrap;">' +
                '<input type="checkbox" id="evalRemote" style="accent-color:#6366f1;"> 远程</label>' +
            '</div>' +

            // 公司稳定度
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
              '<select id="evalFunding" class="ninja-input" style="font-size:12px;flex:1;">' +
                '<option value="">融资阶段（可选）</option>' +
                '<option>已上市</option><option>pre-IPO</option><option>D轮及以上</option>' +
                '<option>C轮</option><option>B轮</option><option>A轮</option>' +
                '<option>天使轮</option><option>未融资</option>' +
              '</select>' +
              '<input id="evalEmployees" class="ninja-input" type="number" placeholder="社保人数" style="font-size:12px;flex:1;">' +
            '</div>' +
            '<div style="margin-bottom:8px;">' +
              '<a id="tianyanchaLink" href="#" target="_blank" style="font-size:11px;color:#4a4a6a;text-decoration:none;">' +
                '<i class="fa-solid fa-magnifying-glass"></i> 查看天眼查公开信息</a>' +
            '</div>' +

            // 团队风评 + 成长空间
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
              '<div>' +
                '<label style="font-size:10px;color:#64748b;">团队风评（1-10）</label>' +
                '<input id="evalTeam" class="ninja-input" type="range" min="1" max="10" value="5" ' +
                  'oninput="this.nextElementSibling.textContent=this.value" style="width:100%;margin:0;accent-color:#6366f1;">' +
                '<span style="font-size:12px;color:#d1d5db;">5</span>' +
              '</div>' +
              '<div>' +
                '<label style="font-size:10px;color:#64748b;">成长空间（1-10）</label>' +
                '<input id="evalGrowth" class="ninja-input" type="range" min="1" max="10" value="5" ' +
                  'oninput="this.nextElementSibling.textContent=this.value" style="width:100%;margin:0;accent-color:#10b981;">' +
                '<span style="font-size:12px;color:#d1d5db;">5</span>' +
              '</div>' +
            '</div>' +

            // 操作按钮
            '<button id="btnEvaluate" class="btn btn-primary" style="font-size:12px;width:100%;">' +
              '<i class="fa-solid fa-chart-simple" style="font-size:11px;"></i> 开始评估</button>' +
            '<div style="border-top:1px solid #1a1a26;margin-top:10px;padding-top:10px;">' +
              '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
                '<i class="fa-solid fa-robot" style="color:#a5b4fc;font-size:11px;"></i>' +
                '<span style="font-size:11px;color:#a5b4fc;font-weight:600;">AI深度分析</span>' +
                '<span style="font-size:9px;color:#4a4a6a;">需API · 可选</span>' +
              '</div>' +
              '<button id="btnAIAnalyze" class="btn btn-outline" style="font-size:11px;width:100%;border-color:#312e81;color:#a5b4fc;">' +
                '<i class="fa-solid fa-brain" style="font-size:10px;"></i> AI竞争力分析</button>' +
              '<button id="btnLocalAnalyze" class="btn btn-outline" style="font-size:11px;width:100%;margin-top:4px;">' +
                '<i class="fa-solid fa-compass" style="font-size:10px;"></i> 本地快速分析</button>' +
            '</div>' +
          '</div>' +

          // 权重调节
          '<div class="panel-card" style="margin-bottom:12px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
              '<i class="fa-solid fa-sliders" style="color:#10b981;"></i>' +
              '<span style="font-size:12px;font-weight:600;color:#d1d5db;">评分权重</span>' +
              '<span style="font-size:10px;color:#4a4a6a;">拖动滑块调整</span>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
              weightSliderHTML('薪酬',   'weightSalary',   defWeights.salary,   '#f59e0b') +
              weightSliderHTML('通勤',   'weightCommute',  defWeights.commute,  '#10b981') +
              weightSliderHTML('技术',   'weightTech',     defWeights.techFresh,'#6366f1') +
              weightSliderHTML('稳定',   'weightStability',defWeights.stability,'#8b5cf6') +
              weightSliderHTML('团队',   'weightTeam',     defWeights.team,     '#ec4899') +
              weightSliderHTML('成长',   'weightGrowth',   defWeights.growth,   '#f97316') +
            '</div>' +
          '</div>' +
        '</div>' +

        // ===== 右栏：AI分析 + 雷达图 + 评估列表 =====
        '<div>' +
          // AI分析结果区
          '<div id="evalAIResult" class="panel-card" style="display:none;margin-bottom:12px;border-color:#312e81;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
              '<span style="font-size:12px;font-weight:600;color:#a5b4fc;">' +
                '<i class="fa-solid fa-robot" style="margin-right:4px;"></i>分析报告</span>' +
              '<div style="display:flex;gap:4px;">' +
                '<button id="evalAICopy" class="btn btn-outline" style="font-size:9px;padding:2px 6px;">复制</button>' +
                '<button id="evalAIClose" class="btn btn-outline" style="font-size:9px;padding:2px 6px;">关闭</button>' +
              '</div>' +
            '</div>' +
            '<div id="evalAIContent" style="font-size:12px;color:#94a3b8;line-height:1.8;white-space:pre-wrap;"></div>' +
          '</div>' +
          // 雷达图
          '<div class="panel-card" style="margin-bottom:12px;padding:12px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
              '<span style="font-size:12px;font-weight:600;color:#d1d5db;">' +
                '<i class="fa-solid fa-chart-pie" style="color:#818cf8;margin-right:4px;"></i>对比雷达图</span>' +
              '<div style="display:flex;gap:4px;">' +
                '<button id="btnClearCompare" class="btn btn-outline" style="font-size:10px;padding:2px 8px;">清空对比</button>' +
              '</div>' +
            '</div>' +
            '<canvas id="radarCanvas" width="400" height="380" style="display:block;margin:0 auto;"></canvas>' +
            '<p id="radarHint" style="text-align:center;font-size:11px;color:#4a4a6a;margin:0;">评估岗位后，点击「加入对比」即可在此查看雷达图</p>' +
          '</div>' +

          // 评估历史
          '<div class="panel-card">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
              '<span style="font-size:12px;font-weight:600;color:#d1d5db;">' +
                '<i class="fa-solid fa-clock-rotate-left" style="color:#64748b;margin-right:4px;"></i>评估记录</span>' +
            '</div>' +
            '<div id="evalHistory" style="max-height:320px;overflow-y:auto;" class="custom-scrollbar">' +
              (evaluations.length === 0
                ? '<div style="text-align:center;padding:32px 16px;color:#4a4a6a;font-size:12px;">暂无评估记录</div>'
                : '') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // ===== 事件绑定 =====

    // ---- 识图填表 ----
    var ocrFileInput   = el.querySelector('#ocrFileInput');
    var ocrDropZone    = el.querySelector('#ocrDropZone');
    var ocrPreview     = el.querySelector('#ocrPreview');
    var ocrPlaceholder = el.querySelector('#ocrPlaceholder');
    var ocrRemoveBtn   = el.querySelector('#ocrRemoveImg');
    var ocrActions     = el.querySelector('#ocrActions');
    var ocrStatus      = el.querySelector('#ocrStatus');
    var ocrScanBtn     = el.querySelector('#btnOCRScan');
    var ocrImageData   = null; // { base64, mimeType }

    function showPreview(imgData) {
      ocrImageData = imgData;
      ocrPreview.src = 'data:' + imgData.mimeType + ';base64,' + imgData.base64;
      ocrPreview.style.display = 'block';
      ocrPlaceholder.style.display = 'none';
      ocrRemoveBtn.style.display = 'block';
      ocrActions.style.display = 'flex';
      ocrStatus.textContent = '';
    }

    function hidePreview() {
      ocrImageData = null;
      ocrPreview.src = '';
      ocrPreview.style.display = 'none';
      ocrPlaceholder.style.display = 'block';
      ocrRemoveBtn.style.display = 'none';
      ocrActions.style.display = 'none';
      ocrStatus.textContent = '';
      ocrFileInput.value = '';
    }

    function handleImageFile(file) {
      if (!file || !file.type.match(/^image\/(png|jpeg|jpg|webp|bmp|gif)$/)) {
        ocrStatus.innerHTML = '<span style="color:#ef4444;">不支持的文件格式</span>';
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        ocrStatus.innerHTML = '<span style="color:#ef4444;">图片不能超过 20MB</span>';
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var dataUrl = e.target.result;
        var parts = dataUrl.split(',');
        var mime = parts[0].match(/data:(.*);base64/)[1];
        var b64 = parts[1];
        showPreview({ base64: b64, mimeType: mime });
      };
      reader.readAsDataURL(file);
    }

    // 点击上传
    ocrDropZone.addEventListener('click', function () { ocrFileInput.click(); });
    ocrFileInput.addEventListener('change', function () {
      if (this.files && this.files[0]) handleImageFile(this.files[0]);
    });

    // 拖拽上传
    ocrDropZone.addEventListener('dragover', function (e) { e.preventDefault(); this.style.background = '#1a1a26'; });
    ocrDropZone.addEventListener('dragleave', function () { this.style.background = '#0a0a0f'; });
    ocrDropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      this.style.background = '#0a0a0f';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
    });

    // 删除预览
    ocrRemoveBtn.addEventListener('click', function (e) { e.stopPropagation(); hidePreview(); });

    // 全局 Ctrl+V 粘贴图片
    el.addEventListener('paste', function (e) {
      // 如果焦点在 input/textarea 中，不截获文本粘贴
      var active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

      var items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.match(/^image\//)) {
          e.preventDefault();
          handleImageFile(items[i].getAsFile());
          return;
        }
      }
    });

    // 开始识别
    ocrScanBtn.addEventListener('click', function () {
      if (!ocrImageData) return;

      ocrScanBtn.disabled = true;
      ocrScanBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 识别中...';
      ocrStatus.innerHTML = '<span style="color:#6366f1;"><i class="fa-solid fa-spinner fa-spin"></i> 正在调用视觉模型识别...</span>';

      scanJobImage(ocrImageData.base64, ocrImageData.mimeType, {
        onStart: function () {},
        onDone: function (data) {
          ocrScanBtn.disabled = false;
          ocrScanBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" style="font-size:10px;"></i> 开始识别';
          ocrStatus.innerHTML = '<span style="color:#10b981;"><i class="fa-solid fa-check"></i> 识别完成，已填入表单</span>';

          // 自动填入表单字段
          if (data.company)   el.querySelector('#evalCompany').value = data.company;
          if (data.title)     el.querySelector('#evalTitle').value = data.title;
          if (data.salary)    el.querySelector('#evalSalary').value = data.salary;
          if (data.city)      el.querySelector('#evalCity').value = data.city;
          if (data.jdText)    el.querySelector('#evalJD').value = data.jdText;
          if (data.funding) {
            var fundSel = el.querySelector('#evalFunding');
            for (var j = 0; j < fundSel.options.length; j++) {
              if (fundSel.options[j].text === data.funding) { fundSel.selectedIndex = j; break; }
            }
          }
          if (data.employees) el.querySelector('#evalEmployees').value = data.employees;
          if (data.isRemote)  el.querySelector('#evalRemote').checked = true;

          JN.setStatusMsg && JN.setStatusMsg('识图完成：' + (data.company || data.title || '信息已填入'));
        },
        onError: function (msg) {
          ocrScanBtn.disabled = false;
          ocrScanBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" style="font-size:10px;"></i> 重试';
          ocrStatus.innerHTML = '<span style="color:#ef4444;">' + msg + '</span>';
        }
      });
    });

    // 天眼查链接
    el.querySelector('#tianyanchaLink').addEventListener('click', function (e) {
      e.preventDefault();
      var company = el.querySelector('#evalCompany').value.trim();
      if (company) {
        window.open('https://www.tianyancha.com/search?key=' + encodeURIComponent(company), '_blank');
      } else {
        window.open('https://www.tianyancha.com', '_blank');
      }
    });

    // 评估按钮
    el.querySelector('#btnEvaluate').addEventListener('click', function () {
      var job = {
        id:        'ev_' + Date.now().toString(36),
        company:   el.querySelector('#evalCompany').value.trim(),
        title:     el.querySelector('#evalTitle').value.trim(),
        salary:    el.querySelector('#evalSalary').value.trim(),
        city:      el.querySelector('#evalCity').value.trim(),
        jdText:    el.querySelector('#evalJD').value.trim(),
        commuteMinutes: el.querySelector('#evalCommute').value.trim() || null,
        isRemote:  el.querySelector('#evalRemote').checked,
        fundingStage: el.querySelector('#evalFunding').value,
        employees: el.querySelector('#evalEmployees').value.trim() || null,
        teamReputation: parseInt(el.querySelector('#evalTeam').nextElementSibling.textContent) || 5,
        growthSpace:    parseInt(el.querySelector('#evalGrowth').nextElementSibling.textContent) || 5,
        createdAt: new Date().toISOString()
      };

      if (!job.company && !job.title) {
        JN.showToast('请至少填写公司名称或岗位名称', 'warning');
        return;
      }

      // 读取权重
      var weights = {
        salary:    parseInt(el.querySelector('#weightSalary') ? el.querySelector('#weightSalary').value : 2) || 2,
        commute:   parseInt(el.querySelector('#weightCommute') ? el.querySelector('#weightCommute').value : 1) || 1,
        techFresh: parseInt(el.querySelector('#weightTech') ? el.querySelector('#weightTech').value : 2) || 2,
        stability: parseInt(el.querySelector('#weightStability') ? el.querySelector('#weightStability').value : 2) || 2,
        team:      parseInt(el.querySelector('#weightTeam') ? el.querySelector('#weightTeam').value : 1) || 1,
        growth:    parseInt(el.querySelector('#weightGrowth') ? el.querySelector('#weightGrowth').value : 3) || 3
      };

      var scores = calculateScores(job);
      var total = weightedTotal(scores, weights);
      job.scores  = scores;
      job.total   = total;
      job.weights = weights;

      // 保存
      evaluations.unshift(job);
      if (evaluations.length > 50) evaluations = evaluations.slice(0, 50);
      saveEvaluations(evaluations);

      // 刷新历史列表
      refreshEvalHistory(el);

      // 清空输入
      ['evalCompany','evalTitle','evalSalary','evalCity','evalJD','evalCommute','evalEmployees','evalFunding'].forEach(function (id) {
        var inp = el.querySelector('#' + id);
        if (inp) inp.value = '';
      });
      el.querySelector('#evalRemote').checked = false;

      JN.setStatusMsg && JN.setStatusMsg('评估完成：' + (job.company || job.title) + ' 总分 ' + total);
    });

    // AI深度分析
    el.querySelector('#btnAIAnalyze').addEventListener('click', function() {
      var company = el.querySelector('#evalCompany').value.trim();
      var title = el.querySelector('#evalTitle').value.trim();
      if (!company && !title) { JN.showToast('请至少填写公司或岗位名称', 'warning'); return; }

      var job = {
        company: company, title: title,
        salary: el.querySelector('#evalSalary').value.trim(),
        city: el.querySelector('#evalCity').value.trim(),
        jdText: el.querySelector('#evalJD').value.trim(),
        fundingStage: el.querySelector('#evalFunding').value,
        employees: el.querySelector('#evalEmployees').value.trim()
      };
      var userSummary = (function() {
        try { var s = JSON.parse(localStorage.getItem('jobninja_settings')) || {}; return s.years ? s.years + '年经验' : ''; } catch(_) { return ''; }
      })();

      var btn = el.querySelector('#btnAIAnalyze');
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 分析中...';

      callAIJobAnalysis(job, userSummary, {
        onStart: function() {},
        onDone: function(result) {
          btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-brain" style="font-size:10px;"></i> AI竞争力分析';
          var area = el.querySelector('#evalAIResult');
          var content = el.querySelector('#evalAIContent');
          if (area && content) { area.style.display = 'block'; content.textContent = result; }
          JN.showToast('AI分析完成', 'success');
        },
        onError: function(msg) {
          btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-brain" style="font-size:10px;"></i> AI竞争力分析';
          JN.showToast(msg, 'warning');
          // 降级为本地分析
          var job2 = {
            company: el.querySelector('#evalCompany').value.trim(),
            title: el.querySelector('#evalTitle').value.trim(),
            salary: el.querySelector('#evalSalary').value.trim(),
            city: el.querySelector('#evalCity').value.trim(),
            jdText: el.querySelector('#evalJD').value.trim(),
            fundingStage: el.querySelector('#evalFunding').value,
            employees: el.querySelector('#evalEmployees').value.trim()
          };
          var localResult = generateLocalAnalysis(job2);
          var area = el.querySelector('#evalAIResult');
          var content = el.querySelector('#evalAIContent');
          if (area && content) { area.style.display = 'block'; content.textContent = localResult; }
        }
      });
    });

    // 本地快速分析
    el.querySelector('#btnLocalAnalyze').addEventListener('click', function() {
      var company = el.querySelector('#evalCompany').value.trim();
      var title = el.querySelector('#evalTitle').value.trim();
      if (!company && !title) { JN.showToast('请至少填写公司或岗位名称', 'warning'); return; }
      var job = {
        company: company, title: title,
        salary: el.querySelector('#evalSalary').value.trim(),
        city: el.querySelector('#evalCity').value.trim(),
        jdText: el.querySelector('#evalJD').value.trim(),
        fundingStage: el.querySelector('#evalFunding').value,
        employees: el.querySelector('#evalEmployees').value.trim()
      };
      var result = generateLocalAnalysis(job);
      var area = el.querySelector('#evalAIResult');
      var content = el.querySelector('#evalAIContent');
      if (area && content) { area.style.display = 'block'; content.textContent = result; }
    });

    // AI结果关闭/复制
    el.querySelector('#evalAIClose').addEventListener('click', function() {
      el.querySelector('#evalAIResult').style.display = 'none';
    });
    el.querySelector('#evalAICopy').addEventListener('click', function() {
      var text = el.querySelector('#evalAIContent').textContent;
      if (!text.trim()) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() { JN.showToast('已复制', 'success'); });
      } else {
        var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); JN.showToast('已复制', 'success'); } catch(_) { JN.showToast('复制失败', 'error'); }
        document.body.removeChild(ta);
      }
    });

    // 清空对比
    el.querySelector('#btnClearCompare').addEventListener('click', function () {
      compareSet = [];
      refreshRadar(el);
      JN.setStatusMsg && JN.setStatusMsg('对比列表已清空');
    });

    // 初始化
    refreshEvalHistory(el);
    refreshRadar(el);

    return el;
  }

  // ================================================================
  //  辅助渲染函数
  // ================================================================

  function weightSliderHTML(label, id, defVal, color) {
    return '<div style="display:flex;align-items:center;gap:6px;">' +
      '<span style="font-size:10px;color:#64748b;width:24px;">' + label + '</span>' +
      '<input id="' + id + '" type="range" min="1" max="5" value="' + defVal + '" ' +
        'style="flex:1;accent-color:' + color + ';height:4px;" ' +
        'oninput="this.nextElementSibling.textContent=this.value">' +
      '<span style="font-size:11px;color:#d1d5db;width:14px;text-align:right;">' + defVal + '</span>' +
    '</div>';
  }

  function refreshEvalHistory(el) {
    var container = el.querySelector('#evalHistory');
    if (!container) return;

    if (evaluations.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:32px 16px;color:#4a4a6a;font-size:12px;">暂无评估记录</div>';
      return;
    }

    var html = '';
    evaluations.forEach(function (job, idx) {
      var dimLabels = ['薪酬','通勤','技术','稳定','团队','成长'];
      var dimKeys   = ['salary','commute','techFresh','stability','team','growth'];
      var dimColors = ['#f59e0b','#10b981','#6366f1','#8b5cf6','#ec4899','#f97316'];

      var scoreBars = '';
      dimKeys.forEach(function (k, i) {
        var val = (job.scores && job.scores[k]) || 5;
        scoreBars +=
          '<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">' +
            '<span style="font-size:9px;color:#64748b;width:20px;">' + dimLabels[i] + '</span>' +
            '<div style="flex:1;height:4px;background:#1a1a26;border-radius:2px;overflow:hidden;">' +
              '<div style="width:' + (val*10) + '%;height:100%;background:' + dimColors[i] + ';border-radius:2px;"></div>' +
            '</div>' +
            '<span style="font-size:9px;color:#94a3b8;width:14px;text-align:right;">' + val + '</span>' +
          '</div>';
      });

      html +=
        '<div style="padding:10px 12px;margin-bottom:6px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
            '<div style="display:flex;align-items:center;gap:6px;min-width:0;">' +
              '<span style="font-size:12px;font-weight:600;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                (job.company || '未知名') + '</span>' +
              '<span style="font-size:10px;color:#4a4a6a;">' + (job.title || '') + '</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">' +
              '<span style="font-size:14px;font-weight:700;color:#f59e0b;">' + (job.total || '?') + '</span>' +
              '<span style="font-size:9px;color:#4a4a6a;">/10</span>' +
            '</div>' +
          '</div>' +
          scoreBars +
          '<div style="display:flex;gap:4px;margin-top:6px;">' +
            '<button class="btn-compare-add" data-idx="' + idx + '" ' +
              'style="font-size:9px;padding:2px 8px;background:#1e1e32;border:1px solid #312e81;border-radius:4px;color:#a5b4fc;cursor:pointer;">' +
              '加入对比</button>' +
            '<button class="btn-eval-del" data-idx="' + idx + '" ' +
              'style="font-size:9px;padding:2px 8px;background:transparent;border:1px solid #1a1a26;border-radius:4px;color:#4a4a6a;cursor:pointer;">' +
              '删除</button>' +
          '</div>' +
        '</div>';
    });

    container.innerHTML = html;

    // 加入对比按钮
    container.querySelectorAll('.btn-compare-add').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(this.getAttribute('data-idx'));
        var job = evaluations[i];
        if (!job) return;

        // 检查是否已在对比列表
        var exists = compareSet.some(function (e) { return e.id === job.id; });
        if (exists) {
          JN.setStatusMsg && JN.setStatusMsg('该岗位已在对比列表中');
          return;
        }
        if (compareSet.length >= 3) {
          compareSet.shift(); // 移除最早的
        }
        compareSet.push(job);
        refreshRadar(el);
        JN.setStatusMsg && JN.setStatusMsg('已加入对比（共 ' + compareSet.length + ' 个）');
      });
    });

    // 删除按钮
    container.querySelectorAll('.btn-eval-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!confirm('确定删除该评估记录吗？此操作不可恢复。')) return;
        var i = parseInt(this.getAttribute('data-idx'));
        var removed = evaluations.splice(i, 1)[0];
        saveEvaluations(evaluations);
        compareSet = compareSet.filter(function (e) { return e.id !== removed.id; });
        refreshEvalHistory(el);
        refreshRadar(el);
        JN.showToast('评估记录已删除', 'info');
      });
    });
  }

  function refreshRadar(el) {
    var canvas = el.querySelector('#radarCanvas');
    var hint = el.querySelector('#radarHint');
    if (!canvas) return;

    if (compareSet.length === 0) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (hint) hint.style.display = 'block';
      return;
    }

    if (hint) hint.style.display = 'none';
    var weights = compareSet[0].weights || { salary:2, commute:1, techFresh:2, stability:2, team:1, growth:3 };
    drawRadar(canvas, compareSet, weights);
  }

  // ================================================================
  //  REGISTER
  // ================================================================

  JN.registerPanel({
    id: 'evaluate',
    title: '岗位评估',
    icon: 'fa-magnifying-glass-chart',
    render: render,
    onActivate: function () {
      evaluations = loadEvaluations();
      // 触发 radar 刷新（需要在 DOM 中找到 canvas）
    }
  });

})();
