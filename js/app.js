/**
 * JobNinja — app.js
 * 主控制器：面板注册、侧边栏渲染、面板切换、状态持久化
 *
 * 使用方式：各模块调用 JobNinja.registerPanel({...}) 注册面板，
 *           模块加载完毕后调用 JobNinja.init() 启动应用。
 */

(function () {
  'use strict';

  // ==================== 核心状态 ====================

  /** 已注册的面板列表 */
  const panels = [];

  /** 当前激活的面板 ID */
  let activePanelId = null;

  /** 从 localStorage 恢复上次打开的面板，默认为 'resume' */
  const savedPanel = (function () {
    try {
      return localStorage.getItem('jobninja_active_panel') || 'resume';
    } catch (_) {
      return 'resume';
    }
  })();

  // ==================== DOM 引用 ====================

  function $(id) { return document.getElementById(id); }

  // ==================== 侧边栏渲染 ====================

  /** 核心导航（永远可见） */
  var CORE_IDS = ['jobsearch', 'resume', 'tracker'];
  /** 更多导航（折叠隐藏） */
  var MORE_IDS = ['resumetools', 'templates', 'templatecommunity', 'experiences', 'industrydb', 'channel', 'evaluate', 'interview'];

  function renderSidebar() {
    var container = $('sidebarIcons');
    if (!container) return;

    container.innerHTML = '';

    // 分离面板
    var corePanels = [];
    var morePanels = [];
    var settingsPanel = null;

    panels.forEach(function(p) {
      if (p.id === 'settings') { settingsPanel = p; }
      else if (CORE_IDS.indexOf(p.id) !== -1) { corePanels.push(p); }
      else { morePanels.push(p); }
    });

    // 核心面板（按CORE_IDS顺序）
    CORE_IDS.forEach(function(cid) {
      var p = corePanels.find(function(cp) { return cp.id === cid; });
      if (!p) return;
      var btn = document.createElement('div');
      btn.className = 'nav-btn nav-btn-core';
      btn.setAttribute('data-tooltip', p.title);
      btn.setAttribute('data-panel', p.id);
      btn.innerHTML = '<i class="fa-solid ' + p.icon + '" style="font-size:18px;"></i><span class="nav-label">' + p.title + '</span>';
      btn.addEventListener('click', function () { switchPanel(p.id); if (window.innerWidth < 768) toggleMobileSidebar(false); });
      container.appendChild(btn);
    });

    // 「更多」展开/收起按钮
    var moreBtn = document.createElement('div');
    moreBtn.className = 'nav-btn nav-btn-more';
    moreBtn.id = 'btnMoreToggle';
    moreBtn.setAttribute('data-tooltip', '更多工具');
    moreBtn.innerHTML = '<i class="fa-solid fa-ellipsis"></i><span class="nav-label">更多</span>';
    moreBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var section = document.getElementById('moreSection');
      var isOpen = section.style.display !== 'none';
      section.style.display = isOpen ? 'none' : 'flex';
      moreBtn.classList.toggle('more-open', !isOpen);
    });
    container.appendChild(moreBtn);

    // 折叠区
    var moreSection = document.createElement('div');
    moreSection.id = 'moreSection';
    moreSection.style.cssText = 'display:none;flex-direction:column;gap:1px;width:100%;padding:0 4px;animation:jnMoreIn 0.15s ease;';
    morePanels.forEach(function(p) {
      var btn = document.createElement('div');
      btn.className = 'nav-btn nav-btn-sub';
      btn.setAttribute('data-tooltip', p.title);
      btn.setAttribute('data-panel', p.id);
      btn.innerHTML = '<i class="fa-solid ' + p.icon + '"></i><span class="nav-label">' + p.title + '</span>';
      btn.addEventListener('click', function () { switchPanel(p.id); if (window.innerWidth < 768) toggleMobileSidebar(false); });
      moreSection.appendChild(btn);
    });
    container.appendChild(moreSection);

    // 弹性空间 + 设置
    var spacer = document.createElement('div');
    spacer.style.cssText = 'flex:1;';
    container.appendChild(spacer);

    if (settingsPanel) {
      var sbtn = document.createElement('div');
      sbtn.className = 'nav-btn nav-btn-settings';
      sbtn.setAttribute('data-tooltip', settingsPanel.title);
      sbtn.setAttribute('data-panel', settingsPanel.id);
      sbtn.innerHTML = '<i class="fa-solid ' + settingsPanel.icon + '"></i><span class="nav-label">' + settingsPanel.title + '</span>';
      sbtn.addEventListener('click', function () { switchPanel(settingsPanel.id); if (window.innerWidth < 768) toggleMobileSidebar(false); });
      container.appendChild(sbtn);
    }
  }

  /** 手机端汉堡菜单切换 */
  function toggleMobileSidebar(force) {
    var sidebar = $('sidebar');
    if (!sidebar) return;
    if (typeof force === 'boolean') {
      sidebar.classList.toggle('mobile-open', force);
    } else {
      sidebar.classList.toggle('mobile-open');
    }
    // 更新遮罩
    var overlay = document.getElementById('mobileOverlay');
    if (sidebar.classList.contains('mobile-open')) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'mobileOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:15;';
        overlay.addEventListener('click', function() { toggleMobileSidebar(false); });
        document.body.appendChild(overlay);
      }
    } else {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
  }

  /** 跨面板跳转（带数据传递） */
  function jumpToPanel(targetId, data) {
    if (data) {
      try { localStorage.setItem('jobninja_jump_data', JSON.stringify(data)); } catch(_) {}
    }
    // 确保更多区展开
    var moreSection = document.getElementById('moreSection');
    if (moreSection && MORE_IDS.indexOf(targetId) !== -1) {
      moreSection.style.display = 'flex';
      var moreBtn = document.getElementById('btnMoreToggle');
      if (moreBtn) moreBtn.classList.add('more-open');
    }
    switchPanel(targetId);
  }

  /** 读取跳转携带的数据 */
  function getJumpData() {
    try {
      var d = localStorage.getItem('jobninja_jump_data');
      if (d) { localStorage.removeItem('jobninja_jump_data'); return JSON.parse(d); }
    } catch(_) {}
    return null;
  }

  // ==================== 面板切换 ====================

  function switchPanel(id) {
    if (activePanelId === id) return;

    activePanelId = id;

    // 更新 localStorage
    try { localStorage.setItem('jobninja_active_panel', id); } catch (_) {}

    // 更新侧边栏激活状态
    var btns = document.querySelectorAll('.nav-btn');
    btns.forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-panel') === id);
    });

    // 切换面板显示
    var allPanels = document.querySelectorAll('.panel');
    allPanels.forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-panel') === id);
    });

    // 更新标题栏
    var panel = panels.find(function (p) { return p.id === id; });
    if (panel && $('panelTitle')) {
      $('panelTitle').textContent = panel.title;
    }
  }

  // ==================== 渲染所有面板 ====================

  function renderPanels() {
    var container = $('panelContainer');
    if (!container) return;

    container.innerHTML = '';

    panels.forEach(function (panel) {
      var el = panel.render();
      el.setAttribute('data-panel', panel.id);
      el.classList.add('panel');
      if (panel.id === savedPanel) {
        el.classList.add('active');
        activePanelId = savedPanel;
        if ($('panelTitle')) {
          $('panelTitle').textContent = panel.title;
        }
      }
      container.appendChild(el);
    });

    // 初始化侧边栏激活状态
    var btns = document.querySelectorAll('.nav-btn');
    btns.forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-panel') === savedPanel);
    });
  }

  // ==================== 初始化 ====================

  function init() {
    if (panels.length === 0) {
      console.warn('[JobNinja] 没有注册任何面板，请确认模块脚本已加载');
      return;
    }

    renderPanels();
    renderSidebar();
    updateModeIndicator();
    checkFirstRun();

    // 隐藏加载覆盖层
    var loadingEl = document.getElementById('loadingOverlay');
    if (loadingEl) {
      loadingEl.style.opacity = '0';
      setTimeout(function () {
        if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
      }, 350);
    }

    console.log(
      '%c JobNinja v1.0.0 %c已就绪 %c|%c 本地模式 %c|%c 已注册 ' + panels.length + ' 个面板',
      'background:#10b981;color:#fff;padding:3px 8px;border-radius:4px 0 0 4px;',
      'background:#0a0a0f;color:#9ca3af;padding:3px 8px;border-radius:0 4px 4px 0;',
      'color:#252536;',
      'color:#34d399;',
      'color:#252536;',
      'color:#6b7280;'
    );
  }

  /** 更新底部状态栏显示当前模式 */
  function updateModeIndicator() {
    var statusEl = $('statusText');
    var modeEl = document.getElementById('modeIndicator');
    if (modeEl) {
      var hasApi = false;
      try {
        var cfg = window.JobNinja && window.JobNinja.getApiConfig ? window.JobNinja.getApiConfig() : {};
        hasApi = !!(cfg.apiKey && cfg.endpoint);
      } catch (_) {}
      modeEl.innerHTML = hasApi ?
        '<i class="fa-solid fa-robot" style="color:#818cf8;font-size:10px;"></i> 增强模式' :
        '<span id="quickConfigAI" title="点击配置AI" style="cursor:pointer;"><i class="fa-solid fa-shield-halved" style="color:#10b981;font-size:10px;"></i> 本地模式 <span style="font-size:9px;color:#6366f1;text-decoration:underline;">配置AI</span></span>';
      modeEl.title = hasApi ? '已配置API，可使用AI增强功能' : '点击配置AI以启用增强功能';
      var quickCfg = document.getElementById('quickConfigAI');
      if (quickCfg) {
        quickCfg.addEventListener('click', function() {
          if (window.JobNinja && window.JobNinja.jumpToPanel) window.JobNinja.jumpToPanel('settings', {});
        });
      }
    }
  }

  // ==================== 注册 API ====================

  /**
   * 注册一个功能面板
   * @param {Object} config
   * @param {string} config.id       - 唯一标识，如 'resume'
   * @param {string} config.title    - 面板标题
   * @param {string} config.icon     - Font Awesome 图标类名，如 'fa-file-pen'
   * @param {Function} config.render - 返回 DOM 元素的渲染函数
   */
  function registerPanel(config) {
    if (!config.id || !config.title || !config.icon || typeof config.render !== 'function') {
      console.error('[JobNinja] registerPanel 参数不完整:', config);
      return;
    }

    // 防止重复注册
    if (panels.some(function (p) { return p.id === config.id; })) {
      console.warn('[JobNinja] 面板 "' + config.id + '" 已注册，跳过');
      return;
    }

    panels.push({
      id: config.id,
      title: config.title,
      icon: config.icon,
      render: config.render,
      onActivate: config.onActivate || null
    });
  }

  // ==================== Toast 通知系统 ====================

  /**
   * 显示 Toast 通知
   * @param {string} msg - 消息内容
   * @param {string} type - 'success' | 'error' | 'info' | 'warning'
   */
  function showToast(msg, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
      document.body.appendChild(container);
    }

    var colors = { success:'#10b981', error:'#ef4444', info:'#6366f1', warning:'#f59e0b' };
    var icons  = { success:'fa-circle-check', error:'fa-circle-xmark', info:'fa-circle-info', warning:'fa-triangle-exclamation' };
    var color = colors[type] || colors.info;
    var icon = icons[type] || icons.info;

    var toast = document.createElement('div');
    toast.style.cssText =
      'display:flex;align-items:center;gap:8px;padding:10px 18px;background:#12121a;border:1px solid ' + color + '40;' +
      'border-radius:8px;color:#d1d5db;font-size:12px;pointer-events:auto;max-width:380px;' +
      'animation:jnToastIn 0.25s ease;box-shadow:0 4px 16px rgba(0,0,0,0.4);';
    toast.innerHTML = '<i class="fa-solid ' + icon + '" style="color:' + color + ';font-size:13px;"></i>' + msg;

    container.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // ==================== 按钮防重复点击 ====================

  var _btnOriginals = {};

  /** 按钮进入加载态，返回恢复函数 */
  function btnLoading(btn, text) {
    if (!btn || btn.disabled) return function () {};
    var key = btn.id || btn.className;
    _btnOriginals[key] = { html: btn.innerHTML, disabled: btn.disabled };
    btn.disabled = true;
    btn.innerHTML = (text || '<i class="fa-solid fa-spinner fa-spin"></i>') + ' ' + (btn.getAttribute('data-loading') || '处理中...');
    return function () { btnReset(btn); };
  }

  /** 恢复按钮状态 */
  function btnReset(btn) {
    if (!btn) return;
    var key = btn.id || btn.className;
    if (_btnOriginals[key]) {
      btn.innerHTML = _btnOriginals[key].html;
      btn.disabled = _btnOriginals[key].disabled;
      delete _btnOriginals[key];
    } else {
      btn.disabled = false;
    }
  }

  // ==================== 数据导出/导入 ====================

  /** 获取数据摘要信息 */
  function getDataSummary() {
    var summary = {};
    try {
      var blocks = JSON.parse(localStorage.getItem('jobninja_blocks') || '[]');
      if (blocks.length > 0) summary['简历积木'] = blocks.length + '段经历';
      var basic = JSON.parse(localStorage.getItem('jobninja_basic') || '{}');
      if (basic.name) summary['基本信息'] = basic.name;
      var apps = JSON.parse(localStorage.getItem('jobninja_applications') || '[]');
      if (apps.length > 0) summary['投递记录'] = apps.length + '条';
      var evals = JSON.parse(localStorage.getItem('jobninja_evaluations') || '[]');
      if (evals.length > 0) summary['岗位评估'] = evals.length + '条';
      var interviews = JSON.parse(localStorage.getItem('jobninja_interview_reports') || '[]');
      if (interviews.length > 0) summary['面试报告'] = interviews.length + '条';
      var bookmarks = JSON.parse(localStorage.getItem('jobninja_bookmarks') || '[]');
      if (bookmarks.length > 0) summary['岗位收藏'] = bookmarks.length + '条';
      var searches = JSON.parse(localStorage.getItem('jobninja_saved_searches') || '[]');
      if (searches.length > 0) summary['已保存搜索'] = searches.length + '条';
      var settings = JSON.parse(localStorage.getItem('jobninja_settings') || '{}');
      if (settings.city) summary['设置'] = '已配置';
    } catch (_) {}
    return summary;
  }

  function exportAllData() {
    try {
      var bundle = {};
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf('jobninja_') === 0) {
          bundle[k] = localStorage.getItem(k);
        }
      }
      var summary = getDataSummary();
      var summaryText = Object.keys(summary).map(function(k) { return k + ': ' + summary[k]; }).join('\n');
      var confirmed = confirm('即将导出以下数据：\n\n' + (summaryText || '(暂无数据)') + '\n\n数据将以JSON文件下载到本地。确定导出吗？');
      if (!confirmed) return false;

      var json = JSON.stringify(bundle, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'JobNinja_备份_' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('数据导出成功！文件仅包含你的本地数据，可安全保存', 'success');
      return true;
    } catch (e) {
      showToast('导出失败：' + (e.message || '未知错误'), 'error');
      return false;
    }
  }

  function importAllData(file) {
    if (!file) return;
    if (!confirm('导入数据将覆盖现有数据，建议先导出备份。是否继续？')) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var bundle = JSON.parse(e.target.result);
        var count = 0;
        for (var k in bundle) {
          if (bundle.hasOwnProperty(k) && k.indexOf('jobninja_') === 0) {
            localStorage.setItem(k, bundle[k]);
            count++;
          }
        }
        showToast('成功导入 ' + count + ' 条数据，请刷新页面以应用更改', 'success');
        // 触发各面板 onActivate
        panels.forEach(function (p) {
          if (p.onActivate) {
            try { p.onActivate(); } catch (_) {}
          }
        });
      } catch (err) {
        showToast('导入失败：文件格式不正确', 'error');
      }
    };
    reader.readAsText(file);
  }

  // ==================== 首次使用引导 ====================

  function checkFirstRun() {
    try {
      if (localStorage.getItem('jobninja_onboarded')) return;
    } catch (_) { return; }

    // 标记已引导
    try { localStorage.setItem('jobninja_onboarded', '1'); } catch (_) {}

    // 创建示例积木数据
    if (!localStorage.getItem('jobninja_blocks')) {
      var sampleBlocks = [
        { id: 'sample_1', type: 'work', title: '前端开发工程师', org: '某互联网公司', date: '2021.06 - 2023.12',
          description: '负责核心业务系统前端架构设计，使用 React + TypeScript 重构旧系统，页面加载速度提升显著。' +
            '主导组件库建设，覆盖某平台级产品 80% 的UI场景。推动单元测试覆盖率从 0 到 大幅提升。',
          tags: ['React', 'TypeScript', '性能优化', '组件库', '单元测试'] },
        { id: 'sample_2', type: 'project', title: '某数据产品', org: '', date: '2022.03 - 2022.09',
          description: '从0到1搭建某数据产品，使用 Vue + Node.js + MongoDB 技术栈。实现海量用户数据的实时展示和交互分析，' +
            '支撑日活可观营收。独立负责前端架构和核心模块开发。',
          tags: ['Vue', 'Node.js', 'MongoDB', '全栈', '数据可视化'] },
        { id: 'sample_3', type: 'work', title: '后端开发实习生', org: '某科技企业', date: '2020.07 - 2021.03',
          description: '参与内部基础服务的后端开发，使用 Python + Django 构建 RESTful API。优化数据库查询，将平均响应时间从 大幅降低。',
          tags: ['Python', 'Django', 'REST', 'MySQL', '性能优化'] }
      ];
      localStorage.setItem('jobninja_blocks', JSON.stringify(sampleBlocks));
      localStorage.setItem('jobninja_basic', JSON.stringify({ name: '张三', email: 'zhangsan@example.com', phone: '13800001234' }));
    }

    // 创建示例设置
    if (!localStorage.getItem('jobninja_settings')) {
      localStorage.setItem('jobninja_settings', JSON.stringify({ city: '北京', years: '3', salaryMin: '20', salaryMax: '35' }));
    }

    // 显示新手引导弹窗
    setTimeout(function () {
      showOnboardingGuide();
    }, 800);
  }

  function showOnboardingGuide() {
    var steps = [
      {
        title: '欢迎使用 JobNinja！',
        subtitle: '你的求职军师 · 全程本地运行，无需任何API配置',
        icon: 'fa-ninja',
        iconColor: '#818cf8',
        content: 'JobNinja 帮你完成求职全流程：上传简历 → 找工作 → 改简历 → 导出PDF。<br><br>' +
          '<span style="color:#34d399;">无需配置任何API Key，打开即用！</span>所有数据仅存储在你的浏览器中。'
      },
      {
        title: '第1步：上传简历',
        subtitle: '支持 PDF / Word / TXT 格式',
        icon: 'fa-cloud-upload-alt',
        iconColor: '#818cf8',
        content: '在<strong>简历管理</strong>面板上传你的简历文件。<br>' +
          '系统会自动解析出你的姓名、联系方式、工作/项目/教育经历。<br>' +
          '解析全程在浏览器本地完成，<span style="color:#34d399;">不上传任何数据</span>。'
      },
      {
        title: '第2步：生成求职链接',
        subtitle: '聚合10+主流招聘平台',
        icon: 'fa-magnifying-glass',
        iconColor: '#34d399',
        content: '在<strong>找工作</strong>面板输入「岗位+城市」，一键生成所有主流招聘平台的搜索链接。<br>' +
          '支持BOSS直聘、猎聘、智联、前程无忧、拉勾、脉脉、LinkedIn等10+平台。<br>' +
          '可<strong>一键批量打开</strong>所有搜索结果页。'
      },
      {
        title: '第3步：修改简历',
        subtitle: '本地引擎 · 动词库 · 表达升级',
        icon: 'fa-screwdriver-wrench',
        iconColor: '#f59e0b',
        content: '在<strong>简历工具</strong>面板使用100+简历动词库、表达升级工具、排版优化工具。<br>' +
          '在<strong>简历管理</strong>面板对每条经历点击魔法棒图标，本地引擎自动优化表达。<br>' +
          '如需AI深度润色，可在设置中配置API Key（完全可选）。'
      },
      {
        title: '第4步：导出PDF',
        subtitle: '一键生成专业简历',
        icon: 'fa-file-pdf',
        iconColor: '#ef4444',
        content: '在<strong>简历管理</strong>面板的底部，点击<strong>「导出PDF」</strong>按钮。<br>' +
          '简历预览满意后即可导出为专业排版的PDF文件。<br><br>' +
          '<span style="color:#94a3b8;">提示：简历工具中还提供了<strong>避坑指南</strong>，列出了9个最常见的简历错误写法。</span>'
      }
    ];

    var currentStep = 0;

    var overlay = document.createElement('div');
    overlay.id = 'onboardingOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;animation:panelFadeIn 0.2s ease;';

    function renderStep() {
      var s = steps[currentStep];
      var isLast = currentStep === steps.length - 1;
      var isFirst = currentStep === 0;

      overlay.innerHTML =
        '<div style="background:#12121a;border:1px solid #252536;border-radius:16px;padding:32px;width:95%;max-width:520px;text-align:center;animation:panelFadeIn 0.2s ease;">' +
          // 图标
          '<div style="width:64px;height:64px;border-radius:16px;background:' + s.iconColor + '15;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
            '<i class="fa-solid ' + s.icon + '" style="color:' + s.iconColor + ';font-size:28px;"></i>' +
          '</div>' +
          // 标题
          '<h3 style="font-size:18px;color:#f1f5f9;margin:0 0 4px;">' + s.title + '</h3>' +
          '<p style="font-size:12px;color:#64748b;margin:0 0 16px;">' + s.subtitle + '</p>' +
          // 内容
          '<div style="background:#0f0f17;border:1px solid #1a1a26;border-radius:10px;padding:16px;text-align:left;margin-bottom:20px;">' +
            '<p style="font-size:13px;color:#94a3b8;line-height:1.8;margin:0;">' + s.content + '</p>' +
          '</div>' +
          // 步骤指示器
          '<div style="display:flex;justify-content:center;gap:6px;margin-bottom:20px;">' +
            steps.map(function(_, i) {
              return '<div style="width:' + (i === currentStep ? '20px' : '8px') + ';height:8px;border-radius:4px;background:' + (i === currentStep ? s.iconColor : '#252536') + ';transition:all 0.2s;"></div>';
            }).join('') +
          '</div>' +
          // 按钮
          '<div style="display:flex;gap:8px;justify-content:center;">' +
            (!isFirst ? '<button id="onboardPrev" class="btn btn-outline" style="font-size:12px;">上一步</button>' : '') +
            (!isLast
              ? '<button id="onboardNext" class="btn btn-primary" style="font-size:12px;">下一步 <i class="fa-solid fa-arrow-right" style="font-size:10px;"></i></button>'
              : '<button id="onboardDone" class="btn btn-primary" style="font-size:12px;background:#10b981;">' +
                  '<i class="fa-solid fa-rocket" style="font-size:11px;"></i> 开始使用</button>') +
            '<button id="onboardSkip" class="btn btn-outline" style="font-size:12px;color:#4a4a6a;">跳过</button>' +
          '</div>' +
        '</div>';

      document.body.appendChild(overlay);

      function close() {
        if (overlay.parentNode) document.body.removeChild(overlay);
        // 首次打开默认切换到简历管理面板
        switchPanel('resume');
        showToast('已为你创建示例数据，开始体验吧！上传简历 → 找工作 → 改简历 → 导出PDF', 'info');
      }

      overlay.querySelector('#onboardSkip').addEventListener('click', close);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

      if (!isLast) {
        overlay.querySelector('#onboardNext').addEventListener('click', function() {
          document.body.removeChild(overlay);
          currentStep++;
          renderStep();
        });
      } else {
        overlay.querySelector('#onboardDone').addEventListener('click', close);
      }

      if (!isFirst) {
        overlay.querySelector('#onboardPrev').addEventListener('click', function() {
          document.body.removeChild(overlay);
          currentStep--;
          renderStep();
        });
      }
    }

    renderStep();
  }

  // ==================== 导出 ====================

  /** 全量备份（打包所有数据） */
  function backupAllData() {
    try {
      var bundle = { _version: '1.0.0', _exportedAt: new Date().toISOString(), _keys: [] };
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf('jobninja_') === 0) {
          bundle[k] = localStorage.getItem(k);
          bundle._keys.push(k);
        }
      }
      var summary = getDataSummary();
      var summaryText = Object.keys(summary).map(function(k) { return k + ': ' + summary[k]; }).join('\n');
      if (!confirm('全量备份将导出以下数据：\n\n' + (summaryText || '(暂无数据)') + '\n\n共 ' + bundle._keys.length + ' 个存储项。确认导出？')) return;
      var json = JSON.stringify(bundle, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'JobNinja_全量备份_' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('全量备份完成！数据已安全下载到本地', 'success');
    } catch (e) {
      showToast('备份失败：' + (e.message || '未知错误'), 'error');
    }
  }

  /** 获取存储空间使用情况 */
  function getStorageUsage() {
    var total = 0, itemCount = 0;
    var categories = {};
    var catMap = {
      'blocks': '简历积木', 'basic': '基本信息', 'settings': '设置', 'apikey': 'API密钥',
      'applications': '投递记录', 'evaluations': '岗位评估', 'interview_reports': '面试报告',
      'bookmarks': '岗位收藏', 'saved_searches': '搜索条件', 'search_history': '搜索历史',
      'custom_platforms': '自定义平台', 'custom_templates': '自定义模板',
      'tpl_ratings': '模板评分', 'imported_templates': '导入模板',
      'user_experiences': '用户经验', 'industry_edits': '行业编辑',
      'resume_versions': '简历版本', 'active_template': '模板配置',
      'profiles': 'API配置档案', 'block_order': '排序', 'onboarded': '引导标记', 'language': '语言'
    };
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf('jobninja_') === 0) {
        var size = k.length + (localStorage.getItem(k) || '').length;
        total += size; itemCount++;
        var cat = k.replace('jobninja_', '');
        for (var ck in catMap) {
          if (cat.indexOf(ck) !== -1) { cat = ck; break; }
        }
        if (!categories[cat]) categories[cat] = { count: 0, size: 0 };
        categories[cat].count++; categories[cat].size += size;
      }
    }
    var totalKB = Math.round(total / 1024 * 10) / 10;
    var limitKB = 5000; // ~5MB localStorage limit
    var usedPct = Math.round((totalKB / limitKB) * 100);

    return { totalKB: totalKB, limitKB: limitKB, usedPct: usedPct, itemCount: itemCount, categories: categories };
  }

  window.JobNinja = {
    init: init,
    registerPanel: registerPanel,
    switchPanel: switchPanel,
    jumpToPanel: jumpToPanel,
    getJumpData: getJumpData,
    getActivePanelId: function () { return activePanelId; },
    getPanels: function () { return panels.slice(); },
    showToast: showToast,
    btnLoading: btnLoading,
    btnReset: btnReset,
    exportAllData: exportAllData,
    importAllData: importAllData,
    backupAllData: backupAllData,
    getDataSummary: getDataSummary,
    getStorageUsage: getStorageUsage,
    updateModeIndicator: updateModeIndicator,
    toggleMobileSidebar: toggleMobileSidebar
  };

})();
