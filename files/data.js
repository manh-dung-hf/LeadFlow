/* ============ MOCK DATA ============ */
window.LF = window.LF || {};

LF.leads = [
  { id: 'L-2841', name: 'Tran Minh Duc',    company: 'Vingroup JSC',         country: '🇻🇳 VN', channel: 'zalo',     status: 'new',       value: 12500, owner: 'AN', tag: 'hot',  email: 'duc.tran@vingroup.com.vn', phone: '+84 90 123 4567', last: '2m',  sla: 92, source: 'Facebook Ads',  score: 87 },
  { id: 'L-2840', name: 'Sarah Mitchell',   company: 'Stripe Inc.',          country: '🇺🇸 US', channel: 'whatsapp', status: 'contacted', value: 48000, owner: 'KL', tag: 'hot',  email: 's.mitchell@stripe.com',     phone: '+1 415 555 0142', last: '14m', sla: 65, source: 'LinkedIn',      score: 94 },
  { id: 'L-2839', name: 'Nguyen Thi Lan',   company: 'FPT Software',         country: '🇻🇳 VN', channel: 'telegram', status: 'quoted',    value: 28900, owner: 'AN', tag: 'warm', email: 'lan.nguyen@fpt.com.vn',      phone: '+84 91 234 5678', last: '1h',  sla: 40, source: 'Referral',      score: 78 },
  { id: 'L-2838', name: 'Hiroshi Tanaka',   company: 'Rakuten Group',        country: '🇯🇵 JP', channel: 'email',    status: 'contacted', value: 65000, owner: 'KL', tag: 'hot',  email: 'h.tanaka@rakuten.co.jp',     phone: '+81 80 1234 5678', last: '3h',  sla: 22, source: 'Website',       score: 91 },
  { id: 'L-2837', name: 'Le Hoang Nam',     company: 'Tiki Corporation',     country: '🇻🇳 VN', channel: 'zalo',     status: 'new',       value: 8400,  owner: 'AN', tag: 'cold', email: 'nam.le@tiki.vn',             phone: '+84 93 345 6789', last: '5h',  sla: 80, source: 'Cold Outreach', score: 52 },
  { id: 'L-2836', name: 'Emily Chen',       company: 'Notion Labs',          country: '🇺🇸 US', channel: 'email',    status: 'won',       value: 92000, owner: 'KL', tag: 'won',  email: 'emily@notion.so',            phone: '+1 628 555 0173', last: '1d',  sla: 100, source: 'Inbound',      score: 96 },
  { id: 'L-2835', name: 'Pham Quoc Bao',    company: 'Shopee Vietnam',       country: '🇻🇳 VN', channel: 'whatsapp', status: 'lost',      value: 14200, owner: 'AN', tag: 'lost', email: 'bao.pham@shopee.vn',         phone: '+84 96 456 7890', last: '2d',  sla: 0,   source: 'Trade Show',   score: 31 },
  { id: 'L-2834', name: 'Marcus Weber',     company: 'SAP SE',               country: '🇩🇪 DE', channel: 'telegram', status: 'quoted',    value: 124000,owner: 'KL', tag: 'hot',  email: 'm.weber@sap.com',            phone: '+49 151 2345 6789', last: '4h', sla: 55, source: 'Partner',      score: 89 },
  { id: 'L-2833', name: 'Vo Thi Mai',       company: 'VNG Corporation',      country: '🇻🇳 VN', channel: 'zalo',     status: 'new',       value: 18500, owner: 'AN', tag: 'warm', email: 'mai.vo@vng.com.vn',          phone: '+84 98 567 8901', last: '8m',  sla: 88, source: 'Google Ads',    score: 71 },
  { id: 'L-2832', name: 'Raj Patel',        company: 'Razorpay',             country: '🇮🇳 IN', channel: 'whatsapp', status: 'contacted', value: 36000, owner: 'KL', tag: 'warm', email: 'raj@razorpay.com',           phone: '+91 98765 43210', last: '45m', sla: 50, source: 'LinkedIn',      score: 76 },
];

