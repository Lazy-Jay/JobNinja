/**
 * JobNinja — interview-exp.js
 * 求职经验库：内置面试经验、用户分享、搜索、面试清单、导出导入
 * 纯本地，无需API
 */
(function () {
  if (!window.JobNinja) return;
  var JN = window.JobNinja;

  var STORAGE_USER_EXPS = 'jobninja_user_experiences';

  // 内置面试经验库
  var BUILTIN_EXPERIENCES = [
    { id: 'builtin-fe', position: '前端开发工程师', company: '通用', type: '技术面',
      questions: [
        { q: '请解释浏览器渲染原理和关键渲染路径', answer: '从HTML解析→DOM树、CSS解析→CSSOM树、合并→Render树→布局(Layout)→绘制(Paint)→合成(Composite)。优化方向：减少重排重绘、使用transform/opacity触发合成层、避免强制同步布局。' },
        { q: 'React/Vue的虚拟DOM原理和diff算法', answer: '虚拟DOM是JS对象模拟的真实DOM结构。diff算法采用同层比较策略(O(n)复杂度)：先比较节点类型→再比较属性→最后递归子节点。key属性帮助识别节点移动，避免不必要的重建。' },
        { q: '说一下你对前端性能优化的理解', answer: '从网络层面(CDN/压缩/缓存/HTTP2)、构建层面(Tree Shaking/Code Splitting/Lazy Loading)、渲染层面(减少重排/虚拟列表/Web Worker)、框架层面(shouldComponentUpdate/useMemo/keep-alive)四个维度展开。' }
      ],
      tips: '前端面试通常3-4轮：1面基础(HTML/CSS/JS)、2面框架(React/Vue原理)、3面项目/算法、HR面。重点准备手写代码题和项目难点。' },
    { id: 'builtin-be', position: '后端开发工程师', company: '通用', type: '技术面',
      questions: [
        { q: '如何设计一个高并发系统？', answer: '从接入层(负载均衡/限流)、应用层(缓存/异步/连接池)、数据层(读写分离/分库分表/NoSQL)、运维层(监控/弹性伸缩)四个层次展开。核心是"缓存+异步+分布式"。' },
        { q: 'MySQL索引原理和优化策略', answer: '索引使用B+树结构，非叶子节点只存key、叶子节点存完整数据并用双向链表连接。优化：覆盖索引避免回表、最左前缀原则、避免索引列上使用函数、explain分析执行计划。' },
        { q: '微服务架构的优缺点和实践经验', answer: '优点：独立部署/技术异构/故障隔离/团队自治。挑战：分布式事务/服务发现/链路追踪/数据一致性。实践中常用：API网关+服务注册中心+配置中心+消息队列。' }
      ],
      tips: '后端面试重点：数据结构与算法(必考)、数据库(索引/事务/锁)、系统设计(短链系统/秒杀/消息队列)、项目经历中的技术难点和解决方案。' },
    { id: 'builtin-pm', position: '产品经理', company: '通用', type: '综合面',
      questions: [
        { q: '请分析一款你常用的App，有哪些做得好的和不好的地方？', answer: '用"产品分析框架"：用户画像→核心场景→功能拆解→商业模式→竞品对比→改进建议。举例时要具体到某个功能，说明你的分析逻辑和改进方案。' },
        { q: '如何确定需求的优先级？', answer: '常见方法：KANO模型(基本型/期望型/兴奋型)、ROI评估(投入产出比)、RICE评分(Reach/Impact/Confidence/Effort)。核心是"价值/成本"比的排序，同时考虑战略匹配度和依赖关系。' },
        { q: '说说你做的最成功/最失败的一个项目', answer: '成功项目要展示完整的PM闭环：发现机会→用户调研→需求定义→推动落地→数据验证→迭代优化。失败项目重点分析原因和学到的教训，展示复盘能力。' }
      ],
      tips: '产品经理面试关注：逻辑思维(费米估算题)、用户同理心、数据分析能力、沟通表达。准备1-2个深度案例分析，多用"因为...所以..."的推理链条。' },
    { id: 'builtin-ops', position: '新媒体运营', company: '通用', type: '综合面',
      questions: [
        { q: '你如何策划一场爆款内容/活动？', answer: '策划步骤：①选题调研(竞品分析+热搜+用户痛点) ②内容设计(标题/封面/文案/互动引导) ③渠道分发(多平台发布+社群推广) ④数据监控(实时调整) ⑤复盘总结(爆款要素提炼)。' },
        { q: '运营数据有哪些核心指标？如何提升？', answer: 'AARRR模型：获取(曝光/点击/获客成本)→激活(注册/首次使用)→留存(次日/7日/30日)→变现(GMV/LTV/ARPU)→传播(分享率/K因子)。提升策略要结合具体阶段和产品类型。' },
        { q: '你对「私域运营」的理解和经验', answer: '私域是品牌自主拥有的用户触达渠道(企业微信/社群/小程序)。核心：用户分层→精细化运营→复购提升。关键指标：加粉率、活跃度、转化率、复购率。' }
      ],
      tips: '运营面试准备：带上你的作品集/数据截图/案例，用数字说话。展示你的平台运营方法论和对行业趋势的理解。' },
    { id: 'builtin-data', position: '数据分析师', company: '通用', type: '技术面',
      questions: [
        { q: '描述一个你从数据中发现insight并推动业务决策的案例', answer: '用"分析框架"：业务背景→数据获取→清洗处理→探索分析→发现洞见→可视化呈现→推动决策→效果验证。重点展示你的分析逻辑和对业务的理解深度。' },
        { q: 'SQL优化有哪些常用技巧？', answer: '索引优化(覆盖索引/联合索引最左前缀)、查询优化(避免SELECT */用EXPLAIN分析/子查询改JOIN)、表结构优化(合理分表/归档旧数据)、适当使用临时表/窗口函数/分区表。' },
        { q: 'AB测试的设计原则和注意事项', answer: '原则：单变量控制、样本量计算(统计显著性)、随机分流、足够的实验周期(避免新奇效应)。注意：辛普森悖论、网络效应干扰、AA验证。' }
      ],
      tips: '数据分析面试：SQL必考(窗口函数/复杂JOIN)、统计学基础(P值/置信区间/分布)、业务思维(指标体系/归因分析)。' },
    { id: 'builtin-java', position: 'Java开发工程师', company: '通用', type: '技术面',
      questions: [
        { q: 'JVM内存模型和GC机制', answer: '堆内存分年轻代(Eden/S0/S1)和老年代。GC算法：标记-清除/复制/标记-整理。常用收集器：G1(分区域/可预测停顿)、ZGC(超低延迟)。调优思路：分析GC日志→调整堆大小→选择合适的收集器。' },
        { q: 'Spring框架的核心原理', answer: 'IoC(控制反转)：通过DI实现对象解耦，容器管理Bean生命周期。AOP(面向切面)：基于动态代理实现横切关注点(事务/日志/权限)。Spring Boot自动配置原理：@Conditional条件装配。' }
      ],
      tips: 'Java面试：集合源码(HashMap/ConcurrentHashMap)、多线程(线程池/AQS/synchronized锁升级)、MySQL+Redis、分布式(分布式锁/事务/一致性)、项目经验。' },
    { id: 'builtin-hr', position: 'HR/人力资源', company: '通用', type: '综合面',
      questions: [
        { q: '你如何评估候选人与岗位的匹配度？', answer: '三维评估：能力匹配(技能/经验)、文化匹配(价值观/工作风格)、潜力匹配(学习能力/成长空间)。工具：结构化面试、行为事件访谈(BEI)、STAR追问法。' },
        { q: '如何处理员工关系中的冲突？', answer: '步骤：①倾听双方，客观了解事实 ②找到冲突根源(利益/认知/沟通风格) ③调解沟通，寻找共同目标 ④制定书面方案，跟进执行。核心是"公平+及时+保密"。' }
      ],
      tips: 'HR面试：展现你的沟通协调能力、对劳动法的理解、对组织发展的思考。准备1-2个你处理过的典型HR案例。' },
    { id: 'builtin-sales', position: '商务拓展/销售', company: '通用', type: '综合面',
      questions: [
        { q: '描述你成功签下的最大一个客户', answer: '用销售漏斗和BANT框架：客户背景→需求挖掘→方案匹配→商务谈判(价格/条款)→签单策略→客情维护。重点展示你的商务判断力、谈判技巧和关系管理能力。' },
        { q: '新市场/新客户如何快速打开局面？', answer: '策略：①行业Mapping(找出TOP客户) ②多渠道触达(展会/转介绍/内容营销) ③快速POC(概念验证) ④标杆客户打造 ⑤行业复制。' }
      ],
      tips: '销售面试核心：用数字说话(年/季度业绩、客户数、客单价、回款率、排名)。展示你的销售方法论、抗压能力和商务谈判技巧。' }
  ];

  function loadUserExps() { try { return JSON.parse(localStorage.getItem(STORAGE_USER_EXPS)) || []; } catch (_) { return []; } }
  function saveUserExps(list) { localStorage.setItem(STORAGE_USER_EXPS, JSON.stringify(list)); }
  function getAllExps() { return BUILTIN_EXPERIENCES.concat(loadUserExps()); }

  function render() {
    var el = document.createElement('div');
    var userExps = loadUserExps();

    el.innerHTML =
      '<div style="margin-bottom:16px;">' +
        '<h2 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 4px;">' +
          '<i class="fa-solid fa-book-open" style="color:#a78bfa;margin-right:8px;"></i>求职经验库' +
        '</h2>' +
        '<p style="font-size:13px;color:#64748b;margin:0;">内置面试经验 · 用户分享 · 搜索查找 · 面试清单</p>' +
      '</div>' +

      // 搜索 + 操作按钮
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
        '<input id="ieSearch" class="ninja-input" placeholder="搜索岗位/公司/关键词..." style="font-size:12px;flex:1;">' +
        '<button id="btnAddExp" class="btn btn-primary" style="font-size:12px;white-space:nowrap;">' +
          '<i class="fa-solid fa-plus"></i> 分享经验</button>' +
        '<button id="btnExportExp" class="btn btn-outline" style="font-size:11px;">导出</button>' +
        '<button id="btnImportExp" class="btn btn-outline" style="font-size:11px;">导入</button>' +
        '<input type="file" id="ieFileInput" accept=".json" style="display:none;">' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
        // 左栏：经验列表
        '<div>' +
          '<div id="ieExpList" style="max-height:600px;overflow-y:auto;" class="custom-scrollbar">' +
            renderExpCards(getAllExps(), '') +
          '</div>' +
          // 用户贡献统计
          '<div style="margin-top:10px;padding:8px 12px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;font-size:10px;color:#4a4a6a;">' +
            '内置' + BUILTIN_EXPERIENCES.length + '条经验 · 你已贡献' + userExps.length + '条 · 所有数据存储于本地' +
          '</div>' +
        '</div>' +

        // 右栏：详情 + 面试清单
        '<div>' +
          '<div id="ieDetail" class="panel-card" style="min-height:300px;">' +
            '<div class="empty-state" style="padding:60px 20px;">' +
              '<i class="fa-solid fa-hand-pointer" style="font-size:28px;display:block;margin-bottom:8px;color:#252536;"></i>' +
              '<span style="font-size:12px;color:#4a4a6a;">点击左侧经验卡片查看详情</span>' +
            '</div>' +
          '</div>' +
          // 面试准备清单
          '<div class="panel-card" style="margin-top:10px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
              '<span style="font-size:12px;font-weight:600;color:#d1d5db;">' +
                '<i class="fa-solid fa-clipboard-check" style="color:#10b981;margin-right:4px;"></i>面试准备清单</span>' +
              '<button id="btnGenChecklist" class="btn btn-outline" style="font-size:10px;padding:3px 8px;">生成清单</button>' +
            '</div>' +
            '<div id="ieChecklist" style="font-size:11px;color:#94a3b8;line-height:1.8;">点击「生成清单」创建面试前检查项</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // 搜索
    el.querySelector('#ieSearch').addEventListener('input', function() {
      var q = this.value.trim();
      var list = el.querySelector('#ieExpList');
      if (list) list.innerHTML = renderExpCards(getAllExps(), q);
    });

    // 分享经验
    el.querySelector('#btnAddExp').addEventListener('click', function() { showAddExpModal(el); });

    // 导出
    el.querySelector('#btnExportExp').addEventListener('click', function() {
      var userExps = loadUserExps();
      if (userExps.length === 0) { JN.showToast('暂无可导出的个人经验', 'warning'); return; }
      var json = JSON.stringify({ type: 'jnexperiences', version: '1.0', data: userExps, exportedAt: new Date().toISOString() }, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'JobNinja_面试经验_' + new Date().toISOString().slice(0,10) + '.json';
      a.click(); URL.revokeObjectURL(url);
      JN.showToast('经验数据已导出', 'success');
    });

    // 导入
    el.querySelector('#btnImportExp').addEventListener('click', function() { el.querySelector('#ieFileInput').click(); });
    el.querySelector('#ieFileInput').addEventListener('change', function() {
      var file = this.files && this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var json = JSON.parse(e.target.result);
          var data = json.data || json;
          if (!Array.isArray(data)) throw new Error('格式不正确');
          var existing = loadUserExps();
          var added = 0;
          data.forEach(function(exp) {
            if (exp.position && exp.questions && !existing.some(function(x) { return x.position === exp.position && x.company === exp.company; })) {
              exp.id = 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,6);
              existing.unshift(exp); added++;
            }
          });
          saveUserExps(existing);
          JN.showToast('成功导入' + added + '条经验', 'success');
          refreshAll(el);
        } catch(err) { JN.showToast('导入失败：文件格式不正确', 'error'); }
      };
      reader.readAsText(file);
      this.value = '';
    });

    // 生成清单
    el.querySelector('#btnGenChecklist').addEventListener('click', function() {
      var checklist = [
        '□ 打印3-5份纸质简历（彩色，优质纸张）',
        '□ 准备1分钟和3分钟两个版本的自我介绍',
        '□ 研究目标公司的产品、技术栈、近期新闻',
        '□ 准备3-5个STAR案例（技术能力/项目经验/团队协作）',
        '□ 装备作品集/项目演示（如有）',
        '□ 列出3-5个反问面试官的问题',
        '□ 确认面试时间、地点、形式（线上/线下）',
        '□ 准备合适的着装（商务休闲为宜）',
        '□ 提前30分钟到达（线下）或提前10分钟进入会议（线上）',
        '□ 检查设备（线上：摄像头/麦克风/网络/背景）',
        '□ 准备纸笔记录面试要点',
        '□ 面试后24小时内发送感谢邮件/消息'
      ];
      var html = '<ul style="padding-left:0;list-style:none;margin:0;">';
      checklist.forEach(function(item) {
        html += '<li style="padding:4px 0;cursor:pointer;" onclick="this.style.textDecoration=this.style.textDecoration===\'line-through\'?\'\':\'line-through\';this.style.opacity=this.style.opacity===\'0.4\'?\'1\':\'0.4\'">' + item + '</li>';
      });
      html += '</ul>';
      el.querySelector('#ieChecklist').innerHTML = html;
    });

    // 委托事件
    el.addEventListener('click', function(e) {
      var card = e.target.closest('.ie-exp-card');
      if (card && !e.target.closest('button')) {
        var id = card.getAttribute('data-id');
        var exp = getAllExps().find(function(x) { return x.id === id; });
        if (exp) showExpDetail(el, exp);
        return;
      }
      var delBtn = e.target.closest('.ie-del-btn');
      if (delBtn) {
        if (!confirm('确定删除该经验吗？')) return;
        var id2 = delBtn.getAttribute('data-id');
        var exps = loadUserExps().filter(function(x) { return x.id !== id2; });
        saveUserExps(exps);
        refreshAll(el);
        JN.showToast('经验已删除', 'info');
        return;
      }
    });

    return el;
  }

  function renderExpCards(exps, query) {
    var filtered = exps;
    if (query) {
      var ql = query.toLowerCase();
      filtered = exps.filter(function(e) {
        return (e.position||'').toLowerCase().indexOf(ql) !== -1 ||
               (e.company||'').toLowerCase().indexOf(ql) !== -1 ||
               (e.type||'').toLowerCase().indexOf(ql) !== -1 ||
               (e.questions||[]).some(function(qq) { return (qq.q||'').toLowerCase().indexOf(ql) !== -1; });
      });
    }
    if (filtered.length === 0) return '<div style="text-align:center;padding:40px;color:#4a4a6a;font-size:12px;">' + (query ? '没有匹配「' + query + '」的经验' : '暂无经验数据') + '</div>';

    return filtered.map(function(exp) {
      var isBuiltin = exp.id && exp.id.indexOf('builtin') === 0;
      var typeColor = exp.type === '技术面' ? '#6366f1' : exp.type === '综合面' ? '#8b5cf6' : '#10b981';
      return '<div class="ie-exp-card panel-card" data-id="' + exp.id + '" style="padding:10px 12px;margin-bottom:8px;cursor:pointer;transition:border-color 0.12s;"' +
        ' onmouseenter="this.style.borderColor=\'#6366f1\'" onmouseleave="this.style.borderColor=\'#1a1a26\'">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="display:flex;align-items:center;gap:6px;min-width:0;">' +
            '<span style="font-size:12px;font-weight:600;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + exp.position + '</span>' +
            '<span style="font-size:9px;padding:1px 5px;background:' + typeColor + '18;color:' + typeColor + ';border-radius:3px;">' + (exp.type||'') + '</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">' +
            (isBuiltin ? '<span style="font-size:8px;color:#4a4a6a;">内置</span>' : '<span style="font-size:8px;color:#34d399;">用户</span>') +
            (!isBuiltin ? '<button class="ie-del-btn" data-id="' + exp.id + '" style="background:none;border:none;color:#4a4a6a;cursor:pointer;font-size:12px;">&times;</button>' : '') +
          '</div>' +
        '</div>' +
        '<div style="font-size:10px;color:#4a4a6a;">' + (exp.company||'') + ' · ' + (exp.questions||[]).length + '个问题</div>' +
      '</div>';
    }).join('');
  }

  function showExpDetail(el, exp) {
    var typeColor = exp.type === '技术面' ? '#6366f1' : exp.type === '综合面' ? '#8b5cf6' : '#10b981';
    var detailEl = el.querySelector('#ieDetail');
    if (!detailEl) return;

    detailEl.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
        '<div>' +
          '<span style="font-size:14px;font-weight:600;color:#e2e8f0;">' + exp.position + '</span>' +
          '<span style="font-size:10px;padding:1px 6px;margin-left:6px;background:' + typeColor + '18;color:' + typeColor + ';border-radius:3px;">' + (exp.type||'') + '</span>' +
        '</div>' +
        '<span style="font-size:10px;color:#4a4a6a;">' + (exp.company||'') + '</span>' +
      '</div>' +
      (exp.tips ? '<div style="padding:8px 10px;background:#0f1a1a;border:1px solid #1a2a2a;border-radius:6px;font-size:10px;color:#6ee7b7;line-height:1.5;margin-bottom:10px;">' +
        '<i class="fa-solid fa-lightbulb" style="color:#f59e0b;margin-right:4px;"></i>' + exp.tips + '</div>' : '') +
      '<div style="max-height:380px;overflow-y:auto;" class="custom-scrollbar">' +
        (exp.questions||[]).map(function(qq, i) {
          return '<div style="padding:10px 12px;margin-bottom:8px;background:#0f0f17;border:1px solid #1a1a26;border-radius:8px;">' +
            '<div style="font-size:11px;font-weight:600;color:#a5b4fc;margin-bottom:4px;">Q' + (i+1) + '. ' + qq.q + '</div>' +
            '<div style="font-size:11px;color:#94a3b8;line-height:1.6;">' + (qq.answer||'') + '</div>' +
          '</div>';
        }).join('') +
      '</div>';
  }

  function showAddExpModal(el) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#12121a;border:1px solid #252536;border-radius:12px;padding:18px;width:90%;max-width:500px;max-height:85vh;overflow-y:auto;">' +
        '<h4 style="font-size:14px;color:#e2e8f0;margin:0 0 12px;">分享面试经验</h4>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">' +
          '<div><label style="font-size:10px;color:#64748b;">岗位名称 *</label><input id="ieAddPos" class="ninja-input" placeholder="如：前端开发" style="font-size:12px;"></div>' +
          '<div><label style="font-size:10px;color:#64748b;">公司名称</label><input id="ieAddCompany" class="ninja-input" placeholder="如：字节跳动" style="font-size:12px;"></div>' +
        '</div>' +
        '<div style="margin-bottom:8px;">' +
          '<label style="font-size:10px;color:#64748b;">面试类型</label>' +
          '<select id="ieAddType" class="ninja-input" style="font-size:12px;"><option>技术面</option><option>综合面</option><option>HR面</option><option>群面</option></select>' +
        '</div>' +
        '<div style="margin-bottom:8px;">' +
          '<label style="font-size:10px;color:#64748b;">面试问题和回答（每行一个问题，用 | 分隔问题和答案）</label>' +
          '<textarea id="ieAddQuestions" class="ninja-input" rows="6" placeholder="例：&#10;React虚拟DOM原理是什么？ | 虚拟DOM是JS对象模拟的真实DOM结构...&#10;说一下性能优化经验？ | 从网络、构建、渲染三个层面..." style="font-size:12px;"></textarea>' +
        '</div>' +
        '<div style="margin-bottom:10px;">' +
          '<label style="font-size:10px;color:#64748b;">面试建议/复盘</label>' +
          '<textarea id="ieAddTips" class="ninja-input" rows="2" placeholder="如：面试官重点问了算法，建议准备..." style="font-size:12px;"></textarea>' +
        '</div>' +
        '<div style="display:flex;gap:6px;justify-content:flex-end;">' +
          '<button id="ieAddCancel" class="btn btn-outline" style="font-size:12px;">取消</button>' +
          '<button id="ieAddSave" class="btn btn-primary" style="font-size:12px;">保存</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('#ieAddCancel').addEventListener('click', function() { document.body.removeChild(overlay); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) document.body.removeChild(overlay); });
    overlay.querySelector('#ieAddSave').addEventListener('click', function() {
      var pos = overlay.querySelector('#ieAddPos').value.trim();
      if (!pos) { JN.showToast('请填写岗位名称', 'warning'); return; }
      var qText = overlay.querySelector('#ieAddQuestions').value.trim();
      var questions = [];
      if (qText) {
        qText.split('\n').forEach(function(line) {
          var parts = line.split('|');
          if (parts.length >= 2) questions.push({ q: parts[0].trim(), answer: parts.slice(1).join('|').trim() });
          else if (parts[0].trim()) questions.push({ q: parts[0].trim(), answer: '' });
        });
      }
      var exp = {
        id: 'user_' + Date.now().toString(36), position: pos,
        company: overlay.querySelector('#ieAddCompany').value.trim(),
        type: overlay.querySelector('#ieAddType').value,
        questions: questions, tips: overlay.querySelector('#ieAddTips').value.trim(),
        createdAt: new Date().toISOString()
      };
      var exps = loadUserExps(); exps.unshift(exp); saveUserExps(exps);
      document.body.removeChild(overlay);
      refreshAll(el);
      JN.showToast('经验已保存，感谢分享！', 'success');
    });
  }

  function refreshAll(el) {
    var list = el.querySelector('#ieExpList');
    var q = el.querySelector('#ieSearch').value.trim();
    if (list) list.innerHTML = renderExpCards(getAllExps(), q);

    var statsDiv = el.querySelector('[style*="margin-top:10px;padding:8px 12px"]');
    if (statsDiv) {
      var userExps = loadUserExps();
      statsDiv.innerHTML = '内置' + BUILTIN_EXPERIENCES.length + '条经验 · 你已贡献' + userExps.length + '条 · 所有数据存储于本地';
    }
  }

  JN.registerPanel({
    id: 'experiences',
    title: '求职经验',
    icon: 'fa-book-open',
    render: render,
    onActivate: function() {}
  });

})();
