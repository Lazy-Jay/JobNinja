/**
 * JobNinja — i18n.js v1.0
 * 多语言支持：简体中文/English，界面切换，关键UI本地化
 * 纯本地，无需API
 */
(function () {
  if (!window.JobNinja) return;
  var JN = window.JobNinja;

  var STORAGE_LANG = 'jobninja_language';

  // 翻译表
  var STRINGS = {
    'zh-CN': {
      // 通用
      'app.name': 'JobNinja - 求职军师',
      'app.desc': '永远做你的军师，不做平台。简历优化、渠道推荐、岗位评估、模拟面试。',
      'app.version': 'v0.5.0',
      'mode.local': '本地模式',
      'mode.enhanced': '增强模式',
      'mode.localDesc': '无需API，所有功能本地运行',
      'mode.enhancedDesc': '已配置API，可使用AI增强功能',
      'data.local': '数据仅存储于本机',
      'badge.text': '社区版',

      // 侧边栏
      'nav.resume': '简历管理',
      'nav.jobsearch': '找工作',
      'nav.resumetools': '简历工具',
      'nav.templates': '简历模板',
      'nav.templatecommunity': '模板社区',
      'nav.tracker': '求职进度',
      'nav.channel': '渠道推荐',
      'nav.evaluate': '岗位评估',
      'nav.interview': '模拟面试',
      'nav.experiences': '求职经验',
      'nav.industrydb': '行业信息',
      'nav.settings': '设置',

      // 操作
      'btn.save': '保存',
      'btn.cancel': '取消',
      'btn.close': '关闭',
      'btn.delete': '删除',
      'btn.edit': '编辑',
      'btn.export': '导出',
      'btn.import': '导入',
      'btn.copy': '复制',
      'btn.search': '搜索',
      'btn.confirm': '确认',
      'btn.apply': '应用',
      'btn.preview': '预览',

      // Toast
      'toast.saved': '已保存',
      'toast.deleted': '已删除',
      'toast.copied': '已复制到剪贴板',
      'toast.exported': '导出成功',
      'toast.imported': '导入成功',
      'toast.error': '操作失败',

      // 面试清单
      'checklist.title': '面试准备清单',
      'checklist.items': [
        '打印3-5份纸质简历（彩色，优质纸张）',
        '准备1分钟和3分钟两个版本的自我介绍',
        '研究目标公司的产品、技术栈、近期新闻',
        '准备3-5个STAR案例（技术能力/项目经验/团队协作）',
        '装备作品集/项目演示（如有）',
        '列出3-5个反问面试官的问题',
        '确认面试时间、地点、形式（线上/线下）',
        '准备合适的着装（商务休闲为宜）',
        '提前30分钟到达（线下）或提前10分钟进入会议（线上）',
        '检查设备（线上：摄像头/麦克风/网络/背景）',
        '准备纸笔记录面试要点',
        '面试后24小时内发送感谢邮件/消息'
      ]
    },
    'en': {
      'app.name': 'JobNinja - Career Coach',
      'app.desc': 'Your career strategist, not a platform. Resume optimization, channel recommendations, job evaluation, mock interviews.',
      'app.version': 'v0.5.0',
      'mode.local': 'Local Mode',
      'mode.enhanced': 'Enhanced Mode',
      'mode.localDesc': 'No API needed, all features run locally',
      'mode.enhancedDesc': 'API configured, AI features available',
      'data.local': 'Data stored locally only',
      'badge.text': 'Community',

      'nav.resume': 'Resume',
      'nav.jobsearch': 'Job Search',
      'nav.resumetools': 'Resume Tools',
      'nav.templates': 'Templates',
      'nav.templatecommunity': 'Community',
      'nav.tracker': 'Job Tracker',
      'nav.channel': 'Channels',
      'nav.evaluate': 'Evaluation',
      'nav.interview': 'Interview',
      'nav.experiences': 'Experiences',
      'nav.industrydb': 'Industries',
      'nav.settings': 'Settings',

      'btn.save': 'Save',
      'btn.cancel': 'Cancel',
      'btn.close': 'Close',
      'btn.delete': 'Delete',
      'btn.edit': 'Edit',
      'btn.export': 'Export',
      'btn.import': 'Import',
      'btn.copy': 'Copy',
      'btn.search': 'Search',
      'btn.confirm': 'Confirm',
      'btn.apply': 'Apply',
      'btn.preview': 'Preview',

      'toast.saved': 'Saved',
      'toast.deleted': 'Deleted',
      'toast.copied': 'Copied to clipboard',
      'toast.exported': 'Export successful',
      'toast.imported': 'Import successful',
      'toast.error': 'Operation failed',

      'checklist.title': 'Interview Checklist',
      'checklist.items': [
        'Print 3-5 copies of your resume (color, quality paper)',
        'Prepare 1-min and 3-min self-introduction',
        'Research the company: products, tech stack, recent news',
        'Prepare 3-5 STAR examples (technical/project/teamwork)',
        'Have your portfolio/project demos ready',
        'List 3-5 questions to ask the interviewer',
        'Confirm interview time, location, format (online/offline)',
        'Dress appropriately (business casual recommended)',
        'Arrive 30 min early (offline) or 10 min early (online)',
        'Check equipment (camera/mic/network/background for online)',
        'Bring pen and paper for notes',
        'Send thank-you email/message within 24 hours'
      ]
    }
  };

  function getLang() {
    try { return localStorage.getItem(STORAGE_LANG) || 'zh-CN'; } catch (_) { return 'zh-CN'; }
  }
  function setLang(lang) {
    try { localStorage.setItem(STORAGE_LANG, lang); } catch (_) {}
  }

  function t(key, fallback) {
    var lang = getLang();
    var table = STRINGS[lang] || STRINGS['zh-CN'];
    var val = table[key];
    if (val !== undefined) return val;
    // fallback to zh-CN
    val = (STRINGS['zh-CN'] || {})[key];
    if (val !== undefined) return val;
    return fallback || key;
  }

  /** 翻译UI元素：更新所有带 data-i18n 属性的元素 */
  function translateUI() {
    var lang = getLang();
    var all = document.querySelectorAll('[data-i18n]');
    all.forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var translated = t(key);
      if (translated && translated !== key) {
        if (el.tagName === 'INPUT' && el.type === 'placeholder') {
          el.placeholder = translated;
        } else {
          el.textContent = translated;
        }
      }
    });
    // 更新 tooltip
    var navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(function(btn) {
      var panelId = btn.getAttribute('data-panel');
      if (panelId) {
        var navKey = 'nav.' + panelId;
        var navText = t(navKey);
        if (navText && navText !== navKey) btn.setAttribute('data-tooltip', navText);
      }
    });
    // 更新标题
    var panelTitle = document.getElementById('panelTitle');
    if (panelTitle) {
      var activeId = JN.getActivePanelId ? JN.getActivePanelId() : 'resume';
      var titleKey = 'nav.' + activeId;
      var titleText = t(titleKey);
      if (titleText && titleText !== titleKey) panelTitle.textContent = titleText;
    }
    // 更新模式指示器
    var modeEl = document.getElementById('modeIndicator');
    if (modeEl) {
      var hasApi = false;
      try { var cfg = JN.getApiConfig ? JN.getApiConfig() : {}; hasApi = !!(cfg.apiKey && cfg.endpoint); } catch (_) {}
      var modeKey = hasApi ? 'mode.enhanced' : 'mode.local';
      var modeText = t(modeKey);
      if (modeText) {
        var icon = hasApi ? '<i class="fa-solid fa-robot" style="color:#818cf8;font-size:10px;"></i> ' :
                            '<i class="fa-solid fa-shield-halved" style="color:#10b981;font-size:10px;"></i> ';
        modeEl.innerHTML = icon + modeText;
      }
    }
    // 更新数据存储文本
    var dataEl = document.querySelector('footer span:last-child');
    var dataText = t('data.local');
    // 更新版本号
    var versionSpan = document.querySelector('footer span:last-of-type');
    // 更新徽章
    var badge = document.getElementById('panelBadge');
    if (badge) { var badgeText = t('badge.text'); if (badgeText) badge.textContent = badgeText; }
  }

  /** 渲染语言切换器 */
  function renderLangSwitcher() {
    var container = document.getElementById('langSwitcher');
    if (!container) return;
    var currentLang = getLang();
    var isZh = currentLang === 'zh-CN';
    container.innerHTML =
      '<button id="btnSwitchLang" style="background:transparent;border:1px solid #252536;border-radius:6px;color:#4a4a6a;cursor:pointer;font-size:11px;padding:5px 10px;transition:all 0.12s;"' +
        ' onmouseenter="this.style.borderColor=\'#6366f1\';this.style.color=\'#a5b4fc\'"' +
        ' onmouseleave="this.style.borderColor=\'#252536\';this.style.color=\'#4a4a6a\'"' +
        ' title="Switch Language / 切换语言">' +
        (isZh ? 'EN' : '中') +
      '</button>';
    container.querySelector('#btnSwitchLang').addEventListener('click', function() {
      var newLang = getLang() === 'zh-CN' ? 'en' : 'zh-CN';
      setLang(newLang);
      renderLangSwitcher();
      translateUI();
      JN.showToast ? JN.showToast('Language: ' + (newLang === 'en' ? 'English' : '中文'), 'info') : null;
      // 刷新当前面板
      if (JN.switchPanel) {
        var activeId = JN.getActivePanelId ? JN.getActivePanelId() : 'resume';
        JN.switchPanel(activeId);
      }
    });
  }

  // 注册i18n函数
  JN.t = t;
  JN.getLang = getLang;
  JN.setLang = setLang;
  JN.translateUI = translateUI;
  JN.renderLangSwitcher = renderLangSwitcher;
  JN.i18nStrings = STRINGS;

  // 等待DOM准备好后初始化
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      renderLangSwitcher();
      translateUI();
    }, 100);
  });

})();