LF.kpis = [
  { id: 'leads',      label: 'New Leads',       value: '142',   delta: '+12.4%', up: true,  tone: 'cyan',   icon: 'users',     spark: [12,15,11,18,22,19,28,24,32,30,38,42] },
  { id: 'response',   label: 'Avg Response',    value: '2m 14s',delta: '−18.2%', up: true,  tone: 'green',  icon: 'clock',     spark: [42,38,35,30,28,26,22,20,18,16,14,12] },
  { id: 'conversion', label: 'Conversion',      value: '34.8%', delta: '+5.6%',  up: true,  tone: 'purple', icon: 'trending',  spark: [22,24,26,25,28,30,29,32,31,33,34,35] },
  { id: 'pipeline',   label: 'Pipeline Value',  value: '$1.2M', delta: '+22.1%', up: true,  tone: 'amber',  icon: 'dollar',    spark: [600,680,720,800,850,920,980,1020,1080,1120,1180,1200] },
];

LF.activity = [
  { who: 'Sarah Mitchell',  what: 'replied via WhatsApp',     when: '2m ago',  tone: 'cyan' },
  { who: 'AI Assistant',    what: 'scored L-2841 as 87/100',  when: '5m ago',  tone: 'purple' },
  { who: 'Tran Minh Duc',   what: 'requested a demo',         when: '12m ago', tone: 'green' },
  { who: 'Hiroshi Tanaka',  what: 'opened proposal PDF',      when: '32m ago', tone: 'cyan' },
  { who: 'Emily Chen',      what: 'closed deal · $92,000',    when: '1h ago',  tone: 'green' },
  { who: 'Marcus Weber',    what: 'requested pricing',        when: '2h ago',  tone: 'amber' },
];

LF.slaAlerts = [
  { id: 'L-2838', name: 'Hiroshi Tanaka',  remaining: '12 min',  level: 'danger', value: '$65k' },
  { id: 'L-2840', name: 'Sarah Mitchell',  remaining: '38 min',  level: 'warn',   value: '$48k' },
  { id: 'L-2834', name: 'Marcus Weber',    remaining: '1h 24m',  level: 'warn',   value: '$124k' },
];

LF.notifications = [
  { id: 1, color: '#34d399', title: 'Deal closed: Notion Labs',     desc: 'Emily Chen · $92,000 ARR',           time: 'Just now',     unread: true },
  { id: 2, color: '#22d3ee', title: 'New high-intent lead',         desc: 'Sarah Mitchell · Stripe Inc. · 94',  time: '14 min ago',   unread: true },
  { id: 3, color: '#f87171', title: 'SLA breach incoming',          desc: 'Hiroshi Tanaka · 12 min remaining',  time: '22 min ago',   unread: true },
  { id: 4, color: '#a855f7', title: 'AI suggestion ready',          desc: '3 follow-up scripts for Vingroup',   time: '1h ago',       unread: false },
  { id: 5, color: '#fbbf24', title: 'Quote viewed',                 desc: 'Marcus Weber opened proposal 4x',    time: '2h ago',       unread: false },
  { id: 6, color: '#60a5fa', title: 'Telegram bot reconnected',     desc: 'Channel @leadflow_sales is online',  time: '5h ago',       unread: false },
];

