/* ============================================================
   LeadFlow AI — App Logic
   Routing, views, interactions, charts, drag-drop, modals, toasts
   ============================================================ */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const outlet = $('#view-outlet');
  let activeChart = []; // track to destroy on view change

  // ============ ROUTER ============
  const routes = {
    dashboard:    renderDashboard,
    leads:        renderLeads,
    pipeline:     renderPipeline,
    'lead-detail': renderLeadDetail,
    kb:           renderKnowledgeBase,
    scripts:      renderScripts,
    config:       renderConfig,
  };

  function navigate(route) {
    activeChart.forEach(c => { try { c.destroy(); } catch(e){} });
    activeChart = [];
    $$('.nav-item').forEach(n => n.classList.toggle('is-active', n.dataset.route === route));
    const fn = routes[route] || routes.dashboard;
    fn();
    LF.renderIcons(outlet);
    window.scrollTo(0, 0);
  }

  $$('.nav-item').forEach(item => item.addEventListener('click', () => navigate(item.dataset.route)));

  // ============ HELPERS ============
  const initials = (name) => name.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase();
  const fmtMoney = (n) => '$' + n.toLocaleString();

  function pageHeader(title, subtitle, actions = '') {
    return `
      <div class="flex items-end justify-between flex-wrap gap-4 mb-7">
        <div>
          <h1 class="font-display text-3xl font-bold text-white tracking-tight">${title}</h1>
          <p class="text-slate-400 text-sm mt-1.5">${subtitle}</p>
        </div>
        <div class="flex items-center gap-2">${actions}</div>
      </div>`;
  }

  // ============ VIEW: DASHBOARD ============
  function renderDashboard() {
    const kpiCards = LF.kpis.map((k, i) => `
      <div class="glass glass-hover kpi-card" data-tone="${k.tone}" style="animation-delay:${i*60}ms">
        <div class="flex items-start justify-between mb-4">
          <div class="kpi-card__icon"><i data-icon="${k.icon}"></i></div>
          <span class="delta delta--${k.up ? 'up' : 'down'}">${k.delta}</span>
        </div>
        <div class="font-mono text-xs uppercase tracking-widest text-slate-400 mb-1.5">${k.label}</div>
        <div class="font-display text-3xl font-bold text-white tracking-tight">${k.value}</div>
        <canvas class="kpi-card__sparkline" data-spark='${JSON.stringify(k.spark)}' data-tone="${k.tone}"></canvas>
      </div>`).join('');

    const slaList = LF.slaAlerts.map(a => `
      <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition cursor-pointer">
        <div class="w-9 h-9 rounded-full grid place-items-center" style="background:${a.level==='danger'?'rgba(248,113,113,0.15)':'rgba(251,191,36,0.15)'};color:${a.level==='danger'?'#f87171':'#fbbf24'}"><i data-icon="warn" class="w-4 h-4"></i></div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-white truncate">${a.name}</div>
          <div class="text-xs text-slate-400 font-mono">${a.id} · ${a.value}</div>
        </div>
        <div class="text-right">
          <div class="font-mono text-xs font-semibold ${a.level==='danger'?'text-red-400':'text-amber-400'}">${a.remaining}</div>
          <div class="text-[10px] text-slate-500 uppercase tracking-wider">remaining</div>
        </div>
      </div>`).join('');

    const activityList = LF.activity.map(a => `
      <div class="flex items-start gap-3 py-2.5">
        <div class="w-2 h-2 rounded-full mt-2 flex-shrink-0" style="background:var(--${a.tone === 'cyan' ? 'cyan' : a.tone === 'purple' ? 'purple' : a.tone === 'green' ? 'green' : 'amber'});box-shadow:0 0 8px var(--${a.tone === 'cyan' ? 'cyan' : a.tone === 'purple' ? 'purple' : a.tone === 'green' ? 'green' : 'amber'})"></div>
        <div class="flex-1 min-w-0">
          <div class="text-sm text-white"><span class="font-semibold">${a.who}</span> <span class="text-slate-400">${a.what}</span></div>
          <div class="text-xs text-slate-500 font-mono mt-0.5">${a.when}</div>
        </div>
      </div>`).join('');

    outlet.innerHTML = `
      <div class="view">
        ${pageHeader('Dashboard', 'Real-time overview · last sync just now',
          `<div class="segmented"><button class="is-active">Today</button><button>Week</button><button>Month</button><button>Quarter</button></div>
           <button class="btn-ghost"><i data-icon="download" class="w-4 h-4"></i>Export</button>
           <button class="btn-primary"><i data-icon="plus" class="w-4 h-4"></i>New Lead</button>`
        )}

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">${kpiCards}</div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div class="glass p-5 lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
              <div>
                <div class="font-display font-semibold text-white">Leads Trend</div>
                <div class="text-xs text-slate-400 mt-0.5">New vs converted leads · last 30 days</div>
              </div>
              <div class="flex items-center gap-3 text-xs">
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-cyan-400" style="box-shadow:0 0 6px #22d3ee"></span>New</span>
                <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-purple-400" style="box-shadow:0 0 6px #a855f7"></span>Converted</span>
              </div>
            </div>
            <div class="chart-wrap"><canvas id="ch-leads"></canvas></div>
          </div>
          <div class="glass p-5">
            <div class="flex items-center justify-between mb-4">
              <div class="font-display font-semibold text-white">Channel Mix</div>
              <span class="ai-badge">AI optimized</span>
            </div>
            <div class="chart-wrap" style="height:240px"><canvas id="ch-channel"></canvas></div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div class="glass p-5 lg:col-span-2">
            <div class="flex items-center justify-between mb-4">
              <div>
                <div class="font-display font-semibold text-white">Conversion Funnel</div>
                <div class="text-xs text-slate-400 mt-0.5">Visitor → Lead → Qualified → Won</div>
              </div>
            </div>
            <div class="space-y-2.5">
              ${LF.funnel.map((f,i) => {
                const pct = (f.value / LF.funnel[0].value) * 100;
                return `<div>
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="text-slate-300 font-medium">${f.stage}</span>
                    <span class="font-mono text-white">${f.value.toLocaleString()} <span class="text-slate-500">(${pct.toFixed(1)}%)</span></span>
                  </div>
                  <div class="h-9 rounded-lg overflow-hidden bg-white/5 relative">
                    <div class="h-full rounded-lg transition-all duration-700" style="width:${pct}%;background:linear-gradient(90deg, ${f.color}40, ${f.color});box-shadow:0 0 20px ${f.color}40;animation-delay:${i*100}ms"></div>
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>

          <div class="glass p-5">
            <div class="flex items-center justify-between mb-3">
              <div class="font-display font-semibold text-white">SLA Alerts</div>
              <span class="tag tag--hot"><span class="tag-dot"></span>${LF.slaAlerts.length}</span>
            </div>
            <div>${slaList}</div>
            <div class="mt-4 pt-4 border-t border-white/5">
              <div class="font-display font-semibold text-white mb-2 text-sm">Recent Activity</div>
              <div class="max-h-[280px] overflow-auto pr-1">${activityList}</div>
            </div>
          </div>
        </div>
      </div>`;

    setTimeout(() => {
      drawSparklines();
      drawLeadsChart();
      drawChannelChart();
    }, 30);
  }

  function drawSparklines() {
    $$('.kpi-card__sparkline').forEach(c => {
      const data = JSON.parse(c.dataset.spark);
      const tone = c.dataset.tone;
      const colors = { cyan: '#22d3ee', purple: '#a855f7', green: '#34d399', amber: '#fbbf24' };
      const color = colors[tone];
      const ctx = c.getContext('2d');
      const chart = new Chart(ctx, {
        type: 'line',
        data: { labels: data.map((_,i)=>i), datasets: [{ data, borderColor: color, backgroundColor: ctx => {
          const grd = ctx.chart.ctx.createLinearGradient(0, 0, 0, 50);
          grd.addColorStop(0, color + '40'); grd.addColorStop(1, color + '00');
          return grd;
        }, fill: true, tension: 0.4, borderWidth: 1.8, pointRadius: 0 }]},
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
          animation: { duration: 1200, easing: 'easeOutQuart' },
        }
      });
      activeChart.push(chart);
    });
  }

  function drawLeadsChart() {
    const ctx = $('#ch-leads')?.getContext('2d'); if (!ctx) return;
    const labels = Array.from({length: 30}, (_, i) => `D${i+1}`);
    const newLeads = labels.map((_, i) => Math.round(20 + Math.sin(i/3)*8 + i*1.2 + Math.random()*8));
    const conv = newLeads.map(v => Math.round(v * (0.32 + Math.random()*0.12)));
    const grdC = ctx.createLinearGradient(0,0,0,280); grdC.addColorStop(0,'#22d3ee55'); grdC.addColorStop(1,'#22d3ee00');
    const grdP = ctx.createLinearGradient(0,0,0,280); grdP.addColorStop(0,'#a855f755'); grdP.addColorStop(1,'#a855f700');
    activeChart.push(new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [
        { label: 'New', data: newLeads, borderColor: '#22d3ee', backgroundColor: grdC, fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#22d3ee' },
        { label: 'Converted', data: conv, borderColor: '#a855f7', backgroundColor: grdP, fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#a855f7' }
      ]},
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode:'index', intersect:false },
        plugins: { legend: { display: false },
          tooltip: { backgroundColor: '#0b0f1d', borderColor: '#26304b', borderWidth: 1, titleColor: '#f8fafc', bodyColor: '#cbd5e1', padding: 10, cornerRadius: 8, displayColors: true, boxPadding: 4 }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10, family: 'JetBrains Mono' }, maxTicksLimit: 8 } },
          y: { grid: { color: 'rgba(148,163,184,0.06)' }, ticks: { color: '#64748b', font: { size: 10, family: 'JetBrains Mono' } } },
        },
        animation: { duration: 1400, easing: 'easeOutQuart' }
      }
    }));
  }

  function drawChannelChart() {
    const ctx = $('#ch-channel')?.getContext('2d'); if (!ctx) return;
    activeChart.push(new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Zalo', 'WhatsApp', 'Telegram', 'Email'],
        datasets: [{
          data: [42, 28, 18, 12],
          backgroundColor: ['#22d3ee', '#34d399', '#60a5fa', '#a855f7'],
          borderColor: '#0b0f1d', borderWidth: 3, hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 11, family: 'Inter' }, padding: 12, boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle' } },
          tooltip: { backgroundColor: '#0b0f1d', borderColor: '#26304b', borderWidth: 1, titleColor: '#f8fafc', bodyColor: '#cbd5e1', padding: 10, cornerRadius: 8 }
        },
        animation: { animateRotate: true, animateScale: true, duration: 1200 }
      }
    }));
  }

  // ============ VIEW: LEADS TABLE ============
  function renderLeads() {
    const filterChips = ['All', 'HOT', 'WARM', 'COLD', 'New', 'Contacted', 'Quoted', 'Won', 'Lost'];
    outlet.innerHTML = `
      <div class="view">
        ${pageHeader('Lead Management', `${LF.leads.length} active leads · 142 total this month`,
          `<button class="btn-ghost"><i data-icon="filter" class="w-4 h-4"></i>Advanced</button>
           <button class="btn-ghost"><i data-icon="download" class="w-4 h-4"></i>CSV</button>
           <button class="btn-primary"><i data-icon="plus" class="w-4 h-4"></i>New Lead</button>`
        )}

        <div class="glass p-5 mb-5">
          <div class="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div class="topbar__search flex-1" style="max-width:none">
              <i data-icon="search" class="text-slate-500"></i>
              <input id="leads-search" type="text" placeholder="Search by name, company, email..." />
            </div>
            <div class="flex flex-wrap gap-2" id="leads-filters">
              ${filterChips.map((c,i) => `<button class="btn-ghost h-8 text-xs ${i===0?'is-active-chip':''}" data-filter="${c.toLowerCase()}" style="${i===0?'border-color:rgba(34,211,238,0.4);background:rgba(34,211,238,0.08);color:white':''}">${c}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="glass table-wrap">
          <div class="overflow-x-auto">
            <table class="dtable">
              <thead><tr>
                <th><input type="checkbox" class="accent-cyan-400" /></th>
                <th>Lead</th><th>Company</th><th>Status</th><th>Channel</th>
                <th class="text-right">Value</th><th>Owner</th><th>Score</th><th>SLA</th><th></th>
              </tr></thead>
              <tbody id="leads-tbody">${renderLeadRows(LF.leads)}</tbody>
            </table>
          </div>
        </div>
      </div>`;

    $('#leads-search').addEventListener('input', applyLeadFilters);
    $$('#leads-filters button').forEach(btn => btn.addEventListener('click', () => {
      $$('#leads-filters button').forEach(b => { b.style.cssText = ''; b.classList.remove('is-active-chip'); });
      btn.style.cssText = 'border-color:rgba(34,211,238,0.4);background:rgba(34,211,238,0.08);color:white';
      btn.classList.add('is-active-chip');
      applyLeadFilters();
    }));
    $$('#leads-tbody tr').forEach(r => r.addEventListener('click', (e) => {
      if (e.target.closest('input,button')) return;
      openLeadModal(r.dataset.id);
    }));
  }

  function renderLeadRows(leads) {
    if (!leads.length) return `<tr><td colspan="10" class="text-center text-slate-500 py-12">No leads match your filters.</td></tr>`;
    return leads.map(l => {
      const scoreColor = l.score >= 85 ? '#34d399' : l.score >= 65 ? '#fbbf24' : '#64748b';
      const slaColor = l.sla > 70 ? 'progress' : l.sla > 30 ? 'progress progress--warn' : 'progress progress--danger';
      return `
      <tr data-id="${l.id}">
        <td onclick="event.stopPropagation()"><input type="checkbox" class="accent-cyan-400" /></td>
        <td>
          <div class="flex items-center gap-3">
            <div class="avatar-mini" style="background:${LF.avatarColor(l.id)}">${initials(l.name)}</div>
            <div>
              <div class="text-white font-medium">${l.name}</div>
              <div class="text-xs text-slate-500 font-mono">${l.id}</div>
            </div>
          </div>
        </td>
        <td><div class="text-slate-200">${l.company}</div><div class="text-xs text-slate-500">${l.country}</div></td>
        <td><span class="tag tag--${LF.statusToTag[l.status]}"><span class="tag-dot"></span>${LF.statusLabel[l.status]}</span></td>
        <td><div class="w-7 h-7 rounded-md grid place-items-center" style="background:rgba(148,163,184,0.08)"><i data-icon="${LF.channelIcon[l.channel]}" class="w-4 h-4 text-slate-300"></i></div></td>
        <td class="text-right font-mono font-semibold text-white">${fmtMoney(l.value)}</td>
        <td><div class="avatar-mini" style="background:${LF.avatarColor(l.owner)};width:24px;height:24px;font-size:9px">${l.owner}</div></td>
        <td>
          <div class="flex items-center gap-2">
            <div class="font-mono font-bold" style="color:${scoreColor}">${l.score}</div>
            <span class="tag tag--${l.tag}">${LF.tagLabel[l.tag]||l.tag.toUpperCase()}</span>
          </div>
        </td>
        <td>
          <div class="flex items-center gap-2 min-w-[100px]">
            <div class="${slaColor} flex-1"><span style="width:${l.sla}%"></span></div>
            <span class="font-mono text-xs text-slate-400">${l.sla}%</span>
          </div>
        </td>
        <td onclick="event.stopPropagation()"><button class="icon-btn" style="width:30px;height:30px"><i data-icon="more" class="w-4 h-4"></i></button></td>
      </tr>`;
    }).join('');
  }

  function applyLeadFilters() {
    const q = $('#leads-search').value.trim().toLowerCase();
    const activeChip = $('#leads-filters .is-active-chip');
    const f = activeChip ? activeChip.dataset.filter : 'all';
    const filtered = LF.leads.filter(l => {
      const matchQ = !q || l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
      const matchF = f === 'all' || l.tag === f || l.status === f;
      return matchQ && matchF;
    });
    $('#leads-tbody').innerHTML = renderLeadRows(filtered);
    LF.renderIcons($('#leads-tbody'));
    $$('#leads-tbody tr').forEach(r => r.addEventListener('click', (e) => {
      if (e.target.closest('input,button')) return;
      openLeadModal(r.dataset.id);
    }));
  }

  // ============ VIEW: PIPELINE (KANBAN) ============
  function renderPipeline() {
    const cols = [
      { id: 'new',       label: 'New',       color: '#60a5fa' },
      { id: 'contacted', label: 'Contacted', color: '#22d3ee' },
      { id: 'quoted',    label: 'Quoted',    color: '#a855f7' },
      { id: 'won',       label: 'Won',       color: '#34d399' },
      { id: 'lost',      label: 'Lost',      color: '#64748b' },
    ];

    const colsHtml = cols.map(col => {
      const items = LF.leads.filter(l => l.status === col.id);
      const total = items.reduce((s, l) => s + l.value, 0);
      const cardsHtml = items.map(l => `
        <div class="kanban-card" draggable="true" data-id="${l.id}">
          <div class="flex items-start justify-between mb-2.5">
            <div class="flex items-center gap-2">
              <div class="avatar-mini" style="background:${LF.avatarColor(l.id)};width:24px;height:24px;font-size:9px">${initials(l.name)}</div>
              <div>
                <div class="text-sm font-semibold text-white leading-tight">${l.name}</div>
                <div class="text-[10px] font-mono text-slate-500">${l.id}</div>
              </div>
            </div>
            <span class="tag tag--${l.tag}">${LF.tagLabel[l.tag]||l.tag.toUpperCase()}</span>
          </div>
          <div class="text-xs text-slate-400 mb-3 truncate">${l.company} · ${l.country}</div>
          <div class="flex items-center justify-between text-xs">
            <span class="font-mono font-semibold text-white">${fmtMoney(l.value)}</span>
            <div class="flex items-center gap-2 text-slate-500">
              <i data-icon="${LF.channelIcon[l.channel]}" class="w-3.5 h-3.5"></i>
              <span class="font-mono text-[10px]">${l.last}</span>
            </div>
          </div>
        </div>`).join('');

      return `
        <div class="glass kanban-col" data-col="${col.id}">
          <div class="kanban-col__head">
            <div class="kanban-col__title" style="color:${col.color}">
              <span class="tag-dot" style="color:${col.color}"></span>
              ${col.label}
              <span class="kanban-col__count">${items.length}</span>
            </div>
            <button class="icon-btn" style="width:26px;height:26px"><i data-icon="plus" class="w-3.5 h-3.5"></i></button>
          </div>
          <div class="text-[10px] font-mono text-slate-500 mb-2 px-1.5">TOTAL: ${fmtMoney(total)}</div>
          <div class="kanban-col__body flex-1 flex flex-col gap-2">${cardsHtml}</div>
        </div>`;
    }).join('');

    outlet.innerHTML = `
      <div class="view">
        ${pageHeader('Pipeline', 'Drag cards across stages — auto-saves and notifies team',
          `<div class="segmented"><button class="is-active">Board</button><button>Forecast</button></div>
           <button class="btn-ghost"><i data-icon="filter" class="w-4 h-4"></i>Filter</button>
           <button class="btn-primary"><i data-icon="plus" class="w-4 h-4"></i>New Deal</button>`
        )}
        <div class="kanban">${colsHtml}</div>
      </div>`;

    initDragDrop();
  }

  function initDragDrop() {
    let dragged = null;
    $$('.kanban-card').forEach(card => {
      card.addEventListener('dragstart', e => {
        dragged = card;
        card.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
        $$('.kanban-col').forEach(c => c.classList.remove('is-drag-over'));
      });
    });
    $$('.kanban-col').forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('is-drag-over'); });
      col.addEventListener('dragleave', () => col.classList.remove('is-drag-over'));
      col.addEventListener('drop', e => {
        e.preventDefault();
        col.classList.remove('is-drag-over');
        if (!dragged) return;
        col.querySelector('.kanban-col__body').appendChild(dragged);
        const newStatus = col.dataset.col;
        const id = dragged.dataset.id;
        const lead = LF.leads.find(l => l.id === id);
        if (lead && lead.status !== newStatus) {
          lead.status = newStatus;
          showToast({ tone: 'success', icon: 'check', title: 'Stage updated', desc: `${lead.name} → ${LF.statusLabel[newStatus]}` });
        }
      });
    });
  }

  // ============ VIEW: LEAD DETAIL ============
  function renderLeadDetail() {
    const l = LF.leads[1]; // Sarah Mitchell
    outlet.innerHTML = `
      <div class="view">
        <div class="flex items-center gap-2 text-xs text-slate-500 mb-4 font-mono">
          <span class="cursor-pointer hover:text-cyan-400" data-route="leads">Leads</span>
          <span>/</span>
          <span class="text-slate-300">${l.id}</span>
        </div>

        <div class="flex items-start justify-between flex-wrap gap-4 mb-7">
          <div class="flex items-center gap-4">
            <div class="avatar-mini" style="background:${LF.avatarColor(l.id)};width:56px;height:56px;font-size:18px;border-radius:14px">${initials(l.name)}</div>
            <div>
              <div class="flex items-center gap-3 mb-1">
                <h1 class="font-display text-2xl font-bold text-white">${l.name}</h1>
                <span class="tag tag--${l.tag}">${LF.tagLabel[l.tag]||l.tag.toUpperCase()}</span>
                <span class="ai-badge">Score ${l.score}</span>
              </div>
              <div class="text-sm text-slate-400">${l.company} · ${l.country} · ${l.email}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-ghost"><i data-icon="phone" class="w-4 h-4"></i>Call</button>
            <button class="btn-ghost"><i data-icon="mail" class="w-4 h-4"></i>Email</button>
            <button class="btn-primary"><i data-icon="send" class="w-4 h-4"></i>Reply</button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- Conversation -->
          <div class="glass p-5 lg:col-span-2 flex flex-col" style="height:calc(100vh - 220px); min-height:520px">
            <div class="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-md grid place-items-center" style="background:rgba(34,211,238,0.1);color:#22d3ee"><i data-icon="${LF.channelIcon[l.channel]}" class="w-4 h-4"></i></div>
                <div>
                  <div class="font-display font-semibold text-white text-sm">WhatsApp Conversation</div>
                  <div class="text-xs text-slate-500 font-mono">Last reply 14m ago · ${l.phone}</div>
                </div>
              </div>
              <span class="flex items-center gap-1.5 text-xs text-green-400"><span class="pulse-dot"></span>Online</span>
            </div>

            <div class="flex-1 overflow-auto pr-1 mb-4" id="chat-stream">
              ${LF.conversation.map(m => `
                <div class="chat-msg chat-msg--${m.dir==='in'?'in':'out'}">
                  ${m.dir==='in' ? `<div class="avatar-mini" style="background:${LF.avatarColor(l.id)};font-size:9px">${initials(l.name)}</div>` : ''}
                  <div>
                    <div class="chat-msg__bubble">${m.text}</div>
                    <div class="chat-meta ${m.dir==='out'?'text-right':''}">${m.time}</div>
                  </div>
                </div>`).join('')}
            </div>

            <div class="flex gap-2 items-end pt-3 border-t border-white/5">
              <input class="input flex-1" placeholder="Type a reply..." id="reply-input" />
              <button class="icon-btn"><i data-icon="attach" class="w-4 h-4"></i></button>
              <button class="icon-btn"><i data-icon="sparkle" class="w-4 h-4" style="color:#a855f7"></i></button>
              <button class="btn-primary" id="send-reply"><i data-icon="send" class="w-4 h-4"></i>Send</button>
            </div>
          </div>

          <!-- Right column: AI + Products + Timeline -->
          <div class="space-y-5">

            <!-- AI Suggestions -->
            <div class="glass p-5">
              <div class="flex items-center justify-between mb-4">
                <div class="font-display font-semibold text-white text-sm flex items-center gap-2"><span class="ai-badge">AI</span>Suggestions</div>
                <button class="text-xs text-cyan-400 hover:text-white">Refresh</button>
              </div>
              <div class="space-y-2.5">
                ${LF.aiSuggestions.map(s => `
                  <div class="p-3 rounded-xl border border-white/5 hover:border-cyan-400/30 transition cursor-pointer group">
                    <div class="flex items-start justify-between gap-3 mb-1.5">
                      <div class="text-sm text-white font-medium leading-tight flex-1">${s.title}</div>
                      <div class="font-mono text-xs font-bold" style="color:${s.score>=90?'#34d399':s.score>=80?'#22d3ee':'#fbbf24'}">${s.score}</div>
                    </div>
                    <div class="text-xs text-slate-500 leading-relaxed">${s.reason}</div>
                  </div>`).join('')}
              </div>
            </div>

            <!-- Product recommendations -->
            <div class="glass p-5">
              <div class="font-display font-semibold text-white text-sm mb-4">Recommended Products</div>
              <div class="space-y-2.5">
                ${LF.products.map(p => `
                  <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition">
                    <div class="w-9 h-9 rounded-lg grid place-items-center" style="background:linear-gradient(135deg,rgba(34,211,238,0.15),rgba(168,85,247,0.15))"><i data-icon="sparkle" class="w-4 h-4 text-cyan-400"></i></div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm text-white font-medium">${p.name}</div>
                      <div class="text-xs text-slate-500 font-mono">${p.price}</div>
                    </div>
                    <div class="text-right">
                      <div class="font-mono text-xs font-bold text-cyan-400">${p.fit}%</div>
                      ${p.badge ? `<div class="text-[9px] uppercase tracking-wider text-slate-500 font-mono">${p.badge}</div>` : ''}
                    </div>
                  </div>`).join('')}
              </div>
            </div>

            <!-- Attachments -->
            <div class="glass p-5">
              <div class="font-display font-semibold text-white text-sm mb-3">Attachments</div>
              <div class="space-y-2">
                ${[
                  {name:'pricing-enterprise.pdf', size:'2.4 MB'},
                  {name:'security-whitepaper.pdf', size:'1.8 MB'},
                  {name:'demo-recording.mp4', size:'48 MB'},
                ].map(f => `
                  <div class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition cursor-pointer">
                    <div class="w-8 h-8 rounded-md grid place-items-center" style="background:rgba(96,165,250,0.1);color:#60a5fa"><i data-icon="attach" class="w-4 h-4"></i></div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs text-slate-200 truncate">${f.name}</div>
                      <div class="text-[10px] text-slate-500 font-mono">${f.size}</div>
                    </div>
                    <button class="icon-btn" style="width:28px;height:28px"><i data-icon="download" class="w-3.5 h-3.5"></i></button>
                  </div>`).join('')}
              </div>
            </div>

            <!-- Timeline -->
            <div class="glass p-5">
              <div class="font-display font-semibold text-white text-sm mb-4">Activity Timeline</div>
              <div class="timeline">
                ${LF.timeline.map(t => `
                  <div class="timeline-item">
                    <div class="text-sm text-slate-200 leading-snug">${t.text}</div>
                    <div class="text-[10px] text-slate-500 font-mono mt-0.5">${t.time}</div>
                  </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>`;

    $('#send-reply')?.addEventListener('click', () => {
      const v = $('#reply-input').value.trim(); if (!v) return;
      const stream = $('#chat-stream');
      stream.insertAdjacentHTML('beforeend', `
        <div class="chat-msg chat-msg--out">
          <div><div class="chat-msg__bubble">${v}</div><div class="chat-meta text-right">just now</div></div>
        </div>`);
      stream.scrollTop = stream.scrollHeight;
      $('#reply-input').value = '';
      showToast({ tone: 'success', icon: 'check', title: 'Message sent', desc: 'Delivered via WhatsApp' });
    });

    // Breadcrumb back
    outlet.querySelector('[data-route="leads"]').addEventListener('click', () => navigate('leads'));
  }

  // ============ VIEW: KNOWLEDGE BASE ============
  function renderKnowledgeBase() {
    const cats = ['All', 'Pricing', 'Product', 'Sales', 'Process'];
    outlet.innerHTML = `
      <div class="view">
        ${pageHeader('Knowledge Base', `${LF.kb.length} documents · synced 2 minutes ago`,
          `<button class="btn-ghost"><i data-icon="filter" class="w-4 h-4"></i>Tags</button>
           <button class="btn-primary"><i data-icon="plus" class="w-4 h-4"></i>New Article</button>`
        )}

        <div class="glass p-7 mb-6 relative overflow-hidden">
          <div class="absolute -top-20 -right-20 w-72 h-72 rounded-full" style="background:radial-gradient(circle,rgba(34,211,238,0.15),transparent 60%);filter:blur(60px)"></div>
          <div class="relative max-w-2xl mx-auto text-center">
            <div class="font-display text-2xl font-bold text-white mb-2">What do you want to know?</div>
            <div class="text-sm text-slate-400 mb-5">Ask a question or search across all knowledge — semantic + keyword.</div>
            <div class="topbar__search h-12" style="max-width:none">
              <i data-icon="search" class="text-slate-500 w-5 h-5"></i>
              <input id="kb-search" type="text" placeholder='Try "what is the discount approval matrix?"' />
              <span class="ai-badge">AI Search</span>
            </div>
            <div class="flex flex-wrap justify-center gap-2 mt-5">
              ${cats.map((c,i) => `<button class="btn-ghost h-7 text-xs px-3" data-cat="${c.toLowerCase()}" style="${i===0?'border-color:rgba(34,211,238,0.4);background:rgba(34,211,238,0.08);color:white':''}">${c}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" id="kb-grid">
          ${renderKbCards(LF.kb)}
        </div>
      </div>`;

    $('#kb-search').addEventListener('input', filterKb);
    $$('[data-cat]').forEach(b => b.addEventListener('click', () => {
      $$('[data-cat]').forEach(x => { x.style.cssText=''; x.removeAttribute('data-active'); });
      b.style.cssText = 'border-color:rgba(34,211,238,0.4);background:rgba(34,211,238,0.08);color:white';
      b.setAttribute('data-active', 'true');
      filterKb();
    }));
    // mark first as active by default
    const firstCat = $$('[data-cat]')[0]; if (firstCat) firstCat.setAttribute('data-active', 'true');
  }
  function renderKbCards(items) {
    if (!items.length) return `<div class="col-span-full text-center text-slate-500 py-12">No articles match.</div>`;
    return items.map(k => `
      <div class="glass glass-hover kb-card">
        <div class="kb-card__cover relative">
          <i data-icon="book" class="w-7 h-7 relative"></i>
          <span class="absolute top-2 right-2 tag tag--neutral">${k.cat}</span>
        </div>
        <div class="font-display font-semibold text-white text-sm mb-1.5 leading-tight">${k.title}</div>
        <div class="text-xs text-slate-400 leading-relaxed mb-3">${k.desc}</div>
        <div class="flex items-center justify-between">
          <div class="flex flex-wrap gap-1">
            ${k.tags.map(t => `<span class="text-[10px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">#${t}</span>`).join('')}
          </div>
          <span class="font-mono text-[10px] text-cyan-400">${k.price}</span>
        </div>
      </div>`).join('');
  }
  function filterKb() {
    const q = $('#kb-search').value.trim().toLowerCase();
    const activeBtn = $('[data-cat][data-active="true"]');
    const cat = activeBtn ? activeBtn.dataset.cat : 'all';
    const filtered = LF.kb.filter(k => {
      const matchQ = !q || k.title.toLowerCase().includes(q) || k.desc.toLowerCase().includes(q) || k.tags.some(t=>t.includes(q));
      const matchC = cat === 'all' || k.cat === cat;
      return matchQ && matchC;
    });
    $('#kb-grid').innerHTML = renderKbCards(filtered);
    LF.renderIcons($('#kb-grid'));
  }

  // ============ VIEW: SCRIPTS ============
  function renderScripts() {
    const cats = [...new Set(LF.scripts.map(s => s.cat))];
    outlet.innerHTML = `
      <div class="view">
        ${pageHeader('Sales Scripts', `${LF.scripts.length} scripts across ${cats.length} categories · battle-tested`,
          `<button class="btn-ghost"><i data-icon="sparkle" class="w-4 h-4"></i>AI Generate</button>
           <button class="btn-primary"><i data-icon="plus" class="w-4 h-4"></i>New Script</button>`
        )}

        ${cats.map(cat => `
          <div class="mb-7">
            <div class="flex items-center gap-3 mb-4">
              <div class="font-display font-semibold text-white capitalize">${cat}</div>
              <div class="h-px bg-white/10 flex-1"></div>
              <div class="font-mono text-xs text-slate-500">${LF.scripts.filter(s=>s.cat===cat).length} scripts</div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              ${LF.scripts.filter(s => s.cat === cat).map(s => `
                <div class="glass glass-hover p-5 group">
                  <div class="flex items-start justify-between mb-3">
                    <div class="font-display font-semibold text-white text-sm">${s.title}</div>
                    <button class="icon-btn" style="width:30px;height:30px" data-copy="${encodeURIComponent(s.body)}"><i data-icon="copy" class="w-3.5 h-3.5"></i></button>
                  </div>
                  <div class="text-xs text-slate-300 leading-relaxed mb-4 font-mono whitespace-pre-line">${s.body}</div>
                  <div class="flex items-center justify-between pt-3 border-t border-white/5">
                    <span class="tag tag--purple">${cat}</span>
                    <div class="text-[10px] font-mono text-slate-500">Used 142 times</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>`;

    $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
      navigator.clipboard.writeText(decodeURIComponent(b.dataset.copy));
      showToast({ tone: 'success', icon: 'copy', title: 'Copied to clipboard', desc: 'Script ready to paste' });
    }));
  }

  // ============ VIEW: CONFIG / INTEGRATIONS ============
  function renderConfig() {
    outlet.innerHTML = `
      <div class="view">
        ${pageHeader('Integrations', 'Connect your channels and AI providers · 4 of 6 active', '')}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          ${LF.integrations.map(i => `
            <div class="glass glass-hover p-5">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl grid place-items-center" style="background:rgba(34,211,238,0.08);color:#22d3ee;border:1px solid rgba(34,211,238,0.2)"><i data-icon="${i.icon}" class="w-6 h-6"></i></div>
                  <div>
                    <div class="font-display font-semibold text-white">${i.name}</div>
                    <div class="flex items-center gap-1.5 text-xs">
                      <span class="w-1.5 h-1.5 rounded-full" style="background:${i.enabled?'#34d399':'#64748b'}"></span>
                      <span class="text-slate-400 font-mono text-[11px]">${i.status} · ${i.lastPing}</span>
                    </div>
                  </div>
                </div>
                <label class="toggle">
                  <input type="checkbox" ${i.enabled ? 'checked' : ''} data-int="${i.id}" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <p class="text-xs text-slate-400 mb-4 leading-relaxed">${i.desc}</p>
              <div class="space-y-3 mb-4">
                ${i.fields.map(f => `
                  <div>
                    <label class="label">${f.label}</label>
                    <input class="input" type="password" placeholder="${f.placeholder}" />
                  </div>`).join('')}
              </div>
              <div class="flex gap-2 pt-3 border-t border-white/5">
                <button class="btn-ghost flex-1 h-9 text-xs" data-test-conn="${i.id}"><i data-icon="bolt" class="w-3.5 h-3.5"></i>Test connection</button>
                <button class="btn-primary h-9 text-xs px-4">Save</button>
              </div>
            </div>`).join('')}
        </div>
      </div>`;

    $$('[data-test-conn]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.testConn;
      const orig = btn.innerHTML;
      btn.innerHTML = '<div class="skeleton" style="height:14px;width:60px"></div>';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = orig;
        LF.renderIcons(btn);
        btn.disabled = false;
        const ok = Math.random() > 0.2;
        showToast({
          tone: ok ? 'success' : 'error',
          icon: ok ? 'check' : 'warn',
          title: ok ? `${LF.integrations.find(i=>i.id===id).name} connected` : 'Connection failed',
          desc: ok ? 'Latency 142ms · token verified' : 'Check API key and try again'
        });
      }, 1100);
    }));

    $$('[data-int]').forEach(t => t.addEventListener('change', e => {
      const i = LF.integrations.find(x => x.id === e.target.dataset.int);
      i.enabled = e.target.checked;
      showToast({ tone: i.enabled ? 'success' : 'warn', icon: 'info', title: `${i.name} ${i.enabled?'enabled':'disabled'}`, desc: i.enabled ? 'Now receiving messages' : 'Channel paused' });
    }));
  }

  // ============ LEAD MODAL ============
  function openLeadModal(id) {
    const l = LF.leads.find(x => x.id === id); if (!l) return;
    const root = $('#modal-root');
    root.innerHTML = `
      <div class="modal-backdrop" id="lead-backdrop">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="p-6 border-b border-white/5 flex items-start justify-between">
            <div class="flex items-center gap-4">
              <div class="avatar-mini" style="background:${LF.avatarColor(l.id)};width:48px;height:48px;font-size:16px;border-radius:12px">${initials(l.name)}</div>
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <div class="font-display text-xl font-bold text-white">${l.name}</div>
                  <span class="tag tag--${l.tag}">${LF.tagLabel[l.tag]||l.tag.toUpperCase()}</span>
                </div>
                <div class="text-sm text-slate-400">${l.company} · ${l.country} · ${l.id}</div>
              </div>
            </div>
            <button class="icon-btn" id="modal-close"><i data-icon="close" class="w-4 h-4"></i></button>
          </div>
          <div class="p-6 overflow-auto grid grid-cols-2 gap-5">
            ${[
              ['Email', l.email], ['Phone', l.phone],
              ['Channel', l.channel.toUpperCase()], ['Status', LF.statusLabel[l.status]],
              ['Source', l.source], ['Owner', l.owner],
              ['Deal Value', fmtMoney(l.value)], ['AI Score', `${l.score}/100`],
            ].map(([k,v]) => `
              <div>
                <div class="label">${k}</div>
                <div class="text-sm text-white font-medium">${v}</div>
              </div>`).join('')}
            <div class="col-span-2">
              <div class="label">SLA Progress</div>
              <div class="flex items-center gap-3">
                <div class="progress ${l.sla>70?'':l.sla>30?'progress--warn':'progress--danger'} flex-1"><span style="width:${l.sla}%"></span></div>
                <span class="font-mono text-sm font-bold text-white">${l.sla}%</span>
              </div>
            </div>
          </div>
          <div class="p-5 border-t border-white/5 flex items-center justify-between bg-black/20">
            <button class="btn-danger"><i data-icon="close" class="w-4 h-4"></i>Mark Lost</button>
            <div class="flex gap-2">
              <button class="btn-ghost" id="modal-view-detail">Open detail</button>
              <button class="btn-primary"><i data-icon="send" class="w-4 h-4"></i>Reply</button>
            </div>
          </div>
        </div>
      </div>`;
    LF.renderIcons(root);
    $('#lead-backdrop').addEventListener('click', closeModal);
    $('#modal-close').addEventListener('click', closeModal);
    $('#modal-view-detail').addEventListener('click', () => { closeModal(); navigate('lead-detail'); });
  }
  function closeModal() {
    const bd = $('#lead-backdrop'); if (!bd) return;
    bd.style.animation = 'backdropIn 0.2s reverse'; bd.querySelector('.modal').style.animation = 'modalIn 0.2s reverse';
    setTimeout(() => $('#modal-root').innerHTML = '', 180);
  }

  // ============ TOAST ============
  function showToast({ tone = 'info', icon = 'info', title, desc, ttl = 3500 }) {
    const stack = $('#toast-stack');
    const el = document.createElement('div');
    el.className = `toast toast--${tone}`;
    el.innerHTML = `
      <div class="toast__icon"><i data-icon="${icon}"></i></div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-white leading-tight">${title}</div>
        ${desc ? `<div class="text-xs text-slate-400 mt-0.5">${desc}</div>` : ''}
      </div>
      <button class="text-slate-500 hover:text-white"><i data-icon="close" class="w-3.5 h-3.5"></i></button>`;
    stack.appendChild(el);
    LF.renderIcons(el);
    const remove = () => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 280); };
    el.querySelector('button').addEventListener('click', remove);
    setTimeout(remove, ttl);
  }
  window.LF.showToast = showToast;

  // ============ NOTIF PANEL ============
  function buildNotifPanel() {
    $('#notif-list').innerHTML = LF.notifications.map(n => `
      <div class="notif-item">
        <div class="notif-item__dot" style="background:${n.color};color:${n.color}"></div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-white leading-tight">${n.title}</div>
          <div class="text-xs text-slate-400 mt-0.5">${n.desc}</div>
          <div class="text-[10px] text-slate-500 font-mono mt-1">${n.time}</div>
        </div>
        ${n.unread ? `<div class="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" style="box-shadow:0 0 6px #22d3ee"></div>` : ''}
      </div>`).join('');
  }
  $('#notif-trigger').addEventListener('click', e => {
    e.stopPropagation();
    $('#notif-panel').classList.toggle('is-open');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#notif-panel') && !e.target.closest('#notif-trigger')) {
      $('#notif-panel').classList.remove('is-open');
    }
  });

  // ============ SIDEBAR TOGGLE ============
  $('#sidebar-toggle')?.addEventListener('click', () => $('#sidebar').classList.toggle('is-open'));

  // ============ KEYBOARD SHORTCUTS ============
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      $('#global-search').focus();
    }
    if (e.key === 'Escape') { closeModal(); $('#notif-panel').classList.remove('is-open'); }
  });

  // ============ RIPPLE ============
  document.addEventListener('mousemove', e => {
    const btn = e.target.closest('.btn-primary');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--x', `${e.clientX - r.left}px`);
    btn.style.setProperty('--y', `${e.clientY - r.top}px`);
  });

  // ============ LIVE SIMULATION ============
  function simulateLive() {
    const messages = [
      { tone: 'info',    icon: 'message',  title: 'New message', desc: 'Tran Minh Duc · "Send me the pricing PDF"' },
      { tone: 'success', icon: 'check',    title: 'Lead converted', desc: 'L-2840 → Quoted · $48,000' },
      { tone: 'warn',    icon: 'warn',     title: 'SLA warning', desc: 'Hiroshi Tanaka · 12 min remaining' },
      { tone: 'info',    icon: 'sparkle',  title: 'AI suggestion', desc: 'Try the "urgency close" script for Marcus Weber' },
    ];
    let idx = 0;
    setInterval(() => {
      if (Math.random() > 0.5) showToast(messages[idx % messages.length]);
      idx++;
    }, 18000);
  }

  // ============ BOOT ============
  LF.renderIcons(document);
  buildNotifPanel();
  navigate('dashboard');
  simulateLive();

  // Welcome toast
  setTimeout(() => showToast({ tone: 'success', icon: 'sparkle', title: 'Welcome back, An', desc: 'You have 3 unread notifications and 142 active leads' }), 600);
})();
