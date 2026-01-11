const { ipcRenderer } = require('electron');

// Data Structure
let appData = {
    leadGenerators: [],
    weeklyData: {},
    goals: {
        team: {
            sales: 0,
            leads: 0,
            appointments: 0,
            sph: 0
        },
        individual: {} // generatorId: { sales, leads, appointments, sph }
    }
};

let currentYear = new Date().getFullYear();
let currentWeek = getWeekNumber(new Date());
let editingGeneratorId = null;

// Listen for update notifications
ipcRenderer.on('update-available', (event, info) => {
    showUpdateNotification(info.version);
});

ipcRenderer.on('update-downloaded', (event, info) => {
    showRestartPrompt(info.version);
});

// Initialize App
async function init() {
    // Load saved data
    const savedData = await ipcRenderer.invoke('load-data');
    if (savedData) {
        appData = savedData;
        // Ensure goals structure exists (for backward compatibility)
        if (!appData.goals) {
            appData.goals = {
                team: { sales: 0, leads: 0, appointments: 0, sph: 0 },
                individual: {}
            };
        }
    }

    // Initialize year selector
    initYearSelector();
    
    // Setup event listeners
    setupEventListeners();
    
    // Render initial view
    renderDashboardView();
}

// Year Selector
function initYearSelector() {
    const yearSelector = document.getElementById('yearSelector');
    const startYear = 2020;
    const endYear = currentYear + 5;
    
    for (let year = startYear; year <= endYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelector.appendChild(option);
    }
}

// Event Listeners
function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.dataset.view;
            switchView(view);
        });
    });

    // Year Selector
    document.getElementById('yearSelector').addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        const activeView = document.querySelector('.tab.active').dataset.view;
        if (activeView === 'dashboard') {
            renderDashboardView();
        } else if (activeView === 'master') {
            renderMasterView();
        }
    });

    // Week Navigation
    document.getElementById('prevWeek').addEventListener('click', () => {
        currentWeek--;
        if (currentWeek < 1) {
            currentWeek = 52;
            currentYear--;
            document.getElementById('yearSelector').value = currentYear;
        }
        renderDashboardView();
    });

    document.getElementById('nextWeek').addEventListener('click', () => {
        currentWeek++;
        if (currentWeek > 52) {
            currentWeek = 1;
            currentYear++;
            document.getElementById('yearSelector').value = currentYear;
        }
        renderDashboardView();
    });

    // Add Generator
    document.getElementById('addGeneratorBtn').addEventListener('click', () => {
        openGeneratorModal();
    });

    // Set Goals
    document.getElementById('setGoalsBtn').addEventListener('click', () => {
        openGoalsModal();
    });

    // Modal
    document.getElementById('cancelGenerator').addEventListener('click', () => {
        closeGeneratorModal();
    });

    document.getElementById('generatorForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveGenerator();
    });

    // Goals Modal
    document.querySelectorAll('.goals-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.dataset.tab;
            document.querySelectorAll('.goals-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.goals-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tabType}GoalsTab`).classList.add('active');
        });
    });

    document.getElementById('cancelGoals').addEventListener('click', () => {
        closeGoalsModal();
    });

    document.getElementById('saveGoals').addEventListener('click', () => {
        saveGoals();
    });

    // Close modal on outside click
    document.getElementById('generatorModal').addEventListener('click', (e) => {
        if (e.target.id === 'generatorModal') {
            closeGeneratorModal();
        }
    });

    document.getElementById('goalsModal').addEventListener('click', (e) => {
        if (e.target.id === 'goalsModal') {
            closeGoalsModal();
        }
    });
}

// View Switching
function switchView(view) {
    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === view);
    });

    // Update views
    document.querySelectorAll('.view').forEach(viewEl => {
        viewEl.classList.remove('active');
    });

    const viewMap = {
        'dashboard': 'dashboardView',
        'performance': 'performanceView',
        'master': 'masterView'
    };

    document.getElementById(viewMap[view]).classList.add('active');

    // Render appropriate view
    if (view === 'dashboard') {
        renderDashboardView();
    } else if (view === 'performance') {
        renderPerformanceView();
    } else if (view === 'master') {
        renderMasterView();
    }
}