LF.kb = [
  { id: 1, title: 'Pro Plan — Enterprise',     cat: 'pricing',  tags: ['enterprise','annual'],     price: '$499/mo',  desc: 'Full feature set with SSO, dedicated CSM, and 99.99% SLA.' },
  { id: 2, title: 'Onboarding Playbook',       cat: 'process',  tags: ['onboarding','training'],   price: 'Free',     desc: 'Step-by-step guide for first 30 days with new clients.' },
  { id: 3, title: 'API Integration Suite',     cat: 'product',  tags: ['api','developer'],         price: 'Add-on',   desc: 'REST + GraphQL APIs with webhooks and rate limiting.' },
  { id: 4, title: 'Battle Card: vs HubSpot',   cat: 'sales',    tags: ['competitive','battle'],    price: 'Internal', desc: 'Win against HubSpot in mid-market segment.' },
  { id: 5, title: 'Vietnam Market Pricing',    cat: 'pricing',  tags: ['localization','vn'],       price: 'VND 12M',  desc: 'Localized pricing tier for Vietnamese SMB customers.' },
  { id: 6, title: 'Security & Compliance',     cat: 'product',  tags: ['security','soc2','gdpr'],  price: 'Included', desc: 'SOC2 Type II, GDPR, ISO 27001 certifications and audit logs.' },
  { id: 7, title: 'Discount Approval Matrix',  cat: 'process',  tags: ['discount','approval'],     price: 'Internal', desc: 'Who can approve what. 5%/10%/20% thresholds.' },
  { id: 8, title: 'Demo Environment Setup',    cat: 'sales',    tags: ['demo','sandbox'],          price: 'Free',     desc: 'Spin up a sandbox tenant with seed data in 60 seconds.' },
];

LF.scripts = [
  { id: 1, cat: 'discovery', title: 'First Cold Outreach',    body: 'Hi {{name}}, noticed {{company}} is scaling its sales team — we help similar companies cut response time by 73%. Worth a 15-min chat?' },
  { id: 2, cat: 'discovery', title: 'LinkedIn Connection',    body: 'Saw your post on revenue ops at {{company}} — sharp take. Curious how you handle multi-channel lead routing today?' },
  { id: 3, cat: 'objection', title: 'Price Objection',         body: 'I hear you — and you\'re right to push on price. Most clients see ROI within 90 days. Want to walk through your numbers together?' },
  { id: 4, cat: 'objection', title: 'Timing Objection',        body: 'Totally fair. What would need to be true 90 days from now for this to be a priority? Happy to circle back then with a tailored brief.' },
  { id: 5, cat: 'closing',   title: 'Soft Close',              body: 'Based on what you shared, the Pro plan fits best. Should we get a 14-day pilot started this week so your team can validate?' },
  { id: 6, cat: 'closing',   title: 'Urgency Close',           body: 'We\'re onboarding 3 new clients this quarter to keep CSM ratios tight — want me to hold a slot for {{company}}?' },
  { id: 7, cat: 'follow-up', title: '48h Follow-Up',           body: 'Following up on our chat Tuesday — did the proposal land okay? Happy to jump on a quick call to walk through any questions.' },
  { id: 8, cat: 'follow-up', title: 'Re-engage Cold Lead',     body: 'It\'s been a few months. We just shipped {{feature}} which solves what you raised last time — worth another look?' },
];

LF.integrations = [
  { id: 'telegram', name: 'Telegram',  desc: 'Bot API for real-time chat with leads',           icon: 'telegram', enabled: true,  status: 'connected',    lastPing: '2s ago',  fields: [{ label: 'Bot Token', placeholder: '7234567890:AAH...' }, { label: 'Channel ID', placeholder: '@leadflow_sales' }] },
  { id: 'zalo',     name: 'Zalo OA',   desc: 'Vietnam\'s #1 messaging app — Official Account',  icon: 'zalo',     enabled: true,  status: 'connected',    lastPing: '5s ago',  fields: [{ label: 'OA Access Token', placeholder: 'eyJhbGc...' }, { label: 'OA ID', placeholder: '1234567890123456' }] },
  { id: 'whatsapp', name: 'WhatsApp Business',  desc: 'Cloud API for WhatsApp messaging',       icon: 'whatsapp', enabled: false, status: 'disconnected', lastPing: '—',       fields: [{ label: 'Phone Number ID', placeholder: '109876543210987' }, { label: 'Access Token', placeholder: 'EAAJ...' }] },
  { id: 'gmail',    name: 'Gmail',     desc: 'Send and track sales emails via Gmail',           icon: 'mail',     enabled: true,  status: 'connected',    lastPing: '1m ago',  fields: [{ label: 'OAuth Client ID', placeholder: '1234.apps.google...' }] },
  { id: 'slack',    name: 'Slack',     desc: 'Internal alerts for SLA + closed deals',          icon: 'slack',    enabled: false, status: 'disconnected', lastPing: '—',       fields: [{ label: 'Webhook URL', placeholder: 'https://hooks.slack.com/...' }] },
  { id: 'openai',   name: 'OpenAI',    desc: 'AI-powered lead scoring and reply suggestions',   icon: 'sparkle',  enabled: true,  status: 'connected',    lastPing: '8s ago',  fields: [{ label: 'API Key', placeholder: 'sk-proj-...' }, { label: 'Model', placeholder: 'gpt-4o' }] },
];

