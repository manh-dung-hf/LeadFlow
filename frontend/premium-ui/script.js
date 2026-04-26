// ===== LeadFlow AI - Premium Frontend Script =====

// Global State
const state = {
    currentPage: 'dashboard',
    leads: [],
    knowledgeBase: [],
    scripts: [],
    notifications: [],
    user: {
        name: 'John Sales',
        role: 'SALES',
        email: 'john@leadflow.ai'
    },
    filters: {
        status: '',
        temperature: '',
        source: '',
        search: ''
    },
    pagination: {
        page: 1,
        limit: 10,
        total: 0
    }
};

// ===== Initialize Application =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadInitialData();
    startAnimations();
    initializeCharts();
    createParticles();
});

function initializeApp() {
    // Set initial page
    showPage('dashboard');
    
    // Initialize tooltips
    initializeTooltips();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Initialize drag and drop
    initializeDragAndDrop();
    
    // Setup real-time simulation
    startRealTimeSimulation();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            showPage(page);
        });
    });
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Notifications
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', toggleNotifications);
    }
    
    // Search
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('input', debounce(handleGlobalSearch, 300));
    }
    
    // Add Lead Modal
    const addLeadBtn = document.getElementById('addLeadBtn');
    const addLeadBtn2 = document.getElementById('addLeadBtn2');
    const closeAddLeadModal = document.getElementById('closeAddLeadModal');
    const cancelAddLead = document.getElementById('cancelAddLead');
    const saveAddLead = document.getElementById('saveAddLead');
    
    if (addLeadBtn) addLeadBtn.addEventListener('click', () => showModal('addLeadModal'));
    if (addLeadBtn2) addLeadBtn2.addEventListener('click', () => showModal('addLeadModal'));
    if (closeAddLeadModal) closeAddLeadModal.addEventListener('click', () => hideModal('addLeadModal'));
    if (cancelAddLead) cancelAddLead.addEventListener('click', () => hideModal('addLeadModal'));
    if (saveAddLead) saveAddLead.addEventListener('click', handleAddLead);
    
    // Lead Detail Modal
    const closeLeadDetailModal = document.getElementById('closeLeadDetailModal');
    if (closeLeadDetailModal) {
        closeLeadDetailModal.addEventListener('click', () => hideModal('leadDetailModal'));
    }
    
    // Filters
    document.getElementById('statusFilter')?.addEventListener('change', handleFilterChange);
    document.getElementById('temperatureFilter')?.addEventListener('change', handleFilterChange);
    document.getElementById('sourceFilter')?.addEventListener('change', handleFilterChange);
    document.getElementById('leadsSearch')?.addEventListener('input', debounce(handleFilterChange, 300));
    
    // Knowledge Base
    document.getElementById('knowledgeSearch')?.addEventListener('input', debounce(handleKnowledgeSearch, 300));
    
    // Filter tags
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            filterKnowledgeBase(e.target.dataset.category);
        });
    });
    
    // Script categories
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            filterScripts(e.target.dataset.category);
        });
    });
    
    // Modal overlay
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                hideAllModals();
            }
        });
    }
    
    // Message input
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
}

// ===== Page Navigation =====
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Show selected page
    const selectedPage = document.getElementById(`${pageName}-page`);
    if (selectedPage) {
        selectedPage.classList.remove('hidden');
        selectedPage.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    state.currentPage = pageName;
    
    // Load page-specific data
    loadPageData(pageName);
}

