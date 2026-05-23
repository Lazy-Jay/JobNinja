/**
 * JobNinja — resume.js
 * 简历管理：上传解析 → 积木化管理 → JD匹配 → 智能生成 → 导出
 * 全部前端处理，不上传任何数据。
 */
(function () {
  if (!window.JobNinja) return;
  var JN = window.JobNinja;

  // ================================================================
  //  常量定义
  // ================================================================
  var STORAGE_BLOCKS = 'jobninja_blocks';
  var STORAGE_BASIC  = 'jobninja_basic';
  var STORAGE_ORDER  = 'jobninja_block_order';

  // 技术栈关键词库
  var TECH_DB = [
    'JavaScript','TypeScript','Python','Java','Go','Golang','Rust','C\\+\\+','C#','Ruby','PHP','Swift','Kotlin','Scala','Dart',
    'React','React\\.js','Vue','Vue\\.js','Angular','Angular\\.js','Next\\.js','Nuxt','Nuxt\\.js','Svelte','Solid\\.js','jQuery',
    'Node\\.js','Node','Express','Koa','Nest\\.js','Deno','Bun',
    'Spring','Spring Boot','Spring Cloud','Django','Flask','FastAPI','Rails','Laravel','Gin','Beego',
    'MySQL','PostgreSQL','MongoDB','Redis','Elasticsearch','ClickHouse','TiDB','SQLite','Oracle','SQL Server',
    'Docker','Kubernetes','K8s','AWS','Azure','GCP','阿里云','腾讯云','华为云','Jenkins','GitLab CI','GitHub Actions','Terraform',
    'Git','SVN','Webpack','Vite','Rollup','esbuild','Babel','SWC',
    'GraphQL','REST','RESTful','gRPC','WebSocket','MQTT','Kafka','RabbitMQ','RocketMQ','Nginx','Apache','Traefik',
    'HTML','HTML5','CSS','CSS3','Sass','Less','Tailwind','Tailwind CSS','Bootstrap','Ant Design','Element','Element UI','Material UI',
    'Linux','Shell','Bash','TCP/IP','HTTP','HTTPS','DNS','CDN',
    'Hadoop','Spark','Flink','Hive','HBase','Kafka Streams','Storm',
    'TensorFlow','PyTorch','Keras','Scikit-learn','Pandas','NumPy','OpenCV','NLP','CV',
    'React Native','Flutter','Uni-app','Taro','Electron','小程序','微信小程序',
    '微服务','微前端','DDD','敏捷','Scrum','Kanban','DevOps','CI/CD','TDD',
    'AI','人工智能','机器学习','深度学习','大模型','LLM','RAG','Agent'
  ];

  // 软技能关键词
  var SOFT_DB = [
    '沟通能力','团队合作','团队协作','领导力','领导能力','项目管理','问题解决','解决问题',
    '抗压能力','时间管理','自驱力','学习能力','逻辑思维','逻辑能力',
    '英语流利','英语读写','英语口语','英语',
    '跨部门','跨团队','需求分析','需求评审','技术方案','方案设计',
    '代码评审','Code Review','技术分享','技术选型','架构设计',
    '数据分析','数据驱动','用户导向','结果导向','owner','ownership',
    '执行力','推动力','创新','主动性','责任心','细致','耐心'
  ];

  // 简历段落标题模式
  var SECTION_PATTERNS = {
    basic:    /^\s*(基本信息|个人信息|个人资料|联系方式|个人简历|简历|Personal\s*Info|Contact|Profile)\s*$/i,
    education:/^\s*(教育经历|教育背景|学历|学习经历|学术背景|Education|Academic|Qualification)\s*$/i,
    work:     /^\s*(工作经历|工作经验|工作履历|实习经历|从业经历|职业经历|Work\s*Experience|Experience|Employment|Professional|Career)\s*$/i,
    project:  /^\s*(项目经历|项目经验|项目|Projects|Project\s*Experience|Portfolio|主要项目)\s*$/i,
    skill:    /^\s*(技能|专业技能|技术栈|个人技能|语言能力|证书|Skills|Technical\s*Skills|Technologies|Tech\s*Stack|Language|Certification)\s*$/i
  };

  // PDF.js worker 配置
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // ================================================================
  //  隐私脱敏引擎
  // ================================================================
  var COMPANY_PATTERNS = [
    /[\w一-鿿]{2,6}(?:科技|网络|软件|信息|数据|云|金融|医疗|教育|传媒|电商|游戏|出行|物流)(?:有限公司|股份|集团|公司|技术)?/g,
    /[\w一-鿿]{2,6}(?:公司|集团|企业|工作室|实验室)/g,
    /(?:字节跳动|阿里巴巴|腾讯|百度|美团|滴滴|京东|网易|快手|拼多多|华为|小米|OPPO|vivo|联想|中兴|海康|大疆|商汤|旷视|寒武纪)/g,
    /[A-Z][a-z]+(?:\s[A-Z][a-z]+)?(?:\s(?:Inc|Corp|Ltd|LLC|Technologies|Software|Solutions|Labs))/g
  ];

  var PROJECT_PATTERNS = [
    /[「「][^」」]{2,20}[」」]/g,
    /《[^》]{2,30}》/g,
    /[\w一-鿿]{2,10}(?:系统|平台|引擎|中台|服务|工具|框架|组件|SDK|App|APP|应用|产品)/g,
    /(?:项目|Project)\s*[:：]\s*[\w一-鿿]{2,20}/gi
  ];

  var NAME_PATTERNS = [
    /(?:张|李|王|刘|陈|杨|赵|黄|周|吴|徐|孙|胡|朱|高|林|何|郭|马|罗|梁|宋|郑|谢|韩|唐|冯|于|董|萧|程|曹|袁|邓|许|傅|沈|曾|彭|吕|苏|卢|蒋|蔡|贾|丁|魏|薛|叶|阎|余|潘|杜|戴|夏|钟|汪|田|任|姜|范|方|石|姚|谭|廖|邹|熊|金|陆|郝|孔|白|崔|康|毛|邱|秦|江|史|顾|侯|邵|孟|龙|万|段|雷|钱|汤|尹|易|常|武|乔|贺|赖|龚|文)[一-鿿]{1,2}(?!\s*(?:科技|网络|软件|公司|集团|大学|学院|医院|银行|政府|部门|团队|总监|经理|工程师|架构师|设计师|程序员|分析师|运营|产品))/g,
    /(?:同学|老师|老板|经理|总监|总|哥|姐|工|博|导)(?!\s*(?:科技|网络|软件|公司|集团|大学|学院))/g
  ];

  var NUMBER_PATTERNS = [
    /(?:提升|增长|提高|增加|上升|降低|减少|下降|优化|改善|缩短|节省|节约|带来|实现|达成|完成|达到|超过|突破)(?:了|约|近|达)?\s*(\d+(?:\.\d+)?)\s*%/g,
    /(?:日活|月活|用户|日活用户|月活用户|DAU|MAU|GMV|PV|UV|QPS|TPS|营收|收入|流水|金额|预算|成本)\s*(?:达|到|超|过|突破|约|近)?\s*(\d+(?:\.\d+)?)\s*(?:万|亿|k|w|M|B)?/gi,
    /(\d+(?:\.\d+)?)\s*倍/g
  ];

  var DESENSITIZE_MAP = {
    company: ['某互联网公司', '某科技企业', '某行业头部公司', '某跨国企业', '某独角兽企业'],
    project: ['核心业务系统', '某平台级产品', '内部基础服务', '某商业化项目', '某数据产品'],
    number_small: '显著',
    number_medium: '大幅',
    number_large: '数倍',
    number_pct: '显著提升',
    number_pct_down: '大幅降低',
    number_user: '海量用户',
    number_revenue: '可观营收'
  };

  function desensitize(text) {
    var result = text;
    var map = DESENSITIZE_MAP;
    var compIdx = 0, projIdx = 0;

    // 替换公司名
    COMPANY_PATTERNS.forEach(function (re) {
      result = result.replace(re, function () {
        var rep = map.company[compIdx % map.company.length];
        compIdx++;
        return rep;
      });
    });

    // 替换项目名
    PROJECT_PATTERNS.forEach(function (re) {
      result = result.replace(re, function () {
        var rep = map.project[projIdx % map.project.length];
        projIdx++;
        return rep;
      });
    });

    // 替换人名
    NAME_PATTERNS.forEach(function (re) {
      result = result.replace(re, '某同事');
    });

    // 替换数字
    NUMBER_PATTERNS.forEach(function (re) {
      result = result.replace(re, function (full) {
        if (/提升|增长|提高|增加|上升|改善|缩短|节省|节约|实现|达成|完成|达到|超过|突破/.test(full)) {
          return full.replace(/\d+(?:\.\d+)?\s*%/, map.number_pct);
        }
        if (/降低|减少|下降/.test(full)) {
          return full.replace(/\d+(?:\.\d+)?\s*%/, map.number_pct_down);
        }
        if (/日活|月活|用户|DAU|MAU|PV|UV/.test(full)) {
          return full.replace(/\d+(?:\.\d+)?\s*(?:万|亿|k|w|M|B)?/gi, map.number_user);
        }
        if (/营收|收入|流水|金额|预算|成本|GMV/.test(full)) {
          return full.replace(/\d+(?:\.\d+)?\s*(?:万|亿|k|w|M|B)?/gi, map.number_revenue);
        }
        if (/倍/.test(full)) {
          return full.replace(/\d+(?:\.\d+)?\s*倍/g, map.number_large);
        }
        return full.replace(/\d+(?:\.\d+)?/g, map.number_medium);
      });
    });

    return result;
  }

  // ================================================================
  //  本地润色引擎（纯规则，无需API）
  // ================================================================
  var LOCAL_POLISH_RULES = [
    // 弱化词清理
    { from: /(?:只是|仅仅|只不过)/g, to: '' },
    { from: /(?:可能|也许|大概|似乎)/g, to: '' },
    { from: /差不多/g, to: '' },
    { from: /基本(?:上)?/g, to: '' },
    // 动词升级
    { from: /参与了?(\S*项目)/g, to: '主导$1' },
    { from: /帮(?:助|忙)/g, to: '协助' },
    { from: /做了?一些/g, to: '完成' },
    { from: /做了?很多/g, to: '高效完成多项' },
    { from: /做得?不错/g, to: '出色完成' },
    { from: /做得?好/g, to: '达成预期目标' },
    { from: /完成了?任务/g, to: '达成关键目标' },
    { from: /按时完成/g, to: '提前交付' },
    { from: /(?:学过|了解)/g, to: '具备' },
    { from: /比较熟/g, to: '精通' },
    { from: /能(?:够|做)/g, to: '擅长' },
    { from: /写(?:了|过)(?:一些)?代码/g, to: '完成核心模块开发' },
    { from: /改(?:了|过)?bug/g, to: '修复关键缺陷' },
    { from: /加(?:了|些)?功能/g, to: '迭代核心功能' },
    { from: /日常工[作组]/g, to: '核心业务' },
    // 表达增强
    { from: /负责(?!人)(\S{2,20})的/g, to: '主导$1的' },
    { from: /[，,]\s*等\s*[。\.]/g, to: '。' },
    { from: /[，,]\s*等等/g, to: '等' },
    { from: /各种/g, to: '多元' }
  ];

  function polishTextLocal(text) {
    var result = text;
    LOCAL_POLISH_RULES.forEach(function(rule) {
      result = result.replace(rule.from, rule.to);
    });
    // 清理多余空格
    result = result.replace(/[ ]{2,}/g, ' ');
    // 清理多余换行
    result = result.replace(/\n{3,}/g, '\n\n');
    // 中文间多余空格
    result = result.replace(/([一-鿿])\s+([一-鿿])/g, '$1$2');
    return result.trim();
  }

  // ================================================================
  //  AI 润色（高级增强，需要API配置）
  // ================================================================
  function callAIPolish(desensitizedText, options) {
    var cfg = JN.getApiConfig ? JN.getApiConfig() : {};
    if (!cfg.apiKey) {
      var localResult = polishTextLocal(desensitizedText);
      if (localResult !== desensitizedText) {
        options.onDone && options.onDone(localResult);
      } else {
        options.onError && options.onError('未检测到可优化的表达，或配置API Key获得AI深度润色');
      }
      return { abort: function() {} };
    }
    if (!cfg.endpoint) {
      var localResult2 = polishTextLocal(desensitizedText);
      if (localResult2 !== desensitizedText) {
        options.onDone && options.onDone(localResult2);
      } else {
        options.onError && options.onError('未检测到可优化的表达');
      }
      return { abort: function() {} };
    }

    var prompt = [
      '你是一位资深简历顾问。请将以下经历描述优化为 STAR 法则格式，要求：',
      '1. 用词专业、简洁、有力',
      '2. 尽量量化成果（基于脱敏后的泛化数据做合理推断）',
      '3. 保持原意，不凭空添加经历',
      '4. 直接输出优化后的中文描述，不要解释、不要前缀',
      '',
      '原始描述：',
      desensitizedText
    ].join('\n');

    options.onProgress && options.onProgress('loading');

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

    fetch(cfg.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify({
        model: cfg.textModel,
        messages: [
          { role: 'system', content: '你是一位资深简历顾问，擅长用 STAR 法则优化简历。只输出优化后的文本。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 1500
      }),
      signal: controller ? controller.signal : undefined
    })
    .then(function (res) {
      if (!res.ok) {
        return res.json().then(function (err) {
          throw new Error(err.error ? err.error.message : 'API 请求失败 (' + res.status + ')');
        });
      }
      return res.json();
    })
    .then(function (data) {
      var polished = (data.choices && data.choices[0] && data.choices[0].message.content) || '';
      if (!polished.trim()) {
        throw new Error('AI 返回内容为空，请重试');
      }
      options.onDone && options.onDone(polished.trim());
    })
    .catch(function (err) {
      if (err.name === 'AbortError') {
        options.onError && options.onError('已取消');
      } else {
        options.onError && options.onError(err.message || '网络错误，请检查 API Key 和网络连接');
      }
    });

    return { abort: function() { if (controller) controller.abort(); } };
  }

  // ================================================================
  //  润色对比弹窗（本地润色默认 + AI增强可选）
  // ================================================================
  function showPolishModal(block, idx) {
    var original = block.description || '';
    if (original.trim().length < 20) {
      JN.showToast('该积木描述内容过短，不适合润色', 'warning'); return;
    }

    // 立即执行本地润色
    var localPolished = polishTextLocal(original);

    var overlay = document.createElement('div');
    overlay.id = 'polishModalOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:999;display:flex;align-items:center;justify-content:center;';

    var hasLocalChange = localPolished !== original;

    var modalHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;padding:0;width:95%;max-width:720px;max-height:85vh;display:flex;flex-direction:column;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #1a1a26;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<i class="fa-solid fa-wand-magic-sparkles" style="color:#10b981;font-size:16px;"></i>' +
            '<div>' +
              '<h4 style="font-size:15px;color:#e2e8f0;margin:0;">智能润色</h4>' +
              '<p style="font-size:11px;color:#64748b;margin:0;">' + (block.title || '无标题') + ' · 本地引擎</p>' +
            '</div>' +
          '</div>' +
          '<button id="polishClose" style="background:none;border:none;color:#4a4a6a;cursor:pointer;font-size:18px;padding:4px;">&times;</button>' +
        '</div>' +
        '<div style="flex:1;overflow-y:auto;padding:16px 20px;display:grid;grid-template-columns:1fr 1fr;gap:14px;" class="custom-scrollbar">' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' +
              '<span style="font-size:10px;padding:2px 6px;background:#1a1a26;color:#94a3b8;border-radius:3px;">原始描述</span>' +
              '<span style="font-size:12px;color:#94a3b8;">可编辑后重新润色</span>' +
            '</div>' +
            '<textarea id="polishInput" style="width:100%;height:200px;padding:10px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:8px;color:#d1d5db;font-size:12px;line-height:1.6;resize:vertical;">' +
              original.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
            '</textarea>' +
          '</div>' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' +
              '<span style="font-size:10px;padding:2px 6px;background:#064e3b;color:#34d399;border-radius:3px;">润色结果</span>' +
              '<span id="polishStatus" style="font-size:11px;color:#4a4a6a;">' + (hasLocalChange ? '本地引擎已优化' : '可手动编辑或AI增强') + '</span>' +
            '</div>' +
            '<div id="polishResult" style="width:100%;height:200px;padding:10px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:8px;color:#d1d5db;font-size:12px;line-height:1.6;overflow-y:auto;white-space:pre-wrap;">' +
              (hasLocalChange ? localPolished.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '<span style="color:#64748b;">本地引擎未检测到需优化的表达。可手动编辑左侧原文，或使用AI增强获得深度润色。</span>') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="padding:14px 20px;border-top:1px solid #1a1a26;display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<i class="fa-solid fa-shield-halved" style="color:#10b981;font-size:13px;"></i>' +
            '<span style="font-size:11px;color:#6ee7b7;">数据仅存储于本机</span>' +
          '</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<button id="polishLocalBtn" class="btn btn-outline" style="font-size:12px;background:#1e1e32;border-color:#312e81;color:#a5b4fc;">' +
              '<i class="fa-solid fa-rotate" style="font-size:11px;"></i> 重新本地润色</button>' +
            '<button id="polishAIBtn" class="btn btn-outline" style="font-size:12px;background:transparent;border:1px solid #312e81;color:#a5b4fc;" title="需配置API Key">' +
              '<i class="fa-solid fa-robot" style="font-size:11px;"></i> AI增强</button>' +
            '<button id="polishAcceptBtn" class="btn btn-primary" style="font-size:12px;' + (hasLocalChange ? '' : 'display:none;') + '">' +
              '<i class="fa-solid fa-check" style="font-size:11px;"></i> 接受并替换</button>' +
            '<button id="polishCancelBtn" class="btn btn-outline" style="font-size:12px;">关闭</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    overlay.innerHTML = modalHTML;
    document.body.appendChild(overlay);

    var polishedResult = hasLocalChange ? localPolished : '';

    function close() { document.body.removeChild(overlay); }
    overlay.querySelector('#polishClose').addEventListener('click', close);
    overlay.querySelector('#polishCancelBtn').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    var acceptBtn = overlay.querySelector('#polishAcceptBtn');
    var resultEl = overlay.querySelector('#polishResult');
    var statusEl = overlay.querySelector('#polishStatus');
    var inputEl = overlay.querySelector('#polishInput');

    // 重新本地润色
    overlay.querySelector('#polishLocalBtn').addEventListener('click', function() {
      var text = inputEl.value.trim();
      if (!text) return;
      var result = polishTextLocal(text);
      polishedResult = result;
      resultEl.textContent = result;
      resultEl.style.color = '#d1d5db';
      statusEl.textContent = result !== text ? '本地引擎已优化' : '未检测到可优化的表达';
      statusEl.style.color = result !== text ? '#10b981' : '#f59e0b';
      acceptBtn.style.display = result !== text ? 'inline-flex' : 'none';
    });

    // AI增强（调用API或降级）
    overlay.querySelector('#polishAIBtn').addEventListener('click', function() {
      var text = inputEl.value.trim();
      if (!text) return;
      var aiBtn = overlay.querySelector('#polishAIBtn');
      aiBtn.disabled = true;
      aiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AI处理中...';
      statusEl.textContent = '正在调用AI...';
      statusEl.style.color = '#6366f1';
      resultEl.textContent = '';
      resultEl.style.color = '#64748b';

      var desensitized = desensitize(text);
      callAIPolish(desensitized, {
        onProgress: function() {},
        onDone: function(result) {
          polishedResult = result;
          resultEl.textContent = result;
          resultEl.style.color = '#d1d5db';
          statusEl.textContent = '润色完成';
          statusEl.style.color = '#10b981';
          aiBtn.disabled = false;
          aiBtn.innerHTML = '<i class="fa-solid fa-robot" style="font-size:11px;"></i> AI增强';
          acceptBtn.style.display = 'inline-flex';
        },
        onError: function(errMsg) {
          resultEl.innerHTML = '<span style="color:#f59e0b;">' + errMsg + '</span>';
          statusEl.textContent = '可尝试本地润色';
          statusEl.style.color = '#f59e0b';
          aiBtn.disabled = false;
          aiBtn.innerHTML = '<i class="fa-solid fa-robot" style="font-size:11px;"></i> AI增强';
        }
      });
    });

    acceptBtn.addEventListener('click', function () {
      if (!polishedResult) return;
      _allBlocks[idx].description = polishedResult;
      _allBlocks[idx].tags = matchTechKeywords(polishedResult).concat(matchSoftSkills(polishedResult));
      saveBlocks(_allBlocks);
      close();
      refreshBlockList();
      if (_selectedBlocks.length > 0) {
        var found = _selectedBlocks.some(function (sb) { return sb.id === _allBlocks[idx].id; });
        if (found) refreshPreview();
      }
      JN.setStatusMsg && JN.setStatusMsg('已应用润色结果');
    });
  }

  // ================================================================
  //  工具函数
  // ================================================================
  function uid() {
    return 'b_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }
  function loadBlocks() {
    try { return JSON.parse(localStorage.getItem(STORAGE_BLOCKS)) || []; }
    catch (_) { return []; }
  }
  function saveBlocks(blocks) {
    localStorage.setItem(STORAGE_BLOCKS, JSON.stringify(blocks));
    localStorage.setItem(STORAGE_ORDER, JSON.stringify(blocks.map(function (b) { return b.id; })));
  }
  function loadBasicInfo() {
    try { return JSON.parse(localStorage.getItem(STORAGE_BASIC)) || { name: '', email: '', phone: '' }; }
    catch (_) { return { name: '', email: '', phone: '' }; }
  }
  function saveBasicInfo(info) {
    localStorage.setItem(STORAGE_BASIC, JSON.stringify(info));
  }
  function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function matchTechKeywords(text) {
    var found = [];
    TECH_DB.forEach(function (kw) {
      var re = new RegExp('\\b' + kw + '\\b|' + escapeRegExp(kw), 'gi');
      if (re.test(text)) {
        var normalized = kw.replace(/\\\\/g, '').replace(/\\/g, '');
        if (found.indexOf(normalized) === -1) found.push(normalized);
      }
    });
    return found;
  }
  function matchSoftSkills(text) {
    return SOFT_DB.filter(function (s) { return text.indexOf(s) !== -1; });
  }
  function fmtDate(d) {
    if (!d) return '';
    return d.replace(/至/g, ' - ').replace(/\s+/g, ' ').trim();
  }

  // ================================================================
  //  简历文本解析引擎（增强版 — 关键词智能匹配）
  // ================================================================

  // 中文简历关键词库
  var BASIC_FIELDS = {
    name:    ['姓名', '名字'],
    phone:   ['电话', '手机', '联系电话', '手机号码', 'Tel', 'Phone', 'Mobile'],
    email:   ['邮箱', '电子邮箱', '电子邮件', 'Email', 'E-mail'],
    address: ['地址', '居住地', '所在地', '现居', '籍贯', '户籍'],
    age:     ['年龄', '出生年月', '出生日期', '生日']
  };

  var EDU_FIELDS = ['学校', '院校', '毕业院校', '大学', '学院', '专业', '学历', '学位', '入学', '毕业', 'GPA', '绩点'];
  var WORK_FIELDS = ['公司', '企业', '单位', '部门', '职位', '岗位', '职务', '入职', '离职', '在职', '至今', '担任'];
  var PROJ_FIELDS = ['项目', '产品', '系统', '平台', '工具', '负责', '主导', '参与', '开发', '设计', '实现', '上线'];
  var SKILL_FIELDS = ['技能', '技术', '语言', '证书', '熟练', '掌握', '精通', '了解', '熟悉'];

  /** 从文本中通过关键词匹配提取字段值 */
  function extractByLabel(text, labels) {
    for (var i = 0; i < labels.length; i++) {
      var re = new RegExp(labels[i] + '[：:\\s]*([^\\n,，]{1,40})', 'i');
      var m = text.match(re);
      if (m) return m[1].trim();
    }
    return '';
  }

  /** 按段落标题拆分为多个 section */
  function splitSections(text) {
    var lines = text.split(/\n/);
    var current = 'rest';
    var sections = { basic: '', education: '', work: '', project: '', skill: '', rest: '' };

    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) return;
      var matched = false;
      for (var key in SECTION_PATTERNS) {
        if (SECTION_PATTERNS[key].test(trimmed) && trimmed.length < 30) {
          current = key; matched = true; break;
        }
      }
      if (!matched) sections[current] += line + '\n';
    });

    return sections;
  }

  /** 提取基本信息（全文扫描） */
  function parseBasicInfo(fullText) {
    var info = { name: '', email: '', phone: '' };

    // 邮箱
    var emailMatch = fullText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) info.email = emailMatch[1];

    // 电话（标签模式 + 裸号模式）
    var phoneMatch = fullText.match(/(?:电话|手机|Tel|Phone|Mobile)[\s：:]*([+\d][\d\s\-()（）]{7,18})/i);
    if (phoneMatch) {
      info.phone = phoneMatch[1].replace(/[\s\-()（）]/g, '');
    } else {
      var barePhone = fullText.match(/(1[3-9]\d)[\s\-]?(\d{4})[\s\-]?(\d{4})/);
      if (barePhone) info.phone = barePhone[1] + barePhone[2] + barePhone[3];
    }

    // 姓名识别（强化：百家姓前200位 + 多策略提取）
    var SURNAMES_200 = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮下齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣贲邓郁单杭洪包诸左石崔吉钮龚程嵇邢滑裴陆荣翁荀羊於惠甄曲家封芮羿储靳汲邴糜松井段富巫乌焦巴弓牧隗山谷车侯宓蓬全郗班仰秋仲伊宫宁仇栾暴甘钭厉戎祖武符刘景詹束龙叶幸司韶郜黎蓟薄印宿白怀蒲邰从鄂索咸籍赖卓蔺屠蒙池乔阴鬱胥能苍双闻莘党翟谭贡劳逄姬申扶堵冉宰郦雍卻璩桑桂濮牛寿通边扈燕冀郏浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东欧殳沃利蔚越夔隆师巩厍聂晁勾敖融冷訾辛阚那简饶空曾毋沙乜养鞠须丰巢关蒯相查后荆红游竺权逯盖益桓公';
    var TITLE_FILTER = /先生|女士|同学|老师|经理|总监|主管|工程师|程序员|设计师|分析师|架构师|产品经理|运营|专员|助理|代表|HR|CEO|CTO|CFO|COO|VP/;
    var SECTION_FILTER = /个人简历|求职意向|基本信息|联系方式|教育背景|教育经历|工作经历|工作履历|项目经历|项目经验|专业技能|技能证书|自我评价|在校经历|实习经历|荣誉奖励|获奖情况|语言能力|兴趣爱好|Resume|CV/i;
    var lines = fullText.split(/\n/);

    // 姓氏匹配函数：候选词是否以百家姓开头 + 1-2个汉字
    function isLikelyName(word) {
      if (!word || word.length < 2 || word.length > 4) return false;
      if (TITLE_FILTER.test(word)) return false;
      if (SECTION_FILTER.test(word)) return false;
      if (/[\d\s，,。；;：:、@/／()（）\-—|｜]/.test(word)) return false;
      var ch = word.charAt(0);
      return SURNAMES_200.indexOf(ch) >= 0 && /^[一-鿿]{2,4}$/.test(word);
    }

    function hasContactNearby(lineIdx) {
      for (var k = lineIdx + 1; k < Math.min(lineIdx + 3, lines.length); k++) {
        var ctx = lines[k];
        if (/(?:电话|手机|Tel|Phone|邮箱|Email|地址|1[3-9]\d{9}|@)/.test(ctx)) return true;
      }
      return false;
    }

    // 方式1：标签匹配「姓名：张三」
    for (var i = 0; i < Math.min(lines.length, 12); i++) {
      var line = lines[i].trim();
      var labelMatch = line.match(/(?:姓名|名字|Name)[\s：:]*\s*([^\s,，\d]{2,6})/i);
      if (labelMatch) {
        var candidate = labelMatch[1];
        if (isLikelyName(candidate)) { info.name = candidate; break; }
      }
    }

    // 方式2：前3行优先（简历姓名必在最顶部）
    if (!info.name) {
      for (var j = 0; j < Math.min(lines.length, 3); j++) {
        var l = lines[j].trim();
        if (!l || l.length > 25 || l.indexOf('@') !== -1) continue;
        if (SECTION_FILTER.test(l)) continue;

        // 格式A：「张三 男」→ 提取姓名
        var genderMatch = l.match(/^([一-鿿]{2,4})\s*[男女]/);
        if (genderMatch && isLikelyName(genderMatch[1])) { info.name = genderMatch[1]; break; }
        // 格式B：「张三 | 1995年」
        var sepMatch = l.match(/^([一-鿿]{2,4})\s*[|｜\-\—\/]\s*\d/);
        if (sepMatch && isLikelyName(sepMatch[1])) { info.name = sepMatch[1]; break; }
        // 格式C：「张三 电话：138xxxx」
        var phonePrefix = l.match(/^([一-鿿]{2,4})\s+(?:电话|手机|Tel|Phone|1[3-9])/);
        if (phonePrefix && isLikelyName(phonePrefix[1])) { info.name = phonePrefix[1]; break; }
        // 格式D：纯中文行，姓氏匹配 + 附近有联系方式 → 100%判定
        var pureName = l.match(/^([一-鿿]{2,4})$/);
        if (pureName && isLikelyName(pureName[1])) {
          if (hasContactNearby(j)) { info.name = pureName[1]; break; }
          if (!info._candidate) info._candidate = pureName[1];
        }
        // 格式E：英文名
        var engName = l.match(/^([a-zA-Z]{1,12}\s[a-zA-Z]{1,12})$/);
        if (engName) { info.name = engName[1]; break; }
      }
    }

    // 方式3：前3行未命中则继续扫描前8行（降级）
    if (!info.name) {
      for (var j2 = 3; j2 < Math.min(lines.length, 8); j2++) {
        var l2 = lines[j2].trim();
        if (!l2 || l2.length > 20 || l2.indexOf('@') !== -1) continue;
        if (SECTION_FILTER.test(l2)) continue;
        var pure2 = l2.match(/^([一-鿿]{2,4})$/);
        if (pure2 && isLikelyName(pure2[1]) && hasContactNearby(j2)) {
          info.name = pure2[1]; break;
        }
      }
    }

    if (!info.name && info._candidate) { info.name = info._candidate; }
    delete info._candidate;

    return info;
  }

  /** 将工作/项目经历文本拆分为独立积木 */
  function splitEntries(text, type) {
    var entries = [];
    var parts = text.split(/(?:\n\s*\n)+/);
    if (parts.length <= 1) parts = text.split(/\n(?=(?:20\d{2}|至今|present|Present))/i);
    if (parts.length <= 1) parts = text.split(/\n(?=[•·\-\*\d]{1,3}[\.\)、．\s])/);

    parts.forEach(function (part) {
      var trimmed = part.trim();
      if (!trimmed || trimmed.length < 10) return;

      var entry = { id: uid(), type: type, title: '', org: '', date: '', description: '', tags: [] };
      var lines = trimmed.split(/\n/);
      var firstLine = lines[0].trim();
      var remainingLines = lines.slice(1).join('\n').trim();

      // 提取日期
      var datePatterns = [
        /(20\d{2}[.\/\-年\s]+\d{1,2}[月]?)\s*[-–至到\s]+\s*(至今|present|Present|20\d{2}[.\/\-年\s]+\d{1,2}[月]?)/i,
        /(20\d{2}[.\/\-年]\d{1,2})\s*[-–至到]\s*(至今|present|20\d{2}[.\/\-年]\d{1,2})/i,
        /(20\d{2})\s*[-–至到]\s*(至今|20\d{2})/,
        /(20\d{2}[.\/\-年]+\d{1,2}[月]?)\s*[-–至到]?\s*(至今|present|Present)?/i
      ];
      for (var di = 0; di < datePatterns.length; di++) {
        var dm = firstLine.match(datePatterns[di]);
        if (!dm) dm = trimmed.match(datePatterns[di]);
        if (dm) { entry.date = dm[0].replace(/\s+/g, ' ').trim(); firstLine = firstLine.replace(dm[0], '').trim(); break; }
      }

      // 解析首行：分离公司 / 职位
      var pipeMatch = firstLine.match(/^(.+?)\s*[|｜\-—]\s*(.+)$/);
      if (pipeMatch && pipeMatch[1].length < 30 && pipeMatch[2].length < 30) {
        var a = pipeMatch[1].trim(), b = pipeMatch[2].trim();
        if (/(?:公司|集团|科技|网络|软件|银行|证券|大学|学院|医院|研究院|Inc|Ltd|Corp)/i.test(a)) {
          entry.org = a; entry.title = b;
        } else if (/(?:公司|集团|科技|网络|软件|银行|证券|大学|学院|医院|研究院|Inc|Ltd|Corp)/i.test(b)) {
          entry.org = b; entry.title = a;
        } else {
          if (a.length <= b.length) { entry.title = a; entry.org = b; }
          else { entry.title = b; entry.org = a; }
        }
      } else {
        if (firstLine && /(?:公司|集团|科技|网络|软件|Inc|Ltd|Corp)/i.test(firstLine)) entry.org = firstLine;
        else if (firstLine && firstLine.length < 30 && !/\d{4}/.test(firstLine)) entry.title = firstLine;
        if (lines.length >= 2) {
          var secondLine = lines[1].trim();
          if (!entry.org && secondLine && /(?:公司|集团|科技|网络|软件|Inc|Ltd|Corp)/i.test(secondLine)) {
            entry.org = secondLine; remainingLines = lines.slice(2).join('\n').trim();
          } else if (!entry.title && secondLine && secondLine.length < 30) {
            entry.title = secondLine; remainingLines = lines.slice(2).join('\n').trim();
          }
        }
      }

      entry.description = remainingLines || trimmed;

      // 模糊匹配公司/学校名
      if (!entry.org) {
        var orgMatch = trimmed.match(/([\w一-鿿]{2,20}(?:公司|集团|科技|网络|软件|银行|证券|保险|医院|大学|学院|研究院|实验室|studio|Inc|Ltd|Corp))/i);
        if (orgMatch) entry.org = orgMatch[1];
        if (!entry.org && type === 'education') {
          var schoolMatch = trimmed.match(/([\w一-鿿]{2,15}(?:大学|学院|学校|School|University|College|Institute))/i);
          if (schoolMatch) entry.org = schoolMatch[1];
        }
      }
      if (!entry.title && firstLine && firstLine.length < 40) entry.title = firstLine;

      entry.tags = matchTechKeywords(trimmed).concat(matchSoftSkills(trimmed));
      if (entry.description.length > 8) entries.push(entry);
    });

    return entries;
  }

  /** 主解析函数：文本 → 积木 + 基本信息 */
  function parseTextToBlocks(text) {
    var sections = splitSections(text);
    var blocks = [];
    var basicInfo = parseBasicInfo(text);

    // 教育经历
    if (sections.education) {
      var eduBlocks = splitEntries(sections.education, 'education');
      if (eduBlocks.length > 0) {
        blocks = blocks.concat(eduBlocks);
      } else {
        var eduLines = sections.education.trim().split(/\n/).filter(function (l) { return l.trim(); });
        if (eduLines.length > 0) {
          blocks.push({ id: uid(), type: 'education', title: eduLines[0].trim().substring(0, 60), org: '', date: '', description: sections.education.trim(), tags: [] });
        }
      }
    }

    // 工作经历
    if (sections.work) blocks = blocks.concat(splitEntries(sections.work, 'work'));

    // 项目经历
    if (sections.project) blocks = blocks.concat(splitEntries(sections.project, 'project'));

    // 技能
    if (sections.skill) {
      var techTags = matchTechKeywords(sections.skill);
      blocks.push({ id: uid(), type: 'skill', title: '技能', org: '', date: '', description: sections.skill.trim().substring(0, 500), tags: techTags });
    }

    // rest 兜底
    if (blocks.length === 0 && sections.rest) {
      var restBlocks = splitEntries(sections.rest, 'work');
      if (restBlocks.length === 0) {
        blocks.push({ id: uid(), type: 'work', title: '经历', org: '', date: '', description: sections.rest.trim().substring(0, 800), tags: matchTechKeywords(sections.rest) });
      } else {
        blocks = blocks.concat(restBlocks);
      }
    }

    // 去重
    var deduped = [];
    blocks.forEach(function (b) {
      var dup = deduped.some(function (d) { return d.description.substring(0, 30) === b.description.substring(0, 30); });
      if (!dup) deduped.push(b);
    });

    return { blocks: deduped, basicInfo: basicInfo };
  }

  // ================================================================
  //  识别结果校验
  // ================================================================
  function evaluateParseQuality(parsed) {
    var blocks = parsed.blocks;
    var info = parsed.basicInfo;
    var score = 0;
    var total = 0;

    // 基本信息完整度（姓名/邮箱/电话各10分）
    total += 30;
    if (info && info.name) score += 10;
    if (info && info.email) score += 10;
    if (info && info.phone) score += 10;

    // 积木质量（每个积木有标题+5，有日期+3，有公司+2）
    total += blocks.length * 10;
    blocks.forEach(function (b) {
      if (b.title) score += 5;
      if (b.date) score += 3;
      if (b.org) score += 2;
      if (b.tags && b.tags.length > 0) score += 2;
    });

    var pct = total > 0 ? Math.round(score / total * 100) : 0;
    return { score: score, total: total, percentage: pct };
  }

  /** 智能再分类：根据内容关键词重新判定积木类型 */
  function smartReclassify(blocks) {
    // 教育类关键词（含强指示词）
    var EDU_STRONG = ['学院','大学','学校','高中','中专','高职'];
    var EDU_KEYS = ['本科','专科','硕士','博士','硕士研究生','博士研究生','学历','学位','专业','专业方向',
      '入学','毕业','毕业设计','毕业论文','院系','系','级','届','班','GPA','绩点','课程','论文','导师','实验室','教研室'];
    // 工作类关键词（含强指示词）
    var WORK_STRONG = ['有限公司','股份公司','公司','集团','企业','事业单位'];
    var WORK_KEYS = ['入职','离职','职位','岗位','工作','任职','担任','负责','主持','主导','带领','管理','运营',
      '开发','设计','测试','交付','客户','业务','业绩','KPI','考核','公务员','实习','兼职','项目负责人','主管','经理','总监'];
    var PROJ_KEYS = ['项目','产品','系统','平台','工具','从0到1','上线','发布','重构','架构','模块'];

    blocks.forEach(function (b) {
      var text = (b.title + ' ' + b.org + ' ' + b.description).toLowerCase();

      var eduScore = 0, workScore = 0, projScore = 0;

      // 强指示词加权（2分）
      EDU_STRONG.forEach(function (k) { if (text.indexOf(k.toLowerCase()) !== -1) eduScore += 2; });
      WORK_STRONG.forEach(function (k) { if (text.indexOf(k.toLowerCase()) !== -1) workScore += 2; });
      // 普通关键词（1分）
      EDU_KEYS.forEach(function (k) { if (text.indexOf(k.toLowerCase()) !== -1) eduScore++; });
      WORK_KEYS.forEach(function (k) { if (text.indexOf(k.toLowerCase()) !== -1) workScore++; });
      PROJ_KEYS.forEach(function (k) { if (text.indexOf(k.toLowerCase()) !== -1) projScore++; });

      // 压倒性证据（得分差 > 2 倍）：强制改判
      if (eduScore >= 6 && eduScore > workScore * 2) { b.type = 'education'; return; }
      if (workScore >= 6 && workScore > eduScore * 2) { b.type = 'work'; return; }
      // 强指示词优先判定（任一强指示匹配即倾向该类别）
      if (eduScore >= 4 && eduScore > workScore) { b.type = 'education'; return; }
      if (workScore >= 4 && workScore > eduScore) { b.type = 'work'; return; }
      // 教育得分领先 → 教育
      if (eduScore >= 2 && eduScore > workScore && workScore <= 1) { b.type = 'education'; return; }
      // 项目得分领先 → 项目
      if (projScore >= 3 && projScore > workScore && workScore < 2) { b.type = 'project'; return; }
      // 反向修正：原为教育但完全没有教育特征 → 改工作
      if (workScore >= 2 && b.type === 'education' && eduScore <= 1) { b.type = 'work'; }
      // 反向修正：原为工作但完全没有工作特征且有教育特征 → 改教育
      if (eduScore >= 2 && b.type === 'work' && workScore <= 1) { b.type = 'education'; }
    });
  }

  function showParseResultPreview(parsed) {
    smartReclassify(parsed.blocks);
    var quality = evaluateParseQuality(parsed);
    var blocks = parsed.blocks;
    var info = parsed.basicInfo;

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:999;display:flex;align-items:center;justify-content:center;';

    var color = quality.percentage >= 60 ? '#10b981' : '#f59e0b';
    var advice = quality.percentage >= 80 ? '识别结果较好，可以直接使用' :
                 quality.percentage >= 60 ? '识别结果一般，建议检查关键信息是否正确' :
                 quality.percentage >= 50 ? '识别准确率偏低，请仔细核对并手动修正各项内容' :
                 '识别准确率过低（' + quality.percentage + '%），建议上传 Word 格式简历获得更好的识别效果';

    var typeOptions = {
      work: '工作经历', project: '项目经历', education: '教育经历', skill: '技能'
    };

    // 经历列表（可编辑）
    var blockListHtml = '';
    blocks.forEach(function (b, i) {
      var escapedTitle = (b.title || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      var escapedOrg = (b.org || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      var escapedDate = (b.date || '').replace(/"/g, '&quot;');
      var escapedDesc = (b.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      blockListHtml +=
        '<div class="preview-block-item" data-idx="' + i + '" style="padding:10px 12px;margin-bottom:8px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;">' +
          // 第一行：序号 + 类型下拉 + 标题 + 删除
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="color:#4a4a6a;font-size:11px;flex-shrink:0;">#' + (i+1) + '</span>' +
            '<select class="preview-type" data-idx="' + i + '" style="padding:3px 8px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:4px;color:#a5b4fc;font-size:11px;cursor:pointer;flex-shrink:0;">' +
              '<option value="work"' + (b.type === 'work' ? ' selected' : '') + '>工作</option>' +
              '<option value="project"' + (b.type === 'project' ? ' selected' : '') + '>项目</option>' +
              '<option value="education"' + (b.type === 'education' ? ' selected' : '') + '>教育</option>' +
              '<option value="skill"' + (b.type === 'skill' ? ' selected' : '') + '>技能</option>' +
            '</select>' +
            '<input class="preview-title" data-idx="' + i + '" value="' + escapedTitle + '" placeholder="标题" style="flex:1;min-width:0;padding:3px 8px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:4px;color:#d1d5db;font-size:11px;">' +
            '<button class="preview-del" data-idx="' + i + '" style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:#4a4a6a;cursor:pointer;border-radius:4px;font-size:12px;flex-shrink:0;" title="删除此经历">&times;</button>' +
          '</div>' +
          // 第二行：公司 + 日期
          '<div style="display:flex;gap:8px;margin-bottom:6px;">' +
            '<input class="preview-org" data-idx="' + i + '" value="' + escapedOrg + '" placeholder="公司/组织" style="flex:1;padding:3px 8px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:4px;color:#d1d5db;font-size:11px;">' +
            '<input class="preview-date" data-idx="' + i + '" value="' + escapedDate + '" placeholder="时间（如 2020.06-2022.12）" style="width:180px;padding:3px 8px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:4px;color:#d1d5db;font-size:11px;">' +
          '</div>' +
          // 第三行：描述
          '<textarea class="preview-desc" data-idx="' + i + '" rows="3" style="width:100%;padding:6px 8px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:4px;color:#d1d5db;font-size:11px;resize:vertical;line-height:1.5;">' + escapedDesc + '</textarea>' +
        '</div>';
    });

    overlay.innerHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;padding:24px;width:95%;max-width:620px;max-height:85vh;display:flex;flex-direction:column;">' +
        // 标题栏（固定）
        '<div style="flex-shrink:0;">' +
          '<h3 style="font-size:16px;color:#e2e8f0;margin:0 0 4px;">' +
            '<i class="fa-solid fa-clipboard-check" style="color:' + color + ';margin-right:6px;"></i>识别结果预览</h3>' +
          '<div style="display:flex;align-items:center;gap:8px;margin:8px 0 6px;">' +
            '<div style="flex:1;height:6px;background:#1a1a26;border-radius:3px;overflow:hidden;">' +
              '<div style="width:' + quality.percentage + '%;height:100%;background:' + color + ';border-radius:3px;"></div>' +
            '</div>' +
            '<span style="font-size:18px;font-weight:700;color:' + color + ';">' + quality.percentage + '%</span>' +
          '</div>' +
          '<p style="font-size:12px;color:#94a3b8;margin:0 0 10px;">' + advice + '</p>' +
          // 基本信息（可编辑）
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">' +
            '<div>' +
              '<label style="font-size:10px;color:#64748b;display:block;margin-bottom:2px;">姓名</label>' +
              '<input id="previewName" class="ninja-input" value="' + (info.name || '') + '" placeholder="' + (info.name ? '' : '请输入姓名') + '" style="font-size:11px;padding:5px 8px;" autofocus>' +
            '</div>' +
            '<div>' +
              '<label style="font-size:10px;color:#64748b;display:block;margin-bottom:2px;">邮箱</label>' +
              '<input id="previewEmail" class="ninja-input" value="' + (info.email || '') + '" placeholder="未识别" style="font-size:11px;padding:5px 8px;">' +
            '</div>' +
            '<div>' +
              '<label style="font-size:10px;color:#64748b;display:block;margin-bottom:2px;">电话</label>' +
              '<input id="previewPhone" class="ninja-input" value="' + (info.phone || '') + '" placeholder="未识别" style="font-size:11px;padding:5px 8px;">' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
            '<span style="font-size:11px;color:#64748b;">识别到 <b id="previewBlockCount">' + blocks.length + '</b> 段经历：</span>' +
            '<button id="previewAddBlock" style="font-size:10px;padding:3px 10px;background:transparent;border:1px solid #312e81;border-radius:4px;color:#a5b4fc;cursor:pointer;">' +
              '<i class="fa-solid fa-plus"></i> 添加新经历</button>' +
          '</div>' +
        '</div>' +
        // 经历列表（可滚动）
        '<div id="previewBlockList" style="flex:1;overflow-y:auto;padding-right:4px;min-height:120px;max-height:340px;" class="custom-scrollbar">' +
          blockListHtml +
        '</div>' +
        // 底部按钮
        '<div style="flex-shrink:0;margin-top:12px;display:flex;gap:8px;">' +
          '<button id="previewConfirm" style="flex:1;padding:10px 16px;background:#6366f1;border:none;border-radius:7px;color:#fff;font-size:13px;cursor:pointer;">确认并导入积木库</button>' +
          '<button id="previewCancel" style="padding:10px 16px;background:#1e1e32;border:1px solid #252536;border-radius:7px;color:#94a3b8;font-size:13px;cursor:pointer;">放弃</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // 辅助：从 DOM 收集当前编辑后的数据
    function collectEditedData() {
      var editedInfo = {
        name: overlay.querySelector('#previewName').value.trim(),
        email: overlay.querySelector('#previewEmail').value.trim(),
        phone: overlay.querySelector('#previewPhone').value.trim()
      };
      var editedBlocks = [];
      var items = overlay.querySelectorAll('.preview-block-item');
      items.forEach(function (item) {
        var idx = parseInt(item.getAttribute('data-idx'));
        var orig = blocks[idx] || {};
        editedBlocks.push({
          id: orig.id || uid(),
          type: item.querySelector('.preview-type').value,
          title: item.querySelector('.preview-title').value.trim(),
          org: item.querySelector('.preview-org').value.trim(),
          date: item.querySelector('.preview-date').value.trim(),
          description: item.querySelector('.preview-desc').value.trim(),
          tags: matchTechKeywords(item.querySelector('.preview-desc').value).concat(matchSoftSkills(item.querySelector('.preview-desc').value))
        });
      });
      return { info: editedInfo, blocks: editedBlocks };
    }

    // 添加新经历
    overlay.querySelector('#previewAddBlock').addEventListener('click', function () {
      var newIdx = blocks.length;
      var newBlock = { id: uid(), type: 'work', title: '', org: '', date: '', description: '', tags: [] };
      blocks.push(newBlock);

      var blockList = overlay.querySelector('#previewBlockList');
      var newItem = document.createElement('div');
      newItem.className = 'preview-block-item';
      newItem.setAttribute('data-idx', newIdx);
      newItem.style.cssText = 'padding:10px 12px;margin-bottom:8px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;';
      newItem.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
          '<span style="color:#4a4a6a;font-size:11px;flex-shrink:0;">#' + (newIdx+1) + '</span>' +
          '<select class="preview-type" data-idx="' + newIdx + '" style="padding:3px 8px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:4px;color:#a5b4fc;font-size:11px;cursor:pointer;flex-shrink:0;">' +
            '<option value="work" selected>工作</option><option value="project">项目</option><option value="education">教育</option><option value="skill">技能</option></select>' +
          '<input class="preview-title" data-idx="' + newIdx + '" value="" placeholder="标题" style="flex:1;min-width:0;padding:3px 8px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:4px;color:#d1d5db;font-size:11px;">' +
          '<button class="preview-del" data-idx="' + newIdx + '" style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:#4a4a6a;cursor:pointer;border-radius:4px;font-size:12px;flex-shrink:0;" title="删除">&times;</button>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:6px;">' +
          '<input class="preview-org" data-idx="' + newIdx + '" value="" placeholder="公司/组织" style="flex:1;padding:3px 8px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:4px;color:#d1d5db;font-size:11px;">' +
          '<input class="preview-date" data-idx="' + newIdx + '" value="" placeholder="时间" style="width:180px;padding:3px 8px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:4px;color:#d1d5db;font-size:11px;">' +
        '</div>' +
        '<textarea class="preview-desc" data-idx="' + newIdx + '" rows="3" style="width:100%;padding:6px 8px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:4px;color:#d1d5db;font-size:11px;resize:vertical;line-height:1.5;"></textarea>';
      blockList.appendChild(newItem);

      // 绑定新项的删除按钮
      newItem.querySelector('.preview-del').addEventListener('click', function () {
        newItem.style.opacity = '0.4';
        newItem.style.pointerEvents = 'none';
        blocks[newIdx] = null; // 标记删除
        overlay.querySelector('#previewBlockCount').textContent = blocks.filter(function(b){return b!==null;}).length;
      });

      overlay.querySelector('#previewBlockCount').textContent = blocks.length;
      // 滚动到底部
      blockList.scrollTop = blockList.scrollHeight;
    });

    // 删除经历（委托）
    overlay.querySelector('#previewBlockList').addEventListener('click', function (e) {
      var delBtn = e.target.closest('.preview-del');
      if (!delBtn) return;
      var item = delBtn.closest('.preview-block-item');
      var idx = parseInt(item.getAttribute('data-idx'));
      item.style.opacity = '0.4';
      item.style.pointerEvents = 'none';
      blocks[idx] = null;
      overlay.querySelector('#previewBlockCount').textContent = blocks.filter(function(b){return b!==null;}).length;
    });

    // 关闭按钮
    overlay.querySelector('#previewCancel').addEventListener('click', function () {
      document.body.removeChild(overlay);
    });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) document.body.removeChild(overlay); });

    // 确认导入
    overlay.querySelector('#previewConfirm').addEventListener('click', function () {
      var edited = collectEditedData();
      var validBlocks = edited.blocks.filter(function (b) { return b.description.trim().length > 5; });

      if (validBlocks.length === 0) {
        JN.showToast('没有有效经历可导入，请至少保留一条完整经历', 'warning');
        return;
      }

      document.body.removeChild(overlay);

      // 导入积木（去重）
      validBlocks.forEach(function (b) {
        var dup = _allBlocks.some(function (eb) { return eb.description.substring(0, 40) === b.description.substring(0, 40); });
        if (!dup) _allBlocks.push(b);
      });

      saveBlocks(_allBlocks);
      saveBasicInfo(edited.info);
      refreshBlockList();

      // 自动填入基本信息
      var nameInput = document.querySelector('#inputName');
      var emailInput = document.querySelector('#inputEmail');
      var phoneInput = document.querySelector('#inputPhone');
      if (nameInput) nameInput.value = edited.info.name || '';
      if (emailInput) emailInput.value = edited.info.email || '';
      if (phoneInput) phoneInput.value = edited.info.phone || '';

      JN.showToast('已导入 ' + validBlocks.length + ' 段经历到积木库', 'success');
    });
  }

  // ================================================================
  //  文件解析器
  // ================================================================

  function pdfPreprocess(text) {
    // 1. 规范化换行（\r\n → \n）
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // 2. 合并3个以上的连续换行为2个（保留段落边界）
    text = text.replace(/\n{3,}/g, '\n\n');
    // 3. 去除页眉页脚模式：纯数字行、页码行、重复标题行
    text = text.replace(/^\d{1,3}\s*$/gm, '');
    text = text.replace(/^第\s*\d+\s*页\s*$/gm, '');
    text = text.replace(/^-\s*\d+\s*-$/gm, '');
    // 4. 合并被PDF拆分的短行（单字或双字孤行合并到上下文）
    var lines = text.split('\n');
    var merged = [];
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i].trim();
      if (!l) { merged.push(''); continue; }
      // 如果当前行极短且不是全角标点开头，尝试与前一行合并
      if (l.length <= 3 && merged.length > 0 && merged[merged.length - 1] !== '' &&
          !/^[，。；：、！？）\)]/.test(l) && !/^\d+$/.test(l)) {
        merged[merged.length - 1] += l;
      } else {
        merged.push(l);
      }
    }
    text = merged.join('\n');
    // 5. 去除多余空格（保留中文间正常间隔但合并英文单词间的多余空格）
    text = text.replace(/[ ]{2,}/g, ' ');
    // 6. 去除每行的首尾空格
    text = text.split('\n').map(function(ln){return ln.trim();}).join('\n');
    // 7. 移除空行过多的情况（最多保留1个连续空行）
    text = text.replace(/\n{2,}/g, '\n\n');
    console.log('[PDF预处理] 处理后文本: ' + text.length + ' 字符');
    return text;
  }

  function parsePDF(file, callback) {
    if (typeof pdfjsLib === 'undefined') {
      callback(new Error('PDF解析库未加载，请刷新页面后重试')); return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var typedarray = new Uint8Array(e.target.result);
      console.log('[PDF解析] 文件读取完成，大小: ' + typedarray.byteLength + ' bytes');
      pdfjsLib.getDocument({ data: typedarray }).promise.then(function (pdf) {
        var pages = [];
        var loaded = 0;
        for (var i = 1; i <= pdf.numPages; i++) {
          pdf.getPage(i).then(function (page) { return page.getTextContent(); })
          .then(function (content) {
            // 保留每个item的位置信息用于更好的文本拼接
            var pageText = '';
            var lastY = null;
            var lastX = 0;
            content.items.forEach(function (item) {
              var curY = item.transform ? item.transform[5] : 0;
              var curX = item.transform ? item.transform[4] : 0;
              // 大幅Y跳变 → 新行
              if (lastY !== null && Math.abs(curY - lastY) > 4) {
                pageText += '\n';
              } else if (lastY !== null && curX > lastX + 80 && pageText.charAt(pageText.length - 1) !== '\n') {
                // X位置大幅提前 → 可能是新段落或缩进
                pageText += '  ';
              }
              pageText += item.str;
              lastY = curY; lastX = curX + (item.width || item.str.length * 5);
            });
            pages[loaded] = pageText;
            loaded++;
            if (loaded === pdf.numPages) {
              var fullText = pages.join('\n\n');
              console.log('[PDF解析] 原始提取: ' + pdf.numPages + ' 页, ' + fullText.length + ' 字符');
              // 预处理
              fullText = pdfPreprocess(fullText);
              callback(null, fullText);
            }
          }).catch(function (err) { console.error('[PDF解析] 页面错误:', err); callback(err); });
        }
      }).catch(function (err) {
        console.error('[PDF解析] 文档加载错误:', err);
        callback(new Error('PDF解析失败：文件可能已加密或损坏。请尝试另存为TXT格式'));
      });
    };
    reader.readAsArrayBuffer(file);
  }

  function parseWord(file, callback) {
    if (typeof mammoth === 'undefined') {
      console.log('[Word解析] Mammoth.js 未加载，使用降级方案');
      var reader2 = new FileReader();
      reader2.onload = function (e2) {
        var rawText = e2.target.result;
        var extracted = '';
        for (var k = 0; k < rawText.length; k++) {
          var cc = rawText.charCodeAt(k);
          if ((cc >= 0x4e00 && cc <= 0x9fff) || (cc >= 0x3000 && cc <= 0x303f) ||
              (cc >= 0xff00 && cc <= 0xffef) || (cc >= 0x20 && cc <= 0x7e) ||
              cc === 0x0a || cc === 0x0d) { extracted += rawText.charAt(k); }
        }
        console.log('[Word解析] 降级提取: ' + rawText.length + ' → ' + extracted.trim().length + ' 字符');
        if (extracted.trim().length > 50) { callback(null, extracted); }
        else { callback(new Error('Mammoth.js未加载且无法提取文本。请将简历另存为PDF或TXT格式后重新上传')); }
      };
      reader2.readAsText(file, 'utf-8');
      return;
    }

    console.log('[Word解析] Mammoth.js 已加载，开始标准解析');
    var reader = new FileReader();
    reader.onload = function (e) {
      var buf = e.target.result;
      console.log('[Word解析] 文件读取完成，大小: ' + buf.byteLength + ' bytes');
      mammoth.extractRawText({ arrayBuffer: buf })
        .then(function (result) {
          var text = result.value || '';
          console.log('[Word解析] 提取文本长度: ' + text.length);
          if (text.trim().length < 10) {
            callback(new Error('Word文档未能提取到文字，文件可能为扫描图片。请将简历另存为PDF或TXT格式'));
            return;
          }
          text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n');
          callback(null, text);
        })
        .catch(function (err) {
          console.error('[Word解析] 错误:', err);
          callback(new Error('Word解析失败：' + (err.message || '文件可能已损坏') + '。建议另存为PDF或TXT后上传'));
        });
    };
    reader.readAsArrayBuffer(file);
  }

  // ================================================================
  //  JD 解析（增强版：更多维度提取）
  // ================================================================
  function parseJD(text) {
    var techStack = matchTechKeywords(text);
    var softSkills = matchSoftSkills(text);
    var tags = techStack.concat(softSkills);

    // 经验要求
    var expYears = null;
    var expMatch = text.match(/(\d+)[\s-]*年(以上|及以上)?(相关)?(工作)?(开发)?经验/);
    if (expMatch) expYears = parseInt(expMatch[1]);
    if (!expYears) {
      var expMatch2 = text.match(/经验(\d+)[\s-]*年/);
      if (expMatch2) expYears = parseInt(expMatch2[1]);
    }
    if (!expYears) {
      var expMatch3 = text.match(/(\d+)[\s-]*(\d+)?\s*年(以上|及以上)?(工作|相关)?(经验|经历)/);
      if (expMatch3) expYears = parseInt(expMatch3[1]);
    }

    // 学历要求
    var degree = null;
    if (/博士|博士研究生|phd|Ph\.D/i.test(text)) degree = '博士';
    else if (/硕士|研究生|master/i.test(text)) degree = '硕士';
    else if (/本科|学士|bachelor/i.test(text)) degree = '本科';
    else if (/大专|专科|college/i.test(text)) degree = '大专';

    // 岗位职责关键词提取
    var responsibilityKeywords = [];
    var respPatterns = [
      { re: /负责|主导|管理|带领|统筹/g, kw: '管理能力' },
      { re: /开发|编程|编码|撰写代码/g, kw: '编码开发' },
      { re: /设计|架构|规划/g, kw: '系统设计' },
      { re: /优化|性能|提升|改进/g, kw: '性能优化' },
      { re: /分析|数据|报表|洞察/g, kw: '数据分析' },
      { re: /运营|增长|获客|转化/g, kw: '运营增长' },
      { re: /沟通|协作|跨部门|协调/g, kw: '沟通协作' },
      { re: /测试|质量|QA|保障/g, kw: '质量保障' },
      { re: /产品|需求|PRD|原型/g, kw: '产品设计' },
      { re: /用户|体验|UX|UI/g, kw: '用户体验' },
      { re: /项目|进度|交付|里程碑/g, kw: '项目管理' },
      { re: /团队|招聘|培养|指导/g, kw: '团队管理' },
      { re: /市场|品牌|推广|营销/g, kw: '市场营销' },
      { re: /销售|客户|商务|BD/g, kw: '商务拓展' },
      { re: /算法|模型|机器学习|深度学习/g, kw: '算法模型' },
      { re: /安全|防护|漏洞|加密/g, kw: '安全防护' }
    ];
    respPatterns.forEach(function(p) {
      if (p.re.test(text) && responsibilityKeywords.indexOf(p.kw) === -1) {
        responsibilityKeywords.push(p.kw);
      }
    });

    return {
      techStack: techStack,
      softSkills: softSkills,
      tags: tags,
      expYears: expYears,
      degree: degree,
      responsibilityKeywords: responsibilityKeywords,
      raw: text
    };
  }

  // ================================================================
  //  匹配报告引擎（无API，纯本地）
  // ================================================================
  function generateMatchReport(jdAnalysis, blocks, basicInfo) {
    if (!jdAnalysis || !jdAnalysis.tags || jdAnalysis.tags.length === 0) return null;
    if (!blocks || blocks.length === 0) return null;

    // 收集简历中所有关键词（含同义词匹配）
    var resumeKeywords = [];
    var keywordSources = {}; // keyword -> [block titles]
    blocks.forEach(function(b) {
      var allText = (b.title || '') + ' ' + (b.description || '') + ' ' + (b.tags || []).join(' ');
      jdAnalysis.tags.forEach(function(jt) {
        var found = false;
        // 精确匹配
        if (allText.toLowerCase().indexOf(jt.toLowerCase()) !== -1) found = true;
        // 同义词匹配
        if (!found) {
          for (var synKey in SYNONYM_MAP) {
            if (isSynonym(synKey, jt)) {
              var syns = SYNONYM_MAP[synKey];
              for (var s = 0; s < syns.length; s++) {
                if (allText.toLowerCase().indexOf(syns[s].toLowerCase()) !== -1) { found = true; break; }
              }
              if (found) break;
            }
          }
        }
        if (found) {
          if (resumeKeywords.indexOf(jt) === -1) resumeKeywords.push(jt);
          if (!keywordSources[jt]) keywordSources[jt] = [];
          if (keywordSources[jt].indexOf(b.title || b.org || '未命名') === -1) {
            keywordSources[jt].push(b.title || b.org || '未命名');
          }
        }
      });
    });

    // 匹配和缺失
    var matched = [];
    var missing = [];
    jdAnalysis.tags.forEach(function(jt) {
      if (resumeKeywords.indexOf(jt) !== -1) {
        matched.push({ keyword: jt, sources: keywordSources[jt] || [] });
      } else {
        missing.push(jt);
      }
    });

    // 技能细分
    var matchedTech = matched.filter(function(m) { return jdAnalysis.techStack.indexOf(m.keyword) !== -1; });
    var missingTech = missing.filter(function(k) { return jdAnalysis.techStack.indexOf(k) !== -1; });
    var matchedSoft = matched.filter(function(m) { return jdAnalysis.softSkills.indexOf(m.keyword) !== -1; });
    var missingSoft = missing.filter(function(k) { return jdAnalysis.softSkills.indexOf(k) !== -1; });

    // 计算匹配率
    var totalKeywords = jdAnalysis.tags.length;
    var matchRate = totalKeywords > 0 ? Math.round((matched.length / totalKeywords) * 100) : 0;

    // 经验匹配
    var expMatch = null;
    if (jdAnalysis.expYears) {
      // 从简历积木估算经验
      var resumeYears = 0;
      var allYears = [];
      blocks.forEach(function(b) {
        if (b.date) {
          var yrs = b.date.match(/20\d{2}/g);
          if (yrs && yrs.length >= 2) {
            allYears.push(parseInt(yrs[0]));
            allYears.push(parseInt(yrs[1]));
          } else if (yrs && yrs.length === 1) {
            allYears.push(parseInt(yrs[0]));
          }
        }
      });
      if (allYears.length >= 2) {
        resumeYears = Math.max.apply(null, allYears) - Math.min.apply(null, allYears);
      }
      if (resumeYears > 0) {
        expMatch = {
          required: jdAnalysis.expYears,
          actual: resumeYears,
          sufficient: resumeYears >= jdAnalysis.expYears
        };
      }
    }

    // 学历匹配
    var degreeMatch = null;
    if (jdAnalysis.degree) {
      var degreeLevels = { '大专': 1, '本科': 2, '硕士': 3, '博士': 4 };
      var resumeDegreeLevel = 0;
      blocks.forEach(function(b) {
        if (b.type === 'education' && b.description) {
          var desc = b.title + ' ' + b.description;
          for (var d in degreeLevels) {
            if (desc.indexOf(d) !== -1 && degreeLevels[d] > resumeDegreeLevel) {
              resumeDegreeLevel = degreeLevels[d];
            }
          }
        }
      });
      if (resumeDegreeLevel > 0) {
        degreeMatch = {
          required: jdAnalysis.degree,
          requiredLevel: degreeLevels[jdAnalysis.degree] || 2,
          actualLevel: resumeDegreeLevel,
          sufficient: resumeDegreeLevel >= (degreeLevels[jdAnalysis.degree] || 2)
        };
      }
    }

    // 生成修改建议
    var suggestions = [];
    if (missingTech.length > 0) {
      suggestions.push({
        priority: 'high',
        text: '建议在简历中补充以下技术技能的相关经历：' + missingTech.slice(0, 5).join('、') +
              (missingTech.length > 5 ? '等' + missingTech.length + '项技能' : '')
      });
    }
    if (missingSoft.length > 0) {
      suggestions.push({
        priority: 'medium',
        text: '建议在经历描述中体现以下软技能：' + missingSoft.slice(0, 3).join('、')
      });
    }
    if (expMatch && !expMatch.sufficient) {
      suggestions.push({
        priority: 'high',
        text: '岗位要求' + expMatch.required + '年经验，简历显示约' + expMatch.actual + '年。建议突出深度项目经验来弥补年限差距'
      });
    }
    if (degreeMatch && !degreeMatch.sufficient) {
      suggestions.push({
        priority: 'medium',
        text: '岗位要求' + degreeMatch.required + '学历。建议突出实际工作成果和专业证书来弥补学历差距'
      });
    }
    if (jdAnalysis.responsibilityKeywords && jdAnalysis.responsibilityKeywords.length > 0) {
      var missingResp = jdAnalysis.responsibilityKeywords.filter(function(rk) {
        return !resumeKeywords.some(function(rkk) { return rkk.indexOf(rk) !== -1 || rk.indexOf(rkk) !== -1; });
      });
      if (missingResp.length > 0) {
        suggestions.push({
          priority: 'medium',
          text: '岗位核心职责涉及：' + missingResp.join('、') + '。建议添加相关项目或工作经历'
        });
      }
    }
    // 量化建议
    if (!/(\d+%|\d+倍|\d+万|\d+用户|\d+条)/.test(blocks.map(function(b){return b.description;}).join(' '))) {
      suggestions.push({
        priority: 'low',
        text: '建议在经历描述中添加量化成果（如：提升X%、节省Y万、覆盖Z用户），增强说服力'
      });
    }

    return {
      matchRate: matchRate,
      totalKeywords: totalKeywords,
      matchedCount: matched.length,
      missingCount: missing.length,
      matched: matched,
      missing: missing,
      matchedTech: matchedTech,
      missingTech: missingTech,
      matchedSoft: matchedSoft,
      missingSoft: missingSoft,
      expMatch: expMatch,
      degreeMatch: degreeMatch,
      suggestions: suggestions,
      keywordSources: keywordSources
    };
  }

  function renderMatchReport(report) {
    if (!report) return '';

    var rateColor = report.matchRate >= 70 ? '#10b981' : report.matchRate >= 40 ? '#f59e0b' : '#ef4444';
    var rateLabel = report.matchRate >= 70 ? '匹配良好' : report.matchRate >= 40 ? '部分匹配' : '匹配较低';

    // 经验学历匹配
    var expHtml = '';
    if (report.expMatch) {
      expHtml += '<div style="font-size:11px;color:' + (report.expMatch.sufficient ? '#34d399' : '#f59e0b') + ';margin-top:4px;">' +
        '<i class="fa-solid ' + (report.expMatch.sufficient ? 'fa-circle-check' : 'fa-triangle-exclamation') + '" style="margin-right:4px;"></i>' +
        '经验：要求' + report.expMatch.required + '年 / 简历约' + report.expMatch.actual + '年' +
        '</div>';
    }
    if (report.degreeMatch) {
      expHtml += '<div style="font-size:11px;color:' + (report.degreeMatch.sufficient ? '#34d399' : '#f59e0b') + ';margin-top:2px;">' +
        '<i class="fa-solid ' + (report.degreeMatch.sufficient ? 'fa-circle-check' : 'fa-triangle-exclamation') + '" style="margin-right:4px;"></i>' +
        '学历：要求' + report.degreeMatch.required + ' / 简历匹配度' + (report.degreeMatch.sufficient ? '满足' : '不足') +
        '</div>';
    }

    // 匹配关键词
    var matchedHtml = '';
    report.matched.forEach(function(m) {
      matchedHtml += '<span title="来源：' + (m.sources || []).join(', ') + '" style="display:inline-block;font-size:10px;padding:2px 8px;margin:2px 3px 2px 0;background:#064e3b;color:#34d399;border-radius:10px;cursor:default;">' + m.keyword + '</span>';
    });

    // 缺失关键词
    var missingHtml = '';
    report.missing.forEach(function(k) {
      missingHtml += '<span style="display:inline-block;font-size:10px;padding:2px 8px;margin:2px 3px 2px 0;background:#3b1414;color:#fca5a5;border-radius:10px;">' + k + '</span>';
    });

    // 修改建议（按优先级排序，带序号）
    var suggestionsHtml = '';
    var sortedSuggestions = report.suggestions.slice().sort(function(a, b) {
      var order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] || 2) - (order[b.priority] || 2);
    });
    sortedSuggestions.forEach(function(s, i) {
      var icon = s.priority === 'high' ? 'fa-circle-exclamation' : s.priority === 'medium' ? 'fa-circle-info' : 'fa-lightbulb';
      var color = s.priority === 'high' ? '#fca5a5' : s.priority === 'medium' ? '#fcd34d' : '#94a3b8';
      var bg = s.priority === 'high' ? '#3b1414' : s.priority === 'medium' ? '#422006' : '#1a1a26';
      suggestionsHtml +=
        '<div style="padding:6px 10px;margin-bottom:4px;background:' + bg + ';border-radius:6px;font-size:11px;color:' + color + ';line-height:1.5;display:flex;align-items:flex-start;gap:6px;">' +
          '<span class="priority-step-badge ' + s.priority + '">第' + (i + 1) + '步</span>' +
          '<span><i class="fa-solid ' + icon + '" style="margin-right:5px;"></i>' + s.text + '</span>' +
        '</div>';
    });

    return '' +
      // 匹配度总览
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">' +
        '<div style="flex-shrink:0;width:56px;height:56px;border-radius:50%;border:3px solid ' + rateColor + ';display:flex;align-items:center;justify-content:center;position:relative;">' +
          '<span style="font-size:16px;font-weight:700;color:' + rateColor + ';">' + report.matchRate + '%</span>' +
        '</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:13px;font-weight:600;color:#e2e8f0;">' + rateLabel + '</div>' +
          '<div style="font-size:11px;color:#64748b;">' + report.matchedCount + ' 项匹配 / ' + report.totalKeywords + ' 项要求（' + report.missingCount + ' 项缺失）</div>' +
          '<div style="margin-top:3px;height:4px;background:#1a1a26;border-radius:2px;overflow:hidden;">' +
            '<div style="width:' + report.matchRate + '%;height:100%;background:' + rateColor + ';border-radius:2px;"></div>' +
          '</div>' +
          expHtml +
        '</div>' +
      '</div>' +

      // 匹配/缺失关键词
      (report.matched.length > 0 ?
        '<div style="margin-bottom:8px;">' +
          '<span style="font-size:10px;color:#34d399;font-weight:600;">已匹配</span>' +
          '<div style="margin-top:2px;">' + matchedHtml + '</div>' +
        '</div>' : '') +
      (report.missing.length > 0 ?
        '<div style="margin-bottom:8px;">' +
          '<span style="font-size:10px;color:#fca5a5;font-weight:600;">需补充</span>' +
          '<div style="margin-top:2px;">' + missingHtml + '</div>' +
        '</div>' : '') +

      // 修改建议
      (report.suggestions.length > 0 ?
        '<div style="border-top:1px solid #1a1a26;padding-top:8px;margin-top:4px;">' +
          '<span style="font-size:10px;color:#64748b;font-weight:600;">修改建议</span>' +
          '<div style="margin-top:4px;">' + suggestionsHtml + '</div>' +
        '</div>' : '');
  }

  // ================================================================
  //  匹配引擎（增强版：同义词 + 权重）
  // ================================================================

  // 同义词映射（用于JD-简历模糊匹配）
  var SYNONYM_MAP = {
    '直播运营': ['内容运营', '短视频运营', '新媒体运营', '直播带货'],
    '内容运营': ['新媒体运营', '直播运营', '社区运营', '内容策划'],
    '用户增长': ['增长运营', '用户运营', '增长黑客', '获客'],
    '数据分析': ['数据运营', '数据分析师', 'BI', '数据驱动'],
    '项目管理': ['项目经理', '项目负责人', 'PM', '交付管理'],
    '团队管理': ['团队负责人', '管理团队', 'Team Lead', '带团队'],
    '架构设计': ['系统架构', '技术架构', '架构师', '技术方案'],
    '性能优化': ['性能调优', '性能提升', '优化性能', '提速'],
    'Python': ['Python开发', 'Python编程', 'PyTorch', 'Django', 'Flask'],
    'Java': ['Java开发', 'Spring', 'Java编程', 'JVM'],
    'JavaScript': ['JS', 'TypeScript', '前端开发', 'Web前端'],
    'React': ['React.js', 'ReactJS', 'React Native', '前端框架'],
    'Vue': ['Vue.js', 'VueJS', 'Vue3', '前端框架'],
    'Node.js': ['Node', 'NodeJS', '后端开发', 'Express', 'Koa'],
    'Go': ['Golang', 'Go语言', 'Go开发'],
    'Docker': ['容器化', 'Docker容器', '容器编排'],
    'Kubernetes': ['K8s', '容器编排', 'K8S集群'],
    'MySQL': ['数据库', 'SQL', '关系型数据库', 'MariaDB'],
    'Redis': ['缓存', '内存数据库', 'Redis集群'],
    '微服务': ['微服务架构', '服务化', '分布式', 'Spring Cloud'],
    'AI': ['人工智能', '机器学习', '深度学习', '大模型', 'LLM'],
    '产品设计': ['产品经理', '需求分析', 'PRD', '产品原型'],
    '用户研究': ['用户体验', 'UX', '用户调研', '可用性测试'],
    '沟通能力': ['沟通协作', '表达', '协调', '跨部门沟通'],
    '领导力': ['领导能力', '带队', '管理', '团队领导'],
    '敏捷开发': ['Scrum', '敏捷', '迭代开发', 'Kanban']
  };

  // 核心技能权重（JD中出现时匹配权重更高）
  var CORE_SKILL_WEIGHTS = {
    'AI': 3, '大模型': 3, 'LLM': 3, '机器学习': 2.5, '深度学习': 2.5,
    'Python': 2, 'Java': 2, 'Go': 2, 'Golang': 2, 'Rust': 2.5,
    'React': 1.5, 'Vue': 1.5, 'TypeScript': 1.5, 'Node.js': 1.5,
    'Kubernetes': 2.5, 'K8s': 2.5, 'Docker': 1.5, '微服务': 2,
    '架构设计': 2.5, '性能优化': 2, '数据分析': 1.5,
    '产品经理': 2, '项目管理': 1.5, '团队管理': 2,
    'MySQL': 1, 'Redis': 1, 'PostgreSQL': 1, 'MongoDB': 1,
    'Git': 0.5, 'HTML': 0.5, 'CSS': 0.5, 'Linux': 0.5
  };

  /** 检查两个词是否为同义/近义 */
  function isSynonym(word1, word2) {
    if (word1 === word2) return true;
    var w1l = word1.toLowerCase();
    var w2l = word2.toLowerCase();
    // 直接相等
    if (w1l === w2l) return true;
    // 包含关系
    if (w1l.indexOf(w2l) !== -1 || w2l.indexOf(w1l) !== -1) return true;
    // 同义词表查询
    var synonyms = SYNONYM_MAP[word1] || SYNONYM_MAP[word2] || [];
    for (var i = 0; i < synonyms.length; i++) {
      if (synonyms[i].toLowerCase() === w2l || synonyms[i].toLowerCase() === w1l) return true;
    }
    // 反向查询
    for (var key in SYNONYM_MAP) {
      var vals = SYNONYM_MAP[key];
      for (var j = 0; j < vals.length; j++) {
        if ((vals[j].toLowerCase() === w1l && key.toLowerCase() === w2l) ||
            (vals[j].toLowerCase() === w2l && key.toLowerCase() === w1l)) return true;
      }
    }
    return false;
  }

  function scoreBlock(block, jdTags) {
    if (!jdTags || jdTags.length === 0) return 0;
    if (!block.tags || block.tags.length === 0) return 0.1;
    var score = 0;
    var descLower = (block.description || '').toLowerCase();
    var titleLower = (block.title || '').toLowerCase();

    jdTags.forEach(function(jt) {
      var jtLower = jt.toLowerCase();
      var weight = CORE_SKILL_WEIGHTS[jt] || 1;

      // 精确标签匹配
      if (block.tags.some(function(bt) { return bt.toLowerCase() === jtLower; })) {
        score += weight;
        return;
      }
      // 同义词匹配
      if (block.tags.some(function(bt) { return isSynonym(bt, jt); })) {
        score += weight * 0.8;
        return;
      }
      // 描述中包含
      if (descLower.indexOf(jtLower) !== -1) {
        score += weight * 0.6;
        return;
      }
      // 标题中包含
      if (titleLower.indexOf(jtLower) !== -1) {
        score += weight * 0.7;
        return;
      }
      // 描述同义词
      for (var key in SYNONYM_MAP) {
        if (isSynonym(key, jt)) {
          var syns = SYNONYM_MAP[key];
          for (var s = 0; s < syns.length; s++) {
            if (descLower.indexOf(syns[s].toLowerCase()) !== -1) {
              score += weight * 0.5;
              return;
            }
          }
        }
      }
    });

    if (block.type === 'work') score += 0.5;
    return score;
  }

  function selectTopBlocks(blocks, jdAnalysis, topN) {
    topN = topN || 5;
    if (!jdAnalysis || !jdAnalysis.tags || jdAnalysis.tags.length === 0) {
      return blocks.filter(function (b) { return b.type === 'work' || b.type === 'project'; }).slice(0, topN);
    }
    var scored = blocks.map(function (b) { return { block: b, score: scoreBlock(b, jdAnalysis.tags) }; });
    scored.sort(function (a, b) { return b.score - a.score; });
    var selected = scored.slice(0, topN).map(function (s) { return s.block; });
    var typeOrder = { work: 0, project: 1, education: 2, skill: 3 };
    selected.sort(function (a, b) {
      if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type];
      return (b.date || '').localeCompare(a.date || '');
    });
    return selected;
  }

  // ================================================================
  //  简历生成
  // ================================================================
  function generateResumeHTML(selectedBlocks, basicInfo) {
    var html = '';
    html += '<div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #6366f1;">';
    html += '<h2 style="margin:0 0 4px;font-size:22px;color:#f1f5f9;">' + (basicInfo.name || '未命名') + '</h2>';
    html += '<p style="margin:0;font-size:13px;color:#94a3b8;">';
    var contactParts = [];
    if (basicInfo.email) contactParts.push('<i class="fa-solid fa-envelope" style="margin-right:4px;font-size:11px;"></i>' + basicInfo.email);
    if (basicInfo.phone) contactParts.push('<i class="fa-solid fa-phone" style="margin-right:4px;font-size:11px;"></i>' + basicInfo.phone);
    html += contactParts.join(' &nbsp;|&nbsp; ') || '联系方式待补充';
    html += '</p></div>';

    var groups = { work: '工作经历', project: '项目经历', education: '教育背景', skill: '技能' };
    for (var type in groups) {
      var groupBlocks = selectedBlocks.filter(function (b) { return b.type === type; });
      if (groupBlocks.length === 0) continue;
      html += '<h3 style="font-size:15px;color:#a5b4fc;margin:16px 0 10px;padding-bottom:4px;border-bottom:1px solid #1e293b;">';
      html += '<i class="fa-solid ' + (type === 'work' ? 'fa-briefcase' : type === 'project' ? 'fa-diagram-project' : type === 'education' ? 'fa-graduation-cap' : 'fa-code') + '" style="margin-right:6px;"></i>';
      html += groups[type] + '</h3>';
      groupBlocks.forEach(function (b) {
        html += '<div style="margin-bottom:14px;padding:10px 14px;background:#0f0f17;border-radius:8px;border:1px solid #1a1a26;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:4px;margin-bottom:4px;">';
        html += '<strong style="font-size:14px;color:#e2e8f0;">' + (b.title || b.org || '未命名') + '</strong>';
        if (b.org && b.title) html += '<span style="font-size:12px;color:#64748b;">' + b.org + '</span>';
        html += '<span style="font-size:11px;color:#475569;">' + fmtDate(b.date) + '</span></div>';
        if (b.description) {
          var desc = b.description.length > 300 ? b.description.substring(0, 300) + '...' : b.description;
          html += '<p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:4px 0;">' + desc.replace(/\n/g, '<br>') + '</p>';
        }
        if (b.tags && b.tags.length > 0) {
          html += '<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;">';
          b.tags.slice(0, 8).forEach(function (t) {
            html += '<span style="font-size:10px;padding:2px 8px;background:#1e1e32;color:#818cf8;border-radius:10px;">' + t + '</span>';
          });
          html += '</div>';
        }
        html += '</div>';
      });
    }
    return html;
  }

  // ================================================================
  //  状态
  // ================================================================
  var _allBlocks = loadBlocks();
  var _basicInfo = loadBasicInfo();
  var _jdAnalysis = null;
  var _matchReport = null;
  var _resumeScore = null;
  var _selectedBlocks = [];

  // ================================================================
  //  UI 渲染辅助
  // ================================================================
  function $id(id) { return document.getElementById(id); }

  function refreshBlockList() {
    var list = $id('blockList');
    if (!list) return;

    if (_allBlocks.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:32px 16px;color:#4a4a6a;font-size:13px;">' +
        '<i class="fa-solid fa-cubes" style="font-size:28px;display:block;margin-bottom:8px;color:#252536;"></i>暂无经历积木，请上传简历解析</div>';
      return;
    }

    var html = '';
    _allBlocks.forEach(function (b, idx) {
      var typeLabel = b.type === 'work' ? '工作' : b.type === 'project' ? '项目' : b.type === 'education' ? '教育' : '技能';
      var typeColor = b.type === 'work' ? '#6366f1' : b.type === 'project' ? '#8b5cf6' : b.type === 'education' ? '#10b981' : '#f59e0b';
      var title = b.title || b.org || '未命名条目';
      if (title.length > 30) title = title.substring(0, 30) + '...';

      html += '<div class="block-item" draggable="true" data-idx="' + idx + '" style="' +
        'display:flex;align-items:flex-start;gap:8px;padding:10px 10px;margin-bottom:6px;' +
        'background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;cursor:grab;transition:border-color 0.12s;' +
        '" onmouseenter="this.style.borderColor=\'#2d2d42\'" onmouseleave="this.style.borderColor=\'#1a1a26\'">' +
        '<div style="color:#2d2d42;font-size:14px;cursor:grab;padding-top:2px;flex-shrink:0;">' +
          '<i class="fa-solid fa-grip-vertical"></i></div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">' +
            '<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:' + typeColor + '20;color:' + typeColor + ';">' + typeLabel + '</span>' +
            '<span style="font-size:13px;font-weight:600;color:#d1d5db;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + title + '</span></div>' +
          '<div style="font-size:11px;color:#4a4a6a;">' + fmtDate(b.date) + (b.org ? ' | ' + b.org : '') + '</div>' +
          (b.tags && b.tags.length > 0 ?
            '<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:3px;">' +
              b.tags.slice(0, 6).map(function (t) { return '<span style="font-size:9px;padding:1px 6px;background:#1a1a26;color:#64748b;border-radius:8px;">' + t + '</span>'; }).join('') +
            '</div>' : '') +
        '</div>' +
        '<div style="display:flex;gap:2px;flex-shrink:0;">' +
          '<button class="btn-polish-block" data-idx="' + idx + '" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:#10b981;cursor:pointer;border-radius:5px;font-size:12px;" title="智能润色">' +
            '<i class="fa-solid fa-wand-magic-sparkles"></i></button>' +
          '<button class="btn-edit-block" data-idx="' + idx + '" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:#4a4a6a;cursor:pointer;border-radius:5px;font-size:12px;" title="编辑">' +
            '<i class="fa-solid fa-pen-to-square"></i></button>' +
          '<button class="btn-del-block" data-idx="' + idx + '" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:#4a4a6a;cursor:pointer;border-radius:5px;font-size:12px;" title="删除">' +
            '<i class="fa-solid fa-trash-can"></i></button>' +
        '</div></div>';
    });

    list.innerHTML = html;

    // 事件绑定
    list.querySelectorAll('.btn-edit-block').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); openBlockEditor(parseInt(this.getAttribute('data-idx'))); });
    });
    list.querySelectorAll('.btn-del-block').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var i = parseInt(this.getAttribute('data-idx'));
        if (confirm('确定删除这个积木吗？此操作不可恢复。')) {
          _allBlocks.splice(i, 1); saveBlocks(_allBlocks); refreshBlockList();
          JN.showToast('积木已删除', 'info');
        }
      });
    });
    list.querySelectorAll('.btn-polish-block').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); showPolishModal(_allBlocks[parseInt(this.getAttribute('data-idx'))], parseInt(this.getAttribute('data-idx'))); });
    });

    // 拖拽排序
    var items = list.querySelectorAll('.block-item');
    items.forEach(function (item) {
      item.addEventListener('dragstart', function (e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.getAttribute('data-idx'));
        this.style.opacity = '0.5';
      });
      item.addEventListener('dragend', function () { this.style.opacity = '1'; items.forEach(function (it) { it.style.borderTop = ''; }); });
      item.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; this.style.borderTop = '2px solid #6366f1'; });
      item.addEventListener('dragleave', function () { this.style.borderTop = ''; });
      item.addEventListener('drop', function (e) {
        e.preventDefault(); this.style.borderTop = '';
        var fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
        var toIdx = parseInt(this.getAttribute('data-idx'));
        if (fromIdx !== toIdx && !isNaN(fromIdx) && !isNaN(toIdx)) {
          var moved = _allBlocks.splice(fromIdx, 1)[0];
          _allBlocks.splice(toIdx, 0, moved);
          saveBlocks(_allBlocks); refreshBlockList();
        }
      });
    });
  }

  function openBlockEditor(idx) {
    var block = idx >= 0 && idx < _allBlocks.length ? _allBlocks[idx] : { id: uid(), type: 'work', title: '', org: '', date: '', description: '', tags: [] };
    var isNew = idx < 0 || idx >= _allBlocks.length;

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;padding:24px;width:90%;max-width:500px;max-height:80vh;overflow-y:auto;">' +
        '<h3 style="font-size:16px;color:#e2e8f0;margin:0 0 16px;">' + (isNew ? '添加积木' : '编辑积木') + '</h3>' +
        '<div style="margin-bottom:10px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:3px;">类型</label>' +
          '<select id="editType" style="width:100%;padding:7px 10px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:6px;color:#d1d5db;font-size:13px;">' +
            '<option value="work"' + (block.type === 'work' ? ' selected' : '') + '>工作经历</option>' +
            '<option value="project"' + (block.type === 'project' ? ' selected' : '') + '>项目经历</option>' +
            '<option value="education"' + (block.type === 'education' ? ' selected' : '') + '>教育经历</option>' +
            '<option value="skill"' + (block.type === 'skill' ? ' selected' : '') + '>技能</option></select></div>' +
        '<div style="margin-bottom:10px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:3px;">标题</label>' +
          '<input id="editTitle" value="' + (block.title || '').replace(/"/g, '&quot;') + '" style="width:100%;padding:7px 10px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:6px;color:#d1d5db;font-size:13px;"></div>' +
        '<div style="margin-bottom:10px;display:flex;gap:8px;">' +
          '<div style="flex:1;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:3px;">公司/组织</label>' +
            '<input id="editOrg" value="' + (block.org || '') + '" style="width:100%;padding:7px 10px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:6px;color:#d1d5db;font-size:13px;"></div>' +
          '<div style="flex:1;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:3px;">时间</label>' +
            '<input id="editDate" value="' + (block.date || '') + '" style="width:100%;padding:7px 10px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:6px;color:#d1d5db;font-size:13px;" placeholder="2020.06 - 2022.12"></div></div>' +
        '<div style="margin-bottom:10px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:3px;">描述</label>' +
          '<textarea id="editDesc" rows="5" style="width:100%;padding:7px 10px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:6px;color:#d1d5db;font-size:13px;resize:vertical;">' + (block.description || '') + '</textarea>' +
          '<div style="display:flex;gap:6px;margin-top:6px;">' +
            '<button id="btnCheckSTAR" type="button" style="font-size:10px;padding:3px 10px;background:#1e1e32;border:1px solid #312e81;border-radius:5px;color:#a5b4fc;cursor:pointer;">' +
              '<i class="fa-solid fa-star" style="font-size:9px;margin-right:3px;"></i>STAR检查</button>' +
            '<button id="btnDetectBuzz" type="button" style="font-size:10px;padding:3px 10px;background:#1e1e32;border:1px solid #422006;border-radius:5px;color:#fcd34d;cursor:pointer;">' +
              '<i class="fa-solid fa-triangle-exclamation" style="font-size:9px;margin-right:3px;"></i>检测套话</button>' +
          '</div>' +
          '<div id="starCheckResult" style="margin-top:6px;"></div>' +
          '<div id="buzzCheckResult" style="margin-top:6px;"></div>' +
        '</div>' +
        '<div style="margin-bottom:12px;"><label style="font-size:12px;color:#64748b;display:block;margin-bottom:3px;">标签（用逗号分隔）</label>' +
          '<input id="editTags" value="' + ((block.tags || []).join(', ')) + '" style="width:100%;padding:7px 10px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:6px;color:#d1d5db;font-size:13px;"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
          '<button id="btnCancelEdit" style="padding:7px 16px;background:#1e1e32;border:1px solid #252536;border-radius:7px;color:#94a3b8;font-size:13px;cursor:pointer;">取消</button>' +
          '<button id="btnSaveEdit" style="padding:7px 16px;background:#6366f1;border:none;border-radius:7px;color:#fff;font-size:13px;cursor:pointer;">保存</button></div></div>';

    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) document.body.removeChild(overlay); });
    overlay.querySelector('#btnCancelEdit').addEventListener('click', function () { document.body.removeChild(overlay); });

    overlay.querySelector('#btnCheckSTAR').addEventListener('click', function() {
      var text = overlay.querySelector('#editDesc').value;
      var result = checkSTAR(text);
      var resultEl = overlay.querySelector('#starCheckResult');
      var html = '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
      ['s', 't', 'a', 'r'].forEach(function(k) {
        html += '<span class="star-check-badge ' + (result[k] ? 'present' : 'missing') + '">' + STAR_LABELS[k] + '</span>';
      });
      html += '</div>';
      if (result.missing.length > 0) {
        html += '<div style="font-size:10px;color:#fcd34d;margin-top:4px;">缺少：' + result.missing.map(function(k) { return STAR_LABELS[k]; }).join('、') + '。建议补充相关描述。</div>';
      } else {
        html += '<div style="font-size:10px;color:#34d399;margin-top:4px;">STAR 四要素完整！</div>';
      }
      resultEl.innerHTML = html;
    });

    overlay.querySelector('#btnDetectBuzz').addEventListener('click', function() {
      var text = overlay.querySelector('#editDesc').value;
      var found = detectBuzzwords(text);
      var resultEl = overlay.querySelector('#buzzCheckResult');
      if (found.length === 0) {
        resultEl.innerHTML = '<div style="font-size:10px;color:#34d399;">未检测到套话，描述较为具体！</div>';
      } else {
        var html = '<div style="font-size:10px;color:#fcd34d;margin-bottom:4px;">检测到 ' + found.length + ' 处套话：</div>';
        found.forEach(function(b) {
          html += '<div style="font-size:10px;padding:4px 8px;margin-bottom:3px;background:#422006;border-radius:4px;">' +
            '<span class="buzzword-highlight">' + b.word + '</span>' +
            '<span style="color:#94a3b8;margin-left:6px;">→ ' + b.suggestion + '</span></div>';
        });
        resultEl.innerHTML = html;
      }
    });

    overlay.querySelector('#btnSaveEdit').addEventListener('click', function () {
      var updated = {
        id: block.id, type: overlay.querySelector('#editType').value,
        title: overlay.querySelector('#editTitle').value.trim(),
        org: overlay.querySelector('#editOrg').value.trim(),
        date: overlay.querySelector('#editDate').value.trim(),
        description: overlay.querySelector('#editDesc').value.trim(),
        tags: overlay.querySelector('#editTags').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean)
      };
      if (isNew) { updated.id = uid(); _allBlocks.push(updated); }
      else _allBlocks[idx] = updated;
      saveBlocks(_allBlocks); document.body.removeChild(overlay); refreshBlockList();
    });
  }

  function refreshTagCloud(analysis) {
    var cloud = $id('jdTagCloud');
    if (!cloud) return;
    if (!analysis || analysis.tags.length === 0) {
      cloud.innerHTML = '<span style="font-size:12px;color:#4a4a6a;">解析 JD 后标签将显示在此处</span>'; return;
    }
    var html = '';
    analysis.tags.forEach(function (t) {
      var isTech = analysis.techStack.indexOf(t) !== -1;
      var color = isTech ? '#818cf8' : '#34d399';
      var bg = isTech ? '#312e81' : '#064e3b';
      html += '<span style="display:inline-block;font-size:11px;padding:3px 10px;margin:2px 4px 2px 0;background:' + bg + ';color:' + color + ';border-radius:12px;">' + t + '</span>';
    });
    cloud.innerHTML = html;
    var meta = $id('jdMeta');
    if (meta) {
      var parts = [];
      if (analysis.expYears) parts.push('经验要求：<b>' + analysis.expYears + '年</b>以上');
      if (analysis.degree) parts.push('学历要求：<b>' + analysis.degree + '</b>');
      meta.innerHTML = parts.length > 0 ? '<i class="fa-solid fa-circle-info" style="margin-right:4px;color:#64748b;"></i>' + parts.join(' &nbsp;|&nbsp; ') : '';
    }
  }

  // ================================================================
  //  简历四维评分引擎
  // ================================================================
  function scoreResume(blocks, basicInfo, jdAnalysis) {
    var dims = { completeness: 0, matching: 0, expression: 0, formatting: 0 };
    var details = { completeness: [], matching: [], expression: [], formatting: [] };

    // 1. 完整性评分 (0-100)
    var compScore = 0;
    if (basicInfo && basicInfo.name) compScore += 20;
    else details.completeness.push('缺少姓名');
    if (basicInfo && basicInfo.email) compScore += 15;
    else details.completeness.push('建议填写邮箱');
    if (basicInfo && basicInfo.phone) compScore += 15;
    else details.completeness.push('建议填写电话');
    var hasWork = blocks.some(function(b) { return b.type === 'work'; });
    var hasProj = blocks.some(function(b) { return b.type === 'project'; });
    var hasEdu = blocks.some(function(b) { return b.type === 'education'; });
    if (hasWork) compScore += 20; else details.completeness.push('缺少工作经历');
    if (hasProj) compScore += 15; else details.completeness.push('建议添加项目经历');
    if (hasEdu) compScore += 15; else details.completeness.push('建议添加教育背景');
    dims.completeness = Math.min(100, compScore);

    // 2. 匹配度评分 (0-100) — 基于JD
    if (jdAnalysis && jdAnalysis.tags && jdAnalysis.tags.length > 0) {
      var report = generateMatchReport(jdAnalysis, blocks, basicInfo);
      dims.matching = report ? report.matchRate : 0;
      if (dims.matching < 100) details.matching.push('与目标岗位匹配度 ' + dims.matching + '%');
    } else {
      dims.matching = 50; // 无JD时默认中等
      details.matching.push('未粘贴JD，无法精确计算匹配度');
    }

    // 3. 表达质量评分 (0-100)
    var exprScore = 50;
    var totalDescs = 0, quantifiedDescs = 0, professionalDescs = 0;
    var PROFESSIONAL_VERBS = ['主导','负责','设计','搭建','优化','提升','实现','完成','达成','推动',
      '带领','管理','分析','构建','开发','重构','突破','创新','交付'];
    blocks.forEach(function(b) {
      if (!b.description || b.description.trim().length < 10) return;
      totalDescs++;
      // 量化检测
      if (/(\d+%|\d+倍|\d+万|\d+用户|\d+条|\d+个|\d+项|\d+人|\d+天|\d+次|\d+元)/.test(b.description)) quantifiedDescs++;
      // 专业动词检测
      for (var v = 0; v < PROFESSIONAL_VERBS.length; v++) {
        if (b.description.indexOf(PROFESSIONAL_VERBS[v]) !== -1) { professionalDescs++; break; }
      }
      // 检查空话
      if (/负责.{0,10}工作/.test(b.description) && b.description.length < 40) {
        exprScore -= 5;
        if (details.expression.indexOf('部分描述过于简略，缺乏细节') === -1) details.expression.push('部分描述过于简略，缺乏细节');
      }
      if (/认真负责|积极努力|刻苦勤奋|吃苦耐劳|踏实肯干/.test(b.description)) {
        exprScore -= 8;
        if (details.expression.indexOf('包含空话套话（如"认真负责"）') === -1) details.expression.push('包含空话套话（如"认真负责"），建议用具体成果替代');
      }
    });
    if (totalDescs > 0) {
      if (quantifiedDescs / totalDescs < 0.5) {
        exprScore -= 10;
        details.expression.push('仅 ' + quantifiedDescs + '/' + totalDescs + ' 段经历有量化数据，建议添加具体数字');
      }
      if (professionalDescs / totalDescs >= 0.8) exprScore += 15;
    } else {
      exprScore -= 20;
      details.expression.push('未检测到有效经历描述');
    }
    dims.expression = Math.max(5, Math.min(100, exprScore));

    // 4. 排版格式评分 (0-100)
    var fmtScore = 70;
    var dateCount = 0, consistentDate = true;
    var dateFormat = null;
    blocks.forEach(function(b) {
      if (b.date) {
        dateCount++;
        var fmt = b.date.match(/\d{4}[.\-/年]/) ? 'yyyy.m' : null;
        if (!dateFormat && fmt) dateFormat = fmt;
      }
      if (b.description && b.description.length > 400) {
        fmtScore -= 5;
        if (details.formatting.indexOf('部分描述过长（>400字），建议精简') === -1) details.formatting.push('部分描述过长（>400字），建议精简到300字以内');
      }
    });
    if (dateCount < blocks.length * 0.5) {
      fmtScore -= 10;
      details.formatting.push('多条经历缺少日期，建议补全时间信息');
    }
    dims.formatting = Math.max(10, Math.min(100, fmtScore));

    var overall = Math.round((dims.completeness + dims.matching + dims.expression + dims.formatting) / 4);
    return { dimensions: dims, overall: overall, details: details };
  }

  function renderResumeScore(scoreResult) {
    if (!scoreResult) return '';
    var dims = scoreResult.dimensions;
    var dimLabels = [
      { key: 'completeness', label: '完整性', icon: 'fa-circle-check', color: '#10b981' },
      { key: 'matching',     label: '匹配度', icon: 'fa-bullseye',    color: '#6366f1' },
      { key: 'expression',   label: '表达力', icon: 'fa-pen-to-square', color: '#f59e0b' },
      { key: 'formatting',   label: '排版',   icon: 'fa-text-height',  color: '#8b5cf6' }
    ];

    var overallColor = scoreResult.overall >= 80 ? '#10b981' : scoreResult.overall >= 60 ? '#f59e0b' : '#ef4444';
    var overallLabel = scoreResult.overall >= 80 ? '优秀' : scoreResult.overall >= 60 ? '良好' : scoreResult.overall >= 40 ? '一般' : '需改进';

    var barsHtml = dimLabels.map(function(d) {
      var val = dims[d.key];
      var color = val >= 80 ? '#10b981' : val >= 60 ? '#f59e0b' : '#ef4444';
      return '<div style="margin-bottom:6px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">' +
          '<span style="font-size:10px;color:#94a3b8;"><i class="fa-solid ' + d.icon + '" style="color:' + d.color + ';margin-right:4px;font-size:9px;"></i>' + d.label + '</span>' +
          '<span style="font-size:10px;color:' + color + ';font-weight:600;">' + val + '</span>' +
        '</div>' +
        '<div style="height:4px;background:#1a1a26;border-radius:2px;overflow:hidden;">' +
          '<div style="width:' + val + '%;height:100%;background:' + color + ';border-radius:2px;"></div>' +
        '</div>' +
      '</div>';
    }).join('');

    var tipsHtml = '';
    for (var dimKey in scoreResult.details) {
      var tips = scoreResult.details[dimKey];
      if (tips && tips.length > 0) {
        tipsHtml += tips.map(function(t) {
          return '<div style="font-size:10px;color:#fca5a5;padding:3px 0;line-height:1.4;">' +
            '<i class="fa-solid fa-arrow-right" style="margin-right:4px;font-size:8px;"></i>' + t + '</div>';
        }).join('');
      }
    }

    return '' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">' +
        '<div style="width:50px;height:50px;border-radius:50%;border:3px solid ' + overallColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          '<span style="font-size:15px;font-weight:700;color:' + overallColor + ';">' + scoreResult.overall + '</span>' +
        '</div>' +
        '<div>' +
          '<span style="font-size:13px;font-weight:600;color:#e2e8f0;">' + overallLabel + '</span>' +
          '<span style="font-size:10px;color:#4a4a6a;margin-left:4px;">/100</span>' +
        '</div>' +
      '</div>' +
      barsHtml +
      (tipsHtml ? '<div style="border-top:1px solid #1a1a26;margin-top:6px;padding-top:6px;">' +
        '<span style="font-size:9px;color:#ef4444;font-weight:600;">待改进项</span>' + tipsHtml + '</div>' : '');
  }

  function refreshMatchReport(el) {
    var container = el ? el.querySelector('#jdMatchReport') : document.querySelector('#jdMatchReport');
    var content = el ? el.querySelector('#jdMatchContent') : document.querySelector('#jdMatchContent');
    var badge = el ? el.querySelector('#matchRateBadge') : document.querySelector('#matchRateBadge');
    if (!container || !content) return;

    if (_jdAnalysis && _allBlocks.length > 0) {
      _matchReport = generateMatchReport(_jdAnalysis, _allBlocks, loadBasicInfo());
    } else {
      _matchReport = null;
    }

    if (_matchReport) {
      container.style.display = 'block';
      content.innerHTML = renderMatchReport(_matchReport);
      var rateColor = _matchReport.matchRate >= 70 ? '#10b981' : _matchReport.matchRate >= 40 ? '#f59e0b' : '#ef4444';
      if (badge) {
        badge.textContent = _matchReport.matchRate + '%';
        badge.style.background = rateColor + '20';
        badge.style.color = rateColor;
        badge.style.border = '1px solid ' + rateColor + '40';
      }
    } else {
      container.style.display = 'none';
      content.innerHTML = '';
      if (badge) { badge.textContent = ''; badge.style.background = ''; badge.style.color = ''; badge.style.border = ''; }
    }
  }

  function refreshResumeScore(el) {
    var container = el ? el.querySelector('#resumeScoreCard') : document.querySelector('#resumeScoreCard');
    var content = el ? el.querySelector('#resumeScoreContent') : document.querySelector('#resumeScoreContent');
    if (!container || !content) return;
    _resumeScore = scoreResume(_allBlocks, loadBasicInfo(), _jdAnalysis);
    if (_resumeScore) {
      container.style.display = 'block';
      content.innerHTML = renderResumeScore(_resumeScore);
    } else {
      container.style.display = 'none';
    }
  }

  function refreshPreview() {
    var preview = $id('resumePreview');
    if (!preview) return;
    if (_selectedBlocks.length === 0) {
      preview.innerHTML = '<div style="text-align:center;padding:48px 16px;color:#4a4a6a;font-size:13px;">' +
        '<i class="fa-solid fa-file-lines" style="font-size:32px;display:block;margin-bottom:12px;color:#252536;"></i>填入 JD 并点击「生成定制简历」后，预览将显示在此处</div>';
      return;
    }
    preview.innerHTML = generateResumeHTML(_selectedBlocks, loadBasicInfo());
  }

  // ================================================================
  //  AI增强功能（可选API，无API时自动降级）
  // ================================================================

  function callAIEnhance(prompt, options) {
    var cfg = JN.getApiConfig ? JN.getApiConfig() : {};
    if (!cfg.apiKey || !cfg.endpoint) {
      options.onError && options.onError('请先在「设置」中配置API Key以使用AI增强功能');
      return;
    }
    fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({
        model: cfg.textModel,
        messages: [
          { role: 'system', content: '你是资深职业顾问和简历专家。输出内容专业、具体、可操作。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7, max_tokens: 2500
      })
    })
    .then(function(res) {
      if (!res.ok) return res.json().then(function(e) { throw new Error(e.error ? e.error.message : 'API错误(' + res.status + ')'); });
      return res.json();
    })
    .then(function(data) {
      var content = (data.choices && data.choices[0] && data.choices[0].message.content) || '';
      if (!content.trim()) throw new Error('AI返回为空');
      options.onDone && options.onDone(content.trim());
    })
    .catch(function(err) { options.onError && options.onError(err.message || '网络错误'); });
  }

  // AI：根据JD生成定制简历内容
  function aiGenerateTailoredResume(jdText, blocks, basicInfo, callbacks) {
    var blockTexts = blocks.map(function(b, i) {
      return '[' + (i+1) + '] ' + (b.title||'') + ' @ ' + (b.org||'') + ' | ' + (b.date||'') + '\n' + (b.description||'');
    }).join('\n\n');
    var prompt = [
      '根据以下JD和候选人现有简历，生成一份定制化的简历内容建议。',
      '重点：补充JD要求的但简历中缺失的技能描述，优化各段经历的表达以匹配JD。',
      '输出格式：先概述3-5条核心修改建议，然后逐段给出优化后的描述文本。',
      '',
      '【目标岗位JD】', jdText.substring(0, 2000),
      '【候选人基本信息】', '姓名：' + (basicInfo.name||'未知'), '邮箱：' + (basicInfo.email||''), '电话：' + (basicInfo.phone||''),
      '【候选人现有经历】', blockTexts
    ].join('\n');
    callAIEnhance(prompt, callbacks);
  }

  // AI：生成量化成果示例
  function aiGenerateQuantified(blockDesc, callbacks) {
    var prompt = [
      '以下是一段简历经历描述。请为其生成3-5个可能的量化成果示例（基于行业经验合理推断），',
      '使其更具说服力。每个示例应包含具体的数字或百分比。',
      '直接输出量化建议列表，每条一行，以"•"开头。',
      '',
      '【原始描述】', blockDesc
    ].join('\n');
    callAIEnhance(prompt, callbacks);
  }

  // AI：生成多版本简历（不同风格）
  function aiGenerateMultiVersion(blocks, basicInfo, callbacks) {
    var blockTexts = blocks.map(function(b) {
      return (b.title||'') + ': ' + (b.description||'').substring(0, 200);
    }).join('\n---\n');
    var prompt = [
      '基于以下简历内容，生成3个不同风格的简历版本。每个版本200字以内的概述：',
      '版本1「互联网大厂风」：强调技术深度、项目规模、数据驱动',
      '版本2「创业公司风」：强调全能型、从0到1、快速迭代',
      '版本3「外企/国际化」：强调跨文化协作、流程规范、影响力',
      '',
      '【原始简历】', (basicInfo.name||'') + ' | ' + (basicInfo.email||''),
      blockTexts
    ].join('\n');
    callAIEnhance(prompt, callbacks);
  }

  // ================================================================
  //  主渲染函数
  // ================================================================
  function render() {
    var el = document.createElement('div');

    el.innerHTML =
      '<div style="margin-bottom:16px;">' +
        '<h2 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">' +
          '<i class="fa-solid fa-file-pen" style="color:#818cf8;margin-right:8px;"></i>简历管理' +
        '</h2>' +
        '<p style="font-size:13px;color:#64748b;margin:0;">上传简历 → 经历积木化管理 → JD匹配 → 生成定制版</p>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
        '<div>' +
          // 上传区
          '<div class="panel-card" style="margin-bottom:10px;padding:14px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
              '<i class="fa-solid fa-cloud-upload-alt" style="color:#818cf8;"></i>' +
              '<span style="font-size:13px;font-weight:600;color:#d1d5db;">上传简历</span>' +
              '<span style="font-size:10px;color:#4a4a6a;">支持 PDF / Word / TXT（最大10MB）</span>' +
            '</div>' +
            '<input type="file" id="fileInput" accept=".pdf,.docx,.doc,.txt" multiple style="display:none;">' +
            '<div id="uploadDropZone" style="text-align:center;padding:22px 14px;border:2px dashed #6366f1;border-radius:8px;' +
              'cursor:pointer;background:#0f0f1a;transition:all 0.15s;">' +
              '<i class="fa-solid fa-cloud-arrow-up" style="font-size:24px;color:#6366f1;display:block;margin-bottom:8px;opacity:0.7;"></i>' +
              '<span style="font-size:13px;color:#a5b4fc;font-weight:500;">拖拽简历文件到此处</span>' +
              '<span style="font-size:12px;color:#64748b;display:block;margin-top:2px;">或 <span style="color:#818cf8;text-decoration:underline;">点击选择文件</span></span>' +
              '<span style="font-size:10px;color:#374151;display:block;margin-top:4px;">支持 PDF、Word（.doc/.docx）、TXT，可同时上传多个</span>' +
            '</div>' +
            '<div style="display:flex;gap:6px;margin-top:8px;">' +
              '<button id="btnSampleResume" class="btn btn-outline" style="font-size:11px;flex:1;background:transparent;border:1px solid #312e81;color:#a5b4fc;padding:6px 10px;">' +
                '<i class="fa-solid fa-gift" style="font-size:10px;"></i> 上传示例简历</button>' +
            '</div>' +
            '<div id="uploadProgress" style="display:none;margin-top:8px;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">' +
                '<span id="uploadStatus" style="font-size:11px;color:#94a3b8;">解析中...</span>' +
                '<span id="uploadPercent" style="font-size:10px;color:#4a4a6a;">0%</span>' +
              '</div>' +
              '<div style="width:100%;height:3px;background:#1a1a26;border-radius:2px;overflow:hidden;">' +
                '<div id="uploadProgressBar" style="width:0%;height:100%;background:#6366f1;border-radius:2px;transition:width 0.3s;"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // 基本信息
          '<div class="panel-card" style="margin-bottom:10px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
              '<i class="fa-solid fa-id-card" style="color:#10b981;"></i>' +
              '<span style="font-size:13px;font-weight:600;color:#d1d5db;">基本信息</span>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
              '<input id="inputName" class="ninja-input" placeholder="姓名" style="font-size:12px;">' +
              '<input id="inputEmail" class="ninja-input" placeholder="邮箱" style="font-size:12px;">' +
            '</div>' +
            '<input id="inputPhone" class="ninja-input" placeholder="电话" style="font-size:12px;margin-top:6px;">' +
          '</div>' +

          // JD 输入区
          '<div class="panel-card" style="margin-bottom:10px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
              '<i class="fa-solid fa-bullseye" style="color:#f59e0b;"></i>' +
              '<span style="font-size:13px;font-weight:600;color:#d1d5db;">目标岗位 JD</span>' +
            '</div>' +
            '<textarea id="jdInput" class="ninja-input" rows="6" placeholder="粘贴目标岗位的职位描述（Job Description）..." style="font-size:12px;"></textarea>' +
            '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">' +
              '<button id="btnParseJD" class="btn btn-primary" style="font-size:12px;">' +
                '<i class="fa-solid fa-magnifying-glass" style="font-size:11px;"></i> 解析 JD</button>' +
              '<button id="btnClearJD" class="btn btn-outline" style="font-size:12px;">清空</button>' +
              '<button id="btnBatchJD" class="btn btn-outline" style="font-size:12px;border-color:#312e81;color:#a5b4fc;" title="批量导入多个JD分析共同关键词">' +
                '<i class="fa-solid fa-layer-group" style="font-size:11px;"></i> 批量JD</button>' +
              '<button id="btnGoJobSearch" class="btn btn-outline" style="font-size:12px;border-color:#065f46;color:#34d399;" title="跳到找工作页面搜索此岗位">' +
                '<i class="fa-solid fa-arrow-right-to-bracket" style="font-size:11px;"></i> 去搜岗位</button>' +
            '</div>' +
            '<div id="jdMeta" style="margin-top:8px;font-size:11px;color:#94a3b8;"></div>' +
            '<div id="jdTagCloud" style="margin-top:6px;line-height:1.8;"></div>' +
          '</div>' +

          // JD匹配报告（解析后显示）
          '<div id="jdMatchReport" class="panel-card" style="display:none;margin-bottom:10px;border-color:#312e81;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
              '<i class="fa-solid fa-chart-pie" style="color:#818cf8;"></i>' +
              '<span style="font-size:13px;font-weight:600;color:#d1d5db;">匹配度报告</span>' +
              '<span id="matchRateBadge" style="font-size:10px;padding:2px 8px;border-radius:10px;"></span>' +
            '</div>' +
            '<div id="jdMatchContent"></div>' +
          '</div>' +
        '</div>' +

        // 积木库
        '<div>' +
          '<div class="panel-card">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<i class="fa-solid fa-cubes" style="color:#8b5cf6;"></i>' +
                '<span style="font-size:13px;font-weight:600;color:#d1d5db;">经历积木库</span>' +
                '<span id="blockCount" style="font-size:11px;color:#4a4a6a;">(' + _allBlocks.length + ')</span>' +
              '</div>' +
              '<button id="btnAddBlock" class="btn btn-outline" style="font-size:11px;padding:4px 10px;">' +
                '<i class="fa-solid fa-plus" style="font-size:10px;"></i> 手动添加</button>' +
            '</div>' +
            '<div id="blockList" style="max-height:460px;overflow-y:auto;padding-right:2px;" class="custom-scrollbar"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div style="margin-top:14px;">' +
        // 简历评分卡片
        '<div id="resumeScoreCard" class="panel-card" style="display:block;margin-bottom:10px;border-color:#312e81;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<i class="fa-solid fa-star" style="color:#f59e0b;"></i>' +
              '<span style="font-size:13px;font-weight:600;color:#d1d5db;">简历评分</span>' +
              '<span style="font-size:10px;color:#4a4a6a;">四维评估</span>' +
            '</div>' +
            '<button id="btnRefreshScore" class="btn btn-outline" style="font-size:10px;padding:3px 10px;">' +
              '<i class="fa-solid fa-rotate"></i> 刷新评分</button>' +
          '</div>' +
          '<div id="resumeScoreContent"></div>' +
        '</div>' +
        // 隐私声明
        '<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;margin-bottom:10px;' +
          'background:#064e3b;border:1px solid #065f46;border-radius:8px;">' +
          '<i class="fa-solid fa-shield-halved" style="color:#34d399;font-size:14px;"></i>' +
          '<span style="font-size:12px;color:#6ee7b7;">' +
            '<strong>本地模式：</strong>无需API配置，润色和解析均在本地完成。所有数据仅存储于本机浏览器。</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<i class="fa-solid fa-file-signature" style="color:#818cf8;"></i>' +
            '<span style="font-size:13px;font-weight:600;color:#d1d5db;">简历预览</span>' +
          '</div>' +
          '<div style="display:flex;gap:6px;">' +
            '<button id="btnVersions" class="btn btn-outline" style="font-size:12px;">' +
              '<i class="fa-solid fa-code-branch" style="font-size:11px;"></i> 版本管理</button>' +
            '<button id="btnBatchPolish" class="btn btn-outline" style="font-size:12px;background:#1e1e32;border-color:#312e81;color:#a5b4fc;">' +
              '<i class="fa-solid fa-wand-magic-sparkles" style="font-size:11px;"></i> 批量优化</button>' +
            '<button id="btnGenerate" class="btn btn-primary" style="font-size:12px;">' +
              '<i class="fa-solid fa-wand-magic-sparkles" style="font-size:11px;"></i> 生成定制简历</button>' +
            '<button id="btnExportPDF" class="btn btn-outline" style="font-size:12px;">' +
              '<i class="fa-solid fa-download" style="font-size:11px;"></i> 导出 PDF</button>' +
            '<div style="position:relative;display:inline-block;">' +
              '<button id="btnExportMore" class="btn btn-outline" style="font-size:12px;" title="更多导出格式">' +
                '<i class="fa-solid fa-ellipsis" style="font-size:11px;"></i></button>' +
              '<div id="exportDropdown" class="export-dropdown-menu" style="display:none;">' +
                '<div class="export-dropdown-item" id="btnExportWord"><i class="fa-solid fa-file-word" style="margin-right:6px;color:#2563eb;"></i>导出 Word</div>' +
                '<div class="export-dropdown-item" id="btnExportTxt"><i class="fa-solid fa-file-lines" style="margin-right:6px;color:#64748b;"></i>导出 TXT</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          // AI增强按钮
          '<div style="display:flex;gap:6px;margin-top:6px;padding-top:6px;border-top:1px solid #1a1a26;">' +
            '<span style="font-size:10px;color:#4a4a6a;display:flex;align-items:center;margin-right:4px;">' +
              '<i class="fa-solid fa-robot" style="margin-right:3px;"></i>AI增强</span>' +
            '<button id="btnAITailor" class="btn btn-outline" style="font-size:11px;border-color:#312e81;color:#a5b4fc;" title="根据JD生成定制简历建议">' +
              '<i class="fa-solid fa-file-pen" style="font-size:10px;"></i> JD定制</button>' +
            '<button id="btnAIQuantify" class="btn btn-outline" style="font-size:11px;border-color:#312e81;color:#a5b4fc;" title="为选中经历生成量化示例">' +
              '<i class="fa-solid fa-percent" style="font-size:10px;"></i> 量化建议</button>' +
            '<button id="btnAIMulti" class="btn btn-outline" style="font-size:11px;border-color:#312e81;color:#a5b4fc;" title="生成不同风格简历版本">' +
              '<i class="fa-solid fa-layer-group" style="font-size:10px;"></i> 多版本</button>' +
          '</div>' +
        '</div>' +
        '<div id="batchProgress" style="display:none;margin-bottom:8px;padding:8px 14px;background:#12121a;border:1px solid #1a1a26;border-radius:8px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
            '<span style="font-size:12px;color:#a5b4fc;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:4px;"></i>批量优化中...</span>' +
            '<span id="batchProgressText" style="font-size:11px;color:#64748b;">0 / 0</span>' +
          '</div>' +
          '<div style="width:100%;height:4px;background:#1a1a26;border-radius:2px;overflow:hidden;">' +
            '<div id="batchProgressBar" style="width:0%;height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:2px;transition:width 0.3s;"></div>' +
          '</div>' +
        '</div>' +
        '<div id="resumePreview" class="panel-card" style="min-height:180px;background:#0a0a0f;border:1px solid #1a1a26;"></div>' +
      '</div>';

    // ===== 事件绑定 =====
    var fileInput = el.querySelector('#fileInput');
    var dropZone  = el.querySelector('#uploadDropZone');
    var progressDiv = el.querySelector('#uploadProgress');
    var progressBar = el.querySelector('#uploadProgressBar');
    var progressPct = el.querySelector('#uploadPercent');
    var statusEl    = el.querySelector('#uploadStatus');
    var MAX_SIZE = 10 * 1024 * 1024;

    function showProgress(show) {
      progressDiv.style.display = show ? 'block' : 'none';
      if (!show) { progressBar.style.width = '0%'; progressPct.textContent = '0%'; }
    }
    function setProgress(msg, pct) {
      statusEl.innerHTML = msg;
      progressPct.textContent = (pct || 0) + '%';
      progressBar.style.width = (pct || 0) + '%';
    }

    function processFile(file) {
      if (!file) return;
      if (file.size > MAX_SIZE) {
        var sizeMB = (file.size / 1024 / 1024).toFixed(1);
        JN.showToast('文件过大（' + sizeMB + 'MB），请压缩到10MB以内', 'error');
        console.error('[上传] 文件超限: ' + file.name + ' (' + sizeMB + ' MB)');
        return;
      }

      console.log('[上传] 开始处理: ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)');
      showProgress(true);
      setProgress('<i class="fa-solid fa-spinner fa-spin"></i> 解析中...', 15);

      var onParsed = function (err, text) {
        if (err) {
          var errMsg = err.message || err.toString();
          console.error('[上传] 解析失败: ' + errMsg);
          setProgress('<span style="color:#ef4444;">' + errMsg + '</span>', 0);
          JN.showToast(errMsg, 'error');
          setTimeout(function () { showProgress(false); }, 4000);
          return;
        }

        setProgress('<i class="fa-solid fa-spinner fa-spin"></i> 分析内容...', 70);
        console.log('[上传] 提取文本长度: ' + text.length + ' 字符');

        var parsed = parseTextToBlocks(text);
        console.log('[上传] 解析: ' + parsed.blocks.length + ' blocks');

        // 显示识别结果预览
        showParseResultPreview(parsed);
        showProgress(false);
      };

      if (file.name.toLowerCase().endsWith('.pdf')) {
        parsePDF(file, onParsed);
      } else if (/\.(docx?|doc)$/i.test(file.name)) {
        parseWord(file, onParsed);
      } else if (file.name.toLowerCase().endsWith('.txt')) {
        var reader = new FileReader();
        reader.onload = function (e) { onParsed(null, e.target.result); };
        reader.readAsText(file, 'utf-8');
      } else {
        console.warn('[上传] 不支持的文件格式: ' + file.name);
        JN.showToast('不支持的文件格式。请上传 PDF、Word 或 TXT 文件', 'error');
      }
    }

    function processFilesSequential(fileList, index) {
      if (index >= fileList.length) return;
      var file = fileList[index];
      var validExt = /\.(pdf|docx?|doc|txt)$/i;
      if (!validExt.test(file.name)) {
        JN.showToast('跳过不支持的文件：' + file.name, 'warning');
        processFilesSequential(fileList, index + 1);
        return;
      }
      processFile(file);
      setTimeout(function () { processFilesSequential(fileList, index + 1); }, 500);
    }

    fileInput.addEventListener('change', function () {
      if (this.files && this.files.length > 0) processFilesSequential(Array.prototype.slice.call(this.files), 0);
      this.value = '';
    });

    dropZone.addEventListener('click', function () { fileInput.click(); });
    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault(); e.stopPropagation();
      this.style.borderColor = '#a5b4fc'; this.style.background = '#13132a';
      this.style.boxShadow = '0 0 20px rgba(99,102,241,0.15)';
    });
    dropZone.addEventListener('dragleave', function () {
      this.style.borderColor = '#6366f1'; this.style.background = '#0f0f1a';
      this.style.boxShadow = 'none';
    });
    dropZone.addEventListener('drop', function (e) {
      e.preventDefault(); e.stopPropagation();
      this.style.borderColor = '#6366f1'; this.style.background = '#0f0f1a';
      this.style.boxShadow = 'none';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFilesSequential(Array.prototype.slice.call(e.dataTransfer.files), 0);
      }
    });

    // 示例简历
    el.querySelector('#btnSampleResume').addEventListener('click', function () {
      var sampleBlocks = [
        { id: 'demo_1', type: 'work', title: '高级前端工程师', org: '某头部互联网公司', date: '2021.06 - 2024.01',
          description: '主导核心中台系统前端架构设计，使用 React + TypeScript 重构遗留项目，页面加载性能提升 60%。\n搭建组件库，覆盖 80% 业务场景，团队开发效率提升 40%。\n推动单元测试和 E2E 测试覆盖，线上故障率下降 70%。',
          tags: ['React', 'TypeScript', '性能优化', '组件库', '测试'] },
        { id: 'demo_2', type: 'project', title: '数据可视化分析平台', org: '', date: '2022.03 - 2022.11',
          description: '从 0 到 1 搭建数据可视化分析平台，使用 Vue3 + ECharts + Node.js + PostgreSQL 技术栈。\n实现海量业务数据的实时展示和交互分析，支撑日均数万次查询。\n独立负责前端架构和核心图表组件开发。',
          tags: ['Vue', 'ECharts', 'Node.js', 'PostgreSQL', '数据可视化'] },
        { id: 'demo_3', type: 'education', title: '计算机科学与技术 本科', org: '某985高校', date: '2017.09 - 2021.06',
          description: '计算机科学与技术专业，GPA 3.8/4.0，获国家奖学金。\n主修课程：数据结构、算法设计、操作系统、计算机网络、数据库原理。',
          tags: ['计算机科学', '算法', '数据结构'] }
      ];
      var sampleInfo = { name: '张三', email: 'zhangsan@example.com', phone: '13800001234' };
      sampleBlocks.forEach(function (b) {
        var dup = _allBlocks.some(function (eb) { return eb.description.substring(0, 30) === b.description.substring(0, 30); });
        if (!dup) _allBlocks.push(b);
      });
      saveBlocks(_allBlocks); refreshBlockList();
      saveBasicInfo(sampleInfo);
      var ni = el.querySelector('#inputName'); if (ni) ni.value = sampleInfo.name;
      var ei = el.querySelector('#inputEmail'); if (ei) ei.value = sampleInfo.email;
      var pi = el.querySelector('#inputPhone'); if (pi) pi.value = sampleInfo.phone;
      JN.showToast('示例简历已加载：' + sampleBlocks.length + ' 个积木，请查看积木库', 'success');
    });

    // 基本信息自动保存
    var inputName = el.querySelector('#inputName');
    var inputEmail = el.querySelector('#inputEmail');
    var inputPhone = el.querySelector('#inputPhone');
    if (_basicInfo.name) inputName.value = _basicInfo.name;
    if (_basicInfo.email) inputEmail.value = _basicInfo.email;
    if (_basicInfo.phone) inputPhone.value = _basicInfo.phone;
    [inputName, inputEmail, inputPhone].forEach(function (inp) {
      inp.addEventListener('change', function () {
        saveBasicInfo({ name: inputName.value.trim(), email: inputEmail.value.trim(), phone: inputPhone.value.trim() });
      });
    });

    // JD 解析
    el.querySelector('#btnParseJD').addEventListener('click', function () {
      var jdText = el.querySelector('#jdInput').value.trim();
      if (!jdText) { JN.showToast('请先粘贴目标岗位 JD', 'warning'); return; }
      _jdAnalysis = parseJD(jdText);
      refreshTagCloud(_jdAnalysis);
      refreshMatchReport(el);
      JN.setStatusMsg && JN.setStatusMsg('JD 解析完成：' + _jdAnalysis.tags.length + ' 个关键词，匹配度 ' + (_matchReport ? _matchReport.matchRate + '%' : 'N/A'));
    });

    // 跳转到找工作
    el.querySelector('#btnGoJobSearch').addEventListener('click', function() {
      var jdText = el.querySelector('#jdInput').value.trim();
      // 从JD中尝试提取岗位名
      var keyword = '';
      var titleMatch = jdText.match(/(?:岗位|职位|招聘)[：:\s]*([^\n，,]{2,20})/);
      if (titleMatch) keyword = titleMatch[1];
      else {
        var firstLine = jdText.split('\n')[0];
        if (firstLine && firstLine.length < 30) keyword = firstLine;
      }
      var settings = (function() { try { return JSON.parse(localStorage.getItem('jobninja_settings')) || {}; } catch(_) { return {}; } })();
      var city = settings.city || '';
      if (JN.jumpToPanel) {
        JN.jumpToPanel('jobsearch', { keyword: keyword, city: city });
      }
    });

    el.querySelector('#btnClearJD').addEventListener('click', function () {
      el.querySelector('#jdInput').value = '';
      _jdAnalysis = null; _selectedBlocks = []; _matchReport = null;
      refreshTagCloud(null); refreshMatchReport(el); refreshPreview();
    });

    // 生成定制简历
    el.querySelector('#btnGenerate').addEventListener('click', function () {
      if (_allBlocks.length === 0) { JN.showToast('请先上传简历或手动添加积木', 'warning'); return; }
      var jdText = el.querySelector('#jdInput').value.trim();
      if (!_jdAnalysis && jdText) { _jdAnalysis = parseJD(jdText); refreshTagCloud(_jdAnalysis); }
      refreshMatchReport(el);
      _selectedBlocks = selectTopBlocks(_allBlocks, _jdAnalysis, 5);
      refreshPreview();
      JN.setStatusMsg && JN.setStatusMsg('已选取 ' + _selectedBlocks.length + ' 段经历生成简历');
    });

    // 导出 PDF
    el.querySelector('#btnExportPDF').addEventListener('click', function () {
      var preview = el.querySelector('#resumePreview');
      if (!preview || _selectedBlocks.length === 0) { JN.showToast('请先生成简历预览', 'warning'); return; }
      if (typeof html2pdf === 'undefined') { JN.showToast('html2pdf.js 未加载，请检查网络连接', 'error'); return; }
      var clone = preview.cloneNode(true);
      clone.style.background = '#0a0a0f'; clone.style.color = '#e2e8f0'; clone.style.padding = '24px';
      clone.style.width = '210mm';
      var opt = {
        margin: [8, 10, 8, 10], filename: 'JobNinja_简历_' + (_basicInfo.name || '未命名') + '.pdf',
        image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, backgroundColor: '#0a0a0f', useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(clone).save().then(function () {
        JN.setStatusMsg && JN.setStatusMsg('PDF 导出成功');
      }).catch(function (err) {
        console.error('PDF导出失败:', err); JN.showToast('导出失败：' + (err.message || '请重试'), 'error');
      });
    });

    // 导出更多格式下拉
    var exportDropdown = el.querySelector('#exportDropdown');
    el.querySelector('#btnExportMore').addEventListener('click', function(e) {
      e.stopPropagation();
      exportDropdown.style.display = exportDropdown.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', function() { if (exportDropdown) exportDropdown.style.display = 'none'; }, { once: false });
    el.querySelector('#btnExportWord').addEventListener('click', function() {
      exportDropdown.style.display = 'none';
      var preview = el.querySelector('#resumePreview');
      if (!preview || _selectedBlocks.length === 0) { JN.showToast('请先生成简历预览', 'warning'); return; }
      exportAsWord(preview.innerHTML, 'JobNinja_简历_' + (_basicInfo.name || '未命名'));
    });
    el.querySelector('#btnExportTxt').addEventListener('click', function() {
      exportDropdown.style.display = 'none';
      if (_selectedBlocks.length === 0 && _allBlocks.length === 0) { JN.showToast('请先生成简历预览', 'warning'); return; }
      exportAsTxt(_selectedBlocks.length > 0 ? _selectedBlocks : _allBlocks, _basicInfo);
    });

    // 批量 JD 分析
    el.querySelector('#btnBatchJD').addEventListener('click', function() {
      showBatchJDModal(_allBlocks, _basicInfo);
    });

    // 手动添加积木
    el.querySelector('#btnAddBlock').addEventListener('click', function () { openBlockEditor(-1); });

    // 批量优化（本地优先）
    el.querySelector('#btnBatchPolish').addEventListener('click', function () {
      if (_allBlocks.length === 0) { JN.showToast('请先上传简历或手动添加积木', 'warning'); return; }
      var candidates = [];
      _allBlocks.forEach(function (b, i) {
        if ((b.type === 'work' || b.type === 'project') && b.description && b.description.trim().length >= 20) {
          candidates.push({ block: b, idx: i });
        }
      });
      if (candidates.length === 0) { JN.showToast('没有可优化的积木（需要工作或项目类型，且描述足够充实）', 'warning'); return; }

      var cfg = JN.getApiConfig ? JN.getApiConfig() : {};
      var useAI = cfg.apiKey && cfg.endpoint;
      var modeLabel = useAI ? '脱敏 → AI润色 → 替换' : '本地规则优化';
      if (!confirm('将对 ' + candidates.length + ' 个积木逐条执行：' + modeLabel + '。\n\n数据仅存储于本机。\n\n是否继续？')) return;

      var progressDiv2 = el.querySelector('#batchProgress');
      var progressBar2 = el.querySelector('#batchProgressBar');
      var progressText2 = el.querySelector('#batchProgressText');
      var batchBtn = el.querySelector('#btnBatchPolish');
      progressDiv2.style.display = 'block'; batchBtn.disabled = true;
      batchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 优化中...';

      var total = candidates.length, completed = 0, errors = [];
      function updateProgress2() {
        var pct = Math.round((completed / total) * 100);
        progressBar2.style.width = pct + '%'; progressText2.textContent = completed + ' / ' + total;
      }
      function processNext2(queue) {
        if (queue.length === 0) {
          progressText2.textContent = '完成！'; progressBar2.style.width = '100%';
          batchBtn.disabled = false; batchBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" style="font-size:11px;"></i> 批量优化';
          saveBlocks(_allBlocks); refreshBlockList(); if (_selectedBlocks.length > 0) refreshPreview();
          var msg = '批量优化完成：' + total + ' 条';
          if (errors.length > 0) { msg += '（' + errors.length + ' 条失败：' + errors.join('；') + '）'; }
          JN.showToast(msg, errors.length > 0 ? 'warning' : 'success');
          JN.setStatusMsg && JN.setStatusMsg(msg);
          setTimeout(function () { if (progressDiv2) progressDiv2.style.display = 'none'; }, 3000);
          return;
        }
        var item = queue.shift();
        progressText2.textContent = completed + ' / ' + total + ' — 处理：' + (item.block.title || '').substring(0, 20);

        if (useAI) {
          var desensitized = desensitize(item.block.description || '');
          callAIPolish(desensitized, {
            onProgress: function () {},
            onDone: function (polished) {
              _allBlocks[item.idx].description = polished;
              _allBlocks[item.idx].tags = matchTechKeywords(polished).concat(matchSoftSkills(polished));
              completed++; updateProgress2(); processNext2(queue);
            },
            onError: function (err) {
              errors.push((item.block.title || '').substring(0, 20) + ': ' + err);
              completed++; updateProgress2(); processNext2(queue);
            }
          });
        } else {
          var localResult = polishTextLocal(item.block.description || '');
          if (localResult !== item.block.description) {
            _allBlocks[item.idx].description = localResult;
            _allBlocks[item.idx].tags = matchTechKeywords(localResult).concat(matchSoftSkills(localResult));
          }
          completed++; updateProgress2();
          // 小延迟让UI更新
          setTimeout(function() { processNext2(queue); }, 50);
        }
      }
      updateProgress2(); processNext2(candidates.slice());
    });

    // 版本管理按钮
    el.querySelector('#btnVersions').addEventListener('click', function() {
      showVersionManager(el);
    });

    // 刷新评分按钮
    el.querySelector('#btnRefreshScore').addEventListener('click', function() {
      refreshResumeScore(el);
      JN.showToast('简历评分已更新', 'info');
    });

    // AI：JD定制
    el.querySelector('#btnAITailor').addEventListener('click', function() {
      var jdText = el.querySelector('#jdInput').value.trim();
      if (!jdText) { JN.showToast('请先粘贴目标岗位JD', 'warning'); return; }
      if (_allBlocks.length === 0) { JN.showToast('请先上传简历', 'warning'); return; }
      var btn = el.querySelector('#btnAITailor');
      var reset = JN.btnLoading(btn, '<i class="fa-solid fa-spinner fa-spin"></i>');
      aiGenerateTailoredResume(jdText, _allBlocks, loadBasicInfo(), {
        onDone: function(result) { showAIResultModal('AI定制简历建议', result); reset(); },
        onError: function(err) { JN.showToast(err, 'warning'); reset(); }
      });
    });

    // AI：量化建议
    el.querySelector('#btnAIQuantify').addEventListener('click', function() {
      if (_allBlocks.length === 0) { JN.showToast('请先上传简历', 'warning'); return; }
      var candidates = _allBlocks.filter(function(b) { return (b.type === 'work' || b.type === 'project') && b.description && b.description.length >= 20; });
      if (candidates.length === 0) { JN.showToast('没有可优化的经历', 'warning'); return; }
      var block = candidates[0];
      if (candidates.length > 1) {
        var names = candidates.map(function(b, i) { return '[' + (i+1) + '] ' + (b.title || '').substring(0, 20); }).join('\n');
        var choice = prompt('选择要生成量化建议的经历（输入序号）：\n\n' + names, '1');
        var idx = parseInt(choice) - 1;
        if (idx >= 0 && idx < candidates.length) block = candidates[idx];
      }
      var btn = el.querySelector('#btnAIQuantify');
      var reset = JN.btnLoading(btn, '<i class="fa-solid fa-spinner fa-spin"></i>');
      aiGenerateQuantified(block.description || '', {
        onDone: function(result) { showAIResultModal('量化建议：' + (block.title || ''), result); reset(); },
        onError: function(err) { JN.showToast(err, 'warning'); reset(); }
      });
    });

    // AI：多版本
    el.querySelector('#btnAIMulti').addEventListener('click', function() {
      if (_allBlocks.length === 0) { JN.showToast('请先上传简历', 'warning'); return; }
      var btn = el.querySelector('#btnAIMulti');
      var reset = JN.btnLoading(btn, '<i class="fa-solid fa-spinner fa-spin"></i>');
      aiGenerateMultiVersion(_allBlocks, loadBasicInfo(), {
        onDone: function(result) { showAIResultModal('多版本简历', result); reset(); },
        onError: function(err) { JN.showToast(err, 'warning'); reset(); }
      });
    });

    // 初始渲染
    setTimeout(function () { refreshBlockList(); refreshTagCloud(_jdAnalysis); refreshMatchReport(el); refreshResumeScore(el); refreshPreview(); }, 0);

    return el;
  }

  // 显示AI结果弹窗
  function showAIResultModal(title, content) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;width:95%;max-width:650px;max-height:85vh;display:flex;flex-direction:column;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #1a1a26;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<i class="fa-solid fa-robot" style="color:#a5b4fc;font-size:14px;"></i>' +
            '<h4 style="font-size:14px;color:#e2e8f0;margin:0;">' + title + '</h4>' +
            '<span style="font-size:9px;padding:2px 6px;background:#312e81;color:#a5b4fc;border-radius:3px;">AI生成</span>' +
          '</div>' +
          '<button id="aiClose" style="background:none;border:none;color:#4a4a6a;cursor:pointer;font-size:18px;">&times;</button>' +
        '</div>' +
        '<div style="flex:1;overflow-y:auto;padding:14px 18px;" class="custom-scrollbar">' +
          '<div style="font-size:13px;color:#d1d5db;line-height:1.8;white-space:pre-wrap;">' + content.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>' +
        '</div>' +
        '<div style="padding:10px 18px;border-top:1px solid #1a1a26;display:flex;justify-content:flex-end;gap:6px;">' +
          '<button id="aiCopy" class="btn btn-outline" style="font-size:11px;"><i class="fa-solid fa-copy"></i> 复制内容</button>' +
          '<button id="aiClose2" class="btn btn-outline" style="font-size:11px;">关闭</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    function close() { document.body.removeChild(overlay); }
    overlay.querySelector('#aiClose').addEventListener('click', close);
    overlay.querySelector('#aiClose2').addEventListener('click', close);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    overlay.querySelector('#aiCopy').addEventListener('click', function() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(content).then(function() { JN.showToast('已复制到剪贴板', 'success'); });
      } else {
        var ta = document.createElement('textarea'); ta.value = content; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); JN.showToast('已复制到剪贴板', 'success'); } catch(_) { JN.showToast('复制失败，请手动选择', 'error'); }
        document.body.removeChild(ta);
      }
    });
  }

  // ================================================================
  //  简历版本管理
  // ================================================================
  var STORAGE_VERSIONS = 'jobninja_resume_versions';

  function loadVersions() { try { return JSON.parse(localStorage.getItem(STORAGE_VERSIONS)) || []; } catch (_) { return []; } }
  function saveVersions(list) { localStorage.setItem(STORAGE_VERSIONS, JSON.stringify(list)); }

  function saveVersion(name) {
    var versions = loadVersions();
    var snapshot = {
      id: 'v_' + Date.now().toString(36),
      name: name || ('版本 ' + (versions.length + 1)),
      blocks: JSON.parse(JSON.stringify(_allBlocks)),
      basicInfo: JSON.parse(JSON.stringify(loadBasicInfo())),
      createdAt: new Date().toISOString()
    };
    versions.unshift(snapshot);
    if (versions.length > 20) versions = versions.slice(0, 20);
    saveVersions(versions);
    return snapshot;
  }

  function loadVersion(versionId) {
    var versions = loadVersions();
    var v = versions.find(function(v) { return v.id === versionId; });
    if (!v) return false;
    if (!confirm('加载版本「' + v.name + '」将替换当前简历内容。建议先保存当前版本。是否继续？')) return false;
    _allBlocks = v.blocks || [];
    _basicInfo = v.basicInfo || { name: '', email: '', phone: '' };
    saveBlocks(_allBlocks);
    saveBasicInfo(_basicInfo);
    refreshBlockList();
    refreshMatchReport();
    refreshResumeScore();
    refreshPreview();
    // 更新基本信息输入框
    var nameInput = document.querySelector('#inputName');
    var emailInput = document.querySelector('#inputEmail');
    var phoneInput = document.querySelector('#inputPhone');
    if (nameInput) nameInput.value = _basicInfo.name || '';
    if (emailInput) emailInput.value = _basicInfo.email || '';
    if (phoneInput) phoneInput.value = _basicInfo.phone || '';
    JN.showToast('已加载版本「' + v.name + '」', 'success');
    return true;
  }

  function showVersionManager(el) {
    var versions = loadVersions();
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;padding:18px;width:95%;max-width:500px;max-height:80vh;display:flex;flex-direction:column;">' +
        '<h4 style="font-size:15px;color:#e2e8f0;margin:0 0 4px;">简历版本管理</h4>' +
        '<p style="font-size:11px;color:#64748b;margin:0 0 10px;">保存不同版本以适配不同岗位</p>' +
        '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
          '<input id="vmName" class="ninja-input" placeholder="版本名称（如：互联网版）" style="font-size:12px;flex:1;">' +
          '<button id="vmSave" class="btn btn-primary" style="font-size:12px;white-space:nowrap;">保存当前</button>' +
        '</div>' +
        '<div style="flex:1;overflow-y:auto;max-height:350px;" class="custom-scrollbar">' +
          (versions.length === 0 ? '<div style="text-align:center;padding:30px;color:#4a4a6a;font-size:12px;">暂无已保存版本</div>' :
            versions.map(function(v, i) {
              var date = v.createdAt ? new Date(v.createdAt).toISOString().slice(0,16).replace('T',' ') : '';
              var blockCount = (v.blocks || []).length;
              return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;margin-bottom:4px;background:#0f0f17;border:1px solid #1a1a26;border-radius:6px;">' +
                '<div style="flex:1;min-width:0;">' +
                  '<div style="font-size:12px;font-weight:600;color:#e2e8f0;">' + (v.name || '未命名') + '</div>' +
                  '<div style="font-size:9px;color:#4a4a6a;">' + blockCount + '段经历 · ' + date + '</div>' +
                '</div>' +
                '<div style="display:flex;gap:3px;">' +
                  '<button class="vm-load-btn" data-vid="' + v.id + '" style="font-size:9px;padding:2px 8px;background:#1e1e32;border:1px solid #312e81;border-radius:3px;color:#a5b4fc;cursor:pointer;">加载</button>' +
                  '<button class="vm-del-btn" data-vid="' + v.id + '" style="font-size:9px;padding:2px 6px;background:transparent;border:1px solid #1a1a26;border-radius:3px;color:#4a4a6a;cursor:pointer;">删除</button>' +
                '</div>' +
              '</div>';
            }).join('')) +
        '</div>' +
        '<button id="vmClose" class="btn btn-outline" style="font-size:12px;margin-top:10px;width:100%;">关闭</button>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('#vmClose').addEventListener('click', function() { document.body.removeChild(overlay); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
    overlay.querySelector('#vmSave').addEventListener('click', function() {
      var name = overlay.querySelector('#vmName').value.trim() || ('版本 ' + (loadVersions().length + 1));
      saveVersion(name);
      document.body.removeChild(overlay);
      JN.showToast('版本「' + name + '」已保存', 'success');
    });
    overlay.addEventListener('click', function(e) {
      var loadBtn = e.target.closest('.vm-load-btn');
      if (loadBtn) {
        var vid = loadBtn.getAttribute('data-vid');
        if (loadVersion(vid)) document.body.removeChild(overlay);
        return;
      }
      var delBtn = e.target.closest('.vm-del-btn');
      if (delBtn) {
        if (!confirm('确定删除该版本吗？')) return;
        var vid2 = delBtn.getAttribute('data-vid');
        var vers = loadVersions().filter(function(v) { return v.id !== vid2; });
        saveVersions(vers);
        document.body.removeChild(overlay);
        JN.showToast('版本已删除', 'info');
        return;
      }
    });
  }

  // ================================================================
  //  STAR 法则检查
  // ================================================================
  var STAR_PATTERNS = {
    s: /负责|在|担任|参与|作为|背景|当时|面对|由于/,
    t: /需要|目标|为了|任务|要求|解决|实现|完成|挑战/,
    a: /通过|采用|使用|设计|开发|实施|推动|建立|优化|改进|引入|搭建/,
    r: /实现|提升|降低|完成|达到|增长|减少|节省|获得|产出|效果|结果|成果|\d+%|\d+倍|\d+万/
  };
  var STAR_LABELS = { s: 'S(背景)', t: 'T(任务)', a: 'A(行动)', r: 'R(结果)' };

  function checkSTAR(text) {
    var result = {};
    var missing = [];
    ['s', 't', 'a', 'r'].forEach(function(k) {
      result[k] = STAR_PATTERNS[k].test(text);
      if (!result[k]) missing.push(k);
    });
    return { s: result.s, t: result.t, a: result.a, r: result.r, missing: missing };
  }

  // ================================================================
  //  空话套话检测
  // ================================================================
  var BUZZWORDS = [
    { word: '负责任', suggestion: '改为具体职责描述，如"负责X模块的Y工作"' },
    { word: '积极主动', suggestion: '改为具体行动，如"主动推动了X项目落地"' },
    { word: '认真负责', suggestion: '用具体成果替代，如"按时交付了X个需求"' },
    { word: '吃苦耐劳', suggestion: '改为具体经历，如"连续X周攻克了Y难题"' },
    { word: '团队合作精神', suggestion: '改为"与X团队协作完成了Y"' },
    { word: '较强的沟通能力', suggestion: '改为"推动了X部门间的Y协作"' },
    { word: '有较强', suggestion: '删除，直接描述具体能力和成果' },
    { word: '具有较强', suggestion: '删除，直接描述具体能力和成果' },
    { word: '良好的', suggestion: '删除形容词，直接描述具体表现' },
    { word: '优秀的', suggestion: '删除形容词，用数据说话' },
    { word: '丰富的经验', suggestion: '改为"X年Y经验，主导了Z项目"' },
    { word: '熟悉各种', suggestion: '列举具体技术栈或工具名称' },
    { word: '了解相关', suggestion: '改为具体技术名称和使用场景' },
    { word: '参与过', suggestion: '改为"负责/主导/独立完成"' },
    { word: '接触过', suggestion: '改为具体使用场景和成果' },
    { word: '有所了解', suggestion: '删除，只写真正掌握的技能' }
  ];

  function detectBuzzwords(text) {
    return BUZZWORDS.filter(function(b) { return text.indexOf(b.word) !== -1; });
  }

  // ================================================================
  //  Word / TXT 导出
  // ================================================================
  function exportAsWord(html, filename) {
    var wordHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:"Microsoft YaHei",sans-serif;}</style></head><body>' + html + '</body></html>';
    var blob = new Blob([wordHtml], { type: 'application/msword' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = (filename || 'resume') + '.doc';
    a.click(); URL.revokeObjectURL(url);
  }

  function exportAsTxt(blocks, basicInfo) {
    var lines = [];
    var info = basicInfo || {};
    if (info.name) lines.push(info.name);
    if (info.email || info.phone) lines.push([info.email, info.phone].filter(Boolean).join(' | '));
    lines.push('');
    var typeOrder = ['work', 'project', 'education', 'skill'];
    var typeLabels = { work: '工作经历', project: '项目经历', education: '教育背景', skill: '专业技能' };
    typeOrder.forEach(function(type) {
      var typeBlocks = blocks.filter(function(b) { return b.type === type; });
      if (!typeBlocks.length) return;
      lines.push('== ' + typeLabels[type] + ' ==');
      typeBlocks.forEach(function(b) {
        lines.push((b.title || '') + (b.org ? ' @ ' + b.org : '') + (b.date ? '  ' + b.date : ''));
        if (b.description) lines.push(b.description);
        lines.push('');
      });
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = (info.name || 'resume') + '.txt';
    a.click(); URL.revokeObjectURL(url);
  }

  // ================================================================
  //  批量 JD 导入
  // ================================================================
  function showBatchJDModal(currentBlocks, currentBasicInfo) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;padding:0;width:95%;max-width:640px;max-height:85vh;display:flex;flex-direction:column;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #1a1a26;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<i class="fa-solid fa-layer-group" style="color:#6366f1;"></i>' +
            '<span style="font-size:14px;font-weight:600;color:#e2e8f0;">批量 JD 分析</span>' +
          '</div>' +
          '<button id="batchJDClose" style="background:none;border:none;color:#4a4a6a;cursor:pointer;font-size:18px;">&times;</button>' +
        '</div>' +
        '<div style="padding:16px 18px;overflow-y:auto;flex:1;" class="custom-scrollbar">' +
          '<p style="font-size:12px;color:#64748b;margin:0 0 10px;">粘贴多个 JD，用 <code style="background:#1a1a26;padding:1px 4px;border-radius:3px;">---</code> 分隔，系统将提取共同关键词生成通用优化建议。</p>' +
          '<textarea id="batchJDInput" class="ninja-input" rows="10" placeholder="JD 1 内容...\n---\nJD 2 内容...\n---\nJD 3 内容..." style="font-size:12px;width:100%;box-sizing:border-box;"></textarea>' +
          '<div style="margin-top:10px;display:flex;gap:8px;">' +
            '<button id="btnAnalyzeBatchJD" class="btn btn-primary" style="font-size:12px;">' +
              '<i class="fa-solid fa-magnifying-glass" style="font-size:11px;"></i> 分析共同关键词</button>' +
          '</div>' +
          '<div id="batchJDResult" style="margin-top:12px;"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#batchJDClose').addEventListener('click', function() { document.body.removeChild(overlay); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
    overlay.querySelector('#btnAnalyzeBatchJD').addEventListener('click', function() {
      var raw = overlay.querySelector('#batchJDInput').value.trim();
      if (!raw) { JN.showToast('请先粘贴 JD 内容', 'warning'); return; }
      var jdList = raw.split(/\n---\n/).map(function(s) { return s.trim(); }).filter(Boolean);
      if (jdList.length < 2) { JN.showToast('请至少粘贴 2 个 JD（用 --- 分隔）', 'warning'); return; }
      var resultEl = overlay.querySelector('#batchJDResult');
      resultEl.innerHTML = '<div style="font-size:12px;color:#64748b;">分析中...</div>';
      setTimeout(function() {
        var allKeywords = {};
        jdList.forEach(function(jd) {
          var analysis = parseJD(jd);
          if (analysis && analysis.tags) {
            analysis.tags.forEach(function(tag) {
              allKeywords[tag] = (allKeywords[tag] || 0) + 1;
            });
          }
        });
        var common = Object.keys(allKeywords).filter(function(k) { return allKeywords[k] >= Math.ceil(jdList.length * 0.6); });
        var all = Object.keys(allKeywords).sort(function(a, b) { return allKeywords[b] - allKeywords[a]; });
        var resumeText = currentBlocks.map(function(b) { return (b.title || '') + ' ' + (b.description || '') + ' ' + (b.tags || []).join(' '); }).join(' ');
        var missing = common.filter(function(k) { return resumeText.toLowerCase().indexOf(k.toLowerCase()) === -1; });

        var html = '<div style="font-size:12px;color:#94a3b8;margin-bottom:8px;">分析了 ' + jdList.length + ' 个 JD，共提取 ' + all.length + ' 个关键词</div>';
        if (common.length > 0) {
          html += '<div style="margin-bottom:10px;"><div style="font-size:11px;font-weight:600;color:#34d399;margin-bottom:4px;">高频共同关键词（≥60% JD 出现）</div>';
          html += common.map(function(k) {
            var inResume = resumeText.toLowerCase().indexOf(k.toLowerCase()) !== -1;
            return '<span style="display:inline-block;font-size:10px;padding:2px 8px;margin:2px 3px 2px 0;background:' + (inResume ? '#064e3b' : '#3b1414') + ';color:' + (inResume ? '#34d399' : '#fca5a5') + ';border-radius:10px;">' + k + (inResume ? ' ✓' : ' ✗') + '</span>';
          }).join('') + '</div>';
        }
        if (missing.length > 0) {
          html += '<div class="universal-suggestion-card" style="padding:10px 12px;background:#12121a;border-radius:6px;margin-bottom:8px;">';
          html += '<div style="font-size:11px;font-weight:600;color:#a5b4fc;margin-bottom:6px;"><i class="fa-solid fa-lightbulb" style="margin-right:4px;"></i>通用优化建议</div>';
          html += '<div style="font-size:11px;color:#94a3b8;line-height:1.7;">以下关键词在多个 JD 中出现但简历中缺失，建议优先补充：</div>';
          html += '<div style="margin-top:6px;">' + missing.map(function(k) {
            return '<span style="display:inline-block;font-size:10px;padding:2px 8px;margin:2px 3px 2px 0;background:#3b1414;color:#fca5a5;border-radius:10px;">' + k + '</span>';
          }).join('') + '</div>';
          html += '</div>';
        }
        resultEl.innerHTML = html;
      }, 100);
    });
  }

  // ================================================================
  //  注册面板
  // ================================================================
  JN.registerPanel({
    id: 'resume',
    title: '简历管理',
    icon: 'fa-file-pen',
    render: render,
    onActivate: function () {
      _allBlocks = loadBlocks();
      _basicInfo = loadBasicInfo();
      refreshBlockList();
      refreshTagCloud(_jdAnalysis);
      refreshMatchReport();
      refreshResumeScore();
      refreshPreview();
      // 处理跨面板跳转数据
      var jumpData = JN.getJumpData ? JN.getJumpData() : null;
      if (jumpData) {
        setTimeout(function() {
          var jdInput = document.querySelector('#jdInput');
          if (jdInput && jumpData.jdText) {
            jdInput.value = jumpData.jdText;
            jdInput.focus();
          }
        }, 200);
      }
    }
  });

  // 状态更新辅助
  JN.setStatusMsg = function (msg) {
    var el = document.getElementById('statusText');
    if (el) el.textContent = msg;
  };

})();
