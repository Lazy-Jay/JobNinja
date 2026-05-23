/**
 * JobNinja — interview.js
 * 面试准备指南 + 豆包/第三方AI提示词生成
 * 有 API → AI 深度生成；无 API → 内置模板兜底
 */
(function () {
  if (!window.JobNinja) return;

  var JN = window.JobNinja;

  // ================================================================
  //  CONSTANTS
  // ================================================================

  var STORAGE_KEY = 'jobninja_interview_reports';

  // 常用技术栈的面试题模板（无 API 时兜底）
  var FALLBACK_QUESTIONS = [
    { q: '请做一个简单的自我介绍，重点谈谈你在这个岗位相关方向的经验。', type: '行为', starHints: ['S: 你的专业背景和当前岗位的关联', 'T: 你在这个领域解决过什么核心问题', 'A: 你用了哪些技术方案或方法论', 'R: 达到了什么效果或学到了什么'] },
    { q: '描述一个你主导或深度参与的项目，遇到了什么难点，如何解决的？', type: '项目', starHints: ['S: 项目背景、规模、你的角色', 'T: 核心难点是什么（性能/架构/协作）', 'A: 你主导的解决方案，技术选型理由', 'R: 量化成果（性能提升X%、交付提前X天等）'] },
    { q: '如果让你设计一个高并发/高可用的系统，你会从哪些方面考虑？', type: '技术', starHints: ['S: 业务场景假设', 'T: 面对的挑战（流量峰值、数据一致性等）', 'A: 架构方案（缓存、消息队列、限流、降级、分布式）', 'R: 方案的预期效果和trade-off'] },
    { q: '讲一次你在团队中与同事产生分歧的经历，你是怎么处理的？', type: '行为', starHints: ['S: 分歧的背景和双方立场', 'T: 需要达成什么目标', 'A: 你是如何沟通、找数据支撑、寻求共识的', 'R: 最终结果和关系影响'] },
    { q: '你对我们公司/这个岗位有什么了解？你为什么想来？', type: '行为', starHints: ['S: 你对公司的研究（产品/技术栈/文化）', 'T: 这个岗位与你职业规划的匹配点', 'A: 你能带来的价值', 'R: 你期望的成长方向'] }
  ];

  var CULTURE_NOTES = [
    '提前了解目标公司的技术栈、产品线和最近新闻',
    '准备2-3个反问面试官的问题（团队结构、技术挑战、成长路径）',
    'STAR法则：每个回答都要有 Situation → Task → Action → Result',
    '遇到不会的问题坦诚承认，展示你的学习思路和解决问题的路径',
    '面试结束时表达感谢，并在24小时内发送感谢邮件'
  ];

  var PITFALLS = [
    '避免对公司前东家或前同事做负面评价',
    '不要夸大或编造经历——面试官很容易追问细节',
    '避免答非所问——先直接回答问题，再展开细节',
    '不要说"我不知道"就结束——展示你的思考过程',
    '薪资谈判放在HR面，技术面避免主动提及'
  ];

  // ================================================================
  //  STATE
  // ================================================================

  function loadReports() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (_) { return []; }
  }

  function saveReports(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  var reports = loadReports();

  // ================================================================
  //  AI 生成（调用通用 API 配置）
  // ================================================================

  function callAIForInterview(jdText, companyName, callbacks) {
    var cfg = JN.getApiConfig ? JN.getApiConfig() : {};
    if (!cfg.apiKey || !cfg.endpoint) {
      callbacks.onFallback && callbacks.onFallback('API 未配置，使用内置模板生成');
      return;
    }

    var prompt = [
      '你是一位资深面试教练。请根据以下岗位信息，生成一份结构化的面试准备报告。',
      '',
      '【公司】' + (companyName || '未提供'),
      '【岗位描述】' + (jdText.substring(0, 2000) || '未提供'),
      '',
      '请严格按以下格式输出（JSON格式，不要markdown代码块）：',
      '{',
      '  "selfIntro": "自我介绍框架（3-4句话，结合JD提炼关键匹配点，用***标注需要用户填入个人信息的地方）",',
      '  "questions": [',
      '    {"q": "面试问题1", "type": "技术/行为/项目", "starHints": ["S:...", "T:...", "A:...", "R:..."]},',
      '    ...共5个',
      '  ],',
      '  "cultureNotes": ["3-5条针对该公司的面试注意事项"],',
      '  "pitfalls": ["3-5条该岗位面试常见雷区"]',
      '}',
      '',
      '要求：',
      '- 问题要混合技术能力、项目经验、软技能三个维度',
      '- STAR提示要具体，结合JD中的技术栈和业务场景',
      '- 注意事項要贴合该公司和岗位的特点',
      '- 只输出纯JSON，不要任何额外文字'
    ].join('\n');

    fetch(cfg.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify({
        model: cfg.textModel,
        messages: [
          { role: 'system', content: '你是一位资深面试教练，输出纯JSON格式的面试准备报告。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    })
    .then(function (res) {
      if (!res.ok) {
        return res.json().then(function (e) {
          throw new Error(e.error ? e.error.message : 'API 错误 (' + res.status + ')');
        });
      }
      return res.json();
    })
    .then(function (data) {
      var content = (data.choices && data.choices[0] && data.choices[0].message.content) || '';
      var json = content.trim();
      var codeMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeMatch) json = codeMatch[1].trim();
      try {
        var report = JSON.parse(json);
        callbacks.onDone && callbacks.onDone(report);
      } catch (e) {
        callbacks.onFallback && callbacks.onFallback('AI 返回格式异常，使用内置模板');
      }
    })
    .catch(function (err) {
      callbacks.onFallback && callbacks.onFallback(err.message || 'API 请求失败');
    });
  }

  // ================================================================
  //  内置模板生成
  // ================================================================

  function generateFallbackReport(jdText, companyName) {
    var techHints = extractTechHints(jdText);

    var selfIntro = [
      '***你的姓名***，***你的工作年限***年' + (techHints.length > 0 ? techHints.slice(0, 4).join('、') : '相关领域') + '经验。',
      '曾主导***提到1-2个核心项目***，在性能优化/架构设计/团队协作方面积累了扎实经验。',
      '关注到' + (companyName || '贵公司') + '在***公司业务方向***方向的发展，',
      '我的***你的关键技能***能力与这个岗位高度匹配，希望深入交流。'
    ].join('');

    var questions = [];
    FALLBACK_QUESTIONS.forEach(function (t) {
      var q = { q: t.q, type: t.type, starHints: t.starHints.slice() };
      // 如果有 JD，把问题中的技术和业务关键词替换为 JD 中的实际关键词
      if (techHints.length > 0 && q.q.indexOf('高并发') !== -1 && techHints.some(function (h) { return /缓存|消息|分布|微服|k8s|docker/i.test(h); })) {
        // 保持原样
      }
      questions.push(q);
    });

    return {
      selfIntro: selfIntro,
      questions: questions,
      cultureNotes: CULTURE_NOTES.slice(),
      pitfalls: PITFALLS.slice()
    };
  }

  function extractTechHints(jdText) {
    if (!jdText) return [];
    var keywords = ['Java','Python','Go','Rust','TypeScript','React','Vue','Node.js','Spring',
      'MySQL','Redis','Kafka','Docker','Kubernetes','AWS','微服务','AI','机器学习','数据分析',
      '项目管理','Scrum','敏捷','CI/CD','性能优化','架构设计'];
    return keywords.filter(function (k) {
      return jdText.toLowerCase().indexOf(k.toLowerCase()) !== -1;
    });
  }

  // ================================================================
  //  提示词生成
  // ================================================================

  function generateInterviewerPrompt(jdText, companyName, report) {
    var tags = [];
    if (report && report.questions) {
      report.questions.forEach(function (q) { tags.push(q.type); });
    }

    return [
      '你是一位资深面试官，请根据以下岗位描述对我进行一场模拟视频面试。',
      '',
      '【公司】' + (companyName || '待定'),
      '【岗位描述】',
      jdText || '（由面试者口头描述）',
      '',
      '【面试要求】',
      '1. 请逐一提问，共5-8个问题，覆盖以下维度：' + (tags.length > 0 ? tags.filter(function(v,i,a){return a.indexOf(v)===i}).join('、') : '技术能力、项目经验、软技能'),
      '2. 每次只问一个问题，等我回答后再问下一个',
      '3. 如果我的回答不够深入，请追问细节',
      '4. 面试结束后，请给出综合评价和改进建议',
      '5. 语言风格：专业、友好、有一定挑战性',
      '',
      '【开始】请先做一个自我介绍并说明面试流程，然后开始第一个问题。'
    ].join('\n');
  }

  // ================================================================
  //  RENDER
  // ================================================================

  function render() {
    var el = document.createElement('div');

    el.innerHTML =
      // 标题
      '<div style="margin-bottom:16px;">' +
        '<h2 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">' +
          '<i class="fa-solid fa-comments" style="color:#a78bfa;margin-right:8px;"></i>模拟面试' +
        '</h2>' +
        '<p style="font-size:13px;color:#64748b;margin:0;">AI 生成面试准备报告 + 豆包/第三方AI提示词</p>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +

        // ===== 左栏：输入区 =====
        '<div>' +
          '<div class="panel-card" style="margin-bottom:12px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #1a1a26;">' +
              '<i class="fa-solid fa-clipboard-list" style="color:#818cf8;"></i>' +
              '<span style="font-size:13px;font-weight:600;color:#d1d5db;">面试配置</span>' +
            '</div>' +
            '<div style="margin-bottom:8px;">' +
              '<label style="font-size:11px;color:#64748b;display:block;margin-bottom:3px;">目标公司（可选）</label>' +
              '<input id="ivCompany" class="ninja-input" placeholder="如：字节跳动" style="font-size:12px;">' +
            '</div>' +
            '<div style="margin-bottom:10px;">' +
              '<label style="font-size:11px;color:#64748b;display:block;margin-bottom:3px;">岗位描述 JD</label>' +
              '<textarea id="ivJD" class="ninja-input" rows="8" placeholder="粘贴目标岗位的完整 JD，越详细报告越精准..." style="font-size:12px;"></textarea>' +
            '</div>' +
            '<button id="btnGenerate" class="btn btn-primary" style="font-size:12px;width:100%;">' +
              '<i class="fa-solid fa-wand-magic-sparkles" style="font-size:11px;"></i> 生成面试准备报告</button>' +
            '<div id="ivGenStatus" style="margin-top:8px;font-size:11px;color:#4a4a6a;text-align:center;"></div>' +
          '</div>' +

          // 历史记录
          '<div class="panel-card">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
              '<i class="fa-solid fa-clock-rotate-left" style="color:#64748b;"></i>' +
              '<span style="font-size:12px;font-weight:600;color:#d1d5db;">生成历史</span>' +
            '</div>' +
            '<div id="ivHistory" class="custom-scrollbar" style="max-height:280px;overflow-y:auto;">' +
              (reports.length === 0
                ? '<div style="text-align:center;padding:28px;color:#4a4a6a;font-size:12px;">暂无记录</div>'
                : '') +
            '</div>' +
          '</div>' +
        '</div>' +

        // ===== 右栏：报告展示区 =====
        '<div id="ivReportArea">' +
          '<div class="panel-card" style="min-height:200px;">' +
            '<div class="empty-state" style="padding:60px 20px;">' +
              '<i class="fa-solid fa-comments"></i>' +
              '<h3>面试准备报告</h3>' +
              '<p>在左侧填入目标岗位JD，点击「生成面试准备报告」</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // ===== 事件绑定 =====

    el.querySelector('#btnGenerate').addEventListener('click', function () {
      var jdText = el.querySelector('#ivJD').value.trim();
      var company = el.querySelector('#ivCompany').value.trim();
      var statusEl = el.querySelector('#ivGenStatus');

      if (!jdText) {
        JN.showToast('请先粘贴目标岗位 JD', 'warning');
        return;
      }

      var btn = el.querySelector('#btnGenerate');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 生成中...';
      statusEl.innerHTML = '<span style="color:#6366f1;"><i class="fa-solid fa-spinner fa-spin"></i> 准备报告...</span>';

      callAIForInterview(jdText, company, {
        onDone: function (report) {
          statusEl.innerHTML = '<span style="color:#10b981;"><i class="fa-solid fa-check"></i> AI 深度报告已生成</span>';
          showReport(el, report, jdText, company);
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" style="font-size:11px;"></i> 生成面试准备报告';
        },
        onFallback: function (msg) {
          statusEl.innerHTML = '<span style="color:#f59e0b;"><i class="fa-solid fa-circle-info"></i> ' + msg + '</span>';
          var fallback = generateFallbackReport(jdText, company);
          showReport(el, fallback, jdText, company);
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" style="font-size:11px;"></i> 重新生成';
        }
      });
    });

    // 初始渲染历史
    refreshHistory(el);

    return el;
  }

  // ================================================================
  //  报告展示
  // ================================================================

  function showReport(el, report, jdText, company) {
    var area = el.querySelector('#ivReportArea');
    if (!area) return;

    // 保存到历史
    var record = {
      id: 'iv_' + Date.now().toString(36),
      company: company || '未指定公司',
      jdPreview: (jdText || '').substring(0, 100),
      report: report,
      createdAt: new Date().toISOString()
    };
    reports.unshift(record);
    if (reports.length > 30) reports = reports.slice(0, 30);
    saveReports(reports);

    // 生成提示词
    var promptText = generateInterviewerPrompt(jdText, company, report);

    var questionsHTML = '';
    (report.questions || []).forEach(function (q, i) {
      var typeColor = q.type === '技术' ? '#6366f1' : q.type === '项目' ? '#8b5cf6' : '#10b981';
      questionsHTML +=
        '<div style="margin-bottom:14px;padding:12px 14px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="font-size:12px;font-weight:700;color:#e2e8f0;">Q' + (i + 1) + '</span>' +
            '<span style="font-size:10px;padding:1px 7px;border-radius:3px;background:' + typeColor + '18;color:' + typeColor + ';">' + q.type + '</span>' +
          '</div>' +
          '<p style="font-size:13px;color:#d1d5db;line-height:1.6;margin:0 0 8px;">' + q.q + '</p>' +
          '<div style="font-size:11px;color:#64748b;line-height:1.6;">' +
            '<span style="color:#a5b4fc;font-weight:600;">STAR要点：</span><br>' +
            (q.starHints || []).map(function (h) {
              return '<span style="color:#94a3b8;">' + h.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
            }).join('<br>') +
          '</div>' +
        '</div>';
    });

    var cultureHTML = (report.cultureNotes || []).map(function (n) {
      return '<li style="margin-bottom:4px;font-size:12px;color:#94a3b8;">' + n + '</li>';
    }).join('');

    var pitfallsHTML = (report.pitfalls || []).map(function (p) {
      return '<li style="margin-bottom:4px;font-size:12px;color:#fca5a5;">' + p + '</li>';
    }).join('');

    area.innerHTML =
      // 1. 自我介绍框架
      '<div class="panel-card" style="margin-bottom:12px;">' +
        '<h3 style="font-size:14px;color:#a5b4fc;margin:0 0 8px;padding-bottom:6px;border-bottom:1px solid #1a1a26;">' +
          '<i class="fa-solid fa-user-pen" style="margin-right:6px;"></i>自我介绍框架</h3>' +
        '<p style="font-size:13px;color:#d1d5db;line-height:1.8;white-space:pre-wrap;">' + (report.selfIntro || '请根据JD准备一段2-3分钟的自我介绍') + '</p>' +
      '</div>' +

      // 2. 高频预测问题
      '<div class="panel-card" style="margin-bottom:12px;">' +
        '<h3 style="font-size:14px;color:#a5b4fc;margin:0 0 8px;padding-bottom:6px;border-bottom:1px solid #1a1a26;">' +
          '<i class="fa-solid fa-circle-question" style="margin-right:6px;"></i>高频预测问题</h3>' +
        questionsHTML +
      '</div>' +

      // 3. 注意事项双栏
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
        '<div class="panel-card">' +
          '<h3 style="font-size:13px;color:#34d399;margin:0 0 8px;">' +
            '<i class="fa-solid fa-circle-check" style="margin-right:4px;"></i>面试注意事项</h3>' +
          '<ul style="padding-left:16px;margin:0;">' + cultureHTML + '</ul>' +
        '</div>' +
        '<div class="panel-card" style="border-color:#3b1414;">' +
          '<h3 style="font-size:13px;color:#fca5a5;margin:0 0 8px;">' +
            '<i class="fa-solid fa-triangle-exclamation" style="margin-right:4px;"></i>常见雷区</h3>' +
          '<ul style="padding-left:16px;margin:0;">' + pitfallsHTML + '</ul>' +
        '</div>' +
      '</div>' +

      // 4. 操作按钮
      '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
        '<button id="btnSaveReport" class="btn btn-primary" style="font-size:12px;">' +
          '<i class="fa-solid fa-floppy-disk" style="font-size:11px;"></i> 保存报告</button>' +
        '<button id="btnCopyPrompt" class="btn btn-outline" style="font-size:12px;' +
          'background:#1e1e32;border-color:#312e81;color:#a5b4fc;">' +
          '<i class="fa-solid fa-copy" style="font-size:11px;"></i> 复制模拟面试提示词</button>' +
      '</div>' +

      // 5. 提示词展示区
      '<div class="panel-card" style="margin-bottom:12px;border-color:#312e81;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<span style="font-size:12px;font-weight:600;color:#a5b4fc;">' +
            '<i class="fa-solid fa-robot" style="margin-right:4px;"></i>模拟面试官提示词</span>' +
          '<span style="font-size:10px;color:#64748b;">可发送给豆包或其他 AI 助手</span>' +
        '</div>' +
        '<textarea id="ivPromptText" readonly rows="8" style="width:100%;padding:10px;' +
          'background:#0a0a0f;border:1px solid #1a1a26;border-radius:6px;color:#94a3b8;' +
          'font-size:12px;line-height:1.6;resize:vertical;">' + promptText.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
        '<p style="font-size:11px;color:#6ee7b7;margin:8px 0 0;">' +
          '<i class="fa-solid fa-lightbulb" style="margin-right:4px;"></i>' +
          '将提示词发送给<strong>豆包</strong>或其他 AI 助手，即可开始视频模拟面试</p>' +
      '</div>';

    // 保存按钮
    el.querySelector('#btnSaveReport').addEventListener('click', function () {
      JN.setStatusMsg && JN.setStatusMsg('报告已保存（共 ' + reports.length + ' 条记录）');
      refreshHistory(el);
    });

    // 复制提示词
    el.querySelector('#btnCopyPrompt').addEventListener('click', function () {
      var textarea = el.querySelector('#ivPromptText');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(promptText).then(function () {
          JN.setStatusMsg && JN.setStatusMsg('模拟面试提示词已复制，可发送给豆包使用');
        }).catch(function () {
          fallbackCopy(textarea);
        });
      } else {
        fallbackCopy(textarea);
      }
    });

    JN.setStatusMsg && JN.setStatusMsg('面试准备报告已生成');
  }

  function fallbackCopy(textarea) {
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    try {
      document.execCommand('copy');
      JN.setStatusMsg && JN.setStatusMsg('提示词已复制');
    } catch (_) {}
  }

  // ================================================================
  //  历史记录
  // ================================================================

  function refreshHistory(el) {
    var container = el.querySelector('#ivHistory');
    if (!container) return;

    if (reports.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:28px;color:#4a4a6a;font-size:12px;">暂无记录</div>';
      return;
    }

    var html = '';
    reports.forEach(function (r, idx) {
      var date = new Date(r.createdAt);
      var dateStr = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');

      html +=
        '<div style="padding:10px 12px;margin-bottom:6px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;cursor:pointer;"' +
          ' class="iv-history-item" data-idx="' + idx + '">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-size:12px;font-weight:600;color:#e2e8f0;">' + (r.company || '未指定') + '</span>' +
            '<span style="font-size:10px;color:#4a4a6a;">' + dateStr + '</span>' +
          '</div>' +
          '<p style="font-size:11px;color:#64748b;margin:4px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
            (r.jdPreview || '无JD预览') + '</p>' +
          '<div style="display:flex;gap:4px;margin-top:6px;">' +
            '<button class="btn-history-del" data-idx="' + idx + '" ' +
              'style="font-size:9px;padding:2px 6px;background:transparent;border:1px solid #1a1a26;border-radius:3px;color:#4a4a6a;cursor:pointer;">删除</button>' +
          '</div>' +
        '</div>';
    });

    container.innerHTML = html;

    // 点击历史项 → 重新展示
    container.querySelectorAll('.iv-history-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        if (e.target.classList.contains('btn-history-del')) return;
        var idx = parseInt(this.getAttribute('data-idx'));
        var r = reports[idx];
        if (r && r.report) {
          showReport(el, r.report, r.jdPreview || '', r.company || '');
        }
      });
    });

    // 删除按钮
    container.querySelectorAll('.btn-history-del').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!confirm('确定删除该面试报告吗？此操作不可恢复。')) return;
        var idx = parseInt(this.getAttribute('data-idx'));
        reports.splice(idx, 1);
        saveReports(reports);
        refreshHistory(el);
        JN.showToast('面试报告已删除', 'info');
      });
    });
  }

  // ================================================================
  //  REGISTER
  // ================================================================

  JN.registerPanel({
    id: 'interview',
    title: '模拟面试',
    icon: 'fa-comments',
    render: render,
    onActivate: function () {
      reports = loadReports();
    }
  });

})();
