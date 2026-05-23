/**
 * JobNinja — job-tracker.js
 * 求职进度跟踪：投递记录 · 面试管理 · 统计报表
 * 纯本地，无需API
 */
(function () {
  if (!window.JobNinja) return;
  var JN = window.JobNinja;

  var STORAGE_APPLICATIONS = 'jobninja_applications';

  var STATUS_OPTIONS = ['待沟通', '已投递', '初筛通过', '面试中', '二面', '终面', 'offer', '已接受', '已拒绝', '已放弃'];
  var STATUS_COLORS = {
    '待沟通': '#f59e0b', '已投递': '#6366f1', '初筛通过': '#06b6d4', '面试中': '#8b5cf6',
    '二面': '#a78bfa', '终面': '#c084fc', 'offer': '#10b981', '已接受': '#059669', '已拒绝': '#ef4444', '已放弃': '#6b7280'
  };
  var INTERVIEW_TYPES = ['电话面试', '视频面试', '现场面试', '笔试', '集体面试', 'HR面', '技术面', '总监面'];

  function loadApps() { try { return JSON.parse(localStorage.getItem(STORAGE_APPLICATIONS)) || []; } catch (_) { return []; } }
  function saveApps(list) { localStorage.setItem(STORAGE_APPLICATIONS, JSON.stringify(list)); }

  function uid() { return 'app_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6); }

  // 统计计算
  function calcStats(apps) {
    var total = apps.length;
    var byStatus = {};
    STATUS_OPTIONS.forEach(function(s) { byStatus[s] = 0; });
    apps.forEach(function(a) { if (byStatus[a.status] !== undefined) byStatus[a.status]++; });

    var active = apps.filter(function(a) { return ['待沟通','已投递','初筛通过','面试中','二面','终面'].indexOf(a.status) !== -1; }).length;
    var interviewCount = apps.filter(function(a) { return ['面试中','二面','终面'].indexOf(a.status) !== -1; }).length;
    var offerCount = byStatus['offer'] + byStatus['已接受'];
    var offerRate = total > 0 ? Math.round((offerCount / total) * 100) : 0;
    var rejectedCount = byStatus['已拒绝'] + byStatus['已放弃'];

    // 按时间统计（最近30天）
    var now = new Date();
    var last30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
    var recentApps = apps.filter(function(a) { return new Date(a.createdAt) >= last30; });
    var recentInterviews = apps.filter(function(a) {
      return ['面试中','二面','终面'].indexOf(a.status) !== -1 && new Date(a.createdAt) >= last30;
    }).length;

    return {
      total: total, active: active, interviewCount: interviewCount,
      offerCount: offerCount, offerRate: offerRate, rejectedCount: rejectedCount,
      byStatus: byStatus, recentApps: recentApps.length, recentInterviews: recentInterviews
    };
  }

  // 简易Canvas柱状图
  function drawBarChart(canvas, data, labels, colors) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var padding = { top: 10, bottom: 30, left: 30, right: 10 };
    var chartW = W - padding.left - padding.right;
    var chartH = H - padding.top - padding.bottom;

    ctx.clearRect(0, 0, W, H);

    var maxVal = Math.max.apply(null, data.concat([1]));
    var barWidth = Math.max(8, (chartW / data.length) * 0.6);
    var gap = chartW / data.length;

    // 网格线
    for (var i = 0; i <= 4; i++) {
      var y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.strokeStyle = '#1a1a26';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    data.forEach(function(val, idx) {
      var barH = (val / maxVal) * chartH;
      var x = padding.left + gap * idx + (gap - barWidth) / 2;
      var y = padding.top + chartH - barH;

      ctx.fillStyle = colors[idx % colors.length];
      ctx.fillRect(x, y, barWidth, barH);

      // 数值标签
      if (val > 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px -apple-system,"PingFang SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(val, x + barWidth / 2, y - 4);
      }

      // X轴标签
      ctx.fillStyle = '#4a4a6a';
      ctx.font = '8px -apple-system,"PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[idx] || '', x + barWidth / 2, H - 6);
    });
  }

  function render() {
    var el = document.createElement('div');
    var apps = loadApps();
    var stats = calcStats(apps);

    el.innerHTML =
      '<div style="margin-bottom:16px;">' +
        '<h2 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">' +
          '<i class="fa-solid fa-chart-line" style="color:#818cf8;margin-right:8px;"></i>求职进度' +
        '</h2>' +
        '<p style="font-size:13px;color:#64748b;margin:0;">投递记录 · 面试管理 · 统计报表</p>' +
      '</div>' +

      // ===== 统计卡片 =====
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;">' +
        statCard('总投递', stats.total, '#6366f1', 'fa-paper-plane') +
        statCard('进行中', stats.active, '#f59e0b', 'fa-spinner') +
        statCard('面试', stats.interviewCount, '#8b5cf6', 'fa-comments') +
        statCard('offer率', stats.offerRate + '%', '#10b981', 'fa-trophy') +
      '</div>' +

      // 图表 + 添加按钮
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;">' +
        // 状态柱状图
        '<div class="panel-card" style="padding:12px;">' +
          '<span style="font-size:12px;font-weight:600;color:#d1d5db;">状态分布</span>' +
          '<canvas id="jtBarChart" width="280" height="160" style="display:block;margin:8px auto 0;"></canvas>' +
        '</div>' +
        // 薪资分布图
        '<div class="panel-card" style="padding:12px;">' +
          '<span style="font-size:12px;font-weight:600;color:#d1d5db;">薪资分布</span>' +
          '<canvas id="jtSalaryChart" width="280" height="160" style="display:block;margin:8px auto 0;"></canvas>' +
        '</div>' +
        // 添加投递 + 最近活动
        '<div class="panel-card" style="padding:12px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
            '<span style="font-size:12px;font-weight:600;color:#d1d5db;">快速操作</span>' +
          '</div>' +
          '<button id="btnAddApp" class="btn btn-primary" style="font-size:12px;width:100%;margin-bottom:8px;">' +
            '<i class="fa-solid fa-plus" style="font-size:11px;"></i> 添加投递记录</button>' +
          '<button id="btnExportCSV" class="btn btn-outline" style="font-size:12px;width:100%;margin-bottom:8px;">' +
            '<i class="fa-solid fa-file-csv" style="font-size:11px;"></i> 导出 Excel(CSV)</button>' +
          '<div style="font-size:11px;color:#64748b;line-height:1.8;">' +
            '<div>最近30天投递：<b style="color:#d1d5db;">' + stats.recentApps + '</b> 家</div>' +
            '<div>最近30天面试：<b style="color:#d1d5db;">' + stats.recentInterviews + '</b> 场</div>' +
          '</div>' +
          '<div style="margin-top:10px;border-top:1px solid #1a1a26;padding-top:8px;">' +
            '<div style="display:flex;gap:6px;margin-bottom:6px;">' +
              '<button id="btnJTGotoSearch" class="btn btn-outline" style="font-size:10px;padding:3px 8px;border-color:#065f46;color:#34d399;">' +
                '<i class="fa-solid fa-magnifying-glass"></i> 找工作</button>' +
              '<button id="btnJTGotoResume" class="btn btn-outline" style="font-size:10px;padding:3px 8px;border-color:#065f46;color:#34d399;">' +
                '<i class="fa-solid fa-file-pen"></i> 改简历</button>' +
            '</div>' +
            '<span style="font-size:10px;color:#4a4a6a;">筛选：</span>' +
            '<select id="jtFilterStatus" class="ninja-input" style="font-size:10px;padding:3px 6px;width:auto;display:inline-block;">' +
              '<option value="">全部状态</option>' +
              STATUS_OPTIONS.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('') +
            '</select>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // ===== 投递列表 =====
      '<div class="panel-card" style="margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
          '<span style="font-size:12px;font-weight:600;color:#d1d5db;">' +
            '<i class="fa-solid fa-list" style="color:#64748b;margin-right:4px;"></i>投递记录' +
            '<span id="jtAppCount" style="font-size:10px;color:#4a4a6a;margin-left:4px;">(' + apps.length + ')</span>' +
          '</span>' +
        '</div>' +
        '<div id="jtAppList" style="max-height:500px;overflow-y:auto;" class="custom-scrollbar">' +
          (apps.length === 0
            ? '<div style="text-align:center;padding:40px;color:#4a4a6a;font-size:12px;">' +
                '<i class="fa-solid fa-inbox" style="font-size:28px;display:block;margin-bottom:8px;color:#252536;"></i>暂无投递记录，点击「添加投递记录」开始追踪</div>'
            : renderAppList(apps, '')) +
        '</div>' +
      '</div>' +

      '<div style="font-size:10px;color:#252536;text-align:right;">所有数据仅存储在浏览器本地</div>';

    // 绘制柱状图
    setTimeout(function() {
      var canvas = el.querySelector('#jtBarChart');
      if (canvas) {
        var filteredApps = loadApps();
        var filteredStats = calcStats(filteredApps);
        var activeStatuses = ['待沟通','已投递','初筛通过','面试中','二面','终面','offer','已接受','已拒绝'];
        var chartData = activeStatuses.map(function(s) { return filteredStats.byStatus[s] || 0; });
        var chartLabels = activeStatuses.map(function(s) { return s.substring(0, 2); });
        var chartColors = activeStatuses.map(function(s) { return STATUS_COLORS[s] || '#6b7280'; });
        drawBarChart(canvas, chartData, chartLabels, chartColors);
      }
      var salaryCanvas = el.querySelector('#jtSalaryChart');
      if (salaryCanvas) drawSalaryChart(salaryCanvas, loadApps());
    }, 100);

    // 事件绑定
    el.querySelector('#btnAddApp').addEventListener('click', function() { showAppModal(el, null); });
    el.querySelector('#btnExportCSV').addEventListener('click', function() {
      var apps = loadApps();
      if (apps.length === 0) { JN.showToast('暂无投递记录', 'warning'); return; }
      exportAppsToCSV(apps);
      JN.showToast('CSV 导出成功', 'success');
    });

    // 快捷跳转
    el.querySelector('#btnJTGotoSearch').addEventListener('click', function() {
      if (JN.jumpToPanel) JN.jumpToPanel('jobsearch', {});
    });
    el.querySelector('#btnJTGotoResume').addEventListener('click', function() {
      if (JN.jumpToPanel) JN.jumpToPanel('resume', {});
    });

    el.querySelector('#jtFilterStatus').addEventListener('click', function() {
      // ... handled below
    });
    el.querySelector('#jtFilterStatus').addEventListener('change', function() {
      refreshAppList(el, this.value);
    });

    // 委托事件
    el.addEventListener('click', function(e) {
      var editBtn = e.target.closest('.jt-edit-btn');
      if (editBtn) {
        var id = editBtn.getAttribute('data-id');
        var app = loadApps().find(function(a) { return a.id === id; });
        if (app) showAppModal(el, app);
        return;
      }
      var delBtn = e.target.closest('.jt-del-btn');
      if (delBtn) {
        if (!confirm('确定删除该投递记录吗？')) return;
        var id2 = delBtn.getAttribute('data-id');
        var apps2 = loadApps().filter(function(a) { return a.id !== id2; });
        saveApps(apps2);
        refreshAppList(el, el.querySelector('#jtFilterStatus').value);
        refreshStats(el);
        JN.showToast('记录已删除', 'info');
        return;
      }
      var statusBtn = e.target.closest('.jt-status-btn');
      if (statusBtn) {
        var id3 = statusBtn.getAttribute('data-id');
        var apps3 = loadApps();
        var app3 = apps3.find(function(a) { return a.id === id3; });
        if (app3) {
          var curIdx = STATUS_OPTIONS.indexOf(app3.status);
          app3.status = STATUS_OPTIONS[(curIdx + 1) % STATUS_OPTIONS.length];
          saveApps(apps3);
          refreshAppList(el, el.querySelector('#jtFilterStatus').value);
          refreshStats(el);
        }
        return;
      }
      var interviewBtn = e.target.closest('.jt-interview-btn');
      if (interviewBtn) {
        var id4 = interviewBtn.getAttribute('data-id');
        var apps4 = loadApps();
        var app4 = apps4.find(function(a) { return a.id === id4; });
        if (app4) showInterviewModal(el, app4);
        return;
      }
    });

    return el;
  }

  function statCard(label, value, color, icon) {
    return '<div class="panel-card" style="padding:12px;text-align:center;">' +
      '<i class="fa-solid ' + icon + '" style="color:' + color + ';font-size:18px;display:block;margin-bottom:6px;"></i>' +
      '<div style="font-size:20px;font-weight:700;color:#e2e8f0;">' + value + '</div>' +
      '<div style="font-size:10px;color:#64748b;">' + label + '</div>' +
    '</div>';
  }

  function renderAppList(apps, filterStatus) {
    var filtered = filterStatus ? apps.filter(function(a) { return a.status === filterStatus; }) : apps;
    if (filtered.length === 0) {
      return '<div style="text-align:center;padding:32px;color:#4a4a6a;font-size:12px;">' +
        (filterStatus ? '没有「' + filterStatus + '」状态的记录' : '暂无投递记录') + '</div>';
    }
    // 按时间倒序
    filtered.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

    return filtered.map(function(app) {
      var sc = STATUS_COLORS[app.status] || '#6b7280';
      var dateStr = app.createdAt ? new Date(app.createdAt).toISOString().slice(0, 10) : '';
      var interviews = app.interviews || [];

      var interviewHtml = '';
      if (interviews.length > 0) {
        interviewHtml = '<div style="margin-top:8px;padding:8px;background:#0a0a0f;border-radius:6px;">' +
          '<span style="font-size:9px;color:#a5b4fc;">面试记录 (' + interviews.length + ')</span>';
        interviews.forEach(function(iv, i) {
          interviewHtml += '<div style="margin-top:4px;font-size:10px;color:#94a3b8;">' +
            '<span style="color:#64748b;">' + (iv.date || '') + '</span> ' +
            '<span style="padding:1px 5px;background:#312e81;color:#a5b4fc;border-radius:3px;">' + (iv.type || '面试') + '</span>' +
            (iv.feedback ? '<div style="color:#4a4a6a;margin-top:2px;">反馈：' + iv.feedback.substring(0, 60) + '</div>' : '') +
          '</div>';
        });
        interviewHtml += '</div>';
      }

      return '<div style="padding:10px 12px;margin-bottom:6px;background:#0f0f17;border:1px solid #1a1a26;border-left:3px solid ' + sc + ';border-radius:8px;">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
              '<strong style="font-size:13px;color:#e2e8f0;">' + (app.position || '未命名岗位') + '</strong>' +
              '<span style="font-size:10px;padding:1px 6px;background:' + sc + '20;color:' + sc + ';border-radius:3px;">' + app.status + '</span>' +
            '</div>' +
            '<div style="font-size:11px;color:#64748b;">' +
              (app.company ? app.company + ' · ' : '') + (app.city || '') +
              (app.salary ? ' · ' + app.salary + 'K' : '') +
            '</div>' +
            (app.note ? '<div style="font-size:10px;color:#4a4a6a;margin-top:2px;">' + app.note.substring(0, 80) + '</div>' : '') +
            interviewHtml +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:3px;flex-shrink:0;margin-left:8px;">' +
            '<button class="jt-status-btn" data-id="' + app.id + '" style="font-size:9px;padding:2px 6px;background:#1a1a26;border:1px solid #252536;border-radius:3px;color:#94a3b8;cursor:pointer;" title="切换状态">状态+</button>' +
            '<button class="jt-interview-btn" data-id="' + app.id + '" style="font-size:9px;padding:2px 6px;background:#312e81;border:1px solid #4338ca;border-radius:3px;color:#a5b4fc;cursor:pointer;" title="添加面试">面试+</button>' +
            '<button class="jt-edit-btn" data-id="' + app.id + '" style="font-size:9px;padding:2px 6px;background:transparent;border:1px solid #1a1a26;border-radius:3px;color:#4a4a6a;cursor:pointer;">编辑</button>' +
            '<button class="jt-del-btn" data-id="' + app.id + '" style="font-size:9px;padding:2px 6px;background:transparent;border:1px solid #1a1a26;border-radius:3px;color:#4a4a6a;cursor:pointer;">删除</button>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:9px;color:#252536;margin-top:4px;">' + dateStr + '</div>' +
      '</div>';
    }).join('');
  }

  function showAppModal(el, existingApp) {
    var isNew = !existingApp;
    var app = existingApp || { id: '', company: '', position: '', city: '', salary: '', status: '已投递', note: '', createdAt: new Date().toISOString() };

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;padding:20px;width:90%;max-width:480px;max-height:85vh;overflow-y:auto;">' +
        '<h4 style="font-size:15px;color:#e2e8f0;margin:0 0 14px;">' + (isNew ? '添加投递记录' : '编辑投递记录') + '</h4>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
          '<div><label style="font-size:10px;color:#64748b;">公司名称 *</label>' +
            '<input id="appCompany" class="ninja-input" placeholder="如：字节跳动" style="font-size:12px;" value="' + (app.company || '') + '"></div>' +
          '<div><label style="font-size:10px;color:#64748b;">岗位名称 *</label>' +
            '<input id="appPosition" class="ninja-input" placeholder="如：高级前端工程师" style="font-size:12px;" value="' + (app.position || '') + '"></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
          '<div><label style="font-size:10px;color:#64748b;">城市</label>' +
            '<input id="appCity" class="ninja-input" placeholder="如：北京" style="font-size:12px;" value="' + (app.city || '') + '"></div>' +
          '<div><label style="font-size:10px;color:#64748b;">期望薪资（K/月）</label>' +
            '<input id="appSalary" class="ninja-input" type="number" placeholder="如：25" style="font-size:12px;" value="' + (app.salary || '') + '"></div>' +
        '</div>' +
        '<div style="margin-bottom:8px;">' +
          '<label style="font-size:10px;color:#64748b;">当前状态</label>' +
          '<select id="appStatus" class="ninja-input" style="font-size:12px;">' +
            STATUS_OPTIONS.map(function(s) { return '<option value="' + s + '"' + (app.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
          '</select>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
          '<label style="font-size:10px;color:#64748b;">备注</label>' +
          '<textarea id="appNote" class="ninja-input" rows="3" placeholder="JD摘要、薪资范围、公司信息等..." style="font-size:12px;">' + (app.note || '') + '</textarea>' +
        '</div>' +
        '<div style="display:flex;gap:6px;justify-content:flex-end;">' +
          '<button id="appCancel" class="btn btn-outline" style="font-size:12px;">取消</button>' +
          '<button id="appSave" class="btn btn-primary" style="font-size:12px;">保存</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('#appCancel').addEventListener('click', function() { document.body.removeChild(overlay); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
    overlay.querySelector('#appSave').addEventListener('click', function() {
      var company = overlay.querySelector('#appCompany').value.trim();
      var position = overlay.querySelector('#appPosition').value.trim();
      if (!company || !position) { JN.showToast('请至少填写公司名称和岗位名称', 'warning'); return; }

      var updated = {
        id: app.id || uid(),
        company: company, position: position,
        city: overlay.querySelector('#appCity').value.trim(),
        salary: overlay.querySelector('#appSalary').value.trim(),
        status: overlay.querySelector('#appStatus').value,
        note: overlay.querySelector('#appNote').value.trim(),
        interviews: app.interviews || [],
        createdAt: app.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      var apps = loadApps();
      if (isNew) {
        apps.unshift(updated);
      } else {
        var idx = apps.findIndex(function(a) { return a.id === app.id; });
        if (idx >= 0) apps[idx] = updated;
      }
      saveApps(apps);
      document.body.removeChild(overlay);
      refreshAppList(el, el.querySelector('#jtFilterStatus').value);
      refreshStats(el);
      JN.showToast(isNew ? '投递记录已添加' : '记录已更新', 'success');
    });
  }

  function showInterviewModal(el, app) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;padding:20px;width:90%;max-width:440px;">' +
        '<h4 style="font-size:15px;color:#e2e8f0;margin:0 0 4px;">添加面试记录</h4>' +
        '<p style="font-size:11px;color:#64748b;margin:0 0 14px;">' + (app.company || '') + ' · ' + (app.position || '') + '</p>' +
        '<div style="margin-bottom:8px;">' +
          '<label style="font-size:10px;color:#64748b;">面试日期</label>' +
          '<input id="ivDate" class="ninja-input" type="date" style="font-size:12px;" value="' + new Date().toISOString().slice(0, 10) + '"></div>' +
        '<div style="margin-bottom:8px;">' +
          '<label style="font-size:10px;color:#64748b;">面试类型</label>' +
          '<select id="ivType" class="ninja-input" style="font-size:12px;">' +
            INTERVIEW_TYPES.map(function(t) { return '<option value="' + t + '">' + t + '</option>'; }).join('') +
          '</select></div>' +
        '<div style="margin-bottom:8px;">' +
          '<label style="font-size:10px;color:#64748b;">面试反馈 / 复盘笔记</label>' +
          '<textarea id="ivFeedback" class="ninja-input" rows="3" placeholder="面试官问了什么？答得如何？有什么改进点？..." style="font-size:12px;"></textarea>' +
        '</div>' +
        '<div style="margin-bottom:12px;padding:8px 10px;background:#0f0f17;border:1px solid #1a1a26;border-radius:6px;">' +
          '<label style="font-size:10px;color:#64748b;display:flex;align-items:center;gap:4px;margin-bottom:6px;">' +
            '<i class="fa-solid fa-bell" style="color:#f59e0b;"></i>设置提醒（可选）</label>' +
          '<input id="ivReminder" class="ninja-input" type="datetime-local" style="font-size:12px;">' +
        '</div>' +
        '<div style="display:flex;gap:6px;justify-content:flex-end;">' +
          '<button id="ivCancel" class="btn btn-outline" style="font-size:12px;">取消</button>' +
          '<button id="ivSave" class="btn btn-primary" style="font-size:12px;">保存</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('#ivCancel').addEventListener('click', function() { document.body.removeChild(overlay); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
    overlay.querySelector('#ivSave').addEventListener('click', function() {
      var apps = loadApps();
      var target = apps.find(function(a) { return a.id === app.id; });
      if (!target) { document.body.removeChild(overlay); return; }
      if (!target.interviews) target.interviews = [];
      var interview = {
        date: overlay.querySelector('#ivDate').value,
        type: overlay.querySelector('#ivType').value,
        feedback: overlay.querySelector('#ivFeedback').value.trim()
      };
      target.interviews.push(interview);
      // 自动将状态推到面试中
      if (['待沟通','已投递','初筛通过'].indexOf(target.status) !== -1) {
        target.status = '面试中';
      }
      // 保存提醒
      var reminderVal = overlay.querySelector('#ivReminder').value;
      if (reminderVal) {
        scheduleInterviewReminder(app.id, (app.company || '') + ' ' + interview.type, reminderVal);
        JN.showToast('面试提醒已设置：' + new Date(reminderVal).toLocaleString('zh-CN'), 'info');
      }
      saveApps(apps);
      document.body.removeChild(overlay);
      refreshAppList(el, el.querySelector('#jtFilterStatus').value);
      refreshStats(el);
      JN.showToast('面试记录已添加，状态已更新为「面试中」', 'success');
    });
  }

  function refreshAppList(el, filterStatus) {
    var list = el.querySelector('#jtAppList');
    var count = el.querySelector('#jtAppCount');
    var apps = loadApps();
    if (list) list.innerHTML = renderAppList(apps, filterStatus);
    if (count) count.textContent = '(' + apps.length + ')';
  }

  function refreshStats(el) {
    var apps = loadApps();
    var stats = calcStats(apps);
    var canvas = el.querySelector('#jtBarChart');
    if (canvas) {
      var activeStatuses = ['待沟通','已投递','初筛通过','面试中','二面','终面','offer','已接受','已拒绝'];
      var chartData = activeStatuses.map(function(s) { return stats.byStatus[s] || 0; });
      var chartLabels = activeStatuses.map(function(s) { return s.substring(0, 2); });
      var chartColors = activeStatuses.map(function(s) { return STATUS_COLORS[s] || '#6b7280'; });
      drawBarChart(canvas, chartData, chartLabels, chartColors);
    }
    var salaryCanvas = el.querySelector('#jtSalaryChart');
    if (salaryCanvas) drawSalaryChart(salaryCanvas, apps);
    var count = el.querySelector('#jtAppCount');
    if (count) count.textContent = '(' + apps.length + ')';
  }

  JN.registerPanel({
    id: 'tracker',
    title: '求职进度',
    icon: 'fa-chart-line',
    render: render,
    onActivate: function() {}
  });

  // ================================================================
  //  薪资分布图
  // ================================================================
  function drawSalaryChart(canvas, apps) {
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    var buckets = { '5K以下': 0, '5-10K': 0, '10-20K': 0, '20-35K': 0, '35-50K': 0, '50K+': 0 };
    apps.forEach(function(a) {
      if (!a.salary) return;
      var m = a.salary.match(/(\d+)/);
      if (!m) return;
      var v = parseInt(m[1]);
      if (v < 5) buckets['5K以下']++;
      else if (v < 10) buckets['5-10K']++;
      else if (v < 20) buckets['10-20K']++;
      else if (v < 35) buckets['20-35K']++;
      else if (v < 50) buckets['35-50K']++;
      else buckets['50K+']++;
    });

    var labels = Object.keys(buckets);
    var data = labels.map(function(k) { return buckets[k]; });
    var colors = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#f97316','#ef4444'];
    drawBarChart(canvas, data, labels, colors);
  }

  // ================================================================
  //  面试提醒（Notification API）
  // ================================================================
  var STORAGE_REMINDERS = 'jobninja_reminders';

  function loadReminders() { try { return JSON.parse(localStorage.getItem(STORAGE_REMINDERS)) || []; } catch(_) { return []; } }
  function saveReminders(list) { localStorage.setItem(STORAGE_REMINDERS, JSON.stringify(list)); }

  function scheduleInterviewReminder(appId, interviewTitle, reminderTime) {
    var reminders = loadReminders();
    reminders.push({ id: Date.now().toString(), appId: appId, title: interviewTitle, time: reminderTime, fired: false });
    saveReminders(reminders);
  }

  function checkPendingReminders() {
    if (typeof Notification === 'undefined') return;
    var now = Date.now();
    var reminders = loadReminders();
    var updated = false;
    reminders.forEach(function(r) {
      if (!r.fired && r.time && new Date(r.time).getTime() <= now) {
        r.fired = true; updated = true;
        if (Notification.permission === 'granted') {
          new Notification('JobNinja 面试提醒', { body: r.title || '您有一场面试即将开始', icon: '/favicon.ico' });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(function(perm) {
            if (perm === 'granted') new Notification('JobNinja 面试提醒', { body: r.title || '您有一场面试即将开始' });
          });
        }
        JN.showToast('面试提醒：' + (r.title || '面试'), 'info');
      }
    });
    if (updated) saveReminders(reminders);
  }

  // 页面加载时检查提醒
  checkPendingReminders();
  setInterval(checkPendingReminders, 60000);

  // ================================================================
  //  CSV 导出
  // ================================================================
  function exportAppsToCSV(apps) {
    var headers = ['公司', '岗位', '城市', '薪资', '状态', '面试次数', '备注', '投递日期'];
    var rows = apps.map(function(a) {
      return [
        a.company || '', a.position || '', a.city || '', a.salary || '',
        a.status || '', (a.interviews || []).length, a.note || '',
        a.appliedAt ? new Date(a.appliedAt).toLocaleDateString('zh-CN') : ''
      ].map(function(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
    });
    var csv = '﻿' + headers.join(',') + '\n' + rows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = 'JobNinja_投递记录_' + new Date().toLocaleDateString('zh-CN').replace(/\//g, '-') + '.csv';
    a.click(); URL.revokeObjectURL(url);
  }

})();