function loadPageData(pageName) {
    switch (pageName) {
        case 'dashboard':
            updateDashboardData();
            break;
        case 'leads':
            loadLeads();
            break;
        case 'pipeline':
            loadPipelineData();
            break;
        case 'knowledge':
            loadKnowledgeBase();
            break;
        case 'scripts':
            loadScripts();
            break;
        case 'analytics':
            updateAnalyticsData();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// ===== Data Loading =====
function loadInitialData() {
    // Load mock data
    state.leads = generateMockLeads();
    state.knowledgeBase = generateMockKnowledgeBase();
    state.scripts = generateMockScripts();
    state.notifications = generateMockNotifications();
    
    // Update notification badge
    updateNotificationBadge();
}

function generateMockLeads() {
    const names = ['John Doe', 'Sarah Johnson', 'Mike Wilson', 'Emily Brown', 'David Lee', 'Lisa Chen', 'Robert Taylor', 'Anna Martinez'];
    const sources = ['TELEGRAM', 'WHATSAPP', 'ZALO', 'WEB', 'MANUAL'];
    const statuses = ['NEW', 'CONTACTED', 'QUOTED', 'NEGOTIATION', 'WON', 'LOST'];
    const temperatures = ['HOT', 'WARM', 'COLD'];
    const countries = ['USA', 'Vietnam', 'Singapore', 'Malaysia', 'Thailand'];
    
    return Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: names[Math.floor(Math.random() * names.length)],
        email: `user${i + 1}@example.com`,
        phone: `+123456789${i}`,
        country: countries[Math.floor(Math.random() * countries.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        temperature: temperatures[Math.floor(Math.random() * temperatures.length)],
        content: `Interested in bamboo houses. Budget around $${Math.floor(Math.random() * 50000 + 10000)}.`,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: 1,
        ai_summary: 'AI generated summary',
        ai_suggested_reply: 'Thank you for your interest...'
    }));
}

function generateMockKnowledgeBase() {
    return [
        {
            id: 1,
            title: 'Eco-Lite Series Specifications',
            content: 'The Eco-Lite series is our entry-level bamboo house line with prices starting at $18,500.',
            category: 'product',
            tags: 'eco-lite, specifications, pricing',
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Shipping to USA',
            content: 'Shipping to the USA takes 4-6 weeks. Cost varies by state.',
            category: 'shipping',
            tags: 'shipping, usa, logistics',
            created_at: new Date().toISOString()
        },
        {
            id: 3,
            title: 'Warranty Policy',
            content: 'All structures come with 10-year structural warranty.',
            category: 'warranty',
            tags: 'warranty, support, maintenance',
            created_at: new Date().toISOString()
        },
        {
            id: 4,
            title: 'Installation Process',
            content: 'Professional installation team ensures proper setup within 2-3 days.',
            category: 'service',
            tags: 'installation, professional, setup',
            created_at: new Date().toISOString()
        },
        {
            id: 5,
            title: 'Payment Terms',
            content: 'We accept 50% upfront and 50% upon completion.',
            category: 'pricing',
            tags: 'payment, terms, financing',
            created_at: new Date().toISOString()
        },
        {
            id: 6,
            title: 'Custom Design Options',
            content: 'Custom designs available with additional lead time.',
            category: 'product',
            tags: 'custom, design, options',
            created_at: new Date().toISOString()
        }
    ];
}

function generateMockScripts() {
    return [
        {
            id: 1,
            title: 'Greeting - New Lead',
            content: 'Thank you for reaching out! I\'d be happy to help you find the perfect bamboo house solution.',
            category: 'greeting',
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            title: 'Qualification Questions',
            content: 'To better assist you, could you tell me more about your specific requirements and timeline?',
            category: 'qualification',
            created_at: new Date().toISOString()
        },
        {
            id: 3,
            title: 'Price Objection Handling',
            content: 'I understand your concern about pricing. Let me show you the value and long-term benefits...',
            category: 'objection',
            created_at: new Date().toISOString()
        },
        {
            id: 4,
            title: 'Closing - Ready to Buy',
            content: 'Great! I\'ll prepare the paperwork and we can get started right away.',
            category: 'closing',
            created_at: new Date().toISOString()
        }
    ];
}

function generateMockNotifications() {
    return [
        {
            id: 1,
            type: 'hot',
            title: 'Hot Lead Alert',
            text: 'Michael from USA is ready to buy',
            time: '2 min ago',
            unread: true
        },
        {
            id: 2,
            type: 'warning',
            title: 'SLA Violation',
            text: 'Lead #1234 overdue by 8 minutes',
            time: '5 min ago',
            unread: true
        },
        {
            id: 3,
            type: 'success',
            title: 'Lead Converted',
            text: 'Nguyen Van A deal closed!',
            time: '1 hour ago',
            unread: true
        }
    ];
}

// ===== Dashboard Functions =====
function updateDashboardData() {
    // Update KPI counters with animation
    animateCounter('total-leads', 2847);
    animateCounter('new-leads', 142);
    animateCounter('hot-leads', 68);
    animateCounter('conversion-rate', 23.5);
    
    // Update charts
    updateDashboardCharts();
    
    // Update activity feed
    updateActivityFeed();
}

function animateCounter(elementId, target) {
    const element = document.querySelector(`[data-kpi="${elementId}"] .counter`);
    if (!element) return;
    
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

function updateDashboardCharts() {
    // Pipeline Chart
    const pipelineCtx = document.getElementById('pipelineChart');
    if (pipelineCtx) {
        new Chart(pipelineCtx, {
            type: 'bar',
            data: {
                labels: ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'],
                datasets: [{
                    label: 'Leads',
                    data: [12, 8, 5, 3, 15, 7],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(6, 182, 212, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(6, 182, 212, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }
    
    // Source Chart
    const sourceCtx = document.getElementById('sourceChart');
    if (sourceCtx) {
        new Chart(sourceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Telegram', 'WhatsApp', 'Web', 'Zalo', 'Manual'],
                datasets: [{
                    data: [342, 256, 189, 145, 98],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(37, 211, 102, 0.8)',
                        'rgba(6, 182, 212, 0.8)',
                        'rgba(0, 104, 255, 0.8)',
                        'rgba(107, 114, 128, 0.8)'
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(37, 211, 102, 1)',
                        'rgba(6, 182, 212, 1)',
                        'rgba(0, 104, 255, 1)',
                        'rgba(107, 114, 128, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }
}

function updateActivityFeed() {
    const activities = [
        {
            icon: 'new',
            title: 'New lead from Telegram',
            text: 'Sarah Johnson interested in bamboo houses',
            time: '5 minutes ago',
            action: 'View'
        },
        {
            icon: 'hot',
            title: 'Hot lead identified',
            text: 'Michael Scott - Budget $50k, urgent',
            time: '12 minutes ago',
            action: 'Contact'
        },
        {
            icon: 'success',
            title: 'Deal closed!',
            text: 'Nguyen Van A purchased Eco-Lite house',
            time: '1 hour ago',
            action: 'View'
        }
    ];
    
    const feedContainer = document.querySelector('.activity-feed');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.icon}">
                <i class="fas fa-${getActivityIcon(activity.icon)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
            <div class="activity-action">
                <button class="btn btn-sm btn-primary">${activity.action}</button>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(iconType) {
    const icons = {
        'new': 'user-plus',
        'hot': 'fire',
        'success': 'check',
        'warning': 'exclamation-triangle'
    };
    return icons[iconType] || 'info-circle';
}

// ===== Leads Management =====
function loadLeads() {
    const filteredLeads = filterLeads();
    displayLeads(filteredLeads);
    updatePagination(filteredLeads.length);
}

function filterLeads() {
    return state.leads.filter(lead => {
        if (state.filters.status && lead.status !== state.filters.status) return false;
        if (state.filters.temperature && lead.temperature !== state.filters.temperature) return false;
        if (state.filters.source && lead.source !== state.filters.source) return false;
        if (state.filters.search) {
            const searchLower = state.filters.search.toLowerCase();
            return lead.name.toLowerCase().includes(searchLower) ||
                   lead.email.toLowerCase().includes(searchLower) ||
                   lead.content.toLowerCase().includes(searchLower);
        }
        return true;
    });
}

function displayLeads(leads) {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;
    
    const startIndex = (state.pagination.page - 1) * state.pagination.limit;
    const endIndex = startIndex + state.pagination.limit;
    const pageLeads = leads.slice(startIndex, endIndex);
    
    tbody.innerHTML = pageLeads.map(lead => `
        <tr>
            <td>
                <input type="checkbox" class="lead-checkbox" data-id="${lead.id}">
            </td>
            <td>
                <div class="lead-cell">
                    <div class="lead-avatar">${lead.name.split(' ').map(n => n[0]).join('')}</div>
                    <div class="lead-info">
                        <div class="lead-name">${lead.name}</div>
                        <div class="lead-email">${lead.email}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge ${lead.status}">${lead.status}</span>
            </td>
            <td>
                <span class="temperature-badge ${lead.temperature}">${lead.temperature}</span>
            </td>
            <td>
                <span class="source-badge">
                    <i class="fab fa-${getSourceIcon(lead.source)}"></i>
                    ${lead.source}
                </span>
            </td>
            <td>${lead.country}</td>
            <td>${formatDate(lead.created_at)}</td>
            <td>
                <div class="table-actions">
                    <button class="action-btn" onclick="viewLeadDetail(${lead.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" onclick="editLead(${lead.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getSourceIcon(source) {
    const icons = {
        'TELEGRAM': 'telegram',
        'WHATSAPP': 'whatsapp',
        'ZALO': 'comment',
        'WEB': 'globe',
        'MANUAL': 'user'
    };
    return icons[source] || 'circle';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function updatePagination(total) {
    state.pagination.total = total;
    
    const showingFrom = document.getElementById('showingFrom');
    const showingTo = document.getElementById('showingTo');
    const totalLeads = document.getElementById('totalLeads');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (showingFrom) showingFrom.textContent = Math.min(1, total) || 0;
    if (showingTo) showingTo.textContent = Math.min(state.pagination.limit, total);
    if (totalLeads) totalLeads.textContent = total;
    
    if (prevBtn) prevBtn.disabled = state.pagination.page === 1;
    if (nextBtn) nextBtn.disabled = state.pagination.page >= Math.ceil(total / state.pagination.limit);
}

function handleFilterChange() {
    state.filters.status = document.getElementById('statusFilter')?.value || '';
    state.filters.temperature = document.getElementById('temperatureFilter')?.value || '';
    state.filters.source = document.getElementById('sourceFilter')?.value || '';
    state.filters.search = document.getElementById('leadsSearch')?.value || '';
    
    state.pagination.page = 1;
    loadLeads();
}

function viewLeadDetail(leadId) {
    const lead = state.leads.find(l => l.id === leadId);
    if (!lead) return;
    
    // Update modal content
    document.getElementById('leadDetailName').textContent = lead.name;
    document.getElementById('leadDetailStatus').textContent = lead.status;
    document.getElementById('leadDetailStatus').className = `lead-status ${lead.status}`;
    document.getElementById('leadDetailTemperature').textContent = lead.temperature;
    document.getElementById('leadDetailTemperature').className = `lead-temperature ${lead.temperature}`;
    document.getElementById('leadDetailEmail').textContent = lead.email;
    document.getElementById('leadDetailPhone').textContent = lead.phone;
    document.getElementById('leadDetailCountry').textContent = lead.country;
    document.getElementById('leadDetailSource').textContent = lead.source;
    document.getElementById('leadDetailContent').textContent = lead.content;
    
    // Show modal
    showModal('leadDetailModal');
}

// ===== Pipeline (Kanban) =====
function loadPipelineData() {
    const columns = ['NEW', 'CONTACTED', 'QUOTED', 'NEGOTIATION', 'WON', 'LOST'];
    
    columns.forEach(status => {
        const column = document.querySelector(`[data-status="${status}"] .kanban-cards`);
        if (!column) return;
        
        const leads = state.leads.filter(lead => lead.status === status).slice(0, 5);
        column.innerHTML = leads.map(lead => `
            <div class="kanban-card" draggable="true" data-lead-id="${lead.id}">
                <div class="kanban-card-header">
                    <div class="kanban-lead-name">${lead.name}</div>
                    <div class="kanban-lead-source">${lead.source}</div>
                </div>
                <div class="kanban-card-content">
                    ${lead.content.substring(0, 100)}...
                </div>
                <div class="kanban-card-footer">
                    <span class="kanban-lead-time">${formatDate(lead.created_at)}</span>
                    <span class="temperature-badge ${lead.temperature}">${lead.temperature}</span>
                </div>
            </div>
        `).join('');
    });
    
    // Setup drag and drop
    setupKanbanDragAndDrop();
}

function initializeDragAndDrop() {
    // This will be called after DOM is ready
    setupKanbanDragAndDrop();
}

function setupKanbanDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-cards');
    
    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', card.dataset.leadId);
            card.classList.add('dragging');
        });
        
        card.addEventListener('dragend', (e) => {
            card.classList.remove('dragging');
        });
    });
    
    columns.forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        });
        
        column.addEventListener('dragleave', (e) => {
            column.style.backgroundColor = '';
        });
        
        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.style.backgroundColor = '';
            
            const leadId = e.dataTransfer.getData('text/plain');
            const newStatus = column.parentElement.dataset.status;
            
            // Update lead status
            const lead = state.leads.find(l => l.id == leadId);
            if (lead) {
                lead.status = newStatus;
                showNotification('Lead status updated', 'success');
            }
            
            // Reload pipeline
            loadPipelineData();
        });
    });
}

// ===== Knowledge Base =====
function loadKnowledgeBase() {
    displayKnowledgeBase(state.knowledgeBase);
}

function displayKnowledgeBase(items) {
    const grid = document.getElementById('knowledgeGrid');
    if (!grid) return;
    
    grid.innerHTML = items.map(item => `
        <div class="knowledge-card">
            <div class="knowledge-card-header">
                <div>
                    <div class="knowledge-card-title">${item.title}</div>
                    <div class="knowledge-card-category">${item.category}</div>
                </div>
            </div>
            <div class="knowledge-card-content">
                ${item.content.substring(0, 150)}...
            </div>
            <div class="knowledge-card-footer">
                <span>Tags: ${item.tags}</span>
                <span>${formatDate(item.created_at)}</span>
            </div>
        </div>
    `).join('');
}

function handleKnowledgeSearch(e) {
    const query = e.target.value.toLowerCase();
    const filtered = state.knowledgeBase.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.tags.toLowerCase().includes(query)
    );
    displayKnowledgeBase(filtered);
}

function filterKnowledgeBase(category) {
    if (category === 'all') {
        displayKnowledgeBase(state.knowledgeBase);
    } else {
        const filtered = state.knowledgeBase.filter(item => item.category === category);
        displayKnowledgeBase(filtered);
    }
}

// ===== Scripts Management =====
function loadScripts() {
    displayScripts(state.scripts);
}

function displayScripts(scripts) {
    const list = document.getElementById('scriptsList');
    if (!list) return;
    
    list.innerHTML = scripts.map(script => `
        <div class="script-card">
            <div class="script-header">
                <div>
                    <div class="script-title">${script.title}</div>
                    <div class="script-category">${script.category}</div>
                </div>
                <div class="script-actions">
                    <button class="btn btn-sm btn-secondary">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-primary">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
            <div class="script-content">
                ${script.content}
            </div>
        </div>
    `).join('');
}

function filterScripts(category) {
    if (category === 'all') {
        displayScripts(state.scripts);
    } else {
        const filtered = state.scripts.filter(script => script.category === category);
        displayScripts(filtered);
    }
}

// ===== Analytics =====
function updateAnalyticsData() {
    // Trend Chart
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Leads',
                    data: [12, 19, 15, 25, 22, 30, 28],
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Conversions',
                    data: [3, 5, 4, 7, 6, 8, 7],
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }
    
    // Funnel Chart
    const funnelCtx = document.getElementById('funnelChart');
    if (funnelCtx) {
        new Chart(funnelCtx, {
            type: 'bar',
            data: {
                labels: ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won'],
                datasets: [{
                    label: 'Leads',
                    data: [100, 75, 50, 30, 15],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(6, 182, 212, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(16, 185, 129, 0.8)'
                    ]
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }
    
    // Response Time Chart
    const responseTimeCtx = document.getElementById('responseTimeChart');
    if (responseTimeCtx) {
        new Chart(responseTimeCtx, {
            type: 'line',
            data: {
                labels: ['0-2min', '2-5min', '5-10min', '10-30min', '30min+'],
                datasets: [{
                    label: 'Response Distribution',
                    data: [45, 30, 15, 7, 3],
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }
}

// ===== Settings =====
function loadSettings() {
    // Settings are mostly static in this demo
    console.log('Settings loaded');
}

// ===== Modal Functions =====
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay');
    
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay');
    
    if (modal && overlay) {
        modal.style.display = 'none';
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.getElementById('modalOverlay')?.classList.remove('show');
    document.body.style.overflow = '';
}

function handleAddLead() {
    const form = document.getElementById('addLeadForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const newLead = {
        id: state.leads.length + 1,
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        country: formData.get('country'),
        source: formData.get('source'),
        temperature: formData.get('temperature'),
        content: formData.get('content'),
        status: 'NEW',
        created_at: new Date().toISOString(),
        assigned_to: 1
    };
    
    state.leads.unshift(newLead);
    hideModal('addLeadModal');
    showNotification('Lead added successfully', 'success');
    
    // Reload leads if on leads page
    if (state.currentPage === 'leads') {
        loadLeads();
    }
    
    // Reset form
    form.reset();
}

// ===== Notification Functions =====
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    const unreadCount = state.notifications.filter(n => n.unread).length;
    
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

function showNotification(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ===== Sidebar Functions =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// ===== Search Functions =====
function handleGlobalSearch(e) {
    const query = e.target.value.toLowerCase();
    console.log('Global search:', query);
    // Implement global search logic
}

// ===== Message Functions =====
function sendMessage() {
    const input = document.getElementById('messageInput');
    const thread = document.getElementById('conversationThread');
    
    if (!input || !thread) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Add message to thread
    const messageElement = document.createElement('div');
    messageElement.className = 'message sales';
    messageElement.innerHTML = `
        <div class="message-content">${message}</div>
        <div class="message-time">Just now</div>
    `;
    
    thread.appendChild(messageElement);
    thread.scrollTop = thread.scrollHeight;
    
    // Clear input
    input.value = '';
    
    // Simulate response
    setTimeout(() => {
        const responseElement = document.createElement('div');
        responseElement.className = 'message lead';
        responseElement.innerHTML = `
            <div class="message-content">Thank you for your message! I'll get back to you soon.</div>
            <div class="message-time">Just now</div>
        `;
        thread.appendChild(responseElement);
        thread.scrollTop = thread.scrollHeight;
    }, 1000);
}

// ===== Animation Functions =====
function startAnimations() {
    // Animate elements on scroll
    observeElements();
    
    // Start particle animation
    animateParticles();
}

function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.kpi-card, .chart-card, .activity-item').forEach(el => {
        observer.observe(el);
    });
}

function createParticles() {
    const container = document.querySelector('.particles');
    if (!container) return;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }
}

function animateParticles() {
    // Particles are animated via CSS
}

// ===== Chart Initialization =====
function initializeCharts() {
    // Charts are initialized when their pages are shown
}

// ===== Real-time Simulation =====
function startRealTimeSimulation() {
    // Simulate real-time updates
    setInterval(() => {
        // Randomly add a new lead
        if (Math.random() > 0.8) {
            addRandomLead();
        }
        
        // Update notification badge
        updateNotificationBadge();
    }, 30000); // Every 30 seconds
}

function addRandomLead() {
    const names = ['Alex Johnson', 'Maria Garcia', 'James Wilson', 'Sophie Chen'];
    const sources = ['TELEGRAM', 'WHATSAPP', 'WEB'];
    
    const newLead = {
        id: state.leads.length + 1,
        name: names[Math.floor(Math.random() * names.length)],
        email: `new${Date.now()}@example.com`,
        phone: `+123456789${Math.floor(Math.random() * 1000)}`,
        country: 'USA',
        source: sources[Math.floor(Math.random() * sources.length)],
        status: 'NEW',
        temperature: Math.random() > 0.7 ? 'HOT' : 'WARM',
        content: 'Interested in bamboo houses...',
        created_at: new Date().toISOString(),
        assigned_to: 1
    };
    
    state.leads.unshift(newLead);
    
    // Show notification
    showNotification(`New lead: ${newLead.name}`, 'info');
    
    // Update current page if needed
    if (state.currentPage === 'dashboard') {
        updateActivityFeed();
    } else if (state.currentPage === 'leads') {
        loadLeads();
    }
}

// ===== Utility Functions =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function initializeTooltips() {
    // Initialize tooltips if needed
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('globalSearch')?.focus();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            hideAllModals();
        }
    });
}

// ===== Click outside to close dropdowns =====
document.addEventListener('click', (e) => {
    if (!e.target.closest('.notification-wrapper')) {
        document.getElementById('notificationDropdown')?.classList.remove('show');
    }
});

// ===== Initialize Charts on page load =====
window.addEventListener('load', () => {
    // Additional initialization if needed
});

// ===== Export functions for global access =====
window.showPage = showPage;
window.viewLeadDetail = viewLeadDetail;
window.editLead = editLead;
window.sendMessage = sendMessage;
window.showNotification = showNotification;
