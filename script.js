// script.js

// URL of the API
const API_URL = 'https://app.sheetlabs.com/K3/call_rprt';

/**
 * Fetches data from the API.
 * @returns {Promise<Array|null>} The fetched data or null if an error occurs.
 */
async function fetchData() {
    try {
        const response = await fetch(API_URL);

        // Check if the response is OK (status code 200-299)
        if (!response.ok) {
            throw new Error(`Network response was not ok (Status: ${response.status})`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        displayError(`Failed to fetch data: ${error.message}`);
        console.error('Fetch Error:', error);
        return null;
    }
}

/**
 * Displays an error message on the webpage.
 * @param {string} message - The error message to display.
 */
function displayError(message) {
    const container = document.getElementById('tables-container');
    container.innerHTML = `<p class="error">${message}</p>`;
}

/**
 * Groups data by the 'Project' field.
 * @param {Array} data - The data to group.
 * @returns {Object} An object where keys are project names and values are arrays of SDR entries.
 */
function groupByProject(data) {
    return data.reduce((acc, item) => {
        const project = item.Project;
        // Ensure all projects are included, including 'ABCL'
        if (!acc[project]) {
            acc[project] = [];
        }
        acc[project].push(item);
        return acc;
    }, {});
}

/**
 * Calculates the total CallsDialedHour for each project.
 * @param {Object} groupedData - The data grouped by project.
 * @returns {Array} An array of objects with project name and total CallsDialedHour.
 */
function calculateTotalCallsDialedHour(groupedData) {
    return Object.keys(groupedData).map(project => {
        const totalCallsDialedHour = groupedData[project].reduce((sum, sdr) => sum + sdr.CallsDialedHour, 0);
        return { project, totalCallsDialedHour };
    });
}

/**
 * Sorts projects based on total CallsDialedHour in descending order.
 * @param {Array} projects - The array of project objects with total CallsDialedHour.
 * @returns {Array} The sorted array of project names.
 */
function sortProjects(projects) {
    return projects.sort((a, b) => b.totalCallsDialedHour - a.totalCallsDialedHour)
                   .map(item => item.project);
}

/**
 * Sorts SDRs in descending order by CallsDialedHour.
 * @param {Array} sdrs - The array of SDR entries.
 * @returns {Array} The sorted array of SDR entries.
 */
function sortSdrsDescendingCallsDialedHour(sdrs) {
    return sdrs.sort((a, b) => b.CallsDialedHour - a.CallsDialedHour);
}

/**
 * Formats the Connected value as a percentage string.
 * @param {number} value - The connected ratio (e.g., 0.1811).
 * @returns {string} The formatted percentage string (e.g., "18.11%").
 */
function formatConnectedPercentage(value) {
    return `${(value * 100).toFixed(2)}%`;
}

/**
 * Creates a table for a given project.
 * @param {string} projectName - The name of the project.
 * @param {Array} sdrs - The array of SDR entries for the project.
 * @returns {HTMLElement} The DOM element containing the project table.
 */
function createProjectTable(projectName, sdrs) {
    // Sort SDRs in descending order by CallsDialedHour
    const sortedSdrs = sortSdrsDescendingCallsDialedHour(sdrs);

    // Create a section for the project
    const projectSection = document.createElement('div');
    projectSection.className = 'project-section';

    // Add the project title
    const title = document.createElement('h2');
    title.className = 'project-title';
    title.textContent = projectName;
    projectSection.appendChild(title);

    // Create the table
    const table = document.createElement('table');

    // Create the colgroup for uniform column widths
    const colgroup = document.createElement('colgroup');
    for (let i = 0; i < 8; i++) { // Now 8 columns
        const col = document.createElement('col');
        col.style.width = '12.5%'; // 100% / 8 = 12.5%
        colgroup.appendChild(col);
    }
    table.appendChild(colgroup);

    // Create the table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = [
        'SDR',
        'Total Calls Dialed',
        'Calls Answered',
        'Connected %',
        'No. of working days',
        'No. of working hours',
        'Calls Dialed/Day',
        'Calls Dialed/Hour'
    ];

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create the table body
    const tbody = document.createElement('tbody');

    sortedSdrs.forEach(sdr => {
        const row = document.createElement('tr');

        const cells = [
            sdr.SDR,
            sdr.TotalCallsDialed,
            sdr.CallsAnswered,
            formatConnectedPercentage(sdr.Connected),
            sdr.Noofworkingdays,
            sdr.Noofworkinghours,
            sdr.CallsDialedDay,
            sdr.CallsDialedHour
        ];

        cells.forEach((cellText, index) => {
            const td = document.createElement('td');
            const headerName = headers[index];
            td.setAttribute('data-title', headerName);
            td.textContent = cellText;
            row.appendChild(td);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    // Note: Removed the table footer (Year: 2014)

    projectSection.appendChild(table);

    return projectSection;
}

/**
 * Renders all project tables on the webpage sorted by total CallsDialedHour.
 */
async function renderTables() {
    const container = document.getElementById('tables-container');
    
    // Display loading spinner
    container.innerHTML = '<div class="spinner"></div>';

    const data = await fetchData();

    if (!data) {
        // If data fetching failed, do not proceed further
        return;
    }

    const groupedData = groupByProject(data);
    
    // Calculate total CallsDialedHour per project
    const projectsWithTotal = calculateTotalCallsDialedHour(groupedData);
    
    // Sort projects based on total CallsDialedHour in descending order
    const sortedProjectNames = sortProjects(projectsWithTotal);
    
    // Clear any existing content (including loading spinner)
    container.innerHTML = '';

    // Iterate over each sorted project and create tables
    sortedProjectNames.forEach(projectName => {
        const sdrs = groupedData[projectName];
        const tableSection = createProjectTable(projectName, sdrs);
        container.appendChild(tableSection);
    });

    // No action buttons, so no event listeners needed
}

// Call the renderTables function when the page loads
window.addEventListener('DOMContentLoaded', renderTables);
