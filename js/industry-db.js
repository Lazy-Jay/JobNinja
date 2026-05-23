/**
 * JobNinja — industry-db.js
 * 行业信息库：薪资数据、技能要求、发展趋势、代表公司、行业对比
 * 纯本地，无需API
 */
(function () {
  if (!window.JobNinja) return;
  var JN = window.JobNinja;

  var STORAGE_INDUSTRY_EDITS = 'jobninja_industry_edits';

  // 行业数据库
  var INDUSTRIES = {
    '互联网/IT': {
      icon: 'fa-globe', color: '#6366f1',
      salaryRanges: { '北京': '15-60K', '上海': '15-55K', '深圳': '15-55K', '杭州': '14-50K', '成都': '12-40K', 'default': '10-45K' },
      coreSkills: ['编程语言(Java/Python/Go/JS)','系统设计','数据结构与算法','数据库','云计算','AI/机器学习'],
      trends: 'AI大模型应用爆发、云原生成为标配、远程办公普及、安全合规要求提升。2026年AI工程师、Rust开发者需求增长最快。',
      topCompanies: ['阿里巴巴','腾讯','字节跳动','百度','美团','华为','京东','拼多多','小红书','蚂蚁集团']
    },
    '电商/新零售': {
      icon: 'fa-cart-shopping', color: '#f59e0b',
      salaryRanges: { '杭州': '12-45K', '上海': '13-50K', '广州': '10-40K', '深圳': '12-45K', 'default': '8-35K' },
      coreSkills: ['电商运营','供应链管理','直播运营','数据分析','用户增长','跨境电商'],
      trends: '直播电商持续增长、跨境电商高速发展、AI个性化推荐提升、即时零售崛起。运营岗越来越需要数据分析和AI工具使用能力。',
      topCompanies: ['阿里巴巴','京东','拼多多','抖音电商','快手电商','美团','SHEIN','Temu','得物','唯品会']
    },
    '金融/投资': {
      icon: 'fa-chart-line', color: '#10b981',
      salaryRanges: { '北京': '15-70K', '上海': '15-65K', '深圳': '14-60K', '香港': '25-100K', 'default': '10-50K' },
      coreSkills: ['金融分析','风险管理','CFA/FRM/CPA','Python/R','量化分析','合规监管'],
      trends: 'FinTech跨界融合加速、数字货币/区块链金融化、AI投顾及量化交易兴起、绿色金融/ESG投资成为新方向。',
      topCompanies: ['中金公司','中信证券','华泰证券','招商银行','蚂蚁集团','微众银行','东方财富','富途','老虎证券']
    },
    '教育/培训': {
      icon: 'fa-graduation-cap', color: '#65a30d',
      salaryRanges: { '北京': '10-35K', '上海': '10-32K', '广州': '8-28K', '深圳': '10-30K', 'default': '6-25K' },
      coreSkills: ['课程设计','教学能力','AI教育应用','学员管理','内容创作','在线直播'],
      trends: 'AI个性化教育爆发、职业教育/技能培训需求旺盛、OMO(线上线下融合)成为主流、素质教育/STEAM教育持续发展。',
      topCompanies: ['好未来','新东方','高途','作业帮','网易有道','猿辅导','粉笔教育','得到','知乎']
    },
    '医疗/健康': {
      icon: 'fa-heart-pulse', color: '#ef4444',
      salaryRanges: { '北京': '12-45K', '上海': '12-42K', '广州': '10-38K', '深圳': '12-40K', 'default': '8-30K' },
      coreSkills: ['临床医学/药学','AI辅助诊断','医疗影像','生物技术','合规','临床试验'],
      trends: 'AI+医疗成为投资热点、远程医疗普及、精准医疗/基因治疗突破、老龄化催生养老健康产业、医疗大模型应用加速。',
      topCompanies: ['联影医疗','迈瑞医疗','药明康德','恒瑞医药','百济神州','微医','丁香园','京东健康','阿里健康']
    },
    '制造/工程': {
      icon: 'fa-industry', color: '#475569',
      salaryRanges: { '深圳': '12-40K', '苏州': '10-35K', '东莞': '8-30K', '上海': '12-38K', 'default': '7-30K' },
      coreSkills: ['自动化/PLC','工业互联网','质量管理(六西格玛)','供应链管理','CAD/CAE','IoT'],
      trends: '智能制造/工业4.0加速、AI质检/预测性维护应用、新能源汽车产业链、工业机器人、数字孪生技术。',
      topCompanies: ['华为(制造)','比亚迪','大疆','富士康','宁德时代','三一重工','徐工','海尔智家','美的集团']
    },
    '咨询/服务': {
      icon: 'fa-building', color: '#0891b2',
      salaryRanges: { '北京': '15-55K', '上海': '15-50K', '深圳': '12-45K', '广州': '10-40K', 'default': '8-35K' },
      coreSkills: ['战略分析','PPT/报告撰写','数据分析','项目管理','沟通表达能力','行业研究'],
      trends: '数字化转型咨询需求旺盛、AI战略咨询新兴、ESG/碳中和咨询增长、精品化/行业化咨询趋势明显。',
      topCompanies: ['麦肯锡','波士顿咨询','贝恩','德勤','普华永道','安永','毕马威','埃森哲']
    },
    '传媒/文化': {
      icon: 'fa-newspaper', color: '#d946ef',
      salaryRanges: { '北京': '10-35K', '上海': '10-32K', '杭州': '8-28K', '广州': '8-28K', 'default': '6-25K' },
      coreSkills: ['内容创作','视频剪辑','社交媒体运营','数据分析','直播互动','IP运营'],
      trends: '短视频/直播仍是流量核心、AI内容生成(AIGC)冲击传统内容生产、知识付费/IP变现成熟、出海内容成为新增量。',
      topCompanies: ['字节跳动','快手','B站','小红书','芒果TV','爱奇艺','腾讯视频','网易云音乐']
    },
    '房地产/建筑': {
      icon: 'fa-house', color: '#b45309',
      salaryRanges: { '北京': '10-35K', '上海': '10-32K', '深圳': '10-35K', '广州': '8-28K', 'default': '6-25K' },
      coreSkills: ['项目管理','BIM技术','工程造价','绿色建筑/LEED','商业运营','投资分析'],
      trends: '行业转型期，商业运营/资产管理岗位需求上升、绿色建筑/碳中和建筑成为新方向、城市更新/存量改造是主要增长点。',
      topCompanies: ['万科','保利','华润置地','龙湖','碧桂园','绿城','中海地产','招商蛇口']
    },
    '物流/供应链': {
      icon: 'fa-truck-fast', color: '#0284c7',
      salaryRanges: { '上海': '10-35K', '深圳': '10-32K', '广州': '8-28K', '杭州': '10-30K', 'default': '6-25K' },
      coreSkills: ['供应链规划','库存管理','物流IT系统','跨境物流','数据分析','仓储自动化'],
      trends: '智慧物流/无人配送加速、跨境电商物流需求爆发、供应链韧性成为企业核心关注、AI路径优化/需求预测普及。',
      topCompanies: ['顺丰','京东物流','菜鸟','中通','圆通','极兔','满帮','货拉拉']
    }
  };

  function loadEdits() { try { return JSON.parse(localStorage.getItem(STORAGE_INDUSTRY_EDITS)) || {}; } catch (_) { return {}; } }
  function saveEdits(e) { localStorage.setItem(STORAGE_INDUSTRY_EDITS, JSON.stringify(e)); }

  function getIndustryData(key) {
    var edits = loadEdits();
    var base = INDUSTRIES[key] || {};
    if (edits[key]) {
      for (var k in edits[key]) {
        if (typeof edits[key][k] === 'object') base[k] = Object.assign({}, base[k], edits[key][k]);
        else base[k] = edits[key][k];
      }
    }
    return base;
  }

  function render() {
    var el = document.createElement('div');
    var edits = loadEdits();

    el.innerHTML =
      '<div style="margin-bottom:16px;">' +
        '<h2 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">' +
          '<i class="fa-solid fa-database" style="color:#06b6d4;margin-right:8px;"></i>行业信息库' +
        '</h2>' +
        '<p style="font-size:13px;color:#64748b;margin:0;">' + Object.keys(INDUSTRIES).length + '大行业数据 · 薪资/技能/趋势/公司 · 行业对比</p>' +
      '</div>' +

      // 行业对比栏
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
        '<span style="font-size:11px;color:#64748b;">对比行业：</span>' +
        '<select id="idCompare1" class="ninja-input" style="font-size:11px;padding:5px 10px;width:auto;">' +
          '<option value="">选择行业</option>' +
          Object.keys(INDUSTRIES).map(function(k) { return '<option value="' + k + '">' + k + '</option>'; }).join('') +
        '</select>' +
        '<span style="font-size:11px;color:#4a4a6a;">VS</span>' +
        '<select id="idCompare2" class="ninja-input" style="font-size:11px;padding:5px 10px;width:auto;">' +
          '<option value="">选择行业</option>' +
          Object.keys(INDUSTRIES).map(function(k) { return '<option value="' + k + '">' + k + '</option>'; }).join('') +
        '</select>' +
        '<button id="btnCompare" class="btn btn-outline" style="font-size:11px;">开始对比</button>' +
      '</div>' +

      // 对比结果区
      '<div id="idCompareResult" style="display:none;margin-bottom:14px;"></div>' +

      // 行业卡片网格
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px;">' +
        Object.keys(INDUSTRIES).map(function(key) {
          var d = getIndustryData(key);
          var hasEdits = edits[key];
          return '<div class="panel-card" style="padding:14px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
              '<div style="width:32px;height:32px;border-radius:8px;background:' + d.color + '15;display:flex;align-items:center;justify-content:center;">' +
                '<i class="fa-solid ' + d.icon + '" style="color:' + d.color + ';"></i>' +
              '</div>' +
              '<div>' +
                '<span style="font-size:13px;font-weight:600;color:#e2e8f0;">' + key + '</span>' +
                (hasEdits ? '<span style="font-size:9px;color:#34d399;margin-left:4px;">已编辑</span>' : '') +
              '</div>' +
            '</div>' +
            '<div style="font-size:10px;color:#64748b;margin-bottom:4px;">参考薪资（北京）：' + (d.salaryRanges['北京'] || d.salaryRanges['default'] || '-') + '</div>' +
            '<div style="font-size:10px;color:#64748b;margin-bottom:6px;">核心技能：' + (d.coreSkills||[]).slice(0,4).join('、') + '</div>' +
            '<div style="font-size:10px;color:#94a3b8;line-height:1.5;margin-bottom:6px;">' + (d.trends||'').substring(0,80) + '...</div>' +
            '<div style="display:flex;gap:4px;">' +
              '<button class="id-edit-btn" data-ind="' + key + '" style="font-size:9px;padding:2px 8px;background:#1e1e32;border:1px solid #312e81;border-radius:3px;color:#a5b4fc;cursor:pointer;">补充/修改</button>' +
              '<button class="id-match-btn" data-ind="' + key + '" style="font-size:9px;padding:2px 8px;background:transparent;border:1px solid #1a1a26;border-radius:3px;color:#4a4a6a;cursor:pointer;">岗位匹配</button>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +

      '<div style="font-size:10px;color:#252536;text-align:right;margin-top:8px;">行业数据定期更新 | 可手动补充修改</div>';

    // 对比按钮
    el.querySelector('#btnCompare').addEventListener('click', function() {
      var k1 = el.querySelector('#idCompare1').value;
      var k2 = el.querySelector('#idCompare2').value;
      if (!k1 || !k2) { JN.showToast('请选择两个行业', 'warning'); return; }
      if (k1 === k2) { JN.showToast('请选择不同的行业', 'warning'); return; }
      var d1 = getIndustryData(k1), d2 = getIndustryData(k2);
      var resultEl = el.querySelector('#idCompareResult');
      resultEl.style.display = 'block';
      resultEl.innerHTML =
        '<div class="panel-card" style="border-color:#312e81;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<i class="fa-solid fa-code-compare" style="color:#a5b4fc;"></i>' +
            '<span style="font-size:12px;font-weight:600;color:#d1d5db;">行业对比：' + k1 + ' VS ' + k2 + '</span>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
            compareCol(k1, d1) + compareCol(k2, d2) +
          '</div>' +
        '</div>';
    });

    // 编辑按钮
    el.addEventListener('click', function(e) {
      var editBtn = e.target.closest('.id-edit-btn');
      if (editBtn) {
        var key = editBtn.getAttribute('data-ind');
        showEditModal(key, el);
        return;
      }
      var matchBtn = e.target.closest('.id-match-btn');
      if (matchBtn) {
        var key2 = matchBtn.getAttribute('data-ind');
        showMatchAdvice(key2);
        return;
      }
    });

    return el;
  }

  function compareCol(name, data) {
    return '<div>' +
      '<h4 style="font-size:13px;color:' + (data.color||'#fff') + ';margin:0 0 8px;">' + name + '</h4>' +
      '<div style="font-size:10px;color:#94a3b8;line-height:1.6;">' +
        '<div style="margin-bottom:4px;"><span style="color:#64748b;">薪资(北京)：</span>' + (data.salaryRanges['北京']||data.salaryRanges['default']||'-') + '</div>' +
        '<div style="margin-bottom:4px;"><span style="color:#64748b;">核心技能：</span>' + (data.coreSkills||[]).slice(0,4).join('、') + '</div>' +
        '<div style="margin-bottom:4px;"><span style="color:#64748b;">趋势：</span>' + (data.trends||'').substring(0,100) + '...</div>' +
        '<div><span style="color:#64748b;">代表公司：</span>' + (data.topCompanies||[]).slice(0,5).join('、') + '</div>' +
      '</div>' +
    '</div>';
  }

  function showEditModal(key, el) {
    var d = getIndustryData(key);
    var edits = loadEdits();
    var currentEdits = edits[key] || {};

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;padding:18px;width:90%;max-width:480px;max-height:85vh;overflow-y:auto;">' +
        '<h4 style="font-size:14px;color:#e2e8f0;margin:0 0 4px;">补充/修改：' + key + '</h4>' +
        '<p style="font-size:10px;color:#4a4a6a;margin:0 0 10px;">修改仅保存在本地，不会影响内置数据</p>' +
        '<div style="margin-bottom:8px;">' +
          '<label style="font-size:10px;color:#64748b;">补充趋势信息</label>' +
          '<textarea id="idEditTrends" class="ninja-input" rows="3" style="font-size:11px;">' + (currentEdits.trends || d.trends || '') + '</textarea>' +
        '</div>' +
        '<div style="margin-bottom:8px;">' +
          '<label style="font-size:10px;color:#64748b;">补充核心技能（逗号分隔）</label>' +
          '<input id="idEditSkills" class="ninja-input" style="font-size:11px;" value="' + (currentEdits.coreSkills || (d.coreSkills||[]).join('、')) + '">' +
        '</div>' +
        '<div style="display:flex;gap:6px;justify-content:flex-end;">' +
          '<button id="idEditCancel" class="btn btn-outline" style="font-size:12px;">取消</button>' +
          '<button id="idEditSave" class="btn btn-primary" style="font-size:12px;">保存</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('#idEditCancel').addEventListener('click', function() { document.body.removeChild(overlay); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
    overlay.querySelector('#idEditSave').addEventListener('click', function() {
      var edits2 = loadEdits();
      if (!edits2[key]) edits2[key] = {};
      edits2[key].trends = overlay.querySelector('#idEditTrends').value.trim() || d.trends;
      edits2[key].coreSkills = overlay.querySelector('#idEditSkills').value.split(/[,，、]/).map(function(s){return s.trim();}).filter(Boolean);
      saveEdits(edits2);
      document.body.removeChild(overlay);
      JN.showToast('数据已保存到本地', 'success');
      JN.switchPanel('industrydb');
    });
  }

  function showMatchAdvice(key) {
    var d = getIndustryData(key);
    try {
      var blocks = JSON.parse(localStorage.getItem('jobninja_blocks')) || [];
      var resumeSkills = [];
      blocks.forEach(function(b) { if (b.tags) resumeSkills = resumeSkills.concat(b.tags); });
      resumeSkills = resumeSkills.filter(function(v,i,a) { return a.indexOf(v)===i; });

      var industrySkills = d.coreSkills || [];
      var matched = industrySkills.filter(function(s) { return resumeSkills.some(function(rs) { return rs.toLowerCase().indexOf(s.toLowerCase()) !== -1 || s.toLowerCase().indexOf(rs.toLowerCase()) !== -1; }); });
      var matchRate = industrySkills.length > 0 ? Math.round((matched.length / industrySkills.length) * 100) : 0;

      var msg = '【' + key + '行业岗位匹配】\n\n';
      msg += '技能匹配度：' + matchRate + '%\n';
      msg += '已匹配技能：' + (matched.length > 0 ? matched.join('、') : '无') + '\n';
      msg += '建议补充：' + (industrySkills.filter(function(s) { return matched.indexOf(s) === -1; }).join('、') || '无');
      msg += '\n\n参考薪资（北京）：' + (d.salaryRanges['北京'] || d.salaryRanges['default'] || '-');
      msg += '\n代表公司：' + (d.topCompanies||[]).slice(0,5).join('、');

      alert(msg);
    } catch(_) { JN.showToast('请先上传简历以进行匹配分析', 'warning'); }
  }

  JN.registerPanel({
    id: 'industrydb',
    title: '行业信息',
    icon: 'fa-database',
    render: render,
    onActivate: function() {}
  });

})();
