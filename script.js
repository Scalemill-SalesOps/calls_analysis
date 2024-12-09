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
 * Creates a table for a given project.
 * @param {string} projectName - The name of the project.
 * @param {Array} sdrs - The array of SDR entries for the project.
 * @returns {HTMLElement} The DOM element containing the project table.
 */
function createProjectTable(projectName, sdrs) {
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

  // Create the table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = [
    'Project',
    'SDR',
    'Total Calls',
    'No. of Working Days',
    'No. of Working Hours',
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

  sdrs.forEach(sdr => {
    const row = document.createElement('tr');

    const cells = [
      sdr.Project,
      sdr.SDR,
      sdr.TotalCalls,
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
 * Renders all project tables on the webpage.
 */
async function renderTables() {
  const container = document.getElementById('tables-container');
  
  // Display loading indicator
  container.innerHTML = '<div id="loading">Loading data...</div>';

  const data = await fetchData();

  if (!data) {
    // If data fetching failed, do not proceed further
    return;
  }

  const groupedData = groupByProject(data);
  
  // Clear any existing content (including loading indicator)
  container.innerHTML = '';

  // Iterate over each project and create tables
  for (const [projectName, sdrs] of Object.entries(groupedData)) {
    const tableSection = createProjectTable(projectName, sdrs);
    container.appendChild(tableSection);
  }

  // No action buttons, so no event listeners needed
}

// Call the renderTables function when the page loads
window.addEventListener('DOMContentLoaded', renderTables);
