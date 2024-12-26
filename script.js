// Google Sheets CSV URL
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2BOrelk2XUJGFgoOWTboVeDAn6pwQxYsFQTDPcu0w_To-8UOzXZA8lx8fUhZB4Q/pub?gid=1631424503&single=true&output=csv";

// Fetch data from Google Sheets CSV
async function fetchCSVData() {
    const response = await fetch(SHEET_CSV_URL);
    const data = await response.text();
    return parseCSV(data); // Parse the CSV into a usable format
}

// Parse CSV Data
function parseCSV(data) {
    const rows = data.split("\n").map(row => row.split(","));
    const headers = rows[0]; // First row contains the headers
    const records = rows.slice(1); // Remaining rows are the data
    return { headers, records }; // Return as an object
}

// Helper function to sort records by a specific column in descending order
function sortByColumn(records, columnIndex) {
    return [...records].sort((a, b) => {
        const aValue = parseFloat(a[columnIndex]) || 0;
        const bValue = parseFloat(b[columnIndex]) || 0;
        return aValue - bValue;
    });
}

// Generate daily tabs and tables
function generateDailyTabs(headers, records, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "<h2>Daily Summary</h2>";

    const tabsContainer = document.createElement("div");
    tabsContainer.id = "daily-tabs-container";
    tabsContainer.style.display = "flex";
    tabsContainer.style.gap = "10px";
    tabsContainer.style.marginBottom = "20px";

    const tablesContainer = document.createElement("div");
    tablesContainer.id = "daily-tables-container";

    const days = {};
    for (let i = 1; i < headers.length - 4; i += 4) {
        const dayNumber = Math.ceil(i / 4);
        days[`Day ${dayNumber}`] = headers.slice(i, i + 4); // Group headers for each day
    }

    Object.entries(days).forEach(([day, dayHeaders], index) => {
        const tabButton = document.createElement("button");
        tabButton.textContent = day;
        tabButton.style.padding = "10px";
        tabButton.style.cursor = "pointer";
        tabButton.setAttribute("data-tab", day);
        tabButton.className = index === 0 ? "active-tab" : "";
        tabButton.onclick = () => showTab(day, "daily-tables-container");

        tabsContainer.appendChild(tabButton);

        const tableContainer = document.createElement("div");
        tableContainer.id = day;
        tableContainer.style.display = index === 0 ? "block" : "none";

        const table = document.createElement("table");
        table.style.width = "100%";
        table.border = "1";

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        headerRow.innerHTML = `<th>Menu Item</th>` + dayHeaders.map(header => `<th>${header}</th>`).join("");
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        const sortedRecords = sortByColumn(records, index * 4 + 4); // Sort by ยอดสุทธิ

        sortedRecords.forEach(record => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${record[0]}</td>` + record.slice(index * 4 + 1, index * 4 + 5).map(cell => `<td>${cell || 0}</td>`).join("");
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        tableContainer.appendChild(table);
        tablesContainer.appendChild(tableContainer);
    });

    container.appendChild(tabsContainer);
    container.appendChild(tablesContainer);
}

// Generate weekly tabs and tables
function generateWeeklyTabs(headers, records, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "<h2>Weekly Summary</h2>";

    const tabsContainer = document.createElement("div");
    tabsContainer.id = "weekly-tabs-container";
    tabsContainer.style.display = "flex";
    tabsContainer.style.gap = "10px";
    tabsContainer.style.marginBottom = "20px";

    const tablesContainer = document.createElement("div");
    tablesContainer.id = "weekly-tables-container";

    const menus = records.map(record => record[0]); // Extract menu names
    const weeks = {};

    for (let i = 0; i < headers.length - 4; i += 28) { // 7 days * 4 columns per day
        const weekNumber = Math.ceil(i / 28) + 1;

        weeks[`Week ${weekNumber}`] = menus.map((menu, menuIndex) => {
            const weekData = records[menuIndex].slice(i + 1, i + 29); // Extract weekly data
            const aggregates = weekData.reduce(
                (acc, value, index) => {
                    const columnIndex = index % 4;
                    acc[columnIndex] += parseFloat(value) || 0;
                    return acc;
                },
                [0, 0, 0, 0] // Initialize accumulators for ทำ, เหลือ, ทิ้ง, ยอดสุทธิ
            );
            return [menu, ...aggregates];
        });
    }

    Object.entries(weeks).forEach(([week, weekData], index) => {
        const tabButton = document.createElement("button");
        tabButton.textContent = week;
        tabButton.style.padding = "10px";
        tabButton.style.cursor = "pointer";
        tabButton.setAttribute("data-tab", week);
        tabButton.className = index === 0 ? "active-tab" : "";
        tabButton.onclick = () => showTab(week, "weekly-tables-container");

        tabsContainer.appendChild(tabButton);

        const tableContainer = document.createElement("div");
        tableContainer.id = week;
        tableContainer.style.display = index === 0 ? "block" : "none";

        const table = document.createElement("table");
        table.style.width = "100%";
        table.border = "1";

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        headerRow.innerHTML = `<th>Menu Item</th><th>ทำ</th><th>เหลือ</th><th>ทิ้ง</th><th>ยอดสุทธิ</th>`;
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        const sortedWeekData = weeks[week].sort((a, b) => a[4] - b[4]); // Sort by ยอดสุทธิ

        sortedWeekData.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = row.map(cell => `<td>${cell}</td>`).join("");
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        tableContainer.appendChild(table);
        tablesContainer.appendChild(tableContainer);
    });

    container.appendChild(tabsContainer);
    container.appendChild(tablesContainer);
}

// Generate monthly summary
function generateMonthlySummary(headers, records, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "<h2>Monthly Summary</h2>";

    const monthlyHeaders = headers.slice(-4);
    const table = document.createElement("table");
    table.style.width = "100%";
    table.border = "1";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th>Menu Item</th>` + monthlyHeaders.map(header => `<th>${header}</th>`).join("");
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const sortedRecords = sortByColumn(records, records[0].length - 1); // Sort by ยอดสุทธิ

    sortedRecords.forEach(record => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${record[0]}</td>` + record.slice(-4).map(cell => `<td>${cell || 0}</td>`).join("");
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
}

// Show a specific tab in a section
function showTab(tabId, containerId) {
    const allTables = document.querySelectorAll(`#${containerId} > div`);
    const allTabs = document.querySelectorAll(`#${containerId.replace("tables", "tabs")} > button`);

    allTables.forEach(table => {
        table.style.display = table.id === tabId ? "block" : "none";
    });

    allTabs.forEach(tab => tab.classList.remove("active-tab"));
    const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeTab) activeTab.classList.add("active-tab");
}

// Main function
async function main() {
    const { headers, records } = await fetchCSVData();
    generateDailyTabs(headers, records, "daily-summary-container");
    generateWeeklyTabs(headers, records, "weekly-summary-container");
    generateMonthlySummary(headers, records, "monthly-summary-container");
}

// Run the script on page load
main();