LF.aiSuggestions = [
  { score: 94, title: 'Send case study: Stripe → Notion',        reason: 'Match: company size + industry · 92% conversion' },
  { score: 87, title: 'Schedule call within next 4 hours',       reason: 'High-intent score · last reply <30min ago' },
  { score: 81, title: 'Offer 14-day pilot vs full demo',         reason: 'Lead profile prefers self-serve evaluation' },
];

LF.products = [
  { name: 'LeadFlow Pro',         price: '$299/mo',    fit: 96, badge: 'Best fit' },
  { name: 'AI Scoring Add-on',    price: '+$99/mo',    fit: 88, badge: 'Recommended' },
  { name: 'Multi-channel Bundle', price: '+$49/mo',    fit: 74, badge: null },
];

LF.timeline = [
  { time: '2m ago',  text: 'AI scored lead at 87/100 (high-intent)',   icon: 'sparkle' },
  { time: '14m ago', text: 'Replied via WhatsApp · "Tell me more"',    icon: 'message' },
  { time: '32m ago', text: 'Opened proposal PDF (3rd time)',           icon: 'eye' },
  { time: '1h ago',  text: 'Sent: pricing-enterprise.pdf',             icon: 'attach' },
  { time: '3h ago',  text: 'Status changed: NEW → CONTACTED',          icon: 'flow' },
  { time: '1d ago',  text: 'Lead created from Facebook Ads campaign',  icon: 'plus' },
];

LF.conversation = [
  { dir: 'in',  text: 'Hi, I saw your ad — interested in pricing for a 50-person team.',                                          time: '10:42' },
  { dir: 'out', text: 'Hi Sarah! Happy to help. For 50 seats, our Pro plan is $299/mo with annual commit. Want to see a demo?',  time: '10:43' },
  { dir: 'in',  text: 'A demo would be great. Also — do you support SSO and SOC2?',                                              time: '10:48' },
  { dir: 'out', text: 'Yes on both — SOC2 Type II certified, and SAML/OIDC SSO is included on Pro. I\'ll send a calendar link.', time: '10:49' },
  { dir: 'in',  text: 'Perfect, also send the security whitepaper if you have one handy.',                                       time: '10:51' },
];

LF.funnel = [
  { stage: 'Visitors',  value: 12450, color: '#22d3ee' },
  { stage: 'Leads',     value: 3280,  color: '#60a5fa' },
  { stage: 'Qualified', value: 1142,  color: '#a855f7' },
  { stage: 'Proposal',  value: 486,   color: '#ec4899' },
  { stage: 'Won',       value: 169,   color: '#34d399' },
];

LF.statusToTag = { new: 'neutral', contacted: 'cold', quoted: 'warm', won: 'won', lost: 'lost' };
LF.tagLabel = { hot: 'HOT', warm: 'WARM', cold: 'COLD', won: 'WON', lost: 'LOST' };
LF.statusLabel = { new: 'New', contacted: 'Contacted', quoted: 'Quoted', won: 'Won', lost: 'Lost' };
LF.channelIcon = { telegram: 'telegram', zalo: 'zalo', whatsapp: 'whatsapp', email: 'mail' };
LF.avatarColors = ['#22d3ee','#a855f7','#60a5fa','#ec4899','#34d399','#fbbf24','#f87171'];
LF.avatarColor = (id) => LF.avatarColors[Math.abs(id.split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % LF.avatarColors.length];
