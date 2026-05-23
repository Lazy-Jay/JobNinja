/**
 * JobNinja — settings.js
 * LLM控制台：厂商预设 | 配置档案管理 | 默认参数 | 数据管理
 */
(function () {
  if (!window.JobNinja) return;
  var JN = window.JobNinja;

  // ================================================================
  //  CONSTANTS
  // ================================================================
  var STORAGE_KEY     = 'jobninja_settings';
  var STORAGE_APIKEY  = 'jobninja_apikey';
  var STORAGE_PROFILES = 'jobninja_profiles';

  var XOR_SEED = 0x5A;
  function obfuscate(str) {
    var out = '';
    for (var i = 0; i < str.length; i++) out += String.fromCharCode(str.charCodeAt(i) ^ XOR_SEED);
    return btoa(out);
  }
  function deobfuscate(encoded) {
    try { var raw = atob(encoded), out = ''; for (var i = 0; i < raw.length; i++) out += String.fromCharCode(raw.charCodeAt(i) ^ XOR_SEED); return out; }
    catch (_) { return ''; }
  }

  // 厂商预设
  var VENDOR_PRESETS = [
    { name: 'OpenAI',        proto: 'openai', url: 'https://api.openai.com/v1/chat/completions', icon: 'fa-brain', color: '#10a37f' },
    { name: 'Claude / Anthropic', proto: 'claude', url: 'https://api.anthropic.com/v1/messages', icon: 'fa-feather', color: '#d4a574' },
    { name: 'Gemini / Google',   proto: 'gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models', icon: 'fa-gem', color: '#4285f4' },
    { name: 'DeepSeek',      proto: 'openai', url: 'https://api.deepseek.com/v1/chat/completions', icon: 'fa-dragon', color: '#6366f1' },
    { name: '通义千问 / Qwen', proto: 'openai', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', icon: 'fa-cloud', color: '#615eed' },
    { name: '文心一言 / 百度', proto: 'openai', url: 'https://qianfan.baidubce.com/v2/chat/completions', icon: 'fa-paw', color: '#2468f2' },
    { name: '智谱 GLM',      proto: 'openai', url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', icon: 'fa-microchip', color: '#3b82f6' },
    { name: '字节豆包 / Doubao', proto: 'openai', url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', icon: 'fa-bolt', color: '#f59e0b' },
    { name: '腾讯混元',      proto: 'openai', url: 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions', icon: 'fa-circle-nodes', color: '#00a4ff' },
    { name: '讯飞星火',      proto: 'openai', url: 'https://spark-api-open.xf-yun.com/v1/chat/completions', icon: 'fa-star', color: '#f97316' }
  ];

  var PROTO_LABELS = { openai: 'OpenAI 兼容', claude: 'Claude 兼容', gemini: 'Gemini 兼容' };
  var COMMON_MODELS = ['deepseek-chat','gpt-4o','gpt-4o-mini','claude-3-opus','claude-3-sonnet','gemini-pro','qwen-turbo','glm-4-flash','doubao-pro-32k','hunyuan-pro','spark-max'];

  // ================================================================
  //  STATE
  // ================================================================
  function loadSettings() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (_) { return {}; } }
  function saveSettings(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  function loadApiKey() { var enc = localStorage.getItem(STORAGE_APIKEY); return enc ? deobfuscate(enc) : ''; }
  function saveApiKey(key) { if (key) localStorage.setItem(STORAGE_APIKEY, obfuscate(key)); else localStorage.removeItem(STORAGE_APIKEY); }
  function loadProfiles() { try { return JSON.parse(localStorage.getItem(STORAGE_PROFILES)) || []; } catch (_) { return []; } }
  function saveProfiles(list) { localStorage.setItem(STORAGE_PROFILES, JSON.stringify(list)); }

  function estimateStorageSize() {
    var total = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k.indexOf('jobninja_') === 0) total += k.length + (localStorage.getItem(k) || '').length;
    }
    return Math.round(total * 2 / 1024 * 10) / 10;
  }

  /** 渲染已拉取的模型标签列表（可点击切换） */
  function renderModelTags(el, models) {
    var container = el.querySelector('#fetchedModelTags');
    if (!container) return;
    var currentModel = (el.querySelector('#cfgModel') || {}).value || '';
    var unique = models.filter(function(v, i, a) { return a.indexOf(v) === i; }).slice(0, 60);
    container.innerHTML = '<span style="font-size:9px;color:#4a4a6a;">点击切换：</span>' +
      unique.map(function(m) {
        var isActive = m === currentModel;
        return '<span class="model-tag" data-model="' + m.replace(/"/g, '&quot;') + '" style="display:inline-block;font-size:10px;padding:3px 8px;margin:2px;' +
          'background:' + (isActive ? '#312e81' : '#0f0f17') + ';border:1px solid ' + (isActive ? '#6366f1' : '#1a1a26') + ';' +
          'border-radius:12px;color:' + (isActive ? '#c7d2fe' : '#94a3b8') + ';cursor:pointer;transition:all 0.1s;' +
          'max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"' +
          ' title="' + m + '">' + m + '</span>';
      }).join('');
    container.querySelectorAll('.model-tag').forEach(function(tag) {
      tag.addEventListener('click', function() {
        var modelName = this.getAttribute('data-model');
        var input = el.querySelector('#cfgModel');
        if (input) input.value = modelName;
        container.querySelectorAll('.model-tag').forEach(function(t) {
          t.style.background = '#0f0f17'; t.style.borderColor = '#1a1a26'; t.style.color = '#94a3b8';
        });
        this.style.background = '#312e81'; this.style.borderColor = '#6366f1'; this.style.color = '#c7d2fe';
        JN.showToast('已选择模型：' + modelName, 'info');
      });
    });
  }

  // ================================================================
  //  获取当前激活的 API 配置（给其他模块用）
  // ================================================================
  function getActiveConfig() {
    var settings = loadSettings();
    var profiles = loadProfiles();
    var activeId = settings.activeProfile;
    if (activeId) {
      var active = profiles.filter(function(p){return p.id===activeId;})[0];
      if (active) return {
        endpoint: active.url || 'https://api.deepseek.com/v1/chat/completions',
        apiKey: deobfuscate(active.apiKey || loadApiKey() || ''),
        textModel: active.model || settings.textModel || 'deepseek-chat',
        visionModel: settings.visionModel || ''
      };
    }
    return {
      endpoint: settings.apiEndpoint || 'https://api.deepseek.com/v1/chat/completions',
      apiKey: loadApiKey(),
      textModel: settings.textModel || 'deepseek-chat',
      visionModel: settings.visionModel || ''
    };
  }

  // ================================================================
  //  RENDER
  // ================================================================
  function render() {
    var settings = loadSettings();
    var apiKey = loadApiKey();
    var profiles = loadProfiles();
    var activeId = settings.activeProfile || '';
    var el = document.createElement('div');

    // 当前编辑态
    var editState = {
      profileId: null,
      name: '',
      proto: 'openai',
      url: settings.apiEndpoint || 'https://api.deepseek.com/v1/chat/completions',
      key: apiKey,
      model: settings.textModel || 'deepseek-chat',
      showKey: false
    };

    // ---- 渲染整个 HTML ----
    el.innerHTML =
      // 标题 + 状态栏
      '<div style="margin-bottom:16px;">' +
        '<h2 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">' +
          '<i class="fa-solid fa-cog" style="color:#a5b4fc;margin-right:8px;"></i>设置</h2>' +
        '<p style="font-size:13px;color:#64748b;margin:0;">本地模式 · 高级增强 · 数据管理</p>' +
      '</div>' +

      // 本地模式状态横幅
      '<div style="margin-bottom:14px;padding:10px 14px;background:#064e3b;border:1px solid #065f46;border-radius:8px;display:flex;align-items:center;gap:10px;">' +
        '<i class="fa-solid fa-shield-halved" style="color:#34d399;font-size:16px;"></i>' +
        '<div>' +
          '<span style="font-size:13px;font-weight:600;color:#6ee7b7;">本地模式运行中</span>' +
          '<span style="font-size:11px;color:#34d399;display:block;">无需API，80%核心功能已可用。下方配置API可启用AI增强功能（完全可选）。</span>' +
        '</div>' +
      '</div>' +

      // ---- 标签页 ----
      '<div style="display:flex;gap:0;margin-bottom:0;">' +
        '<button id="tabLLM" class="tab-nav-btn active" style="padding:8px 20px;background:#12121a;border:1px solid #1a1a26;border-bottom:none;border-radius:8px 8px 0 0;color:#d1d5db;font-size:13px;font-weight:600;cursor:pointer;">' +
          '<i class="fa-solid fa-robot" style="margin-right:6px;color:#818cf8;"></i>LLM 设置</button>' +
        '<button id="tabEmbed" class="tab-nav-btn" style="padding:8px 20px;background:transparent;border:1px solid transparent;border-bottom:none;border-radius:8px 8px 0 0;color:#4a4a6a;font-size:13px;font-weight:500;cursor:pointer;">' +
          '<i class="fa-solid fa-puzzle-piece" style="margin-right:6px;color:#4a4a6a;"></i>嵌入模型</button>' +
        '<div style="flex:1;border-bottom:1px solid #1a1a26;"></div>' +
      '</div>' +

      // ---- LLM 设置内容 ----
      '<div id="panelLLM" style="background:#12121a;border:1px solid #1a1a26;border-top:none;border-radius:0 0 10px 10px;padding:16px;margin-bottom:14px;">' +

        // 激活状态栏
        '<div id="activeBar" style="margin-bottom:14px;padding:8px 14px;background:' + (activeId ? '#064e3b' : '#1a1a26') + ';border:1px solid ' + (activeId ? '#065f46' : '#252536') + ';border-radius:8px;display:flex;align-items:center;justify-content:space-between;">' +
          '<span style="font-size:12px;">' +
            '<i class="fa-solid fa-circle-check" style="color:' + (activeId ? '#34d399' : '#4a4a6a') + ';margin-right:6px;"></i>' +
            '当前：<strong style="color:#d1d5db;">' + (activeId ? (profiles.filter(function(p){return p.id===activeId;})[0]||{}).name||'未命名' : '本地模式（未配置API）') + '</strong>' +
            '<span style="color:#4a4a6a;font-size:10px;margin-left:4px;">' + (activeId ? (editState.model || '') : '无需API') + '</span>' +
          '</span>' +
        '</div>' +

        // 三栏：左侧档案 | 中间厂商卡片 | 右侧表单
        '<div style="display:grid;grid-template-columns:180px 1fr 300px;gap:14px;">' +

          // ===== 左栏：配置档案 =====
          '<div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
              '<span style="font-size:11px;font-weight:600;color:#64748b;">配置档案</span>' +
              '<button id="btnNewProfile" style="font-size:10px;padding:2px 8px;background:transparent;border:1px solid #312e81;border-radius:4px;color:#a5b4fc;cursor:pointer;">' +
                '<i class="fa-solid fa-plus"></i> 新建</button>' +
            '</div>' +
            '<div id="profileList" style="max-height:280px;overflow-y:auto;" class="custom-scrollbar">' +
              renderProfileList(profiles, activeId) +
            '</div>' +
          '</div>' +

          // ===== 中间栏：导入厂商预设 =====
          '<div>' +
            '<div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:8px;">' +
              '<i class="fa-solid fa-puzzle-piece" style="margin-right:4px;"></i>导入厂商预设</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
              VENDOR_PRESETS.map(function(v) {
                return '<div class="vendor-card" data-name="' + v.name + '" style="padding:8px 10px;background:#0f0f17;border:1px solid #1a1a26;border-radius:7px;cursor:pointer;transition:all 0.12s;"' +
                  ' onmouseenter="this.style.borderColor=\'' + v.color + '40\'" onmouseleave="this.style.borderColor=\'#1a1a26\'">' +
                  '<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">' +
                    '<i class="fa-solid ' + v.icon + '" style="color:' + v.color + ';font-size:13px;"></i>' +
                    '<span style="font-size:11px;font-weight:600;color:#d1d5db;">' + v.name + '</span>' +
                  '</div>' +
                  '<div style="display:flex;align-items:center;justify-content:space-between;">' +
                    '<span style="font-size:9px;padding:1px 5px;background:' + v.color + '18;color:' + v.color + ';border-radius:3px;">' + (PROTO_LABELS[v.proto]||v.proto) + '</span>' +
                    '<span style="font-size:9px;color:#4a4a6a;">一键导入</span>' +
                  '</div>' +
                '</div>';
              }).join('') +
            '</div>' +
            '<p style="font-size:10px;color:#374151;margin:6px 0 0;">点击任意厂商卡片自动填入 Base URL 和协议类型</p>' +
          '</div>' +

          // ===== 右栏：配置表单 =====
          '<div>' +
            '<div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:8px;">详细配置</div>' +

            // 配置名称
            '<div style="margin-bottom:6px;">' +
              '<label style="font-size:10px;color:#4a4a6a;display:block;margin-bottom:2px;">配置名称</label>' +
              '<input id="cfgName" class="ninja-input" placeholder="给这个配置起个名字" style="font-size:11px;padding:5px 10px;" value="' + editState.name + '">' +
            '</div>' +

            // 协议类型
            '<div style="margin-bottom:6px;">' +
              '<label style="font-size:10px;color:#4a4a6a;display:block;margin-bottom:2px;">协议类型</label>' +
              '<select id="cfgProto" class="ninja-input" style="font-size:11px;padding:5px 10px;">' +
                '<option value="openai"' + (editState.proto==='openai'?' selected':'') + '>OpenAI 兼容</option>' +
                '<option value="claude"' + (editState.proto==='claude'?' selected':'') + '>Claude 兼容</option>' +
                '<option value="gemini"' + (editState.proto==='gemini'?' selected':'') + '>Gemini 兼容</option>' +
              '</select>' +
            '</div>' +

            // Base URL
            '<div style="margin-bottom:6px;">' +
              '<label style="font-size:10px;color:#4a4a6a;display:block;margin-bottom:2px;">API 地址</label>' +
              '<input id="cfgUrl" class="ninja-input" placeholder="https://api.deepseek.com/v1/chat/completions" style="font-size:11px;padding:5px 10px;" value="' + editState.url + '">' +
            '</div>' +

            // API Key
            '<div style="margin-bottom:6px;">' +
              '<label style="font-size:10px;color:#4a4a6a;display:block;margin-bottom:2px;">API 密钥</label>' +
              '<div style="display:flex;gap:4px;">' +
                '<input id="cfgKey" type="password" class="ninja-input" placeholder="sk-..." style="font-size:11px;padding:5px 10px;flex:1;" value="' + (editState.key ? '••••••••••••••••' : '') + '">' +
                '<button id="btnToggleCfgKey" class="btn btn-outline" style="font-size:10px;padding:4px 8px;flex-shrink:0;"><i class="fa-solid fa-eye"></i></button>' +
              '</div>' +
            '</div>' +

            // 模型名称（下拉选择 + 可手动输入）
            '<div style="margin-bottom:8px;">' +
              '<label style="font-size:10px;color:#4a4a6a;display:block;margin-bottom:2px;">模型名称</label>' +
              '<div style="display:flex;gap:4px;">' +
                '<input id="cfgModel" class="ninja-input" list="cfgModelList" placeholder="先填API地址和密钥，然后点「拉取模型」" style="font-size:11px;padding:5px 10px;flex:1;" value="' + editState.model + '">' +
                '<datalist id="cfgModelList">' + COMMON_MODELS.map(function(m){return '<option value="'+m+'">';}).join('') + '</datalist>' +
              '</div>' +
              '<div id="fetchedModelTags" style="margin-top:5px;display:flex;flex-wrap:wrap;gap:4px;"></div>' +
            '</div>' +

            // 按钮组
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:6px;">' +
              '<button id="btnTestConn2" class="btn btn-outline" style="font-size:10px;padding:6px 8px;width:100%;"><i class="fa-solid fa-plug"></i> 测试连接</button>' +
              '<button id="btnFetchModels2" class="btn btn-outline" style="font-size:10px;padding:6px 8px;width:100%;"><i class="fa-solid fa-arrows-rotate"></i> 拉取模型</button>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">' +
              '<button id="btnSaveProfile" class="btn btn-primary" style="font-size:10px;padding:6px 8px;width:100%;"><i class="fa-solid fa-floppy-disk"></i> 保存配置</button>' +
              '<button id="btnActivateProfile" class="btn btn-outline" style="font-size:10px;padding:6px 8px;width:100%;background:#1e1e32;border-color:#312e81;color:#a5b4fc;"><i class="fa-solid fa-circle-check"></i> 设为启用</button>' +
            '</div>' +
            '<div id="cfgStatus" style="font-size:10px;color:#4a4a6a;margin-top:6px;text-align:center;"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // ---- 嵌入模型面板（默认隐藏） ----
      '<div id="panelEmbed" style="display:none;background:#12121a;border:1px solid #1a1a26;border-top:none;border-radius:0 0 10px 10px;padding:20px;margin-bottom:14px;">' +
        '<div class="empty-state" style="padding:40px 20px;">' +
          '<i class="fa-solid fa-puzzle-piece"></i><h3>嵌入模型</h3><p>用于识图等功能的视觉模型配置。在 LLM 设置中配置视觉模型后即可使用。</p>' +
        '</div>' +
      '</div>' +

      // ===== 默认参数（保持不变） =====
      '<div class="panel-card" style="margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #1a1a26;">' +
          '<i class="fa-solid fa-sliders" style="color:#10b981;"></i>' +
          '<span style="font-size:13px;font-weight:600;color:#d1d5db;">默认参数</span>' +
          '<span style="font-size:10px;color:#4a4a6a;">供各面板自动填充使用</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
          '<div><label style="font-size:11px;color:#64748b;display:block;margin-bottom:3px;">默认城市</label>' +
            '<input id="settingCity" class="ninja-input" placeholder="如：北京、上海、深圳" style="font-size:12px;" value="' + (settings.city || '') + '"></div>' +
          '<div><label style="font-size:11px;color:#64748b;display:block;margin-bottom:3px;">工作年限</label>' +
            '<select id="settingYears" class="ninja-input" style="font-size:12px;">' +
              '<option value="">不限</option>' +
              [1,2,3,5,7,10,15].map(function(y){return '<option value="'+y+'"'+(settings.years==y?' selected':'')+'>'+y+'年</option>';}).join('') +
            '</select></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
          '<div><label style="font-size:11px;color:#64748b;display:block;margin-bottom:3px;">期望薪资下限（K/月）</label>' +
            '<input id="settingSalaryMin" class="ninja-input" type="number" placeholder="如：15" style="font-size:12px;" value="' + (settings.salaryMin || '') + '"></div>' +
          '<div><label style="font-size:11px;color:#64748b;display:block;margin-bottom:3px;">期望薪资上限（K/月）</label>' +
            '<input id="settingSalaryMax" class="ninja-input" type="number" placeholder="如：30" style="font-size:12px;" value="' + (settings.salaryMax || '') + '"></div>' +
        '</div>' +
        '<button id="btnResetDefaults" class="btn btn-outline" style="font-size:10px;padding:4px 10px;margin-top:6px;">' +
          '<i class="fa-solid fa-arrow-rotate-left"></i> 恢复默认设置</button>' +
      '</div>' +

      // ===== 存储空间监控 =====
      '<div id="storageMonitor" class="panel-card" style="margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
          '<i class="fa-solid fa-hard-drive" style="color:#06b6d4;"></i>' +
          '<span style="font-size:13px;font-weight:600;color:#d1d5db;">存储空间</span>' +
        '</div>' +
        '<div id="storageStats"></div>' +
      '</div>' +

      // ===== 数据管理（保持不变） =====
      '<div class="panel-card" style="margin-bottom:12px;border-color:#3b1414;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #3b1414;">' +
          '<i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;"></i>' +
          '<span style="font-size:13px;font-weight:600;color:#fca5a5;">数据管理</span>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">' +
          '<button id="btnBackupAll" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;background:#064e3b;border:1px solid #065f46;border-radius:7px;color:#6ee7b7;font-size:12px;cursor:pointer;">' +
            '<i class="fa-solid fa-box-archive"></i> 全量备份</button>' +
          '<button id="btnExportData" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;background:transparent;border:1px solid #1a1a26;border-radius:7px;color:#a5b4fc;font-size:12px;cursor:pointer;">' +
            '<i class="fa-solid fa-download"></i> 导出数据</button>' +
          '<label style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;background:transparent;border:1px solid #1a1a26;border-radius:7px;color:#a5b4fc;font-size:12px;cursor:pointer;">' +
            '<i class="fa-solid fa-upload"></i> 导入数据<input type="file" id="fileImport" accept=".json" style="display:none;"></label>' +
        '</div>' +
        '<p style="font-size:12px;color:#64748b;margin-bottom:12px;line-height:1.5;">所有数据存储在浏览器 localStorage 中。<strong style="color:#fca5a5;">清除后不可恢复。</strong>建议定期导出备份。</p>' +
        '<button id="btnClearData" style="display:inline-flex;align-items:center;gap:6px;padding:7px 18px;background:transparent;border:1px solid #7f1d1d;border-radius:7px;color:#fca5a5;font-size:12px;cursor:pointer;transition:all 0.12s;"' +
          ' onmouseenter="this.style.background=\'#3b1414\'" onmouseleave="this.style.background=\'transparent\'">' +
          '<i class="fa-solid fa-trash-can"></i> 清除所有本地数据</button>' +
      '</div>' +

      // 底部
      '<div style="display:flex;justify-content:space-between;font-size:10px;color:#374151;">' +
        '<span>本地存储用量：约 ' + estimateStorageSize() + ' KB</span>' +
        '<span>JobNinja v1.0.0</span>' +
      '</div>';

    // ================================================================
    //  辅助渲染函数
    // ================================================================
    function renderProfileList(list, active) {
      if (list.length === 0) return '<div style="text-align:center;padding:20px;color:#374151;font-size:11px;">暂无配置档案</div>';
      return list.map(function(p) {
        var isActive = p.id === active;
        return '<div class="profile-item" data-pid="' + p.id + '" style="padding:8px 10px;margin-bottom:4px;background:' + (isActive ? '#0f1a1a' : '#0f0f17') + ';border:1px solid ' + (isActive ? '#065f46' : '#1a1a26') + ';border-radius:6px;cursor:pointer;transition:all 0.12s;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">' +
            '<span style="font-size:11px;font-weight:600;color:' + (isActive ? '#34d399' : '#d1d5db') + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px;">' + (isActive ? '<i class="fa-solid fa-circle-check" style="font-size:8px;margin-right:3px;"></i>' : '') + (p.name || '未命名') + '</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:4px;">' +
            '<span style="font-size:9px;color:#4a4a6a;">' + (PROTO_LABELS[p.proto]||p.proto) + '</span>' +
            '<span style="font-size:9px;color:#374151;">' + (p.model||'') + '</span>' +
          '</div>' +
          '<div style="display:flex;gap:3px;margin-top:4px;">' +
            '<button class="btn-profile-delete" data-pid="' + p.id + '" style="font-size:8px;padding:1px 5px;background:transparent;border:1px solid #3b1414;border-radius:3px;color:#fca5a5;cursor:pointer;">删除</button>' +
            '<button class="btn-profile-copy" data-pid="' + p.id + '" style="font-size:8px;padding:1px 5px;background:transparent;border:1px solid #1a1a26;border-radius:3px;color:#4a4a6a;cursor:pointer;">复制</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function refreshProfileList() {
      var listEl = el.querySelector('#profileList');
      var activeIdNow = loadSettings().activeProfile || '';
      if (listEl) listEl.innerHTML = renderProfileList(loadProfiles(), activeIdNow);
      // 更新激活栏
      var bar = el.querySelector('#activeBar');
      if (bar) {
        var profilesNow = loadProfiles();
        var activeNow = profilesNow.filter(function(p){return p.id===activeIdNow;})[0];
        if (activeNow) {
          bar.style.background = '#064e3b'; bar.style.borderColor = '#065f46';
          bar.innerHTML = '<span style="font-size:12px;"><i class="fa-solid fa-circle-check" style="color:#34d399;margin-right:6px;"></i>当前激活：<strong style="color:#d1d5db;">' + (activeNow.name||'未命名') + '</strong><span style="color:#4a4a6a;font-size:10px;margin-left:4px;">' + (activeNow.model||'') + '</span></span>';
        } else {
          bar.style.background = '#1a1a26'; bar.style.borderColor = '#252536';
          bar.innerHTML = '<span style="font-size:12px;"><i class="fa-solid fa-circle-check" style="color:#4a4a6a;margin-right:6px;"></i>当前激活：<strong style="color:#d1d5db;">默认配置</strong></span>';
        }
      }
    }

    // ================================================================
    //  事件绑定
    // ================================================================

    // 读取当前表单值
    function getFormValues() {
      return {
        name: (el.querySelector('#cfgName')||{}).value || '',
        proto: (el.querySelector('#cfgProto')||{}).value || 'openai',
        url: (el.querySelector('#cfgUrl')||{}).value || '',
        key: editState.key,
        model: (el.querySelector('#cfgModel')||{}).value || ''
      };
    }

    // 填充表单值
    function setFormValues(vals) {
      var n = el.querySelector('#cfgName'); if (n) n.value = vals.name || '';
      var p = el.querySelector('#cfgProto'); if (p) p.value = vals.proto || 'openai';
      var u = el.querySelector('#cfgUrl'); if (u) u.value = vals.url || '';
      var m = el.querySelector('#cfgModel'); if (m) m.value = vals.model || '';
      editState.key = vals.key || '';
      editState.showKey = false;
      var k = el.querySelector('#cfgKey'); if (k) { k.value = vals.key ? '••••••••••••••••' : ''; k.type = 'password'; }
      var tb = el.querySelector('#btnToggleCfgKey'); if (tb) tb.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }

    // 加载配置到表单
    function loadProfileToForm(profile) {
      editState.profileId = profile.id;
      setFormValues({ name: profile.name, proto: profile.proto||'openai', url: profile.url, key: deobfuscate(profile.apiKey||''), model: profile.model });
    }

    // ---- 标签页切换 ----
    el.querySelector('#tabLLM').addEventListener('click', function(){
      el.querySelector('#panelLLM').style.display = 'block';
      el.querySelector('#panelEmbed').style.display = 'none';
      this.classList.add('active'); this.style.background = '#12121a'; this.style.borderColor = '#1a1a26'; this.style.color = '#d1d5db';
      var t2 = el.querySelector('#tabEmbed'); t2.classList.remove('active'); t2.style.background = 'transparent'; t2.style.borderColor = 'transparent'; t2.style.color = '#4a4a6a';
    });
    el.querySelector('#tabEmbed').addEventListener('click', function(){
      el.querySelector('#panelLLM').style.display = 'none';
      el.querySelector('#panelEmbed').style.display = 'block';
      this.classList.add('active'); this.style.background = '#12121a'; this.style.borderColor = '#1a1a26'; this.style.color = '#d1d5db';
      var t1 = el.querySelector('#tabLLM'); t1.classList.remove('active'); t1.style.background = 'transparent'; t1.style.borderColor = 'transparent'; t1.style.color = '#4a4a6a';
    });

    // ---- 厂商预设卡片 ----
    el.querySelectorAll('.vendor-card').forEach(function(card){
      card.addEventListener('click', function(){
        var name = this.getAttribute('data-name');
        var vendor = VENDOR_PRESETS.filter(function(v){return v.name===name;})[0];
        if (!vendor) return;
        var fn = el.querySelector('#cfgName'); if (fn && !fn.value) fn.value = vendor.name;
        var fp = el.querySelector('#cfgProto'); if (fp) fp.value = vendor.proto;
        var fu = el.querySelector('#cfgUrl'); if (fu) fu.value = vendor.url;
        JN.showToast('已导入「' + vendor.name + '」预设', 'success');
      });
    });

    // ---- API Key 显示/隐藏 ----
    el.querySelector('#btnToggleCfgKey').addEventListener('click', function(){
      var inp = el.querySelector('#cfgKey');
      if (!editState.showKey) {
        inp.type = 'text'; inp.value = editState.key; editState.showKey = true;
        this.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
      } else {
        inp.type = 'password'; inp.value = editState.key ? '••••••••••••••••' : ''; editState.showKey = false;
        this.innerHTML = '<i class="fa-solid fa-eye"></i>';
      }
    });
    el.querySelector('#cfgKey').addEventListener('change', function(){
      if (this.type === 'text') { editState.key = this.value.trim(); }
    });

    // ---- 新建配置档案 ----
    el.querySelector('#btnNewProfile').addEventListener('click', function(){
      editState.profileId = null;
      setFormValues({ name: '', proto: 'openai', url: 'https://api.deepseek.com/v1/chat/completions', key: '', model: 'deepseek-chat' });
      JN.showToast('已新建空白配置，请填写后保存', 'info');
    });

    // ---- 测试连接 ----
    el.querySelector('#btnTestConn2').addEventListener('click', function(){
      var btn = this;
      var vals = getFormValues();
      var key = editState.key;
      if (!key) { JN.showToast('请先输入 API 密钥', 'warning'); return; }
      var statusEl = el.querySelector('#cfgStatus');
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      statusEl.innerHTML = '<span style="color:#6366f1;">测试中...</span>';

      var controller = new AbortController();
      var timeoutId = setTimeout(function(){controller.abort();}, 5000);

      fetch(vals.url.replace(/\/chat\/completions\/?$/, '').replace(/\/+$/, '') + '/models', {
        headers: {'Content-Type':'application/json','Authorization':'Bearer '+key},
        signal: controller.signal
      })
      .then(function(res){
        clearTimeout(timeoutId);
        if (res.ok) {
          statusEl.innerHTML = '<span style="color:#10b981;"><i class="fa-solid fa-circle-check"></i> 连接成功</span>';
          JN.showToast('API 连接测试成功', 'success');
        } else {
          statusEl.innerHTML = '<span style="color:#ef4444;">连接失败（HTTP ' + res.status + '）</span>';
          JN.showToast('连接失败：HTTP ' + res.status, 'error');
        }
      })
      .catch(function(err){
        clearTimeout(timeoutId);
        var msg = err.name === 'AbortError' ? '请求超时' : (err.message||'网络错误');
        statusEl.innerHTML = '<span style="color:#ef4444;">连接失败：' + msg + '</span>';
        JN.showToast('连接失败：' + msg, 'error');
      })
      .finally(function(){ btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-plug"></i> 测试连接'; });
    });

    // ---- 拉取模型（自动检测环境：本地直连 / 在线走代理） ----
    function parseModelData(data) {
      var models = [];
      if (Array.isArray(data.data)) models = data.data.map(function(m){return m.id||m.model||'';});
      else if (Array.isArray(data.models)) models = data.models.map(function(m){return m.id||m.model||'';});
      else if (Array.isArray(data)) models = data.map(function(m){return typeof m==='string'?m:(m.id||m.model||'');});
      return models.filter(Boolean).sort();
    }

    function isLocalhost() {
      var h = window.location.hostname;
      return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.');
    }

    el.querySelector('#btnFetchModels2').addEventListener('click', function(){
      var btn = this;
      var vals = getFormValues();
      var key = editState.key;
      if (!key) { JN.showToast('请先输入 API 密钥', 'warning'); return; }
      var statusEl = el.querySelector('#cfgStatus');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      statusEl.innerHTML = '<span style="color:#6366f1;">正在拉取模型列表...</span>';

      var modelsUrl = vals.url.replace(/\/chat\/completions\/?$/i, '').replace(/\/+$/, '') + '/models';

      // 本地环境：直接请求，不走代理
      if (isLocalhost()) {
        statusEl.innerHTML = '<span style="color:#6366f1;">本地环境，直连请求...</span>';

        var ctrlLocal = new AbortController();
        var tidLocal = setTimeout(function(){ctrlLocal.abort();}, 5000);

        fetch(modelsUrl, {
          headers: {'Content-Type':'application/json','Authorization':'Bearer '+key},
          signal: ctrlLocal.signal
        })
        .then(function(res){
          clearTimeout(tidLocal);
          if (!res.ok) throw new Error('HTTP '+res.status);
          return res.json();
        })
        .then(function(data){
          clearTimeout(tidLocal);
          var models = parseModelData(data);
          if (models.length > 0) {
            var list = el.querySelector('#cfgModelList');
            if (list) list.innerHTML = models.map(function(m){return '<option value="'+m+'">';}).join('');
            renderModelTags(el, models);
            statusEl.innerHTML = '<span style="color:#10b981;"><i class="fa-solid fa-circle-check"></i> 模型列表拉取成功（' + models.length + ' 个模型）</span>';
            JN.showToast('模型列表拉取成功，点击下方标签快速切换模型', 'success');
          } else {
            statusEl.innerHTML = '<span style="color:#f59e0b;">未获取到模型列表</span>';
            JN.showToast('未获取到模型列表，请手动输入模型名称', 'warning');
          }
        })
        .catch(function(err){
          clearTimeout(tidLocal);
          var msg = err.name === 'AbortError' ? '请求超时' : (err.message||'网络错误');
          statusEl.innerHTML = '<span style="color:#f59e0b;">拉取失败：' + msg + '，请手动输入模型名称</span>';
          JN.showToast('拉取失败：' + msg, 'warning');
        })
        .finally(function(){ btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> 拉取模型'; });
        return;
      }

      // 在线环境：使用 /api/proxy POST 代理
      statusEl.innerHTML = '<span style="color:#6366f1;">在线环境，通过代理请求...</span>';

      var ctrlProxy = new AbortController();
      var tidProxy = setTimeout(function(){ctrlProxy.abort();}, 8000);

      fetch('/api/proxy', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ url: modelsUrl }),
        signal: ctrlProxy.signal
      })
      .then(function(res){
        clearTimeout(tidProxy);
        if (!res.ok) throw new Error('代理返回 HTTP '+res.status);
        return res.json();
      })
      .then(function(data){
        clearTimeout(tidProxy);
        var models = parseModelData(data);
        if (models.length > 0) {
          var list = el.querySelector('#cfgModelList');
          if (list) list.innerHTML = models.map(function(m){return '<option value="'+m+'">';}).join('');
          statusEl.innerHTML = '<span style="color:#10b981;"><i class="fa-solid fa-circle-check"></i> 模型列表拉取成功（' + models.length + ' 个模型）</span>';
          JN.showToast('模型列表拉取成功', 'success');
        } else {
          statusEl.innerHTML = '<span style="color:#f59e0b;">未获取到模型列表，请手动输入模型名称</span>';
          JN.showToast('未获取到模型列表，请手动输入模型名称', 'warning');
        }
      })
      .catch(function(err){
        clearTimeout(tidProxy);
        var msg = err.name === 'AbortError' ? '代理请求超时' : (err.message||'代理不可用');
        statusEl.innerHTML = '<span style="color:#f59e0b;">拉取失败：' + msg + '，请手动输入模型名称</span>';
        JN.showToast('拉取失败：' + msg, 'warning');
      })
      .finally(function(){ btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> 拉取模型'; });
    });

    // ---- 保存配置 ----
    el.querySelector('#btnSaveProfile').addEventListener('click', function(){
      var vals = getFormValues();
      var key = editState.key;
      if (!vals.name) { JN.showToast('请输入配置名称', 'warning'); return; }
      if (!vals.url) { JN.showToast('请输入 API 地址', 'warning'); return; }

      var profiles = loadProfiles();
      var id = editState.profileId || ('p_' + Date.now().toString(36));

      var existing = profiles.filter(function(p){return p.id===id;})[0];
      if (existing) {
        existing.name = vals.name; existing.proto = vals.proto; existing.url = vals.url;
        existing.apiKey = key ? obfuscate(key) : ''; existing.model = vals.model;
      } else {
        profiles.push({ id: id, name: vals.name, proto: vals.proto, url: vals.url, apiKey: key ? obfuscate(key) : '', model: vals.model });
      }
      saveProfiles(profiles);
      editState.profileId = id;
      refreshProfileList();
      if (JN.updateModeIndicator) JN.updateModeIndicator();
      JN.showToast('配置已保存', 'success');
    });

    // ---- 设为启用 ----
    el.querySelector('#btnActivateProfile').addEventListener('click', function(){
      var vals = getFormValues();
      if (!editState.profileId) { JN.showToast('请先保存配置', 'warning'); return; }
      var s = loadSettings();
      s.activeProfile = editState.profileId;
      saveSettings(s);
      refreshProfileList();
      if (JN.updateModeIndicator) JN.updateModeIndicator();
      JN.showToast('已设为当前使用的配置', 'success');
    });

    // ---- 档案列表事件（委托） ----
    el.querySelector('#profileList').addEventListener('click', function(e){
      var pid;
      // 点击档案项 → 加载到表单
      var item = e.target.closest('.profile-item');
      if (item && !e.target.closest('button')) {
        pid = item.getAttribute('data-pid');
        var pro = loadProfiles().filter(function(p){return p.id===pid;})[0];
        if (pro) loadProfileToForm(pro);
        return;
      }
      // 删除
      var delBtn = e.target.closest('.btn-profile-delete');
      if (delBtn) {
        pid = delBtn.getAttribute('data-pid');
        if (!confirm('确定删除该配置档案吗？')) return;
        var list = loadProfiles().filter(function(p){return p.id!==pid;});
        saveProfiles(list);
        var s = loadSettings();
        if (s.activeProfile === pid) { s.activeProfile = ''; saveSettings(s); }
        refreshProfileList();
        JN.showToast('配置档案已删除', 'info');
        return;
      }
      // 复制
      var copyBtn = e.target.closest('.btn-profile-copy');
      if (copyBtn) {
        pid = copyBtn.getAttribute('data-pid');
        var src = loadProfiles().filter(function(p){return p.id===pid;})[0];
        if (src) {
          var clone = { id: 'p_' + Date.now().toString(36), name: (src.name||'') + ' (副本)', proto: src.proto, url: src.url, apiKey: src.apiKey, model: src.model };
          var list2 = loadProfiles(); list2.push(clone); saveProfiles(list2);
          refreshProfileList();
          JN.showToast('配置已复制', 'success');
        }
      }
    });

    // ---- 默认参数自动保存 ----
    function autoSaveDefaults() {
      saveSettings({
        city: (el.querySelector('#settingCity')||{}).value||'',
        years: (el.querySelector('#settingYears')||{}).value||'',
        salaryMin: (el.querySelector('#settingSalaryMin')||{}).value||'',
        salaryMax: (el.querySelector('#settingSalaryMax')||{}).value||'',
        apiEndpoint: (el.querySelector('#cfgUrl')||{}).value||'',
        textModel: (el.querySelector('#cfgModel')||{}).value||'',
        activeProfile: (loadSettings()).activeProfile||''
      });
    }
    ['#settingCity','#settingYears','#settingSalaryMin','#settingSalaryMax','#cfgUrl','#cfgModel'].forEach(function(sel){
      var inp = el.querySelector(sel); if (inp) { inp.addEventListener('change', autoSaveDefaults); inp.addEventListener('input', autoSaveDefaults); }
    });

    // ---- 恢复默认设置 ----
    el.querySelector('#btnResetDefaults').addEventListener('click', function(){
      if (!confirm('确定恢复所有设置为默认值吗？此操作不可恢复。')) return;
      var def = { city: '北京', years: '3', salaryMin: '20', salaryMax: '35' };
      saveSettings(def);
      var ce=el.querySelector('#settingCity'); if(ce)ce.value=def.city;
      var ye=el.querySelector('#settingYears'); if(ye)ye.value=def.years;
      var sm=el.querySelector('#settingSalaryMin'); if(sm)sm.value=def.salaryMin;
      var sx=el.querySelector('#settingSalaryMax'); if(sx)sx.value=def.salaryMax;
      JN.showToast('已恢复默认设置', 'success');
    });

    // ---- 存储空间监控 ----
    function refreshStorageStats() {
      var statsDiv = el.querySelector('#storageStats');
      if (!statsDiv) return;
      var usage = JN.getStorageUsage ? JN.getStorageUsage() : { totalKB: 0, limitKB: 5000, usedPct: 0, itemCount: 0, categories: {} };
      var barColor = usage.usedPct > 80 ? '#ef4444' : usage.usedPct > 50 ? '#f59e0b' : '#10b981';
      statsDiv.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<span style="font-size:12px;color:#d1d5db;">已用 <b>' + usage.totalKB + ' KB</b> / ' + usage.limitKB + ' KB</span>' +
          '<span style="font-size:11px;color:' + barColor + ';">' + usage.usedPct + '%</span>' +
        '</div>' +
        '<div style="width:100%;height:6px;background:#1a1a26;border-radius:3px;overflow:hidden;margin-bottom:8px;">' +
          '<div style="width:' + usage.usedPct + '%;height:100%;background:' + barColor + ';border-radius:3px;transition:width 0.3s;"></div>' +
        '</div>' +
        '<div style="font-size:10px;color:#4a4a6a;">共 ' + usage.itemCount + ' 个存储项' +
          (usage.usedPct > 70 ? ' · <span style="color:#f59e0b;">建议清理不常用数据</span>' : '') +
        '</div>';
    }
    setTimeout(function() { refreshStorageStats(); }, 200);

    // ---- 导出/导入/清除数据 ----
    el.querySelector('#btnBackupAll').addEventListener('click', function(){ JN.backupAllData&&JN.backupAllData(); });
    el.querySelector('#btnExportData').addEventListener('click', function(){ JN.exportAllData&&JN.exportAllData(); });
    var fileImport = el.querySelector('#fileImport');
    fileImport.addEventListener('change', function(){
      if (this.files&&this.files[0]) { JN.importAllData&&JN.importAllData(this.files[0]); this.value=''; }
    });
    var confirmStep = 0;
    el.querySelector('#btnClearData').addEventListener('click', function(){
      var btn = this;
      if (confirmStep === 0) {
        // 显示数据摘要
        var summary = JN.getDataSummary ? JN.getDataSummary() : {};
        var summaryText = Object.keys(summary).map(function(k) { return k + ': ' + summary[k]; }).join('\n');
        var totalKeys = 0; for (var i=0; i<localStorage.length; i++) { if (localStorage.key(i).indexOf('jobninja_')===0) totalKeys++; }
        var msg = '确定清除所有本地数据？\n\n当前数据摘要：\n' + (summaryText || '(暂无数据)') +
          '\n\n共 ' + totalKeys + ' 个存储项将被永久删除。\n建议先导出备份。\n\n再次点击确认清除。';
        JN.showToast(msg, 'warning');
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 再次点击确认清除';
        btn.style.background = '#3b1414'; btn.style.borderColor = '#ef4444'; btn.style.color = '#fecaca'; confirmStep = 1;
        setTimeout(function(){ if(confirmStep===1){ btn.innerHTML='<i class="fa-solid fa-trash-can"></i> 清除所有本地数据'; btn.style.background='transparent'; btn.style.borderColor='#7f1d1d'; btn.style.color='#fca5a5'; confirmStep=0; } }, 5000);
      } else {
        var keys=[]; for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.indexOf('jobninja_')===0)keys.push(k);}
        keys.forEach(function(k){localStorage.removeItem(k);});
        btn.innerHTML='<i class="fa-solid fa-check"></i> 已清除'; btn.style.background='#064e3b'; btn.style.borderColor='#10b981'; btn.style.color='#6ee7b7'; confirmStep=0;
        var inputs=el.querySelectorAll('input:not(#cfgKey), select'); inputs.forEach(function(inp){inp.value='';});
        editState.key=''; editState.profileId=null;
        refreshProfileList();
        if (JN.updateModeIndicator) JN.updateModeIndicator();
        JN.showToast('所有本地数据已清除。页面将刷新。', 'info');
        refreshStorageStats();
        setTimeout(function() { location.reload(); }, 1500);
      }
    });

    return el;
  }

  // ================================================================
  //  REGISTER PANEL & EXPORTS
  // ================================================================
  JN.registerPanel({ id: 'settings', title: '设置', icon: 'fa-cog', render: render });

  JN.getSettings  = loadSettings;
  JN.getApiKey    = loadApiKey;
  JN.getApiConfig = getActiveConfig;
  JN.setStatusMsg = function (msg) { var el = document.getElementById('statusText'); if (el) el.textContent = msg; };

})();
