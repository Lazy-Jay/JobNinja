/**
 * JobNinja — resume-templates.js
 * 简历模板库：22+行业模板，三维筛选，评分，字号/行距，模块管理，手机预览，JSON导出/导入
 */
(function () {
  if (!window.JobNinja) return;
  var JN = window.JobNinja;

  var STORAGE_CUSTOM_TEMPLATES = 'jobninja_custom_templates';
  var STORAGE_ACTIVE_TEMPLATE = 'jobninja_active_template';
  var STORAGE_RATINGS = 'jobninja_tpl_ratings';

  var TEMPLATES = [
    { id: 'internet-tech', name: '互联网技术', industry: '互联网/技术', group: '社招1-3年', style: '专业风',
      color: '#6366f1', font: 'default', desc: '适合前端、后端、全栈、算法等技术岗位。突出技术栈和项目成果。',
      layout: 'single', sectionOrder: ['work', 'project', 'education', 'skill'],
      accentColor: '#6366f1', headerStyle: 'centered', skillStyle: 'tags' },
    { id: 'product-manager', name: '产品经理', industry: '产品', group: '社招1-3年', style: '专业风',
      color: '#8b5cf6', font: 'default', desc: '适合产品经理、产品运营等岗位。强调数据驱动、用户洞察和项目成果。',
      layout: 'single', sectionOrder: ['work', 'project', 'education', 'skill'],
      accentColor: '#8b5cf6', headerStyle: 'centered', skillStyle: 'tags' },
    { id: 'operation', name: '运营达人', industry: '运营', group: '社招1-3年', style: '简约风',
      color: '#f59e0b', font: 'default', desc: '适合新媒体运营、用户运营、活动运营等岗位。突出增长数据和运营成果。',
      layout: 'single', sectionOrder: ['work', 'project', 'skill', 'education'],
      accentColor: '#f59e0b', headerStyle: 'left', skillStyle: 'inline' },
    { id: 'ui-designer', name: 'UI/UX设计师', industry: '设计', group: '社招1-3年', style: '创意风',
      color: '#ec4899', font: 'default', desc: '适合UI设计师、UX设计师、视觉设计师。突出设计作品和设计思维。',
      layout: 'sidebar', sectionOrder: ['work', 'project', 'skill', 'education'],
      accentColor: '#ec4899', headerStyle: 'left', skillStyle: 'progress' },
    { id: 'marketing', name: '市场/品牌', industry: '市场', group: '社招3-5年', style: '专业风',
      color: '#f97316', font: 'default', desc: '适合品牌经理、市场推广、公关等岗位。突出品牌项目和传播成果。',
      layout: 'single', sectionOrder: ['work', 'project', 'education', 'skill'],
      accentColor: '#f97316', headerStyle: 'centered', skillStyle: 'tags' },
    { id: 'finance', name: '财务/会计', industry: '金融/财务', group: '社招3-5年', style: '简约风',
      color: '#059669', font: 'default', desc: '适合财务、会计、审计、风控等岗位。突出专业证书和合规经验。',
      layout: 'single', sectionOrder: ['work', 'education', 'skill', 'project'],
      accentColor: '#059669', headerStyle: 'left', skillStyle: 'inline' },
    { id: 'hr-admin', name: '行政/HR', industry: '人力资源', group: '社招1-3年', style: '简约风',
      color: '#0891b2', font: 'default', desc: '适合HR、行政、招聘等岗位。突出组织能力和沟通协调能力。',
      layout: 'single', sectionOrder: ['work', 'education', 'skill', 'project'],
      accentColor: '#0891b2', headerStyle: 'left', skillStyle: 'tags' },
    { id: 'sales', name: '销售/商务', industry: '销售', group: '社招3-5年', style: '专业风',
      color: '#dc2626', font: 'default', desc: '适合销售经理、商务拓展、大客户经理等岗位。突出业绩数据和客户资源。',
      layout: 'single', sectionOrder: ['work', 'project', 'skill', 'education'],
      accentColor: '#dc2626', headerStyle: 'centered', skillStyle: 'tags' },
    { id: 'fresh-graduate', name: '应届生通用', industry: '应届生', group: '应届生', style: '简约风',
      color: '#10b981', font: 'default', desc: '适合应届毕业生和实习生。突出教育背景、实习经历和校园活动。',
      layout: 'single', sectionOrder: ['education', 'project', 'work', 'skill'],
      accentColor: '#10b981', headerStyle: 'centered', skillStyle: 'inline' },
    { id: 'finance-invest', name: '金融/投资', industry: '金融', group: '社招3-5年', style: '专业风',
      color: '#7c3aed', font: 'default', desc: '适合投资经理、分析师、量化等岗位。突出分析能力和项目经验。',
      layout: 'single', sectionOrder: ['work', 'education', 'project', 'skill'],
      accentColor: '#7c3aed', headerStyle: 'centered', skillStyle: 'tags' },
    { id: 'consulting', name: '咨询顾问', industry: '咨询', group: '社招3-5年', style: '外企风',
      color: '#2563eb', font: 'default', desc: '适合管理咨询、战略咨询等岗位。突出分析框架和项目交付。',
      layout: 'sidebar', sectionOrder: ['work', 'education', 'project', 'skill'],
      accentColor: '#2563eb', headerStyle: 'left', skillStyle: 'tags' },
    { id: 'education', name: '教育/培训', industry: '教育', group: '社招1-3年', style: '简约风',
      color: '#65a30d', font: 'default', desc: '适合教师、培训师、课程设计师等岗位。突出教学成果和课程开发。',
      layout: 'single', sectionOrder: ['work', 'education', 'project', 'skill'],
      accentColor: '#65a30d', headerStyle: 'centered', skillStyle: 'inline' },
    { id: 'medical', name: '医疗/制药', industry: '医疗', group: '社招3-5年', style: '简约风',
      color: '#0d9488', font: 'default', desc: '适合医生、药剂师、医药代表、研发等岗位。突出专业资质和临床成果。',
      layout: 'single', sectionOrder: ['work', 'education', 'skill', 'project'],
      accentColor: '#0d9488', headerStyle: 'left', skillStyle: 'inline' },
    { id: 'legal', name: '法律', industry: '法律', group: '社招3-5年', style: '简约风',
      color: '#4f46e5', font: 'default', desc: '适合律师、法务、合规等岗位。突出执业资格和案件经验。',
      layout: 'single', sectionOrder: ['work', 'education', 'skill', 'project'],
      accentColor: '#4f46e5', headerStyle: 'left', skillStyle: 'inline' },
    { id: 'media', name: '传媒/新媒体', industry: '传媒', group: '社招1-3年', style: '创意风',
      color: '#d946ef', font: 'default', desc: '适合记者、编辑、新媒体运营、内容创作者。突出作品和传播数据。',
      layout: 'sidebar', sectionOrder: ['project', 'work', 'skill', 'education'],
      accentColor: '#d946ef', headerStyle: 'centered', skillStyle: 'tags' },
    { id: 'logistics', name: '物流/供应链', industry: '物流', group: '社招3-5年', style: '专业风',
      color: '#0284c7', font: 'default', desc: '适合供应链管理、物流运营、采购等岗位。突出效率优化和成本控制。',
      layout: 'single', sectionOrder: ['work', 'project', 'skill', 'education'],
      accentColor: '#0284c7', headerStyle: 'left', skillStyle: 'tags' },
    { id: 'realestate', name: '房地产/建筑', industry: '房地产', group: '社招3-5年', style: '专业风',
      color: '#b45309', font: 'default', desc: '适合房地产销售、项目管理、建筑设计等岗位。突出项目规模和业绩。',
      layout: 'single', sectionOrder: ['work', 'project', 'skill', 'education'],
      accentColor: '#b45309', headerStyle: 'centered', skillStyle: 'inline' },
    { id: 'manufacture', name: '制造/工程', industry: '制造', group: '社招3-5年', style: '简约风',
      color: '#475569', font: 'default', desc: '适合工程师、生产管理、质量等岗位。突出技术能力和项目管理。',
      layout: 'single', sectionOrder: ['work', 'skill', 'project', 'education'],
      accentColor: '#475569', headerStyle: 'left', skillStyle: 'tags' },
    { id: 'game', name: '游戏行业', industry: '游戏', group: '社招1-3年', style: '创意风',
      color: '#a855f7', font: 'default', desc: '适合游戏策划、游戏开发、游戏美术等岗位。突出游戏项目和核心玩法。',
      layout: 'sidebar', sectionOrder: ['project', 'work', 'skill', 'education'],
      accentColor: '#a855f7', headerStyle: 'centered', skillStyle: 'tags' },
    { id: 'ai-data', name: 'AI/数据科学', industry: '人工智能', group: '社招1-3年', style: '专业风',
      color: '#14b8a6', font: 'default', desc: '适合AI工程师、数据科学家、算法研究员。突出模型成果和技术深度。',
      layout: 'single', sectionOrder: ['work', 'project', 'education', 'skill'],
      accentColor: '#14b8a6', headerStyle: 'centered', skillStyle: 'tags' },
    { id: 'remote', name: '远程工作者', industry: '远程', group: '社招1-3年', style: '外企风',
      color: '#84cc16', font: 'default', desc: '适合远程办公岗位。突出自驱力、沟通能力和独立交付能力。',
      layout: 'single', sectionOrder: ['work', 'project', 'skill', 'education'],
      accentColor: '#84cc16', headerStyle: 'left', skillStyle: 'tags' },
    { id: 'executive', name: '高级管理', industry: '管理', group: '社招5年以上', style: '外企风',
      color: '#1e293b', font: 'default', desc: '适合总监、VP、C-level等高级管理岗位。突出战略成果和团队领导力。',
      layout: 'single', sectionOrder: ['work', 'education', 'project', 'skill'],
      accentColor: '#cbd5e1', headerStyle: 'centered', skillStyle: 'inline' },
    { id: 'career-change', name: '转行通用', industry: '通用', group: '转行', style: '简约风',
      color: '#6366f1', font: 'default', desc: '适合跨行业求职者。突出可迁移技能和跨领域项目经验。',
      layout: 'single', sectionOrder: ['skill', 'project', 'work', 'education'],
      accentColor: '#6366f1', headerStyle: 'centered', skillStyle: 'tags' }
  ];

  var FONT_OPTIONS = [
    { value: 'default', label: '系统默认', css: '-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif' },
    { value: 'song', label: '宋体', css: '"SimSun","宋体",serif' },
    { value: 'hei', label: '黑体', css: '"SimHei","黑体","PingFang SC",sans-serif' },
    { value: 'kai', label: '楷体', css: '"KaiTi","楷体",serif' }
  ];

  var SECTION_LABELS = {
    work: '工作经历', project: '项目经历', education: '教育背景', skill: '专业技能',
    cert: '证书荣誉', summary: '自我评价', language: '语言能力'
  };
  var SECTION_ICONS = {
    work: 'fa-briefcase', project: 'fa-diagram-project', education: 'fa-graduation-cap',
    skill: 'fa-code', cert: 'fa-award', summary: 'fa-user', language: 'fa-language'
  };
  var ALL_SECTION_TYPES = ['work', 'project', 'education', 'skill', 'cert', 'summary', 'language'];

  var GROUPS = ['全部', '应届生', '社招1-3年', '社招3-5年', '社招5年以上', '转行'];
  var STYLES = ['全部', '简约风', '专业风', '创意风', '外企风'];
  var INDUSTRIES = ['全部'].concat(Array.from(new Set(TEMPLATES.map(function(t) { return t.industry; }))).sort());

  function loadCustomTemplates() { try { return JSON.parse(localStorage.getItem(STORAGE_CUSTOM_TEMPLATES)) || []; } catch (_) { return []; } }
  function saveCustomTemplates(list) { localStorage.setItem(STORAGE_CUSTOM_TEMPLATES, JSON.stringify(list)); }
  function getActiveTemplateId() { try { return localStorage.getItem(STORAGE_ACTIVE_TEMPLATE) || 'internet-tech'; } catch (_) { return 'internet-tech'; } }
  function setActiveTemplateId(id) { localStorage.setItem(STORAGE_ACTIVE_TEMPLATE, id); }
  function getAllTemplates() { return TEMPLATES.concat(loadCustomTemplates()); }

  function loadRatings() { try { return JSON.parse(localStorage.getItem(STORAGE_RATINGS)) || {}; } catch (_) { return {}; } }
  function saveRating(tplId, star) {
    var r = loadRatings();
    if (!r[tplId]) r[tplId] = [];
    r[tplId].push(star);
    if (r[tplId].length > 50) r[tplId] = r[tplId].slice(-50);
    localStorage.setItem(STORAGE_RATINGS, JSON.stringify(r));
  }
  function getAvgRating(tplId) {
    var r = loadRatings();
    var arr = r[tplId] || [];
    if (!arr.length) return 0;
    return arr.reduce(function(a, b) { return a + b; }, 0) / arr.length;
  }

  function generateTemplateHTML(template, basicInfo, blocks, opts) {
    opts = opts || {};
    var info = basicInfo || {};
    var name = info.name || '您的姓名';
    var email = info.email || '';
    var phone = info.phone || '';
    var c = template.accentColor || '#6366f1';
    var fontCss = (FONT_OPTIONS.find(function(f) { return f.value === (template.font || 'default'); }) || FONT_OPTIONS[0]).css;
    var fontSize = opts.fontSize || 13;
    var lineHeight = opts.lineHeight || 1.7;
    var sectionOrder = opts.sectionOrder || template.sectionOrder || ['work', 'project', 'education', 'skill'];

    var html = '<div style="font-family:' + fontCss + ';color:#1e293b;background:#ffffff;padding:32px;max-width:210mm;margin:0 auto;font-size:' + fontSize + 'px;line-height:' + lineHeight + ';">';

    if (template.headerStyle === 'centered') {
      html += '<div style="text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid ' + c + ';">';
      html += '<h1 style="margin:0 0 6px;font-size:' + (fontSize + 11) + 'px;color:#0f172a;letter-spacing:2px;">' + name + '</h1>';
      html += '<p style="margin:0;font-size:' + (fontSize - 1) + 'px;color:#64748b;">';
      var cp = [];
      if (email) cp.push(email);
      if (phone) cp.push(phone);
      if (info.location) cp.push(info.location);
      html += cp.join(' &nbsp;|&nbsp; ') || '联系方式待补充';
      html += '</p></div>';
    } else {
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid ' + c + ';">';
      html += '<div><h1 style="margin:0 0 4px;font-size:' + (fontSize + 11) + 'px;color:#0f172a;">' + name + '</h1>';
      if (email || phone) html += '<p style="margin:0;font-size:' + (fontSize - 2) + 'px;color:#64748b;">' + [email, phone, info.location].filter(Boolean).join(' | ') + '</p>';
      html += '</div></div>';
    }

    if (template.layout === 'sidebar') {
      var mainBlocks = [], sideBlocks = [];
      var mainTypes = ['work', 'project', 'education'];
      blocks.forEach(function(b) {
        if (mainTypes.indexOf(b.type) !== -1) mainBlocks.push(b); else sideBlocks.push(b);
      });
      html += '<div style="display:flex;gap:24px;">';
      html += '<div style="width:180px;flex-shrink:0;border-right:1px solid #e2e8f0;padding-right:16px;">';
      sideBlocks.forEach(function(b) {
        html += '<div style="margin-bottom:12px;">';
        html += '<h4 style="font-size:' + (fontSize - 2) + 'px;color:' + c + ';margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">' + (SECTION_LABELS[b.type] || '') + '</h4>';
        html += '<p style="font-size:' + (fontSize - 1) + 'px;color:#475569;margin:0 0 2px;font-weight:600;">' + (b.title || '') + '</p>';
        html += '<p style="font-size:' + (fontSize - 2) + 'px;color:#94a3b8;margin:0;line-height:' + lineHeight + ';">' + (b.description || '').substring(0, 120) + '</p>';
        html += '</div>';
      });
      html += '</div><div style="flex:1;">';
      mainBlocks.forEach(function(b) { html += renderBlock(b, c, template, fontSize, lineHeight); });
      html += '</div></div>';
    } else {
      sectionOrder.forEach(function(type) {
        if (type === 'summary' || type === 'language' || type === 'cert') {
          var extra = opts.extraSections && opts.extraSections[type];
          if (!extra) return;
          html += '<div style="margin-bottom:16px;">';
          html += '<h3 style="font-size:' + (fontSize + 2) + 'px;color:' + c + ';margin:0 0 8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0;">' +
            '<i class="fa-solid ' + (SECTION_ICONS[type] || 'fa-file') + '" style="margin-right:6px;font-size:' + fontSize + 'px;"></i>' + SECTION_LABELS[type] + '</h3>';
          html += '<p style="font-size:' + fontSize + 'px;color:#475569;line-height:' + lineHeight + ';margin:0;">' + extra.replace(/\n/g, '<br>') + '</p>';
          html += '</div>';
          return;
        }
        var typeBlocks = blocks.filter(function(b) { return b.type === type; });
        if (typeBlocks.length === 0) return;
        html += '<div style="margin-bottom:16px;">';
        html += '<h3 style="font-size:' + (fontSize + 2) + 'px;color:' + c + ';margin:0 0 8px;padding-bottom:4px;border-bottom:1px solid #e2e8f0;">' +
          '<i class="fa-solid ' + (SECTION_ICONS[type] || 'fa-file') + '" style="margin-right:6px;font-size:' + fontSize + 'px;"></i>' + (SECTION_LABELS[type] || type) + '</h3>';
        typeBlocks.forEach(function(b) { html += renderBlock(b, c, template, fontSize, lineHeight); });
        html += '</div>';
      });
    }

    html += '</div>';
    return html;
  }

  function renderBlock(b, c, template, fontSize, lineHeight) {
    fontSize = fontSize || 13; lineHeight = lineHeight || 1.7;
    var h = '<div style="margin-bottom:10px;padding:8px 0;">';
    h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;">';
    h += '<strong style="font-size:' + fontSize + 'px;color:#0f172a;">' + (b.title || b.org || '') + '</strong>';
    if (b.org && b.title) h += '<span style="font-size:' + (fontSize - 1) + 'px;color:#64748b;">' + b.org + '</span>';
    h += '<span style="font-size:' + (fontSize - 2) + 'px;color:#94a3b8;">' + (b.date || '') + '</span>';
    h += '</div>';
    if (b.description) {
      h += '<p style="font-size:' + (fontSize - 1) + 'px;color:#475569;line-height:' + lineHeight + ';margin:4px 0;">' + b.description.replace(/\n/g, '<br>') + '</p>';
    }
    if (b.tags && b.tags.length > 0 && template.skillStyle === 'tags') {
      h += '<div style="margin-top:4px;">';
      b.tags.slice(0, 6).forEach(function(t) {
        h += '<span style="font-size:' + (fontSize - 3) + 'px;padding:1px 6px;margin-right:4px;background:' + c + '15;color:' + c + ';border-radius:8px;">' + t + '</span>';
      });
      h += '</div>';
    }
    h += '</div>';
    return h;
  }

  function renderRatingStars(tplId, container) {
    var avg = getAvgRating(tplId);
    var html = '<div class="star-rating" data-tpl-id="' + tplId + '" style="display:inline-flex;gap:2px;cursor:pointer;">';
    for (var i = 1; i <= 5; i++) {
      var filled = i <= Math.round(avg);
      html += '<span class="star" data-star="' + i + '" style="font-size:12px;color:' + (filled ? '#f59e0b' : '#374151') + ';">&#9733;</span>';
    }
    html += '</div>';
    if (avg > 0) html += '<span style="font-size:10px;color:#64748b;margin-left:4px;">' + avg.toFixed(1) + '</span>';
    container.innerHTML = html;
    container.querySelectorAll('.star').forEach(function(star) {
      star.addEventListener('click', function(e) {
        e.stopPropagation();
        var s = parseInt(this.getAttribute('data-star'));
        saveRating(tplId, s);
        renderRatingStars(tplId, container);
        JN.showToast('已评分 ' + s + ' 星', 'success');
      });
    });
  }

  function showMobilePreview(html) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="position:relative;">' +
        '<button id="closeMobilePreview" style="position:absolute;top:-36px;right:0;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">&#10005; 关闭</button>' +
        '<div class="mobile-preview-frame">' +
          '<div style="width:375px;height:667px;overflow-y:auto;background:#fff;border-radius:0 0 32px 32px;" class="custom-scrollbar">' +
            '<div style="transform:scale(0.72);transform-origin:top left;width:521px;">' + html + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#closeMobilePreview').addEventListener('click', function() { document.body.removeChild(overlay); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
  }

  function exportTemplateJSON(tpl, customConfig) {
    var data = Object.assign({}, tpl, { _customConfig: customConfig || {}, _exportedAt: new Date().toISOString() });
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'jobninja_tpl_' + tpl.id + '.json';
    a.click(); URL.revokeObjectURL(url);
  }

  function importTemplateJSON(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!data.id || !data.name) { JN.showToast('无效的模板文件', 'error'); return; }
        data.id = 'custom_' + Date.now();
        data._isCustom = true;
        var list = loadCustomTemplates();
        list.push(data);
        saveCustomTemplates(list);
        JN.showToast('模板「' + data.name + '」导入成功', 'success');
        if (callback) callback(data);
      } catch (_) { JN.showToast('解析模板文件失败', 'error'); }
    };
    reader.readAsText(file);
  }

  function renderModuleManager(container, sectionOrder, onChange) {
    function redraw() {
      container.innerHTML = '';
      var available = ALL_SECTION_TYPES.filter(function(t) { return sectionOrder.indexOf(t) === -1; });

      var title = document.createElement('div');
      title.style.cssText = 'font-size:11px;color:#94a3b8;margin-bottom:8px;';
      title.textContent = '拖拽排序 · 点击删除 · 添加新模块';
      container.appendChild(title);

      var list = document.createElement('div');
      list.id = 'moduleList';
      list.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;min-height:32px;';

      sectionOrder.forEach(function(type, idx) {
        var item = document.createElement('div');
        item.className = 'module-drag-item';
        item.setAttribute('draggable', 'true');
        item.setAttribute('data-type', type);
        item.setAttribute('data-idx', idx);
        item.innerHTML = '<i class="fa-solid ' + (SECTION_ICONS[type] || 'fa-file') + '" style="font-size:9px;margin-right:4px;"></i>' +
          SECTION_LABELS[type] +
          '<span class="remove-module" data-type="' + type + '" style="margin-left:6px;color:#ef4444;cursor:pointer;font-size:10px;">&#10005;</span>';
        list.appendChild(item);
      });

      container.appendChild(list);

      if (available.length > 0) {
        var addRow = document.createElement('div');
        addRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';
        var addLabel = document.createElement('span');
        addLabel.style.cssText = 'font-size:10px;color:#64748b;margin-right:4px;align-self:center;';
        addLabel.textContent = '添加：';
        addRow.appendChild(addLabel);
        available.forEach(function(type) {
          var btn = document.createElement('button');
          btn.className = 'btn btn-outline';
          btn.style.cssText = 'font-size:10px;padding:2px 8px;';
          btn.innerHTML = '<i class="fa-solid fa-plus" style="font-size:9px;margin-right:3px;"></i>' + SECTION_LABELS[type];
          btn.addEventListener('click', function() {
            sectionOrder.push(type);
            redraw();
            if (onChange) onChange(sectionOrder.slice());
          });
          addRow.appendChild(btn);
        });
        container.appendChild(addRow);
      }

      // 删除事件
      container.querySelectorAll('.remove-module').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var t = this.getAttribute('data-type');
          var i = sectionOrder.indexOf(t);
          if (i !== -1) sectionOrder.splice(i, 1);
          redraw();
          if (onChange) onChange(sectionOrder.slice());
        });
      });

      // 拖拽排序
      var dragSrc = null;
      container.querySelectorAll('.module-drag-item').forEach(function(item) {
        item.addEventListener('dragstart', function() { dragSrc = this; this.style.opacity = '0.4'; });
        item.addEventListener('dragend', function() { this.style.opacity = '1'; });
        item.addEventListener('dragover', function(e) { e.preventDefault(); });
        item.addEventListener('drop', function(e) {
          e.preventDefault();
          if (dragSrc === this) return;
          var fromIdx = parseInt(dragSrc.getAttribute('data-idx'));
          var toIdx = parseInt(this.getAttribute('data-idx'));
          var moved = sectionOrder.splice(fromIdx, 1)[0];
          sectionOrder.splice(toIdx, 0, moved);
          redraw();
          if (onChange) onChange(sectionOrder.slice());
        });
      });
    }
    redraw();
  }

  function filterTemplates(all, group, industry, style) {
    return all.filter(function(t) {
      if (group && group !== '全部' && t.group !== group) return false;
      if (industry && industry !== '全部' && t.industry !== industry) return false;
      if (style && style !== '全部' && t.style !== style) return false;
      return true;
    });
  }

  function render() {
    var el = document.createElement('div');
    var activeTemplateId = getActiveTemplateId();
    var basicInfo = (function() { try { return JSON.parse(localStorage.getItem('jobninja_basic')) || {}; } catch(_) { return {}; } })();
    var blocks = (function() { try { return JSON.parse(localStorage.getItem('jobninja_blocks')) || []; } catch(_) { return []; } })();

    var state = {
      filterGroup: '全部', filterIndustry: '全部', filterStyle: '全部',
      currentTpl: null, customColor: null,
      fontSize: 13, lineHeight: 1.7,
      sectionOrder: null,
      extraSections: {}
    };

    el.innerHTML =
      '<div style="margin-bottom:16px;">' +
        '<h2 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">' +
          '<i class="fa-solid fa-palette" style="color:#f59e0b;margin-right:8px;"></i>简历模板库' +
        '</h2>' +
        '<p style="font-size:13px;color:#64748b;margin:0;">' + (TEMPLATES.length + 1) + '+行业模板 · 三维筛选 · 评分 · 手机预览 · JSON导出</p>' +
      '</div>' +

      // 筛选标签区
      '<div class="panel-card" style="padding:10px 12px;margin-bottom:12px;">' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">' +
          '<span style="font-size:11px;color:#64748b;white-space:nowrap;">人群：</span>' +
          '<div id="filterGroup" style="display:flex;flex-wrap:wrap;gap:4px;">' +
            GROUPS.map(function(g) {
              return '<span class="tpl-filter-tag' + (g === '全部' ? ' active' : '') + '" data-filter-group="' + g + '">' + g + '</span>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px;">' +
          '<span style="font-size:11px;color:#64748b;white-space:nowrap;">风格：</span>' +
          '<div id="filterStyle" style="display:flex;flex-wrap:wrap;gap:4px;">' +
            STYLES.map(function(s) {
              return '<span class="tpl-filter-tag' + (s === '全部' ? ' active' : '') + '" data-filter-style="' + s + '">' + s + '</span>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">' +
        // 左：模板列表
        '<div>' +
          '<div class="panel-card" style="padding:12px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
              '<span style="font-size:12px;font-weight:600;color:#d1d5db;">选择模板</span>' +
              '<div style="display:flex;gap:6px;">' +
                '<label class="btn btn-outline" style="font-size:10px;padding:2px 8px;cursor:pointer;">' +
                  '<i class="fa-solid fa-file-import" style="font-size:9px;margin-right:3px;"></i>导入JSON' +
                  '<input type="file" id="importTplFile" accept=".json" style="display:none;">' +
                '</label>' +
              '</div>' +
            '</div>' +
            '<div style="max-height:520px;overflow-y:auto;" class="custom-scrollbar">' +
              '<div id="tplGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // 右：预览 + 操作
        '<div>' +
          '<div class="panel-card" style="padding:12px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
              '<span style="font-size:12px;font-weight:600;color:#d1d5db;">实时预览</span>' +
              '<div style="display:flex;gap:6px;">' +
                '<button id="btnMobilePreview" class="btn btn-outline" style="font-size:10px;padding:2px 8px;" title="手机端预览">' +
                  '<i class="fa-solid fa-mobile-screen" style="font-size:10px;"></i>' +
                '</button>' +
                '<span id="tplPreviewName" style="font-size:10px;color:#64748b;align-self:center;"></span>' +
              '</div>' +
            '</div>' +
            '<div id="tplPreview" style="min-height:300px;max-height:460px;overflow-y:auto;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;" class="custom-scrollbar">' +
              '<div style="text-align:center;padding:80px 20px;color:#94a3b8;font-size:12px;">' +
                '<i class="fa-solid fa-palette" style="font-size:32px;display:block;margin-bottom:12px;opacity:0.3;"></i>选择左侧模板查看预览</div>' +
            '</div>' +
            '<div id="tplDesc" style="margin-top:6px;font-size:11px;color:#64748b;line-height:1.5;"></div>' +
            '<div id="tplRatingRow" style="margin-top:6px;display:flex;align-items:center;gap:8px;">' +
              '<span style="font-size:10px;color:#64748b;">评分：</span>' +
              '<div id="tplRatingStars"></div>' +
            '</div>' +
          '</div>' +

          // 自定义选项
          '<div style="margin-top:8px;padding:10px 12px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;">' +
            '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">' +
              // 颜色
              '<div>' +
                '<div style="font-size:10px;color:#64748b;margin-bottom:4px;">主题色</div>' +
                '<div style="display:flex;gap:4px;">' +
                  ['#6366f1','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#06b6d4','#f97316'].map(function(clr) {
                    return '<div class="tpl-color-dot" data-color="' + clr + '" style="width:20px;height:20px;border-radius:50%;background:' + clr + ';cursor:pointer;border:2px solid transparent;" title="' + clr + '"></div>';
                  }).join('') +
                '</div>' +
              '</div>' +
              // 字号
              '<div>' +
                '<div style="font-size:10px;color:#64748b;margin-bottom:4px;">字号</div>' +
                '<div style="display:flex;gap:4px;">' +
                  [12,13,14].map(function(s) {
                    return '<span class="tpl-filter-tag font-size-tag' + (s === 13 ? ' active' : '') + '" data-font-size="' + s + '" style="font-size:10px;">' + s + 'px</span>';
                  }).join('') +
                '</div>' +
              '</div>' +
              // 行距
              '<div>' +
                '<div style="font-size:10px;color:#64748b;margin-bottom:4px;">行距</div>' +
                '<div style="display:flex;gap:4px;">' +
                  [1.5,1.7,2.0].map(function(lh) {
                    return '<span class="tpl-filter-tag line-height-tag' + (lh === 1.7 ? ' active' : '') + '" data-line-height="' + lh + '" style="font-size:10px;">' + lh + '</span>';
                  }).join('') +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // 模块管理
          '<div style="margin-top:8px;padding:10px 12px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;">' +
            '<div style="font-size:11px;font-weight:600;color:#d1d5db;margin-bottom:8px;">' +
              '<i class="fa-solid fa-layer-group" style="color:#6366f1;margin-right:6px;font-size:10px;"></i>模块管理' +
            '</div>' +
            '<div id="moduleManager"></div>' +
          '</div>' +

          // 操作按钮
          '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">' +
            '<button id="btnApplyTemplate" class="btn btn-primary" style="font-size:12px;flex:1;">' +
              '<i class="fa-solid fa-check" style="font-size:10px;"></i> 应用模板</button>' +
            '<button id="btnExportTplPDF" class="btn btn-outline" style="font-size:12px;">' +
              '<i class="fa-solid fa-file-pdf" style="font-size:10px;"></i> PDF</button>' +
            '<button id="btnExportTplJSON" class="btn btn-outline" style="font-size:12px;">' +
              '<i class="fa-solid fa-file-code" style="font-size:10px;"></i> JSON</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:10px;color:#252536;text-align:right;">模板效果基于你的简历数据实时生成</div>';

    function getPreviewOpts() {
      return {
        fontSize: state.fontSize,
        lineHeight: state.lineHeight,
        sectionOrder: state.sectionOrder,
        extraSections: state.extraSections
      };
    }

    function updatePreview(tpl) {
      if (!tpl) return;
      state.currentTpl = tpl;
      if (!state.sectionOrder) state.sectionOrder = (tpl.sectionOrder || ['work', 'project', 'education', 'skill']).slice();

      var previewTpl = Object.assign({}, tpl);
      if (state.customColor) previewTpl.accentColor = state.customColor;

      var previewEl = el.querySelector('#tplPreview');
      var nameEl = el.querySelector('#tplPreviewName');
      var descEl = el.querySelector('#tplDesc');
      var ratingEl = el.querySelector('#tplRatingStars');

      if (nameEl) nameEl.textContent = tpl.name + ' · ' + (tpl.group || tpl.industry);
      if (descEl) descEl.innerHTML = '<i class="fa-solid fa-circle-info" style="color:#6366f1;margin-right:4px;"></i>' + tpl.desc;
      if (ratingEl) renderRatingStars(tpl.id, ratingEl);

      if (previewEl) {
        if (blocks.length === 0) {
          previewEl.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#94a3b8;font-size:12px;">' +
            '<i class="fa-solid fa-circle-info" style="font-size:24px;display:block;margin-bottom:8px;opacity:0.3;"></i>请先在「简历管理」上传简历或添加示例数据</div>';
        } else {
          previewEl.innerHTML = generateTemplateHTML(previewTpl, basicInfo, blocks, getPreviewOpts());
        }
      }

      // 更新模块管理器
      var mmEl = el.querySelector('#moduleManager');
      if (mmEl) {
        renderModuleManager(mmEl, state.sectionOrder, function(newOrder) {
          state.sectionOrder = newOrder;
          updatePreview(state.currentTpl);
        });
      }
    }

    function rebuildGrid() {
      var grid = el.querySelector('#tplGrid');
      if (!grid) return;
      var all = getAllTemplates();
      var filtered = filterTemplates(all, state.filterGroup, state.filterIndustry, state.filterStyle);
      var activeId = getActiveTemplateId();
      grid.innerHTML = filtered.map(function(tpl) {
        var isActive = tpl.id === activeId;
        var avg = getAvgRating(tpl.id);
        var stars = avg > 0 ? ('<span style="color:#f59e0b;font-size:9px;">' + '★'.repeat(Math.round(avg)) + '</span>') : '';
        return '<div class="tpl-card ' + (isActive ? 'tpl-active' : '') + '" data-tpl-id="' + tpl.id + '" style="padding:10px;border:1px solid ' + (isActive ? tpl.accentColor : '#1a1a26') + ';border-radius:8px;cursor:pointer;background:' + (isActive ? tpl.accentColor + '10' : '#0f0f17') + ';transition:all 0.12s;" title="' + (tpl.group || '') + ' · ' + (tpl.style || '') + '">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
            '<div style="width:8px;height:8px;border-radius:2px;background:' + tpl.accentColor + ';flex-shrink:0;"></div>' +
            '<span style="font-size:12px;font-weight:600;color:#e2e8f0;">' + tpl.name + '</span>' +
          '</div>' +
          '<div style="font-size:10px;color:#64748b;">' + tpl.industry + '</div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">' +
            '<span style="font-size:9px;color:#4a4a6a;">' + (tpl.group || '') + '</span>' +
            stars +
          '</div>' +
          (isActive ? '<div style="font-size:9px;color:' + tpl.accentColor + ';margin-top:2px;">当前使用中</div>' : '') +
        '</div>';
      }).join('');

      grid.querySelectorAll('.tpl-card').forEach(function(card) {
        card.addEventListener('click', function() {
          var tplId = this.getAttribute('data-tpl-id');
          var tpl = getAllTemplates().find(function(t) { return t.id === tplId; });
          if (!tpl) return;
          state.sectionOrder = (tpl.sectionOrder || ['work', 'project', 'education', 'skill']).slice();
          grid.querySelectorAll('.tpl-card').forEach(function(c) { c.classList.remove('tpl-active'); c.style.borderColor = '#1a1a26'; c.style.background = '#0f0f17'; });
          this.classList.add('tpl-active');
          this.style.borderColor = tpl.accentColor;
          this.style.background = tpl.accentColor + '10';
          updatePreview(tpl);
        });
      });
    }

    // 筛选标签事件
    el.querySelectorAll('[data-filter-group]').forEach(function(tag) {
      tag.addEventListener('click', function() {
        state.filterGroup = this.getAttribute('data-filter-group');
        el.querySelectorAll('[data-filter-group]').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        rebuildGrid();
      });
    });
    el.querySelectorAll('[data-filter-style]').forEach(function(tag) {
      tag.addEventListener('click', function() {
        state.filterStyle = this.getAttribute('data-filter-style');
        el.querySelectorAll('[data-filter-style]').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        rebuildGrid();
      });
    });

    // 颜色
    el.querySelectorAll('.tpl-color-dot').forEach(function(dot) {
      dot.addEventListener('click', function() {
        state.customColor = this.getAttribute('data-color');
        el.querySelectorAll('.tpl-color-dot').forEach(function(d) { d.style.borderColor = 'transparent'; });
        this.style.borderColor = '#fff';
        if (state.currentTpl) updatePreview(state.currentTpl);
      });
    });

    // 字号
    el.querySelectorAll('.font-size-tag').forEach(function(tag) {
      tag.addEventListener('click', function() {
        state.fontSize = parseInt(this.getAttribute('data-font-size'));
        el.querySelectorAll('.font-size-tag').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        if (state.currentTpl) updatePreview(state.currentTpl);
      });
    });

    // 行距
    el.querySelectorAll('.line-height-tag').forEach(function(tag) {
      tag.addEventListener('click', function() {
        state.lineHeight = parseFloat(this.getAttribute('data-line-height'));
        el.querySelectorAll('.line-height-tag').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        if (state.currentTpl) updatePreview(state.currentTpl);
      });
    });

    // 手机预览
    el.querySelector('#btnMobilePreview').addEventListener('click', function() {
      if (!state.currentTpl) { JN.showToast('请先选择一个模板', 'warning'); return; }
      if (blocks.length === 0) { JN.showToast('请先在简历管理中上传简历', 'warning'); return; }
      var previewTpl = Object.assign({}, state.currentTpl);
      if (state.customColor) previewTpl.accentColor = state.customColor;
      showMobilePreview(generateTemplateHTML(previewTpl, basicInfo, blocks, getPreviewOpts()));
    });

    // 应用模板
    el.querySelector('#btnApplyTemplate').addEventListener('click', function() {
      if (blocks.length === 0) { JN.showToast('请先在简历管理中上传简历', 'warning'); return; }
      if (!state.currentTpl) { JN.showToast('请先选择一个模板', 'warning'); return; }
      setActiveTemplateId(state.currentTpl.id);
      var previewTpl = Object.assign({}, state.currentTpl);
      if (state.customColor) previewTpl.accentColor = state.customColor;
      var resumeHtml = generateTemplateHTML(previewTpl, basicInfo, blocks, getPreviewOpts());
      try { localStorage.setItem('jobninja_tpl_preview', resumeHtml); } catch(_) {}
      JN.showToast('模板已应用！可在简历管理面板预览和导出PDF。', 'success');
      rebuildGrid();
    });

    // 导出PDF
    el.querySelector('#btnExportTplPDF').addEventListener('click', function() {
      if (!state.currentTpl) { JN.showToast('请先选择一个模板', 'warning'); return; }
      if (typeof html2pdf === 'undefined') { JN.showToast('html2pdf.js 未加载，请检查网络连接', 'error'); return; }
      var previewTpl = Object.assign({}, state.currentTpl);
      if (state.customColor) previewTpl.accentColor = state.customColor;
      var html = generateTemplateHTML(previewTpl, basicInfo, blocks, getPreviewOpts());
      var wrapper = document.createElement('div');
      wrapper.innerHTML = html; wrapper.style.width = '210mm';
      html2pdf().set({
        margin: [0,0,0,0], filename: 'JobNinja_简历_' + (basicInfo.name || '未命名') + '_' + state.currentTpl.name + '.pdf',
        image: { type: 'jpeg', quality: 0.95 }, html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(wrapper).save().catch(function(err) { JN.showToast('导出失败：' + (err.message || '请重试'), 'error'); });
    });

    // 导出JSON
    el.querySelector('#btnExportTplJSON').addEventListener('click', function() {
      if (!state.currentTpl) { JN.showToast('请先选择一个模板', 'warning'); return; }
      exportTemplateJSON(state.currentTpl, { customColor: state.customColor, fontSize: state.fontSize, lineHeight: state.lineHeight, sectionOrder: state.sectionOrder });
    });

    // 导入JSON
    el.querySelector('#importTplFile').addEventListener('change', function() {
      var file = this.files[0];
      if (!file) return;
      importTemplateJSON(file, function() { rebuildGrid(); });
      this.value = '';
    });

    // 初始化
    rebuildGrid();
    setTimeout(function() {
      var activeId = getActiveTemplateId();
      var activeTpl = getAllTemplates().find(function(t) { return t.id === activeId; });
      if (activeTpl) updatePreview(activeTpl);
    }, 100);

    return el;
  }

  JN.registerPanel({
    id: 'templates',
    title: '简历模板',
    icon: 'fa-palette',
    render: render,
    onActivate: function() {}
  });

})();
