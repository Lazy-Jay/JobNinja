/**
 * JobNinja — job-search.js v2
 * 找工作：聚合招聘平台搜索链接 + 筛选条件 + 岗位收藏 + 自定义平台 + 搜索历史
 * 纯本地，无需API
 */
(function () {
  if (!window.JobNinja) return;
  var JN = window.JobNinja;

  var STORAGE_SEARCHES = 'jobninja_saved_searches';
  var STORAGE_BOOKMARKS = 'jobninja_bookmarks';
  var STORAGE_CUSTOM_PLATFORMS = 'jobninja_custom_platforms';
  var STORAGE_SEARCH_HISTORY = 'jobninja_search_history';

  // ================================================================
  //  城市编码映射表
  // ================================================================
  var CITY_CODES = {
    '北京': { boss: '101010100', liepin: '110000', zhilian: '530',  job51: '010000' },
    '上海': { boss: '101020100', liepin: '310000', zhilian: '538',  job51: '020000' },
    '深圳': { boss: '101280100', liepin: '440300', zhilian: '765',  job51: '040300' },
    '广州': { boss: '101280200', liepin: '440100', zhilian: '763',  job51: '030200' },
    '杭州': { boss: '101210100', liepin: '330100', zhilian: '653',  job51: '080200' },
    '成都': { boss: '101270100', liepin: '510100', zhilian: '801',  job51: '090200' },
    '南京': { boss: '101190100', liepin: '320100', zhilian: '635',  job51: '070200' },
    '武汉': { boss: '101200100', liepin: '420100', zhilian: '736',  job51: '180200' },
    '西安': { boss: '101110100', liepin: '610100', zhilian: '854',  job51: '200200' },
    '苏州': { boss: '101190400', liepin: '320500', zhilian: '639',  job51: '070300' },
    '重庆': { boss: '101040100', liepin: '500000', zhilian: '551',  job51: '060000' },
    '长沙': { boss: '101250100', liepin: '430100', zhilian: '749',  job51: '190200' },
    '合肥': { boss: '101220100', liepin: '340100', zhilian: '682',  job51: '150200' },
    '郑州': { boss: '101180100', liepin: '410100', zhilian: '619',  job51: '170200' },
    '厦门': { boss: '101230200', liepin: '350200', zhilian: '690',  job51: '110300' },
    '天津': { boss: '101030100', liepin: '120000', zhilian: '532',  job51: '050000' },
    '青岛': { boss: '101120200', liepin: '370200', zhilian: '607',  job51: '120300' },
    '大连': { boss: '101070200', liepin: '210200', zhilian: '575',  job51: '230300' },
    '济南': { boss: '101120100', liepin: '370100', zhilian: '602',  job51: '120200' },
    '福州': { boss: '101230100', liepin: '350100', zhilian: '688',  job51: '110200' },
    '无锡': { boss: '101190200', liepin: '320200', zhilian: '637',  job51: '070400' },
    '宁波': { boss: '101210400', liepin: '330200', zhilian: '662',  job51: '080300' },
    '东莞': { boss: '101281600', liepin: '441900', zhilian: '769',  job51: '030800' },
    '佛山': { boss: '101280800', liepin: '440600', zhilian: '766',  job51: '030500' },
    '珠海': { boss: '101280700', liepin: '440400', zhilian: '767',  job51: '030600' }
  };

  var CITY_CODES_DEFAULT = { boss: '', liepin: '', zhilian: '', job51: '' };

  /** 根据平台获取城市编码（数字编码平台），中文名平台直接返回城市名 */
  function getCityParam(city, platform) {
    if (!city) return '';
    var codes = CITY_CODES[city] || CITY_CODES_DEFAULT;
    switch (platform) {
      case 'boss':    return codes.boss || city;
      case 'liepin':  return codes.liepin || city;
      case 'zhilian': return codes.zhilian || city;
      case 'job51':   return codes.job51 || city;
      default:        return city;
    }
  }

  /** 拼接筛选参数 */
  function getFilterParams(platform, filters) {
    if (!filters) return '';
    var parts = [];
    // 工作经验
    if (filters.experience) {
      switch (platform) {
        case 'boss':    parts.push('experience=' + encodeURIComponent(filters.experience)); break;
        case 'liepin':  parts.push('workYear=' + encodeURIComponent(filters.experience)); break;
        case 'zhilian': parts.push('we=' + encodeURIComponent(filters.experience)); break;
        case 'job51':   parts.push('workyear=' + encodeURIComponent(filters.experience)); break;
        case 'lagou':   parts.push('gj=' + encodeURIComponent(filters.experience)); break;
      }
    }
    // 学历
    if (filters.degree) {
      switch (platform) {
        case 'boss':    parts.push('degree=' + encodeURIComponent(filters.degree)); break;
        case 'liepin':  parts.push('eduLevel=' + encodeURIComponent(filters.degree)); break;
        case 'zhilian': parts.push('el=' + encodeURIComponent(filters.degree)); break;
        case 'job51':   parts.push('degreefrom=' + encodeURIComponent(filters.degree)); break;
      }
    }
    // 公司规模
    if (filters.companySize) {
      switch (platform) {
        case 'boss':    parts.push('scale=' + encodeURIComponent(filters.companySize)); break;
        case 'liepin':  parts.push('compSize=' + encodeURIComponent(filters.companySize)); break;
        case 'zhilian': parts.push('sc=' + encodeURIComponent(filters.companySize)); break;
      }
    }
    return parts.length > 0 ? '&' + parts.join('&') : '';
  }

  // 招聘平台搜索URL模板（按官方格式逐个修正）
  var PLATFORMS = [
    { key: 'boss',     name: 'BOSS直聘',       icon: 'fa-bolt',             color: '#6366f1', category: '综合',
      url: function(kw, city, f) { return 'https://www.zhipin.com/web/geek/job?query=' + encodeURIComponent(kw) + '&city=' + getCityParam(city, 'boss') + getFilterParams('boss', f); } },
    { key: 'liepin',   name: '猎聘',            icon: 'fa-bullseye',         color: '#f59e0b', category: '中高端',
      url: function(kw, city, f) { return 'https://www.liepin.com/zhaopin/?key=' + encodeURIComponent(kw) + '&dqs=' + getCityParam(city, 'liepin') + getFilterParams('liepin', f); } },
    { key: 'zhilian',  name: '智联招聘',        icon: 'fa-building',         color: '#06b6d4', category: '综合',
      url: function(kw, city, f) { return 'https://sou.zhaopin.com/?jl=' + getCityParam(city, 'zhilian') + '&kw=' + encodeURIComponent(kw) + getFilterParams('zhilian', f); } },
    { key: '51job',    name: '前程无忧',        icon: 'fa-briefcase',        color: '#ef4444', category: '综合',
      url: function(kw, city, f) { return 'https://search.51job.com/list.php?in=' + getCityParam(city, 'job51') + '&keyword=' + encodeURIComponent(kw) + getFilterParams('job51', f); } },
    { key: 'lagou',    name: '拉勾',            icon: 'fa-laptop-code',      color: '#8b5cf6', category: '互联网',
      url: function(kw, city, f) { return 'https://www.lagou.com/wn/jobs?kd=' + encodeURIComponent(kw) + '&city=' + encodeURIComponent(city) + getFilterParams('lagou', f); } },
    { key: 'maimai',   name: '脉脉',            icon: 'fa-share-nodes',      color: '#3b82f6', category: '社交',
      url: function(kw, city, f) { return 'https://maimai.cn/job/search?query=' + encodeURIComponent(kw) + '&city=' + encodeURIComponent(city); } },
    { key: 'guopin',   name: '国聘',            icon: 'fa-landmark',         color: '#dc2626', category: '国企',
      url: function(kw, city, f) { return 'https://www.iguopin.com/job?keywords=' + encodeURIComponent(kw) + '&workPlace=' + encodeURIComponent(city); } },
    { key: 'yingjie',  name: '应届生求职网',    icon: 'fa-graduation-cap',   color: '#10b981', category: '应届生',
      url: function(kw, city, f) { return 'https://www.yingjiesheng.com/job/?keyword=' + encodeURIComponent(kw) + '&city=' + encodeURIComponent(city); } },
    { key: 'shixi',    name: '实习僧',          icon: 'fa-user-graduate',    color: '#06b6d4', category: '应届生',
      url: function(kw, city, f) { return 'https://www.shixiseng.com/interns?k=' + encodeURIComponent(kw) + '&city=' + encodeURIComponent(city); } },
    { key: 'linkedin', name: 'LinkedIn',         icon: 'fa-linkedin',         color: '#0a66c2', category: '外企',
      url: function(kw, city, f) { return 'https://www.linkedin.com/jobs/search/?keywords=' + encodeURIComponent(kw) + '&location=' + encodeURIComponent(city); } },
    { key: 'indeed',   name: 'Indeed',           icon: 'fa-magnifying-glass', color: '#2164f3', category: '外企',
      url: function(kw, city, f) { return 'https://www.indeed.com/jobs?q=' + encodeURIComponent(kw) + '&l=' + encodeURIComponent(city); } },
    { key: 'eleduck',  name: '电鸭(远程)',      icon: 'fa-plug',             color: '#14b8a6', category: '远程',
      url: function(kw, city, f) { return 'https://eleduck.com/jobs?query=' + encodeURIComponent(kw); } },
    { key: 'zcool',    name: '站酷(设计)',      icon: 'fa-palette',          color: '#f97316', category: '设计',
      url: function(kw, city, f) { return 'https://www.zcool.com.cn/job/index.html?keyword=' + encodeURIComponent(kw); } },
    { key: 'dribbble', name: 'Dribbble(设计)',   icon: 'fa-basketball',       color: '#ea4c89', category: '设计',
      url: function(kw, city, f) { return 'https://dribbble.com/jobs?q=' + encodeURIComponent(kw); } },
    { key: 'zhongzhi', name: '中智招聘(国企)',  icon: 'fa-building-columns', color: '#b91c1c', category: '国企',
      url: function(kw, city, f) { return 'https://job.ciic.com.cn/job/list?keywords=' + encodeURIComponent(kw) + '&city=' + encodeURIComponent(city); } }
  ];

  var HOT_KEYWORDS = {
    tech: {
      label: '技术研发', icon: 'fa-code', color: '#6366f1',
      keywords: ['前端开发工程师','后端开发工程师','Java开发工程师','Python开发工程师','Go开发工程师','算法工程师',
        'AI大模型工程师','数据分析师','测试工程师','运维工程师','SRE工程师','架构师','iOS开发工程师',
        'Android开发工程师','全栈工程师','安全工程师','Node.js工程师','C++开发工程师','Rust开发工程师','DevOps工程师']
    },
    product: {
      label: '产品/设计', icon: 'fa-pen-ruler', color: '#8b5cf6',
      keywords: ['产品经理','高级产品经理','产品总监','交互设计师','UI设计师','UX设计师','视觉设计师',
        'B端产品经理','C端产品经理','增长产品经理','数据产品经理','AI产品经理','产品运营','用户研究员']
    },
    operation: {
      label: '运营/市场', icon: 'fa-bullhorn', color: '#f59e0b',
      keywords: ['新媒体运营','内容运营','用户运营','活动运营','电商运营','直播运营','品牌经理',
        '市场推广','社区运营','社群运营','短视频运营','海外运营','SEO优化师','SEM投放','增长运营','私域运营']
    },
    business: {
      label: '业务/职能', icon: 'fa-chart-line', color: '#10b981',
      keywords: ['销售经理','客户经理','商务拓展','项目经理','人力资源','HRBP','财务经理','法务',
        '行政经理','采购经理','供应链管理','质量管理','投资经理','风控经理','审计','合规经理']
    }
  };

  var HOT_CITIES = ['北京','上海','深圳','杭州','广州','成都','南京','武汉','西安','苏州','重庆','长沙','合肥','郑州','厦门','天津'];

  // localStorage helpers
  function loadSearches() { try { return JSON.parse(localStorage.getItem(STORAGE_SEARCHES)) || []; } catch (_) { return []; } }
  function saveSearches(list) { localStorage.setItem(STORAGE_SEARCHES, JSON.stringify(list)); }
  function loadBookmarks() { try { return JSON.parse(localStorage.getItem(STORAGE_BOOKMARKS)) || []; } catch (_) { return []; } }
  function saveBookmarks(list) { localStorage.setItem(STORAGE_BOOKMARKS, JSON.stringify(list)); }
  function loadCustomPlatforms() { try { return JSON.parse(localStorage.getItem(STORAGE_CUSTOM_PLATFORMS)) || []; } catch (_) { return []; } }
  function saveCustomPlatforms(list) { localStorage.setItem(STORAGE_CUSTOM_PLATFORMS, JSON.stringify(list)); }
  function loadHistory() { try { return JSON.parse(localStorage.getItem(STORAGE_SEARCH_HISTORY)) || []; } catch (_) { return []; } }
  function saveHistory(list) { localStorage.setItem(STORAGE_SEARCH_HISTORY, JSON.stringify(list)); }

  function getDefaultCity() {
    try { var s = JSON.parse(localStorage.getItem('jobninja_settings')) || {}; return s.city || ''; }
    catch (_) { return ''; }
  }

  // 合并固定平台 + 自定义平台
  function getAllPlatforms() {
    var custom = loadCustomPlatforms();
    return PLATFORMS.concat(custom);
  }

  function generateLinks(keyword, city, filters) {
    return getAllPlatforms().map(function(p) {
      return { key: p.key, name: p.name, icon: p.icon, color: p.color, category: p.category || '自定义', url: p.url(keyword, city, filters || {}) };
    });
  }

  function addToHistory(keyword, city) {
    var hist = loadHistory();
    hist = hist.filter(function(h) { return !(h.keyword === keyword && h.city === city); });
    hist.unshift({ keyword: keyword, city: city, time: new Date().toISOString() });
    if (hist.length > 50) hist = hist.slice(0, 50);
    saveHistory(hist);
  }

  function render() {
    var el = document.createElement('div');
    var savedSearches = loadSearches();
    var bookmarks = loadBookmarks();
    var defaultCity = getDefaultCity();

    el.innerHTML =
      '<div style="margin-bottom:16px;">' +
        '<h2 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">' +
          '<i class="fa-solid fa-magnifying-glass" style="color:#34d399;margin-right:8px;"></i>找工作' +
        '</h2>' +
        '<p style="font-size:13px;color:#64748b;margin:0;">聚合15+招聘平台 · 筛选条件 · 岗位收藏 · 搜索历史</p>' +
      '</div>' +

      // 搜索输入区
      '<div class="panel-card" style="margin-bottom:14px;">' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">' +
          '<div style="position:relative;">' +
            '<label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px;"><i class="fa-solid fa-briefcase" style="margin-right:4px;"></i>目标岗位</label>' +
            '<input id="jsKeyword" class="ninja-input" placeholder="如：前端开发工程师、产品经理..." style="font-size:13px;" autofocus>' +
            '<div id="jsSuggestions" class="search-suggestion-list" style="display:none;"></div>' +
          '</div>' +
          '<div>' +
            '<label style="font-size:11px;color:#64748b;display:block;margin-bottom:4px;"><i class="fa-solid fa-location-dot" style="margin-right:4px;"></i>目标城市</label>' +
            '<input id="jsCity" class="ninja-input" placeholder="如：北京" style="font-size:13px;" value="' + defaultCity + '" list="jsCityList">' +
            '<datalist id="jsCityList">' + HOT_CITIES.map(function(c) { return '<option value="' + c + '">'; }).join('') + '</datalist>' +
          '</div>' +
        '</div>' +
        // 筛选条件
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;">' +
          '<div>' +
            '<label style="font-size:9px;color:#4a4a6a;display:block;margin-bottom:2px;">薪资范围</label>' +
            '<select id="jsSalary" class="ninja-input" style="font-size:11px;padding:5px 6px;">' +
              '<option value="">不限</option>' +
              '<option value="5-10">5-10K</option><option value="10-15">10-15K</option><option value="15-25">15-25K</option>' +
              '<option value="25-35">25-35K</option><option value="35-50">35-50K</option><option value="50+">50K以上</option>' +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label style="font-size:9px;color:#4a4a6a;display:block;margin-bottom:2px;">工作经验</label>' +
            '<select id="jsExperience" class="ninja-input" style="font-size:11px;padding:5px 6px;">' +
              '<option value="">不限</option>' +
              '<option value="应届">应届生</option><option value="1-3">1-3年</option><option value="3-5">3-5年</option>' +
              '<option value="5-10">5-10年</option><option value="10+">10年以上</option>' +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label style="font-size:9px;color:#4a4a6a;display:block;margin-bottom:2px;">学历要求</label>' +
            '<select id="jsDegree" class="ninja-input" style="font-size:11px;padding:5px 6px;">' +
              '<option value="">不限</option>' +
              '<option value="大专">大专及以上</option><option value="本科">本科及以上</option>' +
              '<option value="硕士">硕士及以上</option><option value="博士">博士</option>' +
            '</select>' +
          '</div>' +
          '<div>' +
            '<label style="font-size:9px;color:#4a4a6a;display:block;margin-bottom:2px;">公司规模</label>' +
            '<select id="jsCompanySize" class="ninja-input" style="font-size:11px;padding:5px 6px;">' +
              '<option value="">不限</option>' +
              '<option value="startup">初创(1-50人)</option><option value="small">小型(50-200人)</option>' +
              '<option value="medium">中型(200-1000人)</option><option value="large">大型(1000+人)</option>' +
              '<option value="listed">上市公司</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        // 操作按钮
        '<div style="display:flex;gap:8px;">' +
          '<button id="btnSearchAll" class="btn btn-primary" style="font-size:13px;padding:9px 20px;">' +
            '<i class="fa-solid fa-rocket" style="font-size:12px;"></i> 一键打开所有平台</button>' +
          '<button id="btnGenLinks" class="btn btn-outline" style="font-size:12px;background:#1e1e32;border-color:#312e81;color:#a5b4fc;">' +
            '<i class="fa-solid fa-link" style="font-size:11px;"></i> 生成搜索链接</button>' +
          '<button id="btnSaveSearch" class="btn btn-outline" style="font-size:12px;">' +
            '<i class="fa-solid fa-bookmark" style="font-size:11px;"></i> 保存条件</button>' +
        '</div>' +
      '</div>' +

      // 热门关键词
      '<div class="panel-card" style="margin-bottom:14px;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
          '<i class="fa-solid fa-fire" style="color:#f59e0b;"></i>' +
          '<span style="font-size:13px;font-weight:600;color:#d1d5db;">热门岗位</span>' +
          '<span style="font-size:10px;color:#4a4a6a;">点击快速填入</span>' +
        '</div>' +
        (function() {
          var h = '';
          for (var ck in HOT_KEYWORDS) {
            var cat = HOT_KEYWORDS[ck];
            h += '<div style="margin-bottom:10px;">' +
              '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">' +
                '<i class="fa-solid ' + cat.icon + '" style="color:' + cat.color + ';font-size:11px;"></i>' +
                '<span style="font-size:11px;font-weight:600;color:#94a3b8;">' + cat.label + '</span>' +
              '</div>' +
              '<div style="display:flex;flex-wrap:wrap;gap:5px;">' +
                cat.keywords.map(function(kw) {
                  return '<button class="js-hot-kw" data-kw="' + kw + '" style="font-size:11px;padding:4px 10px;background:#0f0f17;border:1px solid #1a1a26;border-radius:16px;color:#94a3b8;cursor:pointer;transition:all 0.12s;"' +
                    ' onmouseenter="this.style.borderColor=\'' + cat.color + '40\';this.style.color=\'' + cat.color + '\'"' +
                    ' onmouseleave="this.style.borderColor=\'#1a1a26\';this.style.color=\'#94a3b8\'">' + kw + '</button>';
                }).join('') +
              '</div>' +
            '</div>';
          }
          return h;
        })() +
      '</div>' +

      // 搜索结果区
      '<div id="jsResults" style="display:none;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<i class="fa-solid fa-list-check" style="color:#818cf8;"></i>' +
            '<span style="font-size:13px;font-weight:600;color:#d1d5db;">搜索链接</span>' +
            '<span id="jsResultCount" style="font-size:11px;color:#4a4a6a;"></span>' +
          '</div>' +
          '<div style="display:flex;gap:6px;">' +
            '<button id="btnBatchOpen" class="btn btn-primary" style="font-size:12px;">' +
              '<i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px;"></i> 批量打开</button>' +
            '<button id="btnBookmarkAll" class="btn btn-outline" style="font-size:11px;">' +
              '<i class="fa-solid fa-star" style="font-size:10px;"></i> 收藏本次搜索</button>' +
            '<button id="btnJumpResume" class="btn btn-outline" style="font-size:11px;border-color:#065f46;color:#34d399;" title="跳到简历管理用此岗位JD做匹配">' +
              '<i class="fa-solid fa-file-pen" style="font-size:10px;"></i> 适配简历</button>' +
          '</div>' +
        '</div>' +
        '<div id="jsLinkCards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;"></div>' +
      '</div>' +

      // 三栏：已保存搜索 | 岗位收藏 | 历史记录
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:14px;">' +
        // 已保存搜索
        '<div class="panel-card" style="margin-bottom:0;">' +
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' +
            '<i class="fa-solid fa-bookmark" style="color:#f59e0b;"></i>' +
            '<span style="font-size:12px;font-weight:600;color:#d1d5db;">已保存搜索</span>' +
          '</div>' +
          '<div id="jsSavedList" style="max-height:200px;overflow-y:auto;" class="custom-scrollbar">' +
            (savedSearches.length === 0 ? '<span style="font-size:11px;color:#4a4a6a;">暂无</span>' : renderSavedSearches(savedSearches)) +
          '</div>' +
        '</div>' +
        // 岗位收藏（分组模式）
        '<div class="panel-card" style="margin-bottom:0;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<i class="fa-solid fa-star" style="color:#f59e0b;"></i>' +
              '<span style="font-size:12px;font-weight:600;color:#d1d5db;">岗位收藏</span>' +
            '</div>' +
            '<div style="display:flex;gap:4px;">' +
              '<button id="btnCompareJobs" class="btn btn-outline" style="font-size:9px;padding:2px 6px;display:none;" title="对比选中的岗位">对比</button>' +
              '<button id="btnBatchDelBM" class="btn btn-outline" style="font-size:9px;padding:2px 6px;display:none;color:#ef4444;border-color:#7f1d1d;" title="删除选中">删除</button>' +
              '<button id="btnToggleBatchBM" class="btn btn-outline" style="font-size:9px;padding:2px 6px;" title="批量操作">批量</button>' +
              '<button id="btnBatchExportBM" class="btn btn-outline" style="font-size:9px;padding:2px 6px;" title="导出为CSV">导出</button>' +
              '<button id="btnAddBookmark" class="btn btn-outline" style="font-size:10px;padding:2px 8px;">+</button>' +
            '</div>' +
          '</div>' +
          '<div id="jsBookmarkList" style="max-height:250px;overflow-y:auto;" class="custom-scrollbar">' +
            (bookmarks.length === 0 ? '<span style="font-size:11px;color:#4a4a6a;">收藏感兴趣的岗位</span>' : renderBookmarksGrouped(bookmarks, el)) +
          '</div>' +
        '</div>' +
        // 搜索历史
        '<div class="panel-card" style="margin-bottom:0;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<i class="fa-solid fa-clock-rotate-left" style="color:#64748b;"></i>' +
              '<span style="font-size:12px;font-weight:600;color:#d1d5db;">搜索历史</span>' +
            '</div>' +
            '<button id="btnClearHistory" class="btn btn-outline" style="font-size:10px;padding:2px 8px;">清空</button>' +
          '</div>' +
          '<div id="jsHistoryList" style="max-height:200px;overflow-y:auto;" class="custom-scrollbar">' +
            renderHistory() +
          '</div>' +
        '</div>' +
      '</div>' +

      // 自定义平台管理
      '<div class="panel-card" style="margin-top:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<i class="fa-solid fa-puzzle-piece" style="color:#a5b4fc;"></i>' +
            '<span style="font-size:12px;font-weight:600;color:#d1d5db;">自定义平台</span>' +
            '<span style="font-size:10px;color:#4a4a6a;">添加你常用的小众招聘平台</span>' +
          '</div>' +
          '<button id="btnAddCustom" class="btn btn-outline" style="font-size:11px;padding:4px 10px;">' +
            '<i class="fa-solid fa-plus"></i> 添加平台</button>' +
        '</div>' +
        '<div id="jsCustomPlatforms" style="display:flex;flex-wrap:wrap;gap:6px;">' +
          renderCustomPlatforms() +
        '</div>' +
      '</div>' +

      '<div style="font-size:10px;color:#252536;text-align:right;margin-top:8px;">' +
        '<i class="fa-solid fa-shield-halved" style="margin-right:4px;"></i>搜索在新标签页打开，数据不上传' +
      '</div>';

    // ===== 事件绑定 =====
    var keywordInput = el.querySelector('#jsKeyword');
    var cityInput = el.querySelector('#jsCity');
    var resultsArea = el.querySelector('#jsResults');
    var linkCards = el.querySelector('#jsLinkCards');
    var resultCount = el.querySelector('#jsResultCount');

    function getFilters() {
      return {
        salary: el.querySelector('#jsSalary').value,
        experience: el.querySelector('#jsExperience').value,
        degree: el.querySelector('#jsDegree').value,
        companySize: el.querySelector('#jsCompanySize').value
      };
    }

    function showResults(keyword, city, filters) {
      var allLinks = generateLinks(keyword, city, filters);
      window._currentLinks = allLinks;
      resultCount.textContent = '共 ' + allLinks.length + ' 个平台';

      linkCards.innerHTML = allLinks.map(function(link) {
        return '<div class="panel-card" style="padding:14px;cursor:default;transition:border-color 0.12s;"' +
          ' onmouseenter="this.style.borderColor=\'' + link.color + '40\'"' +
          ' onmouseleave="this.style.borderColor=\'#1a1a26\'">' +
          '<div style="display:flex;align-items:flex-start;gap:10px;">' +
            '<div style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;' +
              'background:' + link.color + '15;flex-shrink:0;">' +
              '<i class="fa-solid ' + link.icon + '" style="color:' + link.color + ';font-size:16px;"></i>' +
            '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
                '<span style="font-size:14px;font-weight:600;color:#e2e8f0;">' + link.name + '</span>' +
                '<span style="font-size:9px;padding:1px 5px;background:#1a1a26;color:#4a4a6a;border-radius:3px;">' + (link.category || '') + '</span>' +
              '</div>' +
              '<a href="' + link.url + '" target="_blank" rel="noopener" ' +
                'style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#818cf8;text-decoration:none;padding:4px 10px;background:#1e1e32;border:1px solid #312e81;border-radius:5px;"' +
                ' onmouseenter="this.style.background=\'#312e81\'" onmouseleave="this.style.background=\'#1e1e32\'">' +
                '<i class="fa-solid fa-arrow-up-right-from-square" style="font-size:9px;"></i> 打开搜索</a>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');

      resultsArea.style.display = 'block';
      resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    el.querySelector('#btnGenLinks').addEventListener('click', function() {
      var kw = keywordInput.value.trim();
      var city = cityInput.value.trim();
      if (!kw) { JN.showToast('请输入目标岗位', 'warning'); return; }
      if (!city) { JN.showToast('请输入目标城市', 'warning'); return; }
      addToHistory(kw, city);
      showResults(kw, city, getFilters());
      refreshAllLists(el);
    });

    el.querySelector('#btnSearchAll').addEventListener('click', function() {
      var kw = keywordInput.value.trim();
      var city = cityInput.value.trim();
      if (!kw) { JN.showToast('请输入目标岗位', 'warning'); return; }
      if (!city) { JN.showToast('请输入目标城市', 'warning'); return; }
      addToHistory(kw, city);
      var allLinks = generateLinks(kw, city, getFilters());
      showResults(kw, city, getFilters());
      var delay = 0;
      allLinks.forEach(function(link) {
        setTimeout(function() { window.open(link.url, '_blank', 'noopener'); }, delay);
        delay += 300;
      });
      JN.showToast('正在批量打开 ' + allLinks.length + ' 个平台搜索页', 'info');
      refreshAllLists(el);
    });

    el.querySelector('#btnBatchOpen').addEventListener('click', function() {
      var links = window._currentLinks || [];
      if (links.length === 0) return;
      var delay = 0;
      links.forEach(function(link) {
        setTimeout(function() { window.open(link.url, '_blank', 'noopener'); }, delay);
        delay += 300;
      });
      JN.showToast('正在批量打开 ' + links.length + ' 个平台', 'info');
    });

    el.querySelector('#btnSaveSearch').addEventListener('click', function() {
      var kw = keywordInput.value.trim();
      var city = cityInput.value.trim();
      if (!kw || !city) { JN.showToast('请输入岗位和城市', 'warning'); return; }
      var searches = loadSearches();
      if (searches.some(function(s) { return s.keyword === kw && s.city === city; })) {
        JN.showToast('该搜索条件已存在', 'info'); return;
      }
      searches.unshift({ keyword: kw, city: city, filters: getFilters(), savedAt: new Date().toISOString() });
      if (searches.length > 20) searches = searches.slice(0, 20);
      saveSearches(searches);
      JN.showToast('搜索条件已保存', 'success');
      refreshAllLists(el);
    });

    el.querySelector('#btnBookmarkAll').addEventListener('click', function() {
      var kw = keywordInput.value.trim();
      var city = cityInput.value.trim();
      if (!kw) { JN.showToast('请先输入岗位', 'warning'); return; }
      var bm = loadBookmarks();
      if (bm.some(function(b) { return b.keyword === kw && b.city === city; })) {
        JN.showToast('该岗位已在收藏中', 'info'); return;
      }
      bm.unshift({ id: 'bm_' + Date.now().toString(36), keyword: kw, city: city, company: '', note: '', savedAt: new Date().toISOString() });
      saveBookmarks(bm);
      JN.showToast('已收藏岗位：' + kw, 'success');
      refreshAllLists(el);
    });

    // 跳转到简历管理
    el.querySelector('#btnJumpResume').addEventListener('click', function() {
      var kw = keywordInput.value.trim();
      var city = cityInput.value.trim();
      // 生成一个模拟JD传给简历管理
      var mockJD = '岗位：' + kw + '\n城市：' + city + '\n\n请粘贴完整JD进行精准匹配';
      if (JN.jumpToPanel) JN.jumpToPanel('resume', { jdText: mockJD, keyword: kw });
    });

    // 批量导出收藏
    el.querySelector('#btnBatchExportBM').addEventListener('click', function() { batchExportBookmarks(); });

    // 手动添加收藏
    el.querySelector('#btnAddBookmark').addEventListener('click', function() {
      var company = prompt('公司名称（可选）：');
      var position = prompt('岗位名称：');
      if (!position) return;
      var city = prompt('城市（可选）：', defaultCity);
      var bm = loadBookmarks();
      bm.unshift({ id: 'bm_' + Date.now().toString(36), keyword: position, city: city || '', company: company || '', note: '', savedAt: new Date().toISOString() });
      saveBookmarks(bm);
      JN.showToast('已收藏岗位', 'success');
      refreshAllLists(el);
    });

    // 清空历史
    el.querySelector('#btnClearHistory').addEventListener('click', function() {
      if (!confirm('确定清空所有搜索历史吗？')) return;
      saveHistory([]);
      refreshAllLists(el);
    });

    // 热门关键词点击
    el.querySelectorAll('.js-hot-kw').forEach(function(btn) {
      btn.addEventListener('click', function() {
        keywordInput.value = this.getAttribute('data-kw');
        keywordInput.focus();
      });
    });

    // 回车搜索
    [keywordInput, cityInput].forEach(function(inp) {
      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          var kw = keywordInput.value.trim();
          var city = cityInput.value.trim();
          if (kw && city) { addToHistory(kw, city); showResults(kw, city, getFilters()); refreshAllLists(el); }
        }
      });
    });

    // 智能搜索建议
    var suggestionBox = el.querySelector('#jsSuggestions');
    var suggestTimer = null;
    keywordInput.addEventListener('input', function() {
      clearTimeout(suggestTimer);
      var kw = this.value.trim();
      suggestTimer = setTimeout(function() { showSearchSuggestions(kw, keywordInput, suggestionBox); }, 200);
    });
    keywordInput.addEventListener('blur', function() { setTimeout(function() { suggestionBox.style.display = 'none'; }, 150); });
    keywordInput.addEventListener('focus', function() {
      if (this.value.trim()) showSearchSuggestions(this.value.trim(), keywordInput, suggestionBox);
    });

    // 批量收藏操作
    var batchMode = false;
    var selectedBMs = [];
    el.querySelector('#btnToggleBatchBM').addEventListener('click', function() {
      batchMode = !batchMode;
      selectedBMs = [];
      this.textContent = batchMode ? '退出' : '批量';
      el.querySelector('#btnBatchDelBM').style.display = batchMode ? 'inline-block' : 'none';
      el.querySelector('#btnCompareJobs').style.display = batchMode ? 'inline-block' : 'none';
      refreshBMList();
    });
    el.querySelector('#btnBatchDelBM').addEventListener('click', function() {
      if (selectedBMs.length === 0) { JN.showToast('请先选择要删除的收藏', 'warning'); return; }
      if (!confirm('确定删除选中的 ' + selectedBMs.length + ' 个收藏？')) return;
      var bms = loadBookmarks().filter(function(_, i) { return selectedBMs.indexOf(i) === -1; });
      saveBookmarks(bms);
      selectedBMs = [];
      refreshBMList();
      JN.showToast('已删除 ' + selectedBMs.length + ' 个收藏', 'success');
    });
    el.querySelector('#btnCompareJobs').addEventListener('click', function() {
      if (selectedBMs.length < 2) { JN.showToast('请至少选择 2 个岗位进行对比', 'warning'); return; }
      if (selectedBMs.length > 3) { JN.showToast('最多对比 3 个岗位', 'warning'); return; }
      var bms = loadBookmarks();
      var selected = selectedBMs.map(function(i) { return bms[i]; }).filter(Boolean);
      showJobCompareModal(selected);
    });

    function refreshBMList() {
      var bmList = el.querySelector('#jsBookmarkList');
      if (!bmList) return;
      var bms = loadBookmarks();
      if (bms.length === 0) { bmList.innerHTML = '<span style="font-size:11px;color:#4a4a6a;">收藏感兴趣的岗位</span>'; return; }
      if (batchMode) {
        bmList.innerHTML = bms.map(function(b, i) {
          var checked = selectedBMs.indexOf(i) !== -1;
          return '<div style="display:flex;align-items:center;gap:6px;padding:5px 6px;margin-bottom:3px;background:#0f0f17;border:1px solid ' + (checked ? '#6366f1' : '#1a1a26') + ';border-radius:6px;cursor:pointer;" data-bm-idx="' + i + '">' +
            '<input type="checkbox" class="batch-checkbox bm-check" data-idx="' + i + '" ' + (checked ? 'checked' : '') + ' style="flex-shrink:0;">' +
            '<span style="font-size:11px;color:#d1d5db;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (b.title || b.keyword || '未命名') + '</span>' +
            '<span style="font-size:10px;color:#64748b;">' + (b.company || '') + '</span>' +
          '</div>';
        }).join('');
        bmList.querySelectorAll('.bm-check').forEach(function(cb) {
          cb.addEventListener('change', function() {
            var idx = parseInt(this.getAttribute('data-idx'));
            if (this.checked) { if (selectedBMs.indexOf(idx) === -1) selectedBMs.push(idx); }
            else { selectedBMs = selectedBMs.filter(function(i) { return i !== idx; }); }
            refreshBMList();
          });
        });
      } else {
        bmList.innerHTML = renderBookmarksGrouped(bms, el);
      }
    }

    // 自定义平台：添加
    el.querySelector('#btnAddCustom').addEventListener('click', function() {
      showCustomPlatformModal(el);
    });

    // 委托事件：已保存搜索、收藏、历史、自定义平台
    el.addEventListener('click', function(e) {
      handleDelegatedClick(e, el);
    });

    return el;
  }

  function renderSavedSearches(searches) {
    return searches.map(function(s, i) {
      return '<div class="js-saved-item" data-idx="' + i + '" style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;margin-bottom:3px;background:#0f0f17;border:1px solid #1a1a26;border-radius:6px;cursor:pointer;font-size:11px;transition:border-color 0.12s;"' +
        ' onmouseenter="this.style.borderColor=\'#6366f1\'" onmouseleave="this.style.borderColor=\'#1a1a26\'">' +
        '<div style="display:flex;align-items:center;gap:4px;min-width:0;">' +
          '<i class="fa-solid fa-magnifying-glass" style="color:#6366f1;font-size:9px;flex-shrink:0;"></i>' +
          '<span style="color:#d1d5db;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + s.keyword + '</span>' +
          '<span style="color:#4a4a6a;flex-shrink:0;">· ' + s.city + '</span>' +
        '</div>' +
        '<button class="js-saved-del" data-idx="' + i + '" style="width:16px;height:16px;background:none;border:none;color:#4a4a6a;cursor:pointer;font-size:10px;flex-shrink:0;">&times;</button>' +
      '</div>';
    }).join('');
  }

  function renderBookmarks(bookmarks) {
    return bookmarks.map(function(b, i) {
      var statColor = b.status === '面试' ? '#818cf8' : b.status === 'offer' ? '#34d399' : b.status === '拒绝' ? '#f87171' : '#f59e0b';
      return '<div class="js-bookmark-item" data-idx="' + i + '" style="padding:6px 8px;margin-bottom:3px;background:#0f0f17;border:1px solid #1a1a26;border-radius:6px;font-size:11px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<span style="color:#d1d5db;font-weight:500;">' + (b.keyword || '未命名') + '</span>' +
          '<span style="font-size:9px;padding:1px 5px;background:' + statColor + '20;color:' + statColor + ';border-radius:3px;">' + (b.status || '待投递') + '</span>' +
        '</div>' +
        (b.company ? '<div style="color:#4a4a6a;font-size:10px;">' + b.company + (b.city ? ' · ' + b.city : '') + '</div>' : '') +
        '<div style="display:flex;gap:4px;margin-top:4px;">' +
          '<button class="js-bm-status" data-idx="' + i + '" style="font-size:9px;padding:1px 5px;background:transparent;border:1px solid #1a1a26;border-radius:3px;color:#4a4a6a;cursor:pointer;">状态</button>' +
          '<button class="js-bm-del" data-idx="' + i + '" style="font-size:9px;padding:1px 5px;background:transparent;border:1px solid #1a1a26;border-radius:3px;color:#4a4a6a;cursor:pointer;">删除</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderHistory() {
    var hist = loadHistory();
    if (hist.length === 0) return '<span style="font-size:11px;color:#4a4a6a;">暂无搜索记录</span>';
    return hist.slice(0, 15).map(function(h, i) {
      return '<div class="js-hist-item" data-kw="' + h.keyword + '" data-city="' + h.city + '" style="padding:5px 8px;margin-bottom:2px;cursor:pointer;font-size:11px;color:#64748b;border-radius:4px;transition:all 0.12s;"' +
        ' onmouseenter="this.style.background=\'#1a1a26\';this.style.color=\'#d1d5db\'" onmouseleave="this.style.background=\'transparent\';this.style.color=\'#64748b\'">' +
        '<i class="fa-solid fa-clock-rotate-left" style="font-size:8px;margin-right:4px;color:#4a4a6a;"></i>' +
        h.keyword + ' · ' + h.city +
      '</div>';
    }).join('');
  }

  function renderCustomPlatforms() {
    var custom = loadCustomPlatforms();
    if (custom.length === 0) return '<span style="font-size:11px;color:#4a4a6a;">点击「添加平台」添加你常用的小众招聘网站</span>';
    return custom.map(function(p, i) {
      return '<div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;font-size:11px;">' +
        '<span style="color:' + (p.color || '#a5b4fc') + ';">' + (p.name || '未命名') + '</span>' +
        '<button class="js-custom-del" data-idx="' + i + '" style="background:none;border:none;color:#4a4a6a;cursor:pointer;font-size:10px;">&times;</button>' +
      '</div>';
    }).join('');
  }

  function showCustomPlatformModal(el) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;padding:20px;width:90%;max-width:400px;">' +
        '<h4 style="font-size:15px;color:#e2e8f0;margin:0 0 12px;">添加自定义平台</h4>' +
        '<div style="margin-bottom:8px;"><label style="font-size:10px;color:#64748b;">平台名称 *</label>' +
          '<input id="custName" class="ninja-input" placeholder="如：内推网" style="font-size:12px;"></div>' +
        '<div style="margin-bottom:8px;"><label style="font-size:10px;color:#64748b;">搜索URL模板 *</label>' +
          '<input id="custUrl" class="ninja-input" placeholder="如：https://example.com/search?q={{keyword}}" style="font-size:12px;"></div>' +
        '<p style="font-size:10px;color:#4a4a6a;margin:0 0 12px;">使用 {{keyword}} 和 {{city}} 作为占位符</p>' +
        '<div style="display:flex;gap:6px;justify-content:flex-end;">' +
          '<button id="custCancel" class="btn btn-outline" style="font-size:12px;">取消</button>' +
          '<button id="custSave" class="btn btn-primary" style="font-size:12px;">保存</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('#custCancel').addEventListener('click', function() { document.body.removeChild(overlay); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
    overlay.querySelector('#custSave').addEventListener('click', function() {
      var name = overlay.querySelector('#custName').value.trim();
      var urlTemplate = overlay.querySelector('#custUrl').value.trim();
      if (!name || !urlTemplate) { JN.showToast('请填写名称和URL', 'warning'); return; }
      var custom = loadCustomPlatforms();
      custom.push({
        key: 'custom_' + Date.now().toString(36),
        name: name,
        icon: 'fa-globe',
        color: '#a5b4fc',
        category: '自定义',
        url: function(kw, city) { return urlTemplate.replace(/\{\{keyword\}\}/g, encodeURIComponent(kw)).replace(/\{\{city\}\}/g, encodeURIComponent(city)); }
      });
      saveCustomPlatforms(custom);
      document.body.removeChild(overlay);
      JN.showToast('自定义平台已添加', 'success');
      refreshAllLists(el);
    });
  }

  function handleDelegatedClick(e, el) {
    // 已保存搜索：点击打开 / 删除
    var savedItem = e.target.closest('.js-saved-item');
    if (savedItem && !e.target.closest('.js-saved-del')) {
      var idx = parseInt(savedItem.getAttribute('data-idx'));
      var s = loadSearches()[idx];
      if (s) {
        el.querySelector('#jsKeyword').value = s.keyword;
        el.querySelector('#jsCity').value = s.city;
        // 恢复筛选条件
        if (s.filters) {
          if (s.filters.salary) el.querySelector('#jsSalary').value = s.filters.salary;
          if (s.filters.experience) el.querySelector('#jsExperience').value = s.filters.experience;
          if (s.filters.degree) el.querySelector('#jsDegree').value = s.filters.degree;
          if (s.filters.companySize) el.querySelector('#jsCompanySize').value = s.filters.companySize;
        }
      }
      return;
    }
    var savedDel = e.target.closest('.js-saved-del');
    if (savedDel) {
      var idx2 = parseInt(savedDel.getAttribute('data-idx'));
      var searches = loadSearches(); searches.splice(idx2, 1); saveSearches(searches);
      refreshAllLists(el); return;
    }
    // 收藏：状态更新 / 删除
    var bmStatus = e.target.closest('.js-bm-status');
    if (bmStatus) {
      var i = parseInt(bmStatus.getAttribute('data-idx'));
      var statuses = ['待投递', '已投递', '面试', 'offer', '拒绝'];
      var bm = loadBookmarks();
      var cur = bm[i].status || '待投递';
      var nextIdx = (statuses.indexOf(cur) + 1) % statuses.length;
      bm[i].status = statuses[nextIdx];
      saveBookmarks(bm);
      refreshAllLists(el); return;
    }
    var bmDel = e.target.closest('.js-bm-del');
    if (bmDel) {
      var i2 = parseInt(bmDel.getAttribute('data-idx'));
      var bm2 = loadBookmarks(); bm2.splice(i2, 1); saveBookmarks(bm2);
      refreshAllLists(el); return;
    }
    // 历史：点击重复搜索
    var histItem = e.target.closest('.js-hist-item');
    if (histItem) {
      el.querySelector('#jsKeyword').value = histItem.getAttribute('data-kw');
      el.querySelector('#jsCity').value = histItem.getAttribute('data-city');
      return;
    }
    // 收藏分组切换
    var bmGroup = e.target.closest('.js-bm-group');
    if (bmGroup) {
      var i4 = parseInt(bmGroup.getAttribute('data-idx'));
      var bm3 = loadBookmarks();
      if (bm3[i4]) { bm3[i4].group = bmGroup.value; saveBookmarks(bm3); }
      return;
    }
    // 收藏删除（新版按钮）
    var bmDel2 = e.target.closest('.js-bm-del2');
    if (bmDel2) {
      var i5 = parseInt(bmDel2.getAttribute('data-idx'));
      var bm4 = loadBookmarks(); bm4.splice(i5, 1); saveBookmarks(bm4);
      refreshAllLists(el); return;
    }
    // 自定义平台：删除
    var custDel = e.target.closest('.js-custom-del');
    if (custDel) {
      var i3 = parseInt(custDel.getAttribute('data-idx'));
      var cust = loadCustomPlatforms(); cust.splice(i3, 1); saveCustomPlatforms(cust);
      refreshAllLists(el); return;
    }
  }

  function refreshAllLists(el) {
    var savedList = el.querySelector('#jsSavedList');
    if (savedList) {
      var s = loadSearches();
      savedList.innerHTML = s.length === 0 ? '<span style="font-size:11px;color:#4a4a6a;">暂无</span>' : renderSavedSearches(s);
    }
    var bmList = el.querySelector('#jsBookmarkList');
    if (bmList) {
      var b = loadBookmarks();
      bmList.innerHTML = b.length === 0 ? '<span style="font-size:11px;color:#4a4a6a;">收藏感兴趣的岗位</span>' : renderBookmarksGrouped(b, el);
    }
    var histList = el.querySelector('#jsHistoryList');
    if (histList) histList.innerHTML = renderHistory();
    var custDiv = el.querySelector('#jsCustomPlatforms');
    if (custDiv) custDiv.innerHTML = renderCustomPlatforms();
  }

  // ================================================================
  //  岗位收藏分组 + 批量导出
  // ================================================================

  var BOOKMARK_GROUPS = ['意向强', '意向中', '备选', '已投递', '已面试', '已offer'];

  function getBookmarkGroup(bm) {
    return bm.group || '意向中';
  }

  function batchExportBookmarks() {
    var bookmarks = loadBookmarks();
    if (bookmarks.length === 0) { JN.showToast('暂无可导出的岗位', 'warning'); return; }
    var lines = ['岗位名称\t公司\t城市\t分组\t薪资\t状态\t备注'];
    bookmarks.forEach(function(b) {
      lines.push([b.keyword||'', b.company||'', b.city||'', b.group||'意向中', b.salary||'', b.status||'待投递', b.note||''].join('\t'));
    });
    var text = lines.join('\n');
    var blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'JobNinja_岗位清单_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click(); URL.revokeObjectURL(url);
    JN.showToast('已导出' + bookmarks.length + '个岗位为CSV表格', 'success');
  }

  function renderBookmarkGroups(bookmarks, el) {
    var groupsHtml = '';
    BOOKMARK_GROUPS.forEach(function(group) {
      var groupItems = bookmarks.filter(function(b) { return getBookmarkGroup(b) === group; });
      var statColor = group === '意向强' ? '#10b981' : group === '意向中' ? '#f59e0b' : group === '备选' ? '#6366f1' : group === '已投递' ? '#06b6d4' : group === '已面试' ? '#8b5cf6' : '#34d399';
      groupsHtml += '<div style="margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">' +
          '<span style="font-size:10px;padding:1px 6px;background:' + statColor + '20;color:' + statColor + ';border-radius:3px;">' + group + '</span>' +
          '<span style="font-size:9px;color:#4a4a6a;">' + groupItems.length + '个</span>' +
        '</div>';
      if (groupItems.length === 0) {
        groupsHtml += '<div style="font-size:10px;color:#4a4a6a;padding:4px 0;">空</div>';
      } else {
        groupItems.forEach(function(b, i) {
          var idx = bookmarks.indexOf(b);
          groupsHtml +=
            '<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 6px;margin-bottom:2px;background:#0f0f17;border-radius:4px;font-size:10px;">' +
              '<span style="color:#d1d5db;">' + (b.keyword||'未命名') + (b.company ? ' · ' + b.company : '') + '</span>' +
              '<div style="display:flex;gap:2px;">' +
                '<select class="js-bm-group" data-idx="' + idx + '" style="font-size:8px;padding:1px 3px;background:#0a0a0f;border:1px solid #1a1a26;border-radius:2px;color:#4a4a6a;">' +
                  BOOKMARK_GROUPS.map(function(g) { return '<option value="' + g + '"' + (getBookmarkGroup(b) === g ? ' selected' : '') + '>' + g.substring(0,2) + '</option>'; }).join('') +
                '</select>' +
                '<button class="js-bm-del2" data-idx="' + idx + '" style="font-size:8px;padding:1px 4px;background:none;border:none;color:#4a4a6a;cursor:pointer;">&times;</button>' +
              '</div>' +
            '</div>';
        });
      }
      groupsHtml += '</div>';
    });
    return groupsHtml;
  }

  // 更新收藏列表渲染（使用分组模式）
  function renderBookmarksGrouped(bookmarks, el) {
    if (bookmarks.length === 0) return '<span style="font-size:11px;color:#4a4a6a;">收藏感兴趣的岗位</span>';
    return renderBookmarkGroups(bookmarks, el);
  }

  // 扩展平台：副业/远程/小众行业
  var EXTRA_PLATFORMS = [
    { key: 'upwork',   name: 'Upwork(海外自由职业)', icon: 'fa-globe',     color: '#14b8a6', category: '远程/自由职业',
      url: function(kw,city,f) { return 'https://www.upwork.com/nx/jobs/search/?q=' + encodeURIComponent(kw); } },
    { key: 'fiverr',   name: 'Fiverr(零工/副业)',     icon: 'fa-briefcase', color: '#1dbf73', category: '远程/自由职业',
      url: function(kw,city,f) { return 'https://www.fiverr.com/search/gigs?query=' + encodeURIComponent(kw); } },
    { key: 'kanzhun',  name: '看准网(公司评价)',      icon: 'fa-eye',       color: '#3b82f6', category: '综合',
      url: function(kw,city,f) { return 'https://www.kanzhun.com/jobs?query=' + encodeURIComponent(kw) + '&city=' + encodeURIComponent(city); } }
  ];

  function getAllPlatformsExt() {
    var custom = loadCustomPlatforms();
    return PLATFORMS.concat(EXTRA_PLATFORMS).concat(custom);
  }

  // 更新generateLinks使用扩展平台列表
  var _origGenerateLinks = generateLinks;
  generateLinks = function(keyword, city, filters) {
    return getAllPlatformsExt().map(function(p) {
      return { key: p.key, name: p.name, icon: p.icon, color: p.color, category: p.category || '自定义', url: p.url(keyword, city, filters || {}) };
    });
  };

  // ================================================================
  //  智能搜索建议
  // ================================================================
  function showSearchSuggestions(keyword, inputEl, containerEl) {
    if (!keyword || keyword.length < 1) { containerEl.style.display = 'none'; return; }
    var kw = keyword.toLowerCase();
    var suggestions = [];
    Object.keys(HOT_KEYWORDS).forEach(function(cat) {
      HOT_KEYWORDS[cat].forEach(function(item) {
        if (item.toLowerCase().indexOf(kw) !== -1 && suggestions.indexOf(item) === -1) {
          suggestions.push(item);
        }
      });
    });
    suggestions = suggestions.slice(0, 6);
    if (suggestions.length === 0) { containerEl.style.display = 'none'; return; }
    containerEl.innerHTML = suggestions.map(function(s) {
      return '<div class="search-suggestion-item" data-kw="' + s + '">' +
        '<i class="fa-solid fa-magnifying-glass" style="font-size:10px;color:#64748b;margin-right:6px;"></i>' + s +
      '</div>';
    }).join('');
    containerEl.style.display = 'block';
    containerEl.querySelectorAll('.search-suggestion-item').forEach(function(item) {
      item.addEventListener('mousedown', function(e) {
        e.preventDefault();
        inputEl.value = this.getAttribute('data-kw');
        containerEl.style.display = 'none';
        inputEl.focus();
      });
    });
  }

  // ================================================================
  //  岗位对比弹窗（最多3个）
  // ================================================================
  function showJobCompareModal(selectedBookmarks) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;';
    var cols = selectedBookmarks.map(function(bm) {
      return '<th style="padding:8px 12px;font-size:12px;color:#e2e8f0;background:#1e1e32;border:1px solid #252536;min-width:160px;">' + (bm.title || '未命名') + '</th>';
    }).join('');
    var fields = [
      { key: 'company', label: '公司' },
      { key: 'city', label: '城市' },
      { key: 'salary', label: '薪资' },
      { key: 'status', label: '状态' },
      { key: 'note', label: '备注' }
    ];
    var rows = fields.map(function(f) {
      var cells = selectedBookmarks.map(function(bm) {
        return '<td style="padding:8px 12px;font-size:11px;color:#94a3b8;border:1px solid #1a1a26;">' + (bm[f.key] || '-') + '</td>';
      }).join('');
      return '<tr><td style="padding:8px 12px;font-size:11px;color:#64748b;font-weight:600;background:#12121a;border:1px solid #1a1a26;white-space:nowrap;">' + f.label + '</td>' + cells + '</tr>';
    }).join('');

    overlay.innerHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;padding:0;width:95%;max-width:700px;max-height:80vh;display:flex;flex-direction:column;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #1a1a26;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<i class="fa-solid fa-table-columns" style="color:#6366f1;"></i>' +
            '<span style="font-size:14px;font-weight:600;color:#e2e8f0;">岗位对比</span>' +
          '</div>' +
          '<button id="compareClose" style="background:none;border:none;color:#4a4a6a;cursor:pointer;font-size:18px;">&times;</button>' +
        '</div>' +
        '<div style="padding:16px 18px;overflow:auto;flex:1;" class="custom-scrollbar">' +
          '<table class="compare-table" style="width:100%;border-collapse:collapse;">' +
            '<thead><tr><th style="padding:8px 12px;font-size:11px;color:#64748b;background:#12121a;border:1px solid #1a1a26;"></th>' + cols + '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#compareClose').addEventListener('click', function() { document.body.removeChild(overlay); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
  }

  JN.registerPanel({
    id: 'jobsearch',
    title: '找工作',
    icon: 'fa-magnifying-glass',
    render: render,
    onActivate: function() {
      // 处理跨面板跳转数据
      var jumpData = JN.getJumpData ? JN.getJumpData() : null;
      if (jumpData) {
        setTimeout(function() {
          var kwEl = document.querySelector('#jsKeyword');
          var cityEl = document.querySelector('#jsCity');
          if (kwEl && jumpData.keyword) kwEl.value = jumpData.keyword;
          if (cityEl && jumpData.city) cityEl.value = jumpData.city;
        }, 200);
      }
    }
  });

})();
