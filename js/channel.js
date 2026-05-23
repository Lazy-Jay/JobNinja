/**
 * JobNinja — channel.js
 * 渠道推荐引擎 + 官网直达 + 内推模拟
 * 纯规则驱动，基于经验年限、岗位类型、薪资档位推荐最优投递渠道
 */
(function () {
  if (!window.JobNinja) return;

  var JN = window.JobNinja;

  // ================================================================
  //  渠道数据库
  // ================================================================

  var CHANNELS = {
    liepin:    { name: '猎聘',      icon: 'fa-bullseye',    color: '#f59e0b', url: 'https://www.liepin.com',     tags: ['中高端', '猎头', '高薪'] },
    maimai:    { name: '脉脉',      icon: 'fa-share-nodes', color: '#3b82f6', url: 'https://maimai.cn',          tags: ['人脉', '内推', '社交招聘'] },
    linkedin:  { name: 'LinkedIn',  icon: 'fa-linkedin',    color: '#0a66c2', url: 'https://www.linkedin.com',   tags: ['外企', '国际化', '高端'] },
    zhilian:   { name: '智联招聘',  icon: 'fa-building',    color: '#06b6d4', url: 'https://www.zhaopin.com',    tags: ['综合', '传统企业', '应届生'] },
    yjs:       { name: '应届生求职网', icon: 'fa-graduation-cap', color: '#10b981', url: 'https://www.yingjiesheng.com', tags: ['应届生', '校招', '实习'] },
    school:    { name: '学校就业网', icon: 'fa-school',     color: '#84cc16', url: '',                             tags: ['校招', '宣讲会', '定向'] },
    boss:      { name: 'BOSS直聘',  icon: 'fa-bolt',        color: '#6366f1', url: 'https://www.zhipin.com',     tags: ['互联网', '快速', '直聊'] },
    lagou:     { name: '拉勾',      icon: 'fa-laptop-code', color: '#8b5cf6', url: 'https://www.lagou.com',      tags: ['互联网', '技术', '创业'] },
    neitui:    { name: '内推',      icon: 'fa-handshake',   color: '#ec4899', url: '',                             tags: ['高命中', '跳过HR', '人脉'] },
    zcool:     { name: '站酷',      icon: 'fa-palette',     color: '#f97316', url: 'https://www.zcool.com.cn',   tags: ['设计', '作品集', '创意'] },
    dribbble:  { name: 'Dribbble',  icon: 'fa-basketball',  color: '#ea4c89', url: 'https://dribbble.com',        tags: ['设计', '国际', '作品集'] },
    dianya:    { name: '电鸭',      icon: 'fa-plug',        color: '#14b8a6', url: 'https://eleduck.com',         tags: ['远程', '自由职业', '独立开发者'] },
    guopin:    { name: '国聘',      icon: 'fa-landmark',    color: '#dc2626', url: 'https://www.iguopin.com',     tags: ['国企', '央企', '事业单位'] },
    zhongzhi:  { name: '中智招聘',  icon: 'fa-building-columns', color: '#b91c1c', url: 'https://www.ciiczhaopin.com', tags: ['国企', '事业单位', '编制'] }
  };

  // 岗位类型分类
  var JOB_CATEGORIES = [
    { value: '',           label: '请选择岗位类型', rule: null },
    { value: 'internet',   label: '互联网 / 技术',  rule: 'internet' },
    { value: 'finance',    label: '金融 / 投资',     rule: 'finance' },
    { value: 'state',      label: '国企 / 事业单位', rule: 'state' },
    { value: 'design',     label: '设计 / 创意',     rule: 'design' },
    { value: 'freelance',  label: '自由职业 / 远程', rule: 'freelance' },
    { value: 'fresh',      label: '应届生 / 校招',   rule: 'fresh' },
    { value: 'senior',     label: '资深 / 管理岗',   rule: 'senior' },
    { value: 'foreign',    label: '外企 / 国际化',   rule: 'foreign' },
    { value: 'startup',    label: '创业公司',        rule: 'startup' },
    { value: 'general',    label: '通用 / 综合',     rule: 'general' }
  ];

  // ================================================================
  //  经验估算
  // ================================================================

  /**
   * 从积木库中估算工作年限
   */
  function estimateExperienceYears() {
    try {
      var blocks = JSON.parse(localStorage.getItem('jobninja_blocks')) || [];
      var dates = [];
      blocks.forEach(function (b) {
        if (b.type === 'work' && b.date) {
          // 提取年份
          var years = b.date.match(/20\d{2}/g);
          if (years && years.length >= 1) {
            dates.push(parseInt(years[0]));
            if (years.length >= 2) dates.push(parseInt(years[1]));
            else dates.push(new Date().getFullYear());
          }
        }
      });
      if (dates.length === 0) return null;

      var minYear = Math.min.apply(null, dates);
      var maxYear = Math.max.apply(null, dates);
      return Math.max(0, maxYear - minYear);
    } catch (_) { return null; }
  }

  /**
   * 从设置中获取用户薪资期望
   */
  function getUserConfig() {
    try {
      var settings = JSON.parse(localStorage.getItem('jobninja_settings')) || {};
      return {
        years: settings.years ? parseInt(settings.years) : estimateExperienceYears(),
        salaryMin: settings.salaryMin ? parseInt(settings.salaryMin) : null,
        salaryMax: settings.salaryMax ? parseInt(settings.salaryMax) : null,
        city: settings.city || ''
      };
    } catch (_) {
      return { years: estimateExperienceYears(), salaryMin: null, salaryMax: null, city: '' };
    }
  }

  // ================================================================
  //  推荐引擎（纯规则）
  // ================================================================

  /**
   * 根据岗位类型 + 用户背景，返回推荐的渠道列表 + 理由
   * 返回 [{ channelKey, reason }]
   */
  function recommend(companyName, categoryValue) {
    var config = getUserConfig();
    var results = [];

    // 辅助：添加渠道
    function add(key, reason) {
      if (!results.some(function (r) { return r.key === key; })) {
        results.push({ key: key, reason: reason });
      }
    }

    // 所有情况都推荐的基础渠道
    add('boss', '适合大多数岗位类型，直接与招聘者沟通');

    // 按岗位类型规则
    switch (categoryValue) {
      case 'internet':
        add('lagou', '互联网行业岗位集中，技术岗匹配度高');
        add('boss', '互联网公司普遍使用，反馈速度快');
        add('neitui', '互联网行业人脉内推命中率显著高于海投');
        add('maimai', '可查找目标公司员工获取内推机会');
        break;

      case 'finance':
        add('liepin', '金融行业中高端岗位聚集地');
        add('linkedin', '外资金融机构常用，适合展示专业背景');
        add('zhilian', '传统金融企业覆盖广');
        break;

      case 'state':
        add('guopin', '央企/国企官方招聘平台，信息最全');
        add('zhongzhi', '事业单位和国企编制岗位首选');
        add('zhilian', '传统国企岗位覆盖面大');
        break;

      case 'design':
        add('zcool', '设计岗位需作品集，站酷为国内最大设计社区');
        add('dribbble', '国际设计岗位机会，展示设计能力');
        add('boss', '互联网公司设计岗较多');
        break;

      case 'freelance':
        add('dianya', '国内最大的远程工作和自由职业社区');
        add('linkedin', '海外远程工作机会');
        add('boss', '可筛选远程工作标签');
        break;

      case 'fresh':
        add('yjs', '应届生校招信息最全平台');
        add('school', '学校就业网发布的岗位经过审核，针对性强');
        add('zhilian', '校招季大量企业入驻');
        break;

      case 'senior':
        add('liepin', '猎头主动联系，中高端岗位聚集');
        add('linkedin', '国际高端岗位，全球化视野');
        add('maimai', '可查看目标公司内部动态和人脉连接');
        break;

      case 'foreign':
        add('linkedin', '外企招聘首选平台');
        add('liepin', '外企中高端岗位多通过猎头');
        add('maimai', '可查找外企员工获取内推');
        break;

      case 'startup':
        add('lagou', '创业公司技术岗集中');
        add('boss', '创业公司CEO/创始人直接招聘');
        add('neitui', '创业公司非常看重内推质量');
        break;

      case 'general':
      default:
        add('zhilian', '综合招聘平台，覆盖广');
        add('boss', '直聊模式效率高');
        add('liepin', '中高端岗位可关注');
        break;
    }

    // 根据经验/薪资追加
    if (config.years !== null) {
      if (config.years > 3) {
        add('liepin', '超过3年经验可关注猎聘中高端岗位');
        add('maimai', '有一定人脉积累后可尝试脉脉内推');
      }
      if (config.years >= 5) {
        add('linkedin', '资深经验在国际平台更有竞争力');
      }
      if (config.years <= 1) {
        add('yjs', '应届生或经验较浅可关注校招平台');
        add('school', '学校就业网是不错的起点');
      }
    }

    if (config.salaryMin && config.salaryMin >= 20) {
      add('liepin', '期望薪资20K以上，猎聘中高端岗位更匹配');
      add('linkedin', '高薪岗位在国际平台机会更多');
    }

    // 去重并限制 5 条
    return results.slice(0, 5);
  }

  // ================================================================
  //  内推话术生成
  // ================================================================

  function generateReferralMessage(companyName, categoryLabel, config) {
    var parts = [];
    parts.push('您好，看到您在' + (companyName || '贵公司') + '工作，冒昧打扰。');
    parts.push('');

    if (categoryLabel) {
      parts.push('我目前在关注' + categoryLabel + '方向的机会，对' + (companyName || '贵公司') + '非常感兴趣。');
    } else {
      parts.push('我对' + (companyName || '贵公司') + '非常感兴趣，希望能了解更多内部情况。');
    }

    if (config.years) {
      parts.push('我有 ' + config.years + ' 年相关工作经验，');
    }

    parts.push('不知是否方便帮忙内推一下？或者如果有合适的岗位信息，也希望能分享一下。非常感谢！');

    return parts.join('\n');
  }

  // ================================================================
  //  官网直达链接生成
  // ================================================================

  function getCompanySearchUrl(companyName) {
    return 'https://www.google.com/search?q=' + encodeURIComponent(companyName + ' 招聘官网');
  }

  // ================================================================
  //  RENDER
  // ================================================================

  function render() {
    var el = document.createElement('div');
    var config = getUserConfig();

    el.innerHTML =
      // 标题
      '<div style="margin-bottom:16px;">' +
        '<h2 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">' +
          '<i class="fa-solid fa-compass" style="color:#34d399;margin-right:8px;"></i>渠道推荐' +
        '</h2>' +
        '<p style="font-size:13px;color:#64748b;margin:0;">分析岗位特征，推荐命中率最高的投递渠道</p>' +
      '</div>' +

      // 输入卡片
      '<div class="panel-card" style="margin-bottom:14px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">' +
          '<div>' +
            '<label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px;">目标公司</label>' +
            '<input id="companyName" class="ninja-input" placeholder="如：字节跳动、华为..." style="font-size:12px;">' +
          '</div>' +
          '<div>' +
            '<label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px;">岗位类型</label>' +
            '<select id="jobCategory" class="ninja-input" style="font-size:12px;">' +
              JOB_CATEGORIES.map(function (cat) {
                return '<option value="' + cat.value + '">' + cat.label + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
        '</div>' +

        // 用户画像摘要
        '<div id="userProfile" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">' +
          (config.years !== null
            ? '<span style="font-size:10px;padding:3px 8px;background:#1a1a26;color:#818cf8;border-radius:10px;">' +
                '<i class="fa-solid fa-briefcase" style="margin-right:3px;"></i>约 ' + config.years + ' 年经验（从积木库估算）</span>'
            : '<span style="font-size:10px;padding:3px 8px;background:#1a1a26;color:#4a4a6a;border-radius:10px;">' +
                '<i class="fa-solid fa-circle-info" style="margin-right:3px;"></i>经验未知（上传简历后自动估算）</span>') +
          (config.salaryMin
            ? '<span style="font-size:10px;padding:3px 8px;background:#1a1a26;color:#34d399;border-radius:10px;">' +
                '<i class="fa-solid fa-coins" style="margin-right:3px;"></i>期望 ' + config.salaryMin + 'K' + (config.salaryMax ? '-' + config.salaryMax + 'K' : '') + '/月</span>'
            : '') +
          (config.city
            ? '<span style="font-size:10px;padding:3px 8px;background:#1a1a26;color:#f59e0b;border-radius:10px;">' +
                '<i class="fa-solid fa-location-dot" style="margin-right:3px;"></i>' + config.city + '</span>'
            : '') +
        '</div>' +

        '<div style="display:flex;gap:8px;">' +
          '<button id="btnAnalyze" class="btn btn-primary" style="font-size:12px;">' +
            '<i class="fa-solid fa-compass" style="font-size:11px;"></i> 分析推荐渠道</button>' +
          '<button id="btnCompanySite" class="btn btn-outline" style="font-size:12px;">' +
            '<i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px;"></i> 查找官网招聘页</button>' +
        '</div>' +
      '</div>' +

      // ===== 结果区 =====
      '<div id="resultsArea" style="display:none;">' +

        // 渠道推荐卡片
        '<div style="margin-bottom:14px;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<i class="fa-solid fa-list-check" style="color:#818cf8;"></i>' +
            '<span style="font-size:13px;font-weight:600;color:#d1d5db;">推荐渠道</span>' +
            '<span id="resultSummary" style="font-size:11px;color:#64748b;"></span>' +
          '</div>' +
          '<div id="channelCards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;"></div>' +
        '</div>' +

        // 内推模拟卡片
        '<div class="panel-card" style="margin-bottom:14px;border-color:#312e81;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<i class="fa-solid fa-handshake" style="color:#ec4899;"></i>' +
            '<span style="font-size:13px;font-weight:600;color:#d1d5db;">内推助攻</span>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
            // 左：统计
            '<div>' +
              '<p style="font-size:12px;color:#94a3b8;line-height:1.6;">' +
                '通过人脉内推投递，简历被查看的概率提高 <strong style="color:#f59e0b;">5-10倍</strong>。' +
                '脉脉、LinkedIn 上可能有 <strong id="contactEstimate" style="color:#818cf8;">N</strong> 位目标公司相关联系人。' +
              '</p>' +
              '<div style="margin-top:10px;display:flex;gap:6px;">' +
                '<a id="linkMaimai" href="#" target="_blank" class="btn btn-outline" style="font-size:11px;text-decoration:none;">' +
                  '<i class="fa-solid fa-share-nodes"></i> 打开脉脉</a>' +
                '<a id="linkLinkedIn" href="#" target="_blank" class="btn btn-outline" style="font-size:11px;text-decoration:none;">' +
                  '<i class="fa-solid fa-linkedin"></i> 打开 LinkedIn</a>' +
              '</div>' +
            '</div>' +
            // 右：话术
            '<div>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
                '<span style="font-size:11px;color:#64748b;">内推话术模板</span>' +
                '<button id="btnCopyMessage" class="btn btn-outline" style="font-size:10px;padding:3px 10px;">' +
                  '<i class="fa-solid fa-copy"></i> 一键复制</button>' +
              '</div>' +
              '<textarea id="referralMessage" readonly rows="6" style="width:100%;padding:8px 10px;' +
                'background:#0a0a0f;border:1px solid #1a1a26;border-radius:6px;color:#94a3b8;font-size:11px;' +
                'line-height:1.5;resize:vertical;"></textarea>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // 官网直达结果
        '<div id="companySiteResult" class="panel-card" style="margin-bottom:14px;display:none;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
            '<i class="fa-solid fa-building" style="color:#10b981;"></i>' +
            '<span style="font-size:13px;font-weight:600;color:#d1d5db;">官网直达</span>' +
          '</div>' +
          '<p id="companySiteText" style="font-size:12px;color:#94a3b8;margin:0 0 8px;"></p>' +
          '<a id="companySiteLink" href="#" target="_blank" class="btn btn-primary" style="font-size:12px;text-decoration:none;display:inline-flex;">' +
            '<i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px;"></i> 打开招聘官网</a>' +
        '</div>' +

      '</div>' +

      // 底部署名
      '<div style="font-size:10px;color:#252536;text-align:right;">渠道推荐基于规则引擎，不含 AI 推理</div>';

    // ===== 事件绑定 =====
    var companyInput  = el.querySelector('#companyName');
    var categorySelect = el.querySelector('#jobCategory');
    var resultsArea    = el.querySelector('#resultsArea');
    var channelCards   = el.querySelector('#channelCards');
    var resultSummary  = el.querySelector('#resultSummary');
    var msgTextarea    = el.querySelector('#referralMessage');
    var contactEst     = el.querySelector('#contactEstimate');
    var companySiteRes = el.querySelector('#companySiteResult');
    var companySiteTxt = el.querySelector('#companySiteText');
    var companySiteLnk = el.querySelector('#companySiteLink');

    // 分析按钮
    el.querySelector('#btnAnalyze').addEventListener('click', function () {
      var companyName = companyInput.value.trim();
      var categoryVal = categorySelect.value;

      if (!categoryVal) {
        JN.showToast('请先选择岗位类型', 'warning');
        return;
      }

      var categoryLabel = categorySelect.options[categorySelect.selectedIndex].text;
      var channels = recommend(companyName, categoryVal);

      // 渲染渠道卡片
      var cardsHTML = '';
      channels.forEach(function (rec) {
        var ch = CHANNELS[rec.key];
        if (!ch) return;

        cardsHTML +=
          '<div class="panel-card" style="padding:14px;transition:border-color 0.12s;cursor:default;" ' +
            'onmouseenter="this.style.borderColor=\'' + ch.color + '40\'" ' +
            'onmouseleave="this.style.borderColor=\'#1a1a26\'">' +
            '<div style="display:flex;align-items:flex-start;gap:10px;">' +
              '<div style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;' +
                'background:' + ch.color + '15;flex-shrink:0;">' +
                '<i class="fa-solid ' + ch.icon + '" style="color:' + ch.color + ';font-size:16px;"></i>' +
              '</div>' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">' +
                  '<span style="font-size:14px;font-weight:600;color:#e2e8f0;">' + ch.name + '</span>' +
                  (ch.url ? '<a href="' + ch.url + '" target="_blank" style="font-size:10px;color:#4a4a6a;text-decoration:none;" title="打开平台"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>' : '') +
                '</div>' +
                '<p style="font-size:11px;color:#64748b;margin:0 0 6px;line-height:1.5;">' + rec.reason + '</p>' +
                '<div style="display:flex;gap:4px;">' +
                  ch.tags.map(function (tag) {
                    return '<span style="font-size:9px;padding:1px 6px;background:#1a1a26;color:#4a4a6a;border-radius:6px;">' + tag + '</span>';
                  }).join('') +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';
      });
      channelCards.innerHTML = cardsHTML;

      // 更新摘要
      resultSummary.textContent = '共 ' + channels.length + ' 条推荐（基于规则引擎）';

      // 更新内推信息
      var n = Math.floor(Math.random() * 20) + 3; // 模拟 3-22 人
      contactEst.textContent = n;

      // 生成话术
      msgTextarea.value = generateReferralMessage(companyName, categoryLabel, config);

      // 更新脉脉和LinkedIn链接（脉脉无稳定公开搜索URL，导向首页）
      var searchName = companyName || (categoryLabel + '岗位');
      el.querySelector('#linkMaimai').href = 'https://maimai.cn';
      el.querySelector('#linkLinkedIn').href = 'https://www.linkedin.com/search/results/people/?keywords=' + encodeURIComponent(searchName);

      // 显示结果区
      resultsArea.style.display = 'block';
    });

    // 官网查找按钮
    el.querySelector('#btnCompanySite').addEventListener('click', function () {
      var companyName = companyInput.value.trim();
      if (!companyName) {
        JN.showToast('请先输入目标公司名称', 'warning');
        return;
      }

      var url = getCompanySearchUrl(companyName);
      companySiteRes.style.display = 'block';
      companySiteTxt.textContent = '在谷歌搜索中查找 "' + companyName + ' 招聘官网" 的结果。最佳路径通常为「公司官网 > 加入我们 / 招聘」。';
      companySiteLnk.href = url;

      // 同时新标签页打开
      window.open(url, '_blank');
    });

    // 复制话术
    el.querySelector('#btnCopyMessage').addEventListener('click', function () {
      var text = msgTextarea.value;
      if (!text.trim()) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          JN.setStatusMsg && JN.setStatusMsg('内推话术已复制到剪贴板');
        }).catch(function () {
          fallbackCopy(msgTextarea);
        });
      } else {
        fallbackCopy(msgTextarea);
      }
    });

    function fallbackCopy(textarea) {
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      try {
        document.execCommand('copy');
        JN.setStatusMsg && JN.setStatusMsg('内推话术已复制');
      } catch (_) {
        JN.showToast('复制失败，请手动选择文本复制', 'error');
      }
    }

    return el;
  }

  JN.registerPanel({
    id: 'channel',
    title: '渠道推荐',
    icon: 'fa-compass',
    render: render,
    onActivate: function () {
      // 重新估算经验
    }
  });

})();