// Dashboard View (Current Week + Timeline)
function renderDashboardView() {
    renderCurrentWeek();
    renderTimeline();
}

// Render Current Week Section
function renderCurrentWeek() {
    const container = document.getElementById('weeklyDataContainer');
    const noGeneratorsMsg = document.getElementById('noGeneratorsMessage');
    const weekDisplay = document.getElementById('currentWeekDisplay');

    // Update week display
    const weekDates = getWeekDates(currentYear, currentWeek);
    weekDisplay.textContent = `Week ${currentWeek} (${weekDates.start} - ${weekDates.end})`;

    if (appData.leadGenerators.length === 0) {
        noGeneratorsMsg.style.display = 'block';
        container.innerHTML = '';
        return;
    }

    noGeneratorsMsg.style.display = 'none';
    container.innerHTML = '';

    appData.leadGenerators.forEach(generator => {
        const card = createGeneratorCard(generator);
        container.appendChild(card);
    });
}

// Render Timeline Section
function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    container.innerHTML = '';

    if (appData.leadGenerators.length === 0) {
        return;
    }

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    months.forEach((monthName, monthIndex) => {
        const monthSection = document.createElement('div');
        monthSection.className = 'month-section';

        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthHeader.textContent = `${monthName} ${currentYear}`;
        monthSection.appendChild(monthHeader);

        const weeksGrid = document.createElement('div');
        weeksGrid.className = 'weeks-grid';

        // Get all weeks for this month (approximately 4-5 weeks per month)
        const weeksInMonth = getWeeksInMonth(currentYear, monthIndex);
        
        weeksInMonth.forEach(weekNum => {
            const weekCard = createTimelineWeekCard(weekNum);
            weeksGrid.appendChild(weekCard);
        });

        monthSection.appendChild(weeksGrid);
        container.appendChild(monthSection);
    });

    // Auto-scroll to current week
    scrollToCurrentWeek();
}

// Create Timeline Week Card
function createTimelineWeekCard(weekNum) {
    const card = document.createElement('div');
    const weekKey = `${currentYear}-W${weekNum}`;
    const weekData = appData.weeklyData[weekKey];
    const hasData = weekData && Object.keys(weekData).length > 0;
    const isCurrent = weekNum === currentWeek;

    card.className = 'timeline-week-card' + 
                     (hasData ? '' : ' empty') + 
                     (isCurrent ? ' current' : '');
    card.setAttribute('data-week', weekNum);
    card.onclick = () => selectWeek(weekNum);

    const weekDates = getWeekDates(currentYear, weekNum);
    
    if (hasData) {
        const totals = calculateWeekTotals(weekData);
        
        card.innerHTML = `
            <div class="timeline-week-number">Week ${weekNum}</div>
            <div class="timeline-week-dates">${weekDates.start} - ${weekDates.end}</div>
            <div class="timeline-stats">
                <div class="timeline-stat">${totals.hours} hrs</div>
                <div class="timeline-stat">${totals.sales} sales</div>
                <div class="timeline-stat highlight">${totals.sph} SPH</div>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="timeline-week-number">Week ${weekNum}</div>
            <div class="timeline-week-dates">${weekDates.start} - ${weekDates.end}</div>
            <div class="timeline-empty">No data</div>
        `;
    }

    return card;
}

// Calculate Week Totals for Timeline
function calculateWeekTotals(weekData) {
    let totalHours = 0;
    let totalSales = 0;

    Object.values(weekData).forEach(data => {
        totalHours += data.hoursWorked || 0;
        totalSales += data.grossSales || 0;
    });

    const avgSPH = totalSales > 0 ? (totalHours / totalSales).toFixed(2) : '0.00';

    return {
        hours: totalHours.toFixed(1),
        sales: totalSales,
        sph: avgSPH
    };
}

// Select Week from Timeline
function selectWeek(weekNum) {
    currentWeek = weekNum;
    renderDashboardView();
}

