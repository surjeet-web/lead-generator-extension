document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let allTemplates = [];
  let filteredTemplates = [];
  let crawlQueue = [];
  let leads = [];
  let crawlStatus = "Idle";
  let settings = {
    domainBlacklist: [],
    crawlDepth: 1,
  };

  // --- DOM ELEMENTS ---
  const filters = {
    sector: document.getElementById('sector-filter'),
    role: document.getElementById('role-filter'),
    location: document.getElementById('location-filter'),
    platform: document.getElementById('platform-filter'),
  };
  const queriesContainer = document.getElementById('queries-container');
  const queueForCrawlBtn = document.getElementById('queue-for-crawl-btn');
  
  const customQueryInput = document.getElementById('custom-query-input');
  const addCustomQueryBtn = document.getElementById('add-custom-query-btn');

  const domainBlacklistTextarea = document.getElementById('domain-blacklist');
  const crawlDepthSelect = document.getElementById('crawl-depth');
  const saveSettingsBtn = document.getElementById('save-settings-btn');

  const queueContainer = document.getElementById('queue-container');
  const queueCountSpan = document.getElementById('queue-count');
  const startCrawlBtn = document.getElementById('start-crawl-btn');
  const clearQueueBtn = document.getElementById('clear-queue-btn');

  const crawlStatusContainer = document.getElementById('crawl-status-container');
  const crawlProgressText = document.getElementById('crawl-progress-text');

  const leadsTableBody = document.getElementById('leads-table-body');
  const leadsCountSpan = document.getElementById('leads-count');
  const clearLeadsBtn = document.getElementById('clear-leads-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const exportTxtBtn = document.getElementById('export-txt-btn');

  const svgInput = document.getElementById('svg-input');
  const iconPreview = document.getElementById('icon-preview');
  const generateIconBtn = document.getElementById('generate-icon-btn');

  // --- INITIALIZATION ---
  async function init() {
    await loadTemplates();
    await loadStateFromStorage();

    populateFilters();
    applyFiltersAndRender();
    renderCrawlQueue();
    renderLeadsTable();
    renderSettings();
    updateCrawlStatusUI();
    loadCustomIcon();

    setupEventListeners();
    setupChromeListeners();
  }

  async function loadTemplates() {
    try {
      const response = await fetch('assets/templates_2025_adv.json');
      allTemplates = await response.json();
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  }

  function loadStateFromStorage() {
    return new Promise(resolve => {
      chrome.storage.local.get({ crawlQueue: [], leads: [], settings: { domainBlacklist: [], crawlDepth: 1 } }, (data) => {
        crawlQueue = data.crawlQueue || [];
        leads = data.leads || [];
        settings = data.settings;
        resolve();
      });
    });
  }

  function loadCustomIcon() {
    chrome.storage.local.get('customIconSvg', (data) => {
      if (data.customIconSvg) {
        svgInput.value = data.customIconSvg;
        updateIconPreview(data.customIconSvg);
      }
    });
  }

  function setupEventListeners() {
    Object.values(filters).forEach(select => select.addEventListener('change', applyFiltersAndRender));
    queueForCrawlBtn.addEventListener('click', handleQueueForCrawl);
    addCustomQueryBtn.addEventListener('click', handleAddCustomQuery);
    startCrawlBtn.addEventListener('click', handleStartCrawl);
    clearQueueBtn.addEventListener('click', handleClearQueue);
    clearLeadsBtn.addEventListener('click', handleClearLeads);
    saveSettingsBtn.addEventListener('click', handleSaveSettings);
    exportCsvBtn.addEventListener('click', () => handleExport('csv'));
    exportJsonBtn.addEventListener('click', () => handleExport('json'));
    exportTxtBtn.addEventListener('click', () => handleExport('txt'));
    leadsTableBody.addEventListener('click', handleDeleteLead);
    generateIconBtn.addEventListener('click', handleGenerateIcon);
    svgInput.addEventListener('input', () => updateIconPreview(svgInput.value));
  }

  function setupChromeListeners() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        if (changes.leads) {
          leads = changes.leads.newValue || [];
          renderLeadsTable();
        }
        if (changes.crawlQueue) {
          crawlQueue = changes.crawlQueue.newValue || [];
          renderCrawlQueue();
        }
        if (changes.settings) {
          settings = changes.settings.newValue;
          renderSettings();
        }
      }
    });

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "crawlUpdate") {
        const { status, progress } = message.data;
        if (status) crawlStatus = status;
        if (progress) crawlProgressText.textContent = progress;
        updateCrawlStatusUI();
      }
    });
  }

  // --- RENDER FUNCTIONS ---
  function renderSettings() {
    domainBlacklistTextarea.value = settings.domainBlacklist.join('\n');
    crawlDepthSelect.value = settings.crawlDepth;
  }

  function populateFilters() {
    const unique = { sector: new Set(), role: new Set(), location: new Set(), platform: new Set() };
    allTemplates.forEach(t => {
      unique.sector.add(t.sector);
      unique.role.add(t.role);
      unique.location.add(t.location);
      unique.platform.add(t.platform);
    });

    for (const key in unique) {
      const select = filters[key];
      select.innerHTML = '<option value="all">All</option>';
      [...unique[key]].sort().forEach(val => {
        const option = document.createElement('option');
        option.value = val;
        option.textContent = val;
        select.appendChild(option);
      });
    }
  }

  function applyFiltersAndRender() {
    const activeFilters = {
      sector: filters.sector.value,
      role: filters.role.value,
      location: filters.location.value,
      platform: filters.platform.value,
    };

    filteredTemplates = allTemplates.filter(t => 
      (activeFilters.sector === 'all' || t.sector === activeFilters.sector) &&
      (activeFilters.role === 'all' || t.role === activeFilters.role) &&
      (activeFilters.location === 'all' || t.location === activeFilters.location) &&
      (activeFilters.platform === 'all' || t.platform === activeFilters.platform)
    );
    renderFilteredTemplates();
  }

  function renderFilteredTemplates() {
    queriesContainer.innerHTML = '';
    if (filteredTemplates.length === 0) {
      queriesContainer.innerHTML = '<p class="placeholder">No matching templates found.</p>';
    } else {
      filteredTemplates.slice(0, 5).forEach(t => {
        const div = document.createElement('div');
        div.className = 'query-item';
        div.innerHTML = `<p>${t.query}</p><p class="meta">${t.platform} - ${t.intent_note}</p>`;
        queriesContainer.appendChild(div);
      });
    }
    queueForCrawlBtn.disabled = filteredTemplates.length === 0;
  }

  function renderCrawlQueue() {
    queueContainer.innerHTML = '';
    queueCountSpan.textContent = crawlQueue.length;
    if (crawlQueue.length === 0) {
      queueContainer.innerHTML = '<p class="placeholder">Queue is empty.</p>';
    } else {
      crawlQueue.slice(0, 5).forEach(t => {
        const p = document.createElement('p');
        p.textContent = t.query;
        p.title = t.query;
        queueContainer.appendChild(p);
      });
      if (crawlQueue.length > 5) {
        const p = document.createElement('p');
        p.textContent = `...and ${crawlQueue.length - 5} more.`;
        queueContainer.appendChild(p);
      }
    }
    updateCrawlStatusUI();
  }

  function renderLeadsTable() {
    leadsTableBody.innerHTML = '';
    leadsCountSpan.textContent = leads.length;
    const sortedLeads = [...leads].sort((a, b) => b.score - a.score);
    if (sortedLeads.length === 0) {
      leadsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px;">No leads found yet.</td></tr>';
    } else {
      sortedLeads.forEach(lead => {
        const tr = document.createElement('tr');
        const leadDate = new Date(lead.firstSeenAt).toLocaleDateString();
        tr.innerHTML = `
          <td>${lead.type}</td>
          <td>${lead.value}</td>
          <td>${lead.type === 'email' ? lead.score : '-'}</td>
          <td><a href="${lead.sourceUrl}" target="_blank" title="${lead.sourceUrl}">${lead.sourceUrl}</a></td>
          <td>${leadDate}</td>
          <td><button class="delete-lead-btn" data-lead-id="${lead.id}" title="Delete Lead">🗑️</button></td>
        `;
        leadsTableBody.appendChild(tr);
      });
    }
    const hasLeads = leads.length > 0;
    clearLeadsBtn.disabled = !hasLeads;
    exportCsvBtn.disabled = !hasLeads;
    exportJsonBtn.disabled = !hasLeads;
    exportTxtBtn.disabled = !hasLeads;
  }

  function updateCrawlStatusUI() {
    const isCrawling = crawlStatus === "Crawling";
    if (isCrawling) {
      startCrawlBtn.textContent = 'Stop Crawl';
      startCrawlBtn.classList.add('danger');
      crawlStatusContainer.style.display = 'block';
    } else {
      startCrawlBtn.textContent = 'Start Deep Crawl';
      startCrawlBtn.classList.remove('danger');
      crawlStatusContainer.style.display = 'none';
    }
    startCrawlBtn.disabled = crawlQueue.length === 0 && !isCrawling;
    clearQueueBtn.disabled = crawlQueue.length === 0 || isCrawling;
    clearLeadsBtn.disabled = leads.length === 0 || isCrawling;
    saveSettingsBtn.disabled = isCrawling;
    domainBlacklistTextarea.disabled = isCrawling;
    crawlDepthSelect.disabled = isCrawling;
    addCustomQueryBtn.disabled = isCrawling;
    customQueryInput.disabled = isCrawling;
    generateIconBtn.disabled = isCrawling;
    svgInput.disabled = isCrawling;
  }

  // --- HANDLER FUNCTIONS ---
  function handleSaveSettings() {
    settings.domainBlacklist = domainBlacklistTextarea.value.split('\n').map(d => d.trim()).filter(Boolean);
    settings.crawlDepth = parseInt(crawlDepthSelect.value, 10);
    chrome.storage.local.set({ settings }, () => {
      const originalText = saveSettingsBtn.textContent;
      saveSettingsBtn.textContent = 'Saved!';
      setTimeout(() => {
        saveSettingsBtn.textContent = originalText;
      }, 1500);
    });
  }

  function handleQueueForCrawl() {
    const newTemplates = filteredTemplates.filter(
      (t) => !crawlQueue.some((cq) => cq.query === t.query)
    );
    if (newTemplates.length > 0) {
      crawlQueue.push(...newTemplates);
      chrome.storage.local.set({ crawlQueue });
    }
  }

  function handleAddCustomQuery() {
    const queryText = customQueryInput.value.trim();
    if (queryText && !crawlQueue.some(item => item.query === queryText)) {
      crawlQueue.push({ query: queryText });
      chrome.storage.local.set({ crawlQueue });
      customQueryInput.value = '';
    }
  }

  function handleStartCrawl() {
    if (crawlStatus === "Crawling") {
      chrome.runtime.sendMessage({ action: "stopCrawl" });
    } else if (crawlQueue.length > 0) {
      chrome.runtime.sendMessage({ action: "startCrawl", data: { queue: crawlQueue, settings } });
    }
  }

  function handleClearQueue() {
    crawlQueue = [];
    chrome.storage.local.set({ crawlQueue: [] });
  }

  function handleClearLeads() {
    if (confirm('Are you sure you want to delete all leads? This cannot be undone.')) {
      leads = [];
      chrome.storage.local.set({ leads: [] });
    }
  }

  function handleDeleteLead(event) {
    const deleteButton = event.target.closest('.delete-lead-btn');
    if (deleteButton) {
      const leadIdToDelete = deleteButton.dataset.leadId;
      const updatedLeads = leads.filter(lead => lead.id !== leadIdToDelete);
      chrome.storage.local.set({ leads: updatedLeads });
    }
  }

  function handleExport(format) {
    if (leads.length === 0) return;
    let content = '';
    let mimeType = '';
    let filename = '';

    if (format === 'csv') {
      const headers = Object.keys(leads[0]);
      const csvRows = [
        headers.join(','),
        ...leads.map(row =>
          headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`).join(',')
        )
      ];
      content = csvRows.join('\n');
      mimeType = 'text/csv;charset=utf-8;';
      filename = 'leads.csv';
    } else if (format === 'json') {
      content = JSON.stringify(leads, null, 2);
      mimeType = 'application/json;charset=utf-8;';
      filename = 'leads.json';
    } else if (format === 'txt') {
      content = leads.map(lead => 
        `${lead.type.toUpperCase()}: ${lead.value} (found on ${lead.sourceUrl})`
      ).join('\n');
      mimeType = 'text/plain;charset=utf-8;';
      filename = 'leads.txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
  }

  function updateIconPreview(svgText) {
    if (!svgText || !svgText.trim().startsWith('<svg')) {
      iconPreview.src = 'assets/icon.png'; // fallback to default
      return;
    }
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    iconPreview.src = url;
  }

  function handleGenerateIcon() {
    const svgText = svgInput.value;
    if (!svgText) return;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      chrome.action.setIcon({ imageData: imageData });
      chrome.storage.local.set({ customIconSvg: svgText }, () => {
        const originalText = generateIconBtn.textContent;
        generateIconBtn.textContent = 'Icon Set!';
        setTimeout(() => {
          generateIconBtn.textContent = originalText;
        }, 1500);
      });
    };
    
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    img.src = url;
  }

  init();
});