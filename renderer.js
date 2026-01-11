const { ipcRenderer } = require('electron');

// Data Structure
let appData = {
    leadGenerators: [],
    weeklyData: {}
};

let currentYear = new Date().getFullYear();
let currentWeek = getWeekNumber(new Date());
let editingGeneratorId = null;

// Initialize App
async function init() {
    // Load saved data
    const savedData = await ipcRenderer.invoke('load-data');
    if (savedData) {
        appData = savedData;
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

    // Modal
    document.getElementById('cancelGenerator').addEventListener('click', () => {
        closeGeneratorModal();
    });

    document.getElementById('generatorForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveGenerator();
    });

    // Close modal on outside click
    document.getElementById('generatorModal').addEventListener('click', (e) => {
        if (e.target.id === 'generatorModal') {
            closeGeneratorModal();
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
        'master': 'masterView'
    };

    document.getElementById(viewMap[view]).classList.add('active');

    // Render appropriate view
    if (view === 'dashboard') {
        renderDashboardView();
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

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