// Scroll to Current Week in Timeline
function scrollToCurrentWeek() {
    setTimeout(() => {
        const currentCard = document.querySelector('.timeline-week-card.current');
        if (currentCard) {
            currentCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}

// Create Generator Card
function createGeneratorCard(generator) {
    const card = document.createElement('div');
    card.className = 'generator-card';

    const weekKey = `${currentYear}-W${currentWeek}`;
    const data = getWeekData(generator.id, weekKey);

    card.innerHTML = `
        <div class="generator-header">
            <div class="generator-name">${generator.name}</div>
            <div class="generator-actions">
                <button class="btn btn-secondary" onclick="editGenerator('${generator.id}')">Edit</button>
                <button class="btn btn-danger" onclick="removeGenerator('${generator.id}')">Remove</button>
            </div>
        </div>
        <form class="data-form" onsubmit="return false;">
            <div class="form-group">
                <label>Hours Worked</label>
                <input type="number" step="0.5" min="0" value="${data.hoursWorked}" 
                    onchange="updateWeekData('${generator.id}', '${weekKey}', 'hoursWorked', this.value)">
            </div>
            <div class="form-group">
                <label>Leads Booked</label>
                <input type="number" min="0" value="${data.leadsBooked}" 
                    onchange="updateWeekData('${generator.id}', '${weekKey}', 'leadsBooked', this.value)">
            </div>
            <div class="form-group">
                <label>Appointments Sat</label>
                <input type="number" min="0" value="${data.appointmentsSat}" 
                    onchange="updateWeekData('${generator.id}', '${weekKey}', 'appointmentsSat', this.value)">
            </div>
            <div class="form-group">
                <label>Gross Sales ($)</label>
                <input type="number" step="0.01" min="0" value="${data.grossSales}" 
                    onchange="updateWeekData('${generator.id}', '${weekKey}', 'grossSales', this.value)">
            </div>
            <div class="form-group">
                <label>Sales Per Hour ($)</label>
                <input type="text" class="calculated" value="${data.salesPerHour}" disabled>
            </div>
        </form>
    `;

    return card;
}

// Get Week Data
function getWeekData(generatorId, weekKey) {
    if (!appData.weeklyData[weekKey]) {
        appData.weeklyData[weekKey] = {};
    }
    
    if (!appData.weeklyData[weekKey][generatorId]) {
        appData.weeklyData[weekKey][generatorId] = {
            hoursWorked: 0,
            leadsBooked: 0,
            appointmentsSat: 0,
            grossSales: 0,
            salesPerHour: '0.00'
        };
    }

    return appData.weeklyData[weekKey][generatorId];
}

// Update Week Data
function updateWeekData(generatorId, weekKey, field, value) {
    const data = getWeekData(generatorId, weekKey);
    data[field] = parseFloat(value) || 0;

    // Calculate Sales Per Hour (Hours Per Sale)
    if (data.grossSales > 0) {
        data.salesPerHour = (data.hoursWorked / data.grossSales).toFixed(2);
    } else {
        data.salesPerHour = '0.00';
    }

    saveData();
    renderDashboardView();
}

// Master Tracker View
function renderMasterView() {
    const container = document.getElementById('masterDataContainer');

    if (appData.leadGenerators.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No lead generators to display.</p></div>';
        return;
    }

    container.innerHTML = '';

    // Combined Totals Card
    const combinedCard = document.createElement('div');
    combinedCard.className = 'master-card';
    
    const combinedHeader = document.createElement('div');
    combinedHeader.className = 'master-header';
    combinedHeader.textContent = `Combined Totals - ${currentYear}`;
    combinedCard.appendChild(combinedHeader);

    const combinedTotals = calculateYearlyTotals(null);
    const combinedGrid = createTotalsGrid(combinedTotals);
    combinedCard.appendChild(combinedGrid);
    container.appendChild(combinedCard);

    // Monthly Performance Card
    const monthlyCard = document.createElement('div');
    monthlyCard.className = 'master-card';
    
    const monthlyHeader = document.createElement('div');
    monthlyHeader.className = 'master-header';
    monthlyHeader.textContent = 'Monthly Performance (Combined Totals)';
    monthlyCard.appendChild(monthlyHeader);

    const monthlyGrid = createMonthlyPerformanceGrid();
    monthlyCard.appendChild(monthlyGrid);
    container.appendChild(monthlyCard);

    // Individual Generator Totals
    const individualsCard = document.createElement('div');
    individualsCard.className = 'master-card';
    
    const individualsHeader = document.createElement('div');
    individualsHeader.className = 'master-header';
    individualsHeader.textContent = 'Individual Performance';
    individualsCard.appendChild(individualsHeader);

    const generatorTotalsContainer = document.createElement('div');
    generatorTotalsContainer.className = 'generator-totals';

    appData.leadGenerators.forEach(generator => {
        const totals = calculateYearlyTotals(generator.id);
        const generatorCard = createGeneratorTotalCard(generator.name, totals);
        generatorTotalsContainer.appendChild(generatorCard);
    });

    individualsCard.appendChild(generatorTotalsContainer);
    container.appendChild(individualsCard);
}

// Calculate Yearly Totals
function calculateYearlyTotals(generatorId) {
    let totalHours = 0;
    let totalLeads = 0;
    let totalAppointments = 0;
    let totalSales = 0;

    Object.keys(appData.weeklyData).forEach(weekKey => {
        if (weekKey.startsWith(`${currentYear}-`)) {
            const weekData = appData.weeklyData[weekKey];
            
            if (generatorId) {
                // Individual generator
                const data = weekData[generatorId];
                if (data) {
                    totalHours += data.hoursWorked || 0;
                    totalLeads += data.leadsBooked || 0;
                    totalAppointments += data.appointmentsSat || 0;
                    totalSales += data.grossSales || 0;
                }
            } else {
                // All generators combined
                Object.values(weekData).forEach(data => {
                    totalHours += data.hoursWorked || 0;
                    totalLeads += data.leadsBooked || 0;
                    totalAppointments += data.appointmentsSat || 0;
                    totalSales += data.grossSales || 0;
                });
            }
        }
    });

    const avgSPH = totalSales > 0 ? (totalHours / totalSales).toFixed(2) : '0.00';

    return {
        hours: totalHours.toFixed(1),
        leads: totalLeads,
        appointments: totalAppointments,
        sales: totalSales,
        sph: avgSPH
    };
}

// Calculate Monthly Totals (Combined Team)
function calculateMonthlyTotals(month) {
    // month is 1-12
    let totalHours = 0;
    let totalLeads = 0;
    let totalAppointments = 0;
    let totalSales = 0;

    // Get week range for this month
    const weekRanges = getWeekRangesForMonth(month, currentYear);

    weekRanges.forEach(weekNum => {
        const weekKey = `${currentYear}-W${weekNum}`;
        const weekData = appData.weeklyData[weekKey];
        
        if (weekData) {
            // Sum all generators for this week
            Object.values(weekData).forEach(data => {
                totalHours += data.hoursWorked || 0;
                totalLeads += data.leadsBooked || 0;
                totalAppointments += data.appointmentsSat || 0;
                totalSales += data.grossSales || 0;
            });
        }
    });

    const avgSPH = totalSales > 0 ? (totalHours / totalSales).toFixed(2) : '0.00';

    return {
        hours: totalHours.toFixed(1),
        leads: totalLeads,
        appointments: totalAppointments,
        sales: totalSales,
        sph: avgSPH
    };
}

// Get week numbers that fall in a given month
function getWeekRangesForMonth(month, year) {
    const weeks = [];
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    let currentDate = new Date(firstDay);
    while (currentDate <= lastDay) {
        const weekNum = getWeekNumber(currentDate);
        if (!weeks.includes(weekNum)) {
            weeks.push(weekNum);
        }
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return weeks;
}

// Create Monthly Performance Grid
function createMonthlyPerformanceGrid() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const grid = document.createElement('div');
    grid.className = 'monthly-performance-grid';

    monthNames.forEach((monthName, index) => {
        const monthNum = index + 1;
        const totals = calculateMonthlyTotals(monthNum);
        
        const monthCard = document.createElement('div');
        monthCard.className = 'monthly-card-item';

        const hasData = parseFloat(totals.hours) > 0 || totals.leads > 0 || totals.appointments > 0 || totals.sales > 0;
        
        if (!hasData) {
            monthCard.classList.add('empty-month');
        }

        monthCard.innerHTML = `
            <div class="monthly-card-header">${monthName}</div>
            <div class="monthly-stats">
                <div class="monthly-stat">
                    <span class="monthly-stat-label">Hours</span>
                    <span class="monthly-stat-value">${totals.hours}</span>
                </div>
                <div class="monthly-stat">
                    <span class="monthly-stat-label">Leads</span>
                    <span class="monthly-stat-value">${totals.leads}</span>
                </div>
                <div class="monthly-stat">
                    <span class="monthly-stat-label">Appts</span>
                    <span class="monthly-stat-value">${totals.appointments}</span>
                </div>
                <div class="monthly-stat">
                    <span class="monthly-stat-label">Sales</span>
                    <span class="monthly-stat-value">${totals.sales}</span>
                </div>
                <div class="monthly-stat highlight">
                    <span class="monthly-stat-label">SPH</span>
                    <span class="monthly-stat-value">${totals.sph}</span>
                </div>
            </div>
        `;

        grid.appendChild(monthCard);
    });

    return grid;
}

// Create Totals Grid
function createTotalsGrid(totals) {
    const grid = document.createElement('div');
    grid.className = 'totals-grid';

    grid.innerHTML = `
        <div class="total-item">
            <div class="total-label">Total Hours Worked</div>
            <div class="total-value">${totals.hours}</div>
        </div>
        <div class="total-item">
            <div class="total-label">Total Leads Booked</div>
            <div class="total-value">${totals.leads}</div>
        </div>
        <div class="total-item">
            <div class="total-label">Total Appointments Sat</div>
            <div class="total-value">${totals.appointments}</div>
        </div>
        <div class="total-item">
            <div class="total-label">Total Gross Sales</div>
            <div class="total-value">${totals.sales}</div>
        </div>
        <div class="total-item">
            <div class="total-label">Avg Hours Per Sale (SPH)</div>
            <div class="total-value">${totals.sph}</div>
        </div>
    `;

    return grid;
}

// Create Generator Total Card
function createGeneratorTotalCard(name, totals) {
    const card = document.createElement('div');
    card.className = 'generator-total-card';

    card.innerHTML = `
        <div class="generator-total-name">${name}</div>
        <div class="week-stats">
            <div class="stat-item">
                <span class="stat-label">Hours Worked:</span>
                <span class="stat-value">${totals.hours}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Leads Booked:</span>
                <span class="stat-value">${totals.leads}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Appointments Sat:</span>
                <span class="stat-value">${totals.appointments}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Gross Sales:</span>
                <span class="stat-value">${totals.sales}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Hours Per Sale:</span>
                <span class="stat-value">${totals.sph}</span>
            </div>
        </div>
    `;

    return card;
}

// Generator Management
function openGeneratorModal(generatorId = null) {
    const modal = document.getElementById('generatorModal');
    const title = document.getElementById('modalTitle');
    const nameInput = document.getElementById('generatorName');

    if (generatorId) {
        const generator = appData.leadGenerators.find(g => g.id === generatorId);
        title.textContent = 'Edit Lead Generator';
        nameInput.value = generator.name;
        editingGeneratorId = generatorId;
    } else {
        title.textContent = 'Add Lead Generator';
        nameInput.value = '';
        editingGeneratorId = null;
    }

    modal.classList.add('active');
    nameInput.focus();
}

function closeGeneratorModal() {
    document.getElementById('generatorModal').classList.remove('active');
    document.getElementById('generatorName').value = '';
    editingGeneratorId = null;
}

function saveGenerator() {
    const name = document.getElementById('generatorName').value.trim();
    
    if (!name) return;

    if (editingGeneratorId) {
        // Edit existing
        const generator = appData.leadGenerators.find(g => g.id === editingGeneratorId);
        generator.name = name;
    } else {
        // Add new
        const newGenerator = {
            id: generateId(),
            name: name
        };
        appData.leadGenerators.push(newGenerator);
    }

    saveData();
    closeGeneratorModal();
    renderDashboardView();
}

function editGenerator(generatorId) {
    openGeneratorModal(generatorId);
}

function removeGenerator(generatorId) {
    if (confirm('Are you sure you want to remove this lead generator? All their data will be deleted.')) {
        appData.leadGenerators = appData.leadGenerators.filter(g => g.id !== generatorId);
        
        // Remove all data for this generator
        Object.keys(appData.weeklyData).forEach(weekKey => {
            delete appData.weeklyData[weekKey][generatorId];
        });

        saveData();
        renderDashboardView();
    }
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeekDates(year, week) {
    const jan1 = new Date(year, 0, 1);
    const days = (week - 1) * 7;
    const weekStart = new Date(jan1.getTime() + days * 24 * 60 * 60 * 1000);
    
    // Adjust to Monday
    const dayOfWeek = weekStart.getDay();
    const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + diff);
    
    const weekEnd = new Date(weekStart.getTime());
    weekEnd.setDate(weekEnd.getDate() + 6);

    return {
        start: formatDate(weekStart),
        end: formatDate(weekEnd)
    };
}

function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

function getWeeksInMonth(year, month) {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let currentWeek = getWeekNumber(firstDay);
    const lastWeek = getWeekNumber(lastDay);
    
    while (currentWeek <= lastWeek) {
        weeks.push(currentWeek);
        currentWeek++;
    }
    
    return weeks;
}

async function saveData() {
    await ipcRenderer.invoke('save-data', appData);
}

// ==========================================
// PERFORMANCE VIEW
// ==========================================

function renderPerformanceView() {
    const container = document.getElementById('performanceContainer');
    
    if (appData.leadGenerators.length === 0) {
        container.innerHTML = `
            <div class="performance-empty">
                <div class="performance-empty-icon">📊</div>
                <div class="performance-empty-text">Add lead generators to view performance metrics</div>
            </div>
        `;
        return;
    }

    const weekKey = `${currentYear}-W${currentWeek}`;
    
    // Calculate current week totals
    const weekTotals = {
        sales: 0,
        leads: 0,
        appointments: 0,
        hours: 0
    };

    appData.leadGenerators.forEach(gen => {
        const data = getWeekData(gen.id, weekKey);
        weekTotals.sales += data.grossSales || 0;
        weekTotals.leads += data.leadsBooked || 0;
        weekTotals.appointments += data.appointmentsSat || 0;
        weekTotals.hours += data.hoursWorked || 0;
    });

    const avgSPH = weekTotals.sales > 0 ? (weekTotals.hours / weekTotals.sales) : 0;

    // Get team goals
    const teamGoals = appData.goals.team;

    // Render Progress Rings
    const progressRingsHTML = `
        <div class="progress-rings-section">
            <h3>Week ${currentWeek} Progress</h3>
            <div class="progress-rings-grid">
                ${createProgressRing('Sales', weekTotals.sales, teamGoals.sales || 0, '#BCC1C5')}
                ${createProgressRing('Leads', weekTotals.leads, teamGoals.leads || 0, '#BCC1C5')}
                ${createProgressRing('Appointments', weekTotals.appointments, teamGoals.appointments || 0, '#BCC1C5')}
                ${createProgressRing('SPH', avgSPH.toFixed(2), teamGoals.sph || 0, '#0029BF', true)}
            </div>
        </div>
    `;

    // Get leaderboard data
    const leaderboardData = appData.leadGenerators.map(gen => {
        const data = getWeekData(gen.id, weekKey);
        const sph = data.grossSales > 0 ? (data.hoursWorked / data.grossSales) : 0;
        
        // Get sparkline data (last 4 weeks)
        const sparklineData = [];
        for (let i = 3; i >= 0; i--) {
            let week = currentWeek - i;
            let year = currentYear;
            if (week < 1) {
                week += 52;
                year--;
            }
            const wk = `${year}-W${week}`;
            const wkData = getWeekData(gen.id, wk);
            const wkSph = wkData.grossSales > 0 ? (wkData.hoursWorked / wkData.grossSales) : 0;
            sparklineData.push(wkSph);
        }

        return {
            id: gen.id,
            name: gen.name,
            sph: sph,
            sparklineData: sparklineData
        };
    }).sort((a, b) => {
        // Lower SPH is better (fewer hours per sale)
        if (a.sph === 0) return 1;
        if (b.sph === 0) return -1;
        return a.sph - b.sph;
    });

    // Render Leaderboard
    const leaderboardHTML = `
        <div class="leaderboard-section">
            <h3>Leaderboard</h3>
            <div class="leaderboard-subtitle">Ranked by SPH (lower is better)</div>
            <div class="leaderboard-list">
                ${leaderboardData.map((item, index) => createLeaderboardItem(item, index + 1)).join('')}
            </div>
        </div>
    `;

    container.innerHTML = progressRingsHTML + leaderboardHTML;
}

function createProgressRing(label, current, target, color, isSPH = false) {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const circumference = 2 * Math.PI * 60; // radius = 60
    const offset = circumference - (percentage / 100) * circumference;

    // For SPH, lower is better, so invert the logic
    let displayPercentage = percentage;
    if (isSPH && target > 0 && current > 0) {
        displayPercentage = current <= target ? 100 : Math.max(0, 100 - ((current - target) / target * 100));
    }

    return `
        <div class="progress-ring-card">
            <div class="ring-container">
                <svg class="ring-svg" width="140" height="140">
                    <circle class="ring-background" cx="70" cy="70" r="60"></circle>
                    <circle 
                        class="ring-progress" 
                        cx="70" 
                        cy="70" 
                        r="60"
                        stroke="${color}"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${circumference - (displayPercentage / 100) * circumference}"
                    ></circle>
                </svg>
                <div class="ring-text">
                    <span class="ring-value">${isSPH ? parseFloat(current).toFixed(1) : Math.round(current)}</span>
                    <span class="ring-target">/ ${isSPH ? parseFloat(target).toFixed(1) : Math.round(target)}</span>
                </div>
            </div>
            <div class="ring-label">${label}</div>
            <div class="ring-percentage">${Math.round(displayPercentage)}%</div>
        </div>
    `;
}

function createLeaderboardItem(item, rank) {
    const rankClass = rank === 1 ? 'rank-1' : '';
    const sparkline = createSparkline(item.sparklineData);
    
    return `
        <div class="leaderboard-item ${rankClass}">
            <div class="leaderboard-rank">${rank}</div>
            <div class="leaderboard-name">${item.name}</div>
            <div class="leaderboard-sph">${item.sph > 0 ? item.sph.toFixed(2) : '—'}</div>
            <svg class="leaderboard-sparkline" viewBox="0 0 80 32" preserveAspectRatio="none">
                ${sparkline}
            </svg>
        </div>
    `;
}

function createSparkline(data) {
    if (data.length === 0 || data.every(v => v === 0)) {
        return '<line x1="0" y1="16" x2="80" y2="16" class="sparkline-line" opacity="0.2" />';
    }

    const max = Math.max(...data, 1);
    const min = Math.min(...data.filter(v => v > 0), 0);
    const range = max - min || 1;
    
    const points = data.map((value, i) => {
        const x = (i / (data.length - 1)) * 80;
        const y = 28 - ((value - min) / range) * 24; // Invert Y and scale to fit
        return { x, y };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L 80 32 L 0 32 Z`;

    const lastPoint = points[points.length - 1];

    return `
        <path d="${areaD}" class="sparkline-area" />
        <path d="${pathD}" class="sparkline-line" />
        <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="2" class="sparkline-dot" />
    `;
}

// ==========================================
// GOALS MODAL
// ==========================================

function openGoalsModal() {
    const modal = document.getElementById('goalsModal');
    
    // Populate team goals
    document.getElementById('teamSalesGoal').value = appData.goals.team.sales || '';
    document.getElementById('teamLeadsGoal').value = appData.goals.team.leads || '';
    document.getElementById('teamAppointmentsGoal').value = appData.goals.team.appointments || '';
    document.getElementById('teamSPHGoal').value = appData.goals.team.sph || '';

    // Populate individual goals
    const container = document.getElementById('individualGoalsContainer');
    container.innerHTML = appData.leadGenerators.map(gen => {
        const goals = appData.goals.individual[gen.id] || { sales: 0, leads: 0, appointments: 0, sph: 0 };
        return `
            <div class="individual-goal-group">
                <h4>${gen.name}</h4>
                <div class="goal-row">
                    <div class="form-group">
                        <label>Sales Target:</label>
                        <input type="number" class="individual-goal" data-gen="${gen.id}" data-field="sales" value="${goals.sales || ''}" min="0" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label>Leads Target:</label>
                        <input type="number" class="individual-goal" data-gen="${gen.id}" data-field="leads" value="${goals.leads || ''}" min="0" placeholder="0">
                    </div>
                </div>
                <div class="goal-row">
                    <div class="form-group">
                        <label>Appointments Target:</label>
                        <input type="number" class="individual-goal" data-gen="${gen.id}" data-field="appointments" value="${goals.appointments || ''}" min="0" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label>SPH Target:</label>
                        <input type="number" class="individual-goal" data-gen="${gen.id}" data-field="sph" value="${goals.sph || ''}" step="0.1" min="0" placeholder="0.0">
                    </div>
                </div>
            </div>
        `;
    }).join('');

    modal.classList.add('active');
}

function closeGoalsModal() {
    const modal = document.getElementById('goalsModal');
    modal.classList.remove('active');
}

function saveGoals() {
    // Save team goals
    appData.goals.team = {
        sales: parseFloat(document.getElementById('teamSalesGoal').value) || 0,
        leads: parseFloat(document.getElementById('teamLeadsGoal').value) || 0,
        appointments: parseFloat(document.getElementById('teamAppointmentsGoal').value) || 0,
        sph: parseFloat(document.getElementById('teamSPHGoal').value) || 0
    };

    // Save individual goals
    document.querySelectorAll('.individual-goal').forEach(input => {
        const genId = input.dataset.gen;
        const field = input.dataset.field;
        const value = parseFloat(input.value) || 0;

        if (!appData.goals.individual[genId]) {
            appData.goals.individual[genId] = { sales: 0, leads: 0, appointments: 0, sph: 0 };
        }
        appData.goals.individual[genId][field] = value;
    });

    saveData();
    closeGoalsModal();
    
    // Re-render performance view if active
    const activeView = document.querySelector('.tab.active').dataset.view;
    if (activeView === 'performance') {
        renderPerformanceView();
    }
}

// Update Notification Functions
function showUpdateNotification(version) {
    // Remove any existing notifications
    const existing = document.querySelector('.update-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <div class="update-notification-content">
            <div class="update-icon">⚡</div>
            <div class="update-text">
                <div class="update-title">Update Available: v${version}</div>
                <div class="update-subtitle">Downloading in background...</div>
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function showRestartPrompt(version) {
    // Remove any existing prompts
    const existing = document.querySelector('.update-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'update-modal';
    modal.innerHTML = `
        <div class="update-modal-overlay"></div>
        <div class="update-modal-content">
            <div class="update-modal-header">
                <div class="update-modal-icon">🎉</div>
                <h3>Update Ready</h3>
            </div>
            <p class="update-modal-text">
                Axon v${version} has been downloaded and is ready to install.
                Would you like to restart now?
            </p>
            <div class="update-modal-actions">
                <button class="btn btn-secondary" onclick="closeUpdateModal()">
                    Later
                </button>
                <button class="btn btn-primary" onclick="restartAndUpdate()">
                    Restart Now
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeUpdateModal() {
    const modal = document.querySelector('.update-modal');
    if (modal) {
        modal.classList.add('fade-out');
        setTimeout(() => modal.remove(), 300);
    }
}

async function restartAndUpdate() {
    await ipcRenderer.invoke('install-update');
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

