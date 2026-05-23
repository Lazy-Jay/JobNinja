/**
 * JobNinja — template-community.js
 * 模板分享平台：社区模板、导出导入、评分评论、分类筛选
 * 纯本地，无需API
 */
(function () {
  if (!window.JobNinja) return;
  var JN = window.JobNinja;

  var STORAGE_RATINGS = 'jobninja_tpl_ratings';
  var STORAGE_IMPORTED = 'jobninja_imported_templates';

  // 社区模板库
  var COMMUNITY_TEMPLATES = [
    { id: 'community-ops', name: '互联网运营通用', category: '运营', audience: '社招', industry: '互联网',
      author: '社区贡献', stars: 4.5, downloads: 3280,
      desc: '适合新媒体运营、用户运营、内容运营。强调数据驱动和增长成果。',
      tips: '运营岗简历核心是「数据+案例」：每段经历必须包含增长数字。建议把公众号粉丝增长、活动转化率等数据前置。',
      color: '#f59e0b', layout: 'single', sectionOrder: ['work','project','skill','education'] },
    { id: 'community-designer', name: 'UI/UX设计作品型', category: '设计', audience: '社招', industry: '互联网',
      author: '设计社区', stars: 4.7, downloads: 2560,
      desc: '适合UI/UX设计师，侧边栏展示技能工具，主区域展示项目作品。',
      tips: '设计师简历重点：1）作品集链接放在最前面 2）每个项目标注你的角色和设计工具 3）量化设计成果（如"设计规范覆盖80%产品线"）。',
      color: '#ec4899', layout: 'sidebar', sectionOrder: ['project','work','skill','education'] },
    { id: 'community-pm', name: '产品经理数据版', category: '产品', audience: '社招', industry: '互联网',
      author: 'PM社区', stars: 4.4, downloads: 2890,
      desc: '适合B端/C端产品经理。突出需求分析、数据驱动决策、项目交付成果。',
      tips: '产品经理简历突出三点：1）你负责的产品DAU/GMV规模 2）你做的需求带来的数据变化 3）跨团队协作的项目管理能力。',
      color: '#8b5cf6', layout: 'single', sectionOrder: ['work','project','education','skill'] },
    { id: 'community-fresh', name: '应届生通用版', category: '通用', audience: '应届生', industry: '通用',
      author: '校招攻略', stars: 4.8, downloads: 5230,
      desc: '适合应届毕业生和实习生。教育背景优先，突出校园项目和实习经历。',
      tips: '应届生简历：1）教育背景放最前，标注GPA/排名（如果优秀） 2）实习经历比校园活动更重要 3）课程项目也可以当项目经历写，但要有成果。',
      color: '#10b981', layout: 'single', sectionOrder: ['education','project','work','skill'] },
    { id: 'community-sales', name: '销售/商务精英版', category: '销售', audience: '社招', industry: '通用',
      author: '销售管理圈', stars: 4.2, downloads: 1820,
      desc: '适合销售经理、商务拓展、大客户经理。以业绩数字为核心，突出客户资源和签单能力。',
      tips: '销售简历就是数字的游戏：年度/季度销售额、客户数量、客单价、回款率、排名（如"连续3季度团队TOP3"）。',
      color: '#dc2626', layout: 'single', sectionOrder: ['work','skill','education','project'] },
    { id: 'community-finance', name: '财务/审计专业版', category: '金融', audience: '社招', industry: '金融',
      author: '财会社区', stars: 4.3, downloads: 1450,
      desc: '适合财务、会计、审计、风控岗位。突出证书、合规经验和系统使用能力。',
      tips: '财务岗简历：1）证书放最前面（CPA/ACCA/中级会计）2）标注你使用过的财务系统（SAP/金蝶/用友）3）合规/审计项目经验很重要。',
      color: '#059669', layout: 'single', sectionOrder: ['work','education','skill','project'] },
    { id: 'community-edu', name: '教师/培训师版', category: '教育', audience: '社招', industry: '教育',
      author: '教育社区', stars: 4.1, downloads: 980,
      desc: '适合K12教师、培训师、课程设计师。突出教学成果、课程开发和学员反馈。',
      tips: '教育行业简历：1）教师资格证/学历放在显眼位置 2）教学成果用数据说话（提分率/通过率/学员数）3）课程开发能力是加分项。',
      color: '#65a30d', layout: 'single', sectionOrder: ['work','education','project','skill'] },
    { id: 'community-media', name: '新媒体/内容版', category: '传媒', audience: '社招', industry: '传媒',
      author: '内容创作者', stars: 4.4, downloads: 2100,
      desc: '适合新媒体编辑、内容运营、短视频编导。以作品和传播数据为核心。',
      tips: '新媒体简历：1）附上你的作品链接/账号 2）10w+爆款文章/视频要标出来 3）展示你对平台算法的理解和运营方法论。',
      color: '#d946ef', layout: 'sidebar', sectionOrder: ['project','work','skill','education'] },
    { id: 'community-career-change', name: '转行过渡版', category: '通用', audience: '转行', industry: '通用',
      author: '转行指南', stars: 4.6, downloads: 3120,
      desc: '适合跨行业转行的求职者。突出可迁移技能和学习能力，弱化原行业标签。',
      tips: '转行简历策略：1）提炼原行业中与新岗位相关的可迁移能力 2）补充自学/培训/项目经历证明新领域能力 3）用新行业的语言改写原经历。',
      color: '#6366f1', layout: 'single', sectionOrder: ['skill','project','work','education'] },
    { id: 'community-tech-lead', name: '技术管理版', category: '技术', audience: '社招', industry: '互联网',
      author: '技术社区', stars: 4.5, downloads: 1950,
      desc: '适合技术经理、架构师、Tech Lead。兼顾技术深度和团队管理能力。',
      tips: '技术管理简历：1）技术和管理分开写，不要混在一起 2）管理经历标注团队规模和业务范围 3）技术深度通过重点项目/专利/演讲来体现。',
      color: '#0ea5e9', layout: 'single', sectionOrder: ['work','project','skill','education'] }
  ];

  function loadRatings() { try { return JSON.parse(localStorage.getItem(STORAGE_RATINGS)) || {}; } catch (_) { return {}; } }
  function saveRatings(r) { localStorage.setItem(STORAGE_RATINGS, JSON.stringify(r)); }
  function loadImported() { try { return JSON.parse(localStorage.getItem(STORAGE_IMPORTED)) || []; } catch (_) { return []; } }
  function saveImported(list) { localStorage.setItem(STORAGE_IMPORTED, JSON.stringify(list)); }

  function getAllTemplates() {
    return COMMUNITY_TEMPLATES.concat(loadImported());
  }

  function render() {
    var el = document.createElement('div');
    var ratings = loadRatings();
    var imported = loadImported();

    el.innerHTML =
      '<div style="margin-bottom:16px;">' +
        '<h2 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">' +
          '<i class="fa-solid fa-users" style="color:#a78bfa;margin-right:8px;"></i>模板社区' +
        '</h2>' +
        '<p style="font-size:13px;color:#64748b;margin:0;">社区模板 · 评分评论 · 分享导入 · ' + COMMUNITY_TEMPLATES.length + '+内置模板</p>' +
      '</div>' +

      // 分类筛选 + 导入导出按钮
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
        '<select id="tcFilterCat" class="ninja-input" style="font-size:11px;padding:5px 10px;width:auto;">' +
          '<option value="">全部行业</option>' +
          '<option value="互联网">互联网</option><option value="运营">运营</option><option value="设计">设计</option>' +
          '<option value="产品">产品</option><option value="金融">金融</option><option value="教育">教育</option>' +
          '<option value="传媒">传媒</option><option value="销售">销售</option><option value="技术">技术</option>' +
          '<option value="通用">通用</option>' +
        '</select>' +
        '<select id="tcFilterAud" class="ninja-input" style="font-size:11px;padding:5px 10px;width:auto;">' +
          '<option value="">全部人群</option>' +
          '<option value="应届生">应届生</option><option value="社招">社招</option><option value="转行">转行</option>' +
        '</select>' +
        '<div style="flex:1;"></div>' +
        '<button id="btnExportTpl" class="btn btn-outline" style="font-size:11px;">' +
          '<i class="fa-solid fa-file-export"></i> 导出模板</button>' +
        '<button id="btnImportTpl" class="btn btn-outline" style="font-size:11px;">' +
          '<i class="fa-solid fa-file-import"></i> 导入模板</button>' +
        '<input type="file" id="tcFileInput" accept=".json,.jntemplate" style="display:none;">' +
      '</div>' +

      // 模板列表
      '<div id="tcTemplateList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;margin-bottom:14px;">' +
        renderTemplateCards(getAllTemplates(), ratings, '') +
      '</div>' +

      // 导入的模板管理
      (imported.length > 0 ?
        '<div class="panel-card" style="margin-bottom:12px;">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' +
            '<i class="fa-solid fa-folder-open" style="color:#f59e0b;"></i>' +
            '<span style="font-size:12px;font-weight:600;color:#d1d5db;">我导入的模板 (' + imported.length + ')</span>' +
          '</div>' +
          '<div id="tcImportedList" style="display:flex;flex-wrap:wrap;gap:6px;">' +
            imported.map(function(t, i) {
              return '<div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;font-size:11px;">' +
                '<span style="color:#d1d5db;">' + (t.name || '未命名') + '</span>' +
                '<span style="color:#4a4a6a;">' + (t.category || '') + '</span>' +
                '<button class="tc-imported-use" data-idx="' + i + '" style="font-size:9px;padding:2px 6px;background:#1e1e32;border:1px solid #312e81;border-radius:3px;color:#a5b4fc;cursor:pointer;">使用</button>' +
                '<button class="tc-imported-del" data-idx="' + i + '" style="font-size:9px;padding:1px 4px;background:transparent;border:none;color:#4a4a6a;cursor:pointer;">&times;</button>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' : '') +

      '<div style="font-size:10px;color:#252536;text-align:right;">模板数据存储在本地浏览器，分享通过导出JSON文件实现</div>';

    // 筛选事件
    el.querySelector('#tcFilterCat').addEventListener('change', function() { refreshCards(el); });
    el.querySelector('#tcFilterAud').addEventListener('change', function() { refreshCards(el); });

    // 导出模板
    el.querySelector('#btnExportTpl').addEventListener('click', function() {
      var activeId = (function() { try { return localStorage.getItem('jobninja_active_template') || ''; } catch(_) { return ''; } })();
      var allTpls = (function() {
        if (typeof TEMPLATES !== 'undefined') return TEMPLATES;
        try { return JSON.parse(localStorage.getItem('jobninja_custom_templates')) || []; } catch(_) { return []; }
      })();
      var tpl = COMMUNITY_TEMPLATES.concat(imported).find(function(t) { return t.id === activeId; });
      if (!tpl && allTpls.length === 0) { JN.showToast('暂无可导出的模板', 'warning'); return; }
      var exportData = tpl || allTpls[0];
      var json = JSON.stringify({ type: 'jntemplate', version: '1.0', template: exportData, exportedAt: new Date().toISOString() }, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'JobNinja_模板_' + (exportData.name || '未命名') + '.jntemplate.json';
      a.click();
      URL.revokeObjectURL(url);
      JN.showToast('模板已导出，可分享给他人导入使用', 'success');
    });

    // 导入模板
    el.querySelector('#btnImportTpl').addEventListener('click', function() { el.querySelector('#tcFileInput').click(); });
    el.querySelector('#tcFileInput').addEventListener('change', function() {
      var file = this.files && this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var data = JSON.parse(e.target.result);
          if (data.type !== 'jntemplate' || !data.template) throw new Error('格式不正确');
          var tpl = data.template;
          if (!tpl.name) throw new Error('模板缺少名称');
          var imported = loadImported();
          // 去重
          if (imported.some(function(t) { return t.name === tpl.name; })) {
            JN.showToast('该模板已导入过', 'info'); return;
          }
          tpl.id = 'imported_' + Date.now().toString(36);
          tpl.importedAt = new Date().toISOString();
          imported.unshift(tpl);
          if (imported.length > 30) imported = imported.slice(0, 30);
          saveImported(imported);
          JN.showToast('模板「' + tpl.name + '」导入成功！可在列表中查看使用', 'success');
          // 刷新当前面板
          JN.switchPanel('templatecommunity');
        } catch(err) {
          JN.showToast('导入失败：' + (err.message || '文件格式不正确'), 'error');
        }
      };
      reader.readAsText(file);
      this.value = '';
    });

    // 委托事件：评分、评论、使用模板
    el.addEventListener('click', function(e) {
      handleCardClick(e, el);
    });

    return el;
  }

  function renderTemplateCards(templates, ratings, filterCat, filterAud) {
    var filtered = templates;
    if (filterCat) filtered = filtered.filter(function(t) { return t.category === filterCat || t.industry === filterCat; });
    if (filterAud) filtered = filtered.filter(function(t) { return t.audience === filterAud; });

    if (filtered.length === 0) {
      return '<div style="text-align:center;padding:40px;color:#4a4a6a;font-size:12px;grid-column:1/-1;">没有匹配的模板</div>';
    }

    return filtered.map(function(tpl) {
      var r = ratings[tpl.id] || {};
      var avgStars = r.avgStars || tpl.stars || 0;
      var commentCount = (r.comments || []).length;
      var starHtml = '';
      for (var s = 1; s <= 5; s++) {
        starHtml += '<i class="fa-solid fa-star tc-star" data-tpl="' + tpl.id + '" data-star="' + s + '" style="font-size:11px;color:' + (s <= Math.round(avgStars) ? '#f59e0b' : '#252536') + ';cursor:pointer;margin-right:1px;"></i>';
      }

      return '<div class="panel-card" style="padding:12px;transition:border-color 0.12s;"' +
        ' onmouseenter="this.style.borderColor=\'' + (tpl.color || '#6366f1') + '40\'"' +
        ' onmouseleave="this.style.borderColor=\'#1a1a26\'">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">' +
              '<span style="font-size:13px;font-weight:600;color:#e2e8f0;">' + tpl.name + '</span>' +
              (tpl.audience ? '<span style="font-size:9px;padding:1px 5px;background:#1a1a26;color:#4a4a6a;border-radius:3px;">' + tpl.audience + '</span>' : '') +
            '</div>' +
            '<div style="font-size:10px;color:#4a4a6a;">' + (tpl.category || tpl.industry || '') + ' · ' + (tpl.author || '') +
              (tpl.downloads ? ' · ' + tpl.downloads + '次使用' : '') + '</div>' +
          '</div>' +
        '</div>' +
        '<p style="font-size:11px;color:#94a3b8;line-height:1.5;margin:0 0 8px;">' + tpl.desc + '</p>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
          '<div style="display:flex;">' + starHtml + '</div>' +
          '<span style="font-size:10px;color:#4a4a6a;">' + (commentCount > 0 ? '(' + commentCount + ')' : '') + '</span>' +
        '</div>' +
        (tpl.tips ? '<div style="padding:6px 8px;background:#0f1a1a;border:1px solid #1a2a2a;border-radius:4px;font-size:10px;color:#6ee7b7;line-height:1.4;margin-bottom:6px;">' +
          '<i class="fa-solid fa-lightbulb" style="color:#f59e0b;margin-right:4px;"></i>' + tpl.tips + '</div>' : '') +
        '<div style="display:flex;gap:4px;">' +
          '<button class="tc-use-btn" data-tpl="' + tpl.id + '" style="font-size:10px;padding:3px 10px;background:' + (tpl.color || '#6366f1') + ';border:none;border-radius:4px;color:#fff;cursor:pointer;">使用此模板</button>' +
          '<button class="tc-comment-btn" data-tpl="' + tpl.id + '" style="font-size:10px;padding:3px 8px;background:transparent;border:1px solid #1a1a26;border-radius:4px;color:#4a4a6a;cursor:pointer;">评论</button>' +
          '<button class="tc-export-btn" data-tpl="' + tpl.id + '" style="font-size:10px;padding:3px 8px;background:transparent;border:1px solid #1a1a26;border-radius:4px;color:#4a4a6a;cursor:pointer;">导出</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function refreshCards(el) {
    var cat = el.querySelector('#tcFilterCat').value;
    var aud = el.querySelector('#tcFilterAud').value;
    var list = el.querySelector('#tcTemplateList');
    if (list) list.innerHTML = renderTemplateCards(getAllTemplates(), loadRatings(), cat, aud);
    // 重新渲染导入列表
    var imported = loadImported();
    var importedDiv = el.querySelector('#tcImportedList');
    if (importedDiv) {
      importedDiv.innerHTML = imported.length === 0 ? '' : imported.map(function(t, i) {
        return '<div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;font-size:11px;">' +
          '<span style="color:#d1d5db;">' + (t.name || '未命名') + '</span>' +
          '<span style="color:#4a4a6a;">' + (t.category || '') + '</span>' +
          '<button class="tc-imported-use" data-idx="' + i + '" style="font-size:9px;padding:2px 6px;background:#1e1e32;border:1px solid #312e81;border-radius:3px;color:#a5b4fc;cursor:pointer;">使用</button>' +
          '<button class="tc-imported-del" data-idx="' + i + '" style="font-size:9px;padding:1px 4px;background:transparent;border:none;color:#4a4a6a;cursor:pointer;">&times;</button>' +
        '</div>';
      }).join('');
    }
  }

  function handleCardClick(e, el) {
    // 星星评分
    var star = e.target.closest('.tc-star');
    if (star) {
      var tplId = star.getAttribute('data-tpl');
      var starVal = parseInt(star.getAttribute('data-star'));
      var ratings = loadRatings();
      if (!ratings[tplId]) ratings[tplId] = { avgStars: 0, totalVotes: 0, comments: [] };
      var r = ratings[tplId];
      r.avgStars = Math.round(((r.avgStars * r.totalVotes) + starVal) / (r.totalVotes + 1) * 10) / 10;
      r.totalVotes++;
      saveRatings(ratings);
      JN.showToast('已评分 ' + starVal + ' 星', 'info');
      refreshCards(el);
      return;
    }
    // 使用模板
    var useBtn = e.target.closest('.tc-use-btn');
    if (useBtn) {
      var tplId2 = useBtn.getAttribute('data-tpl');
      var tpl = getAllTemplates().find(function(t) { return t.id === tplId2; });
      if (tpl) {
        try { localStorage.setItem('jobninja_active_template', tpl.id); } catch(_) {}
        try { localStorage.setItem('jobninja_community_tpl', JSON.stringify(tpl)); } catch(_) {}
        JN.showToast('模板「' + tpl.name + '」已应用！可在简历模板面板和简历管理中使用', 'success');
      }
      return;
    }
    // 评论
    var commentBtn = e.target.closest('.tc-comment-btn');
    if (commentBtn) {
      var tplId3 = commentBtn.getAttribute('data-tpl');
      var tpl2 = getAllTemplates().find(function(t) { return t.id === tplId3; });
      if (tpl2) showCommentModal(tpl2, el);
      return;
    }
    // 导出单个模板
    var exportBtn = e.target.closest('.tc-export-btn');
    if (exportBtn) {
      var tplId4 = exportBtn.getAttribute('data-tpl');
      var tpl3 = getAllTemplates().find(function(t) { return t.id === tplId4; });
      if (tpl3) {
        var json = JSON.stringify({ type: 'jntemplate', version: '1.0', template: tpl3, exportedAt: new Date().toISOString() }, null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = 'JobNinja_模板_' + (tpl3.name || '未命名') + '.jntemplate.json';
        a.click(); URL.revokeObjectURL(url);
        JN.showToast('模板已导出', 'success');
      }
      return;
    }
    // 导入模板使用
    var impUse = e.target.closest('.tc-imported-use');
    if (impUse) {
      var idx = parseInt(impUse.getAttribute('data-idx'));
      var imported = loadImported();
      var tpl4 = imported[idx];
      if (tpl4) {
        try { localStorage.setItem('jobninja_active_template', tpl4.id); } catch(_) {}
        try { localStorage.setItem('jobninja_community_tpl', JSON.stringify(tpl4)); } catch(_) {}
        JN.showToast('模板「' + tpl4.name + '」已应用！', 'success');
      }
      return;
    }
    // 删除导入模板
    var impDel = e.target.closest('.tc-imported-del');
    if (impDel) {
      var idx2 = parseInt(impDel.getAttribute('data-idx'));
      var imp2 = loadImported();
      imp2.splice(idx2, 1); saveImported(imp2);
      refreshCards(el);
      return;
    }
  }

  function showCommentModal(tpl, el) {
    var ratings = loadRatings();
    if (!ratings[tpl.id]) ratings[tpl.id] = { avgStars: 0, totalVotes: 0, comments: [] };
    var r = ratings[tpl.id];

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;padding:18px;width:90%;max-width:440px;max-height:80vh;overflow-y:auto;">' +
        '<h4 style="font-size:14px;color:#e2e8f0;margin:0 0 4px;">' + tpl.name + '</h4>' +
        '<p style="font-size:10px;color:#64748b;margin:0 0 10px;">' + (r.comments.length || 0) + '条评论 · 评分 ' + r.avgStars + '/5</p>' +
        // 评论列表
        '<div style="max-height:200px;overflow-y:auto;margin-bottom:10px;" class="custom-scrollbar">' +
          (r.comments.length === 0 ? '<div style="text-align:center;padding:20px;color:#4a4a6a;font-size:11px;">暂无评论</div>' :
            r.comments.map(function(c) {
              return '<div style="padding:6px 8px;margin-bottom:4px;background:#0f0f17;border-radius:6px;font-size:11px;">' +
                '<div style="color:#d1d5db;">' + c.text + '</div>' +
                '<div style="color:#4a4a6a;font-size:9px;">' + (c.date || '') + '</div></div>';
            }).join('')) +
        '</div>' +
        '<textarea id="tcCommentInput" class="ninja-input" rows="3" placeholder="写下你的评价..." style="font-size:11px;"></textarea>' +
        '<div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px;">' +
          '<button id="tcCommentCancel" class="btn btn-outline" style="font-size:11px;">取消</button>' +
          '<button id="tcCommentSave" class="btn btn-primary" style="font-size:11px;">发表评论</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('#tcCommentCancel').addEventListener('click', function() { document.body.removeChild(overlay); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
    overlay.querySelector('#tcCommentSave').addEventListener('click', function() {
      var text = overlay.querySelector('#tcCommentInput').value.trim();
      if (!text) { JN.showToast('请输入评论内容', 'warning'); return; }
      r.comments.push({ text: text, date: new Date().toISOString().slice(0, 10) });
      if (r.comments.length > 100) r.comments = r.comments.slice(-100);
      saveRatings(ratings);
      document.body.removeChild(overlay);
      JN.showToast('评论已保存（仅存储于本地）', 'success');
      refreshCards(el);
    });
  }

  JN.registerPanel({
    id: 'templatecommunity',
    title: '模板社区',
    icon: 'fa-users',
    render: render,
    onActivate: function() {}
  });

})();
