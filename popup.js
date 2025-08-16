document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let allTemplates = [];
  let filteredTemplates = [];
  let selectedTemplates = new Set();
  let crawlQueue = [];
  let leads = [];
  let crawlStatus = "Idle";
  let currentTab = 'search';
  let currentView = 'grid';
  let currentPage = 1;
  let templatesPerPage = 20;
  let currentCategory = 'all';
  let currentSort = 'relevance';
  let recentTemplates = [];
  let settings = {
    domainBlacklist: [],
    crawlDepth: 1,
    crawlDelay: 2,
    maxPages: 10,
  };

  // Guide system state
  let isGuideActive = false;
  let currentGuideStep = 0;
  let guideSteps = [];
  let highlightedElement = null;

  // --- DOM ELEMENTS ---
  // Tab navigation
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  // Header stats
  const totalLeadsStatEl = document.getElementById('total-leads-stat');
  const queueStatEl = document.getElementById('queue-stat');
  
  // Search tab - Template Library
  const templateLibrarySelect = document.getElementById('template-library-select');
  const totalTemplatesEl = document.getElementById('total-templates');
  const categoryChips = document.querySelectorAll('.category-chip');
  const templateSearchInput = document.getElementById('template-search');
  const viewBtns = document.querySelectorAll('.view-btn');
  const sortSelect = document.getElementById('sort-select');
  const showingCountEl = document.getElementById('showing-count');
  const selectAllVisibleBtn = document.getElementById('select-all-visible-btn');
  const addSelectedBtn = document.getElementById('add-selected-btn');
  const selectedCountEl = document.getElementById('selected-count');
  const templatesContainer = document.getElementById('templates-container');
  const paginationContainer = document.getElementById('pagination-container');
  const paginationInfo = document.getElementById('pagination-info');
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');
  const pageNumbers = document.getElementById('page-numbers');
  const popularTemplatesEl = document.getElementById('popular-templates');
  const recentTemplatesEl = document.getElementById('recent-templates');

  // Guide system elements
  const startGuideBtn = document.getElementById('start-guide-btn');
  const guideOverlay = document.getElementById('guide-overlay');
  const guideTooltip = document.getElementById('guide-tooltip');
  const guideStepCurrent = document.getElementById('guide-step-current');
  const guideStepTotal = document.getElementById('guide-step-total');
  const guideTitle = document.getElementById('guide-title');
  const guideDescription = document.getElementById('guide-description');
  const guideTip = document.getElementById('guide-tip');
  const guideTipText = document.getElementById('guide-tip-text');
  const guideCloseBtn = document.getElementById('guide-close-btn');
  const guideSkipBtn = document.getElementById('guide-skip-btn');
  const guidePrevBtn = document.getElementById('guide-prev-btn');
  const guideNextBtn = document.getElementById('guide-next-btn');

  // Welcome modal elements
  const welcomeModal = document.getElementById('welcome-modal');
  const welcomeSkipBtn = document.getElementById('welcome-skip-btn');
  const welcomeStartGuideBtn = document.getElementById('welcome-start-guide-btn');
  const welcomeDontShowAgain = document.getElementById('welcome-dont-show-again');
  
  const customQueryInput = document.getElementById('custom-query-input');
  const customSectorSelect = document.getElementById('custom-sector');
  const customLocationInput = document.getElementById('custom-location');
  const addCustomQueryBtn = document.getElementById('add-custom-query-btn');

  // Crawl tab
  const queueContainer = document.getElementById('queue-container');
  const queueCountBadge = document.getElementById('queue-count-badge');
  const startCrawlBtn = document.getElementById('start-crawl-btn');
  const clearQueueBtn = document.getElementById('clear-queue-btn');
  const crawlStatusEl = document.getElementById('crawl-status');
  const crawlProgressEl = document.getElementById('crawl-progress');
  const progressFillEl = document.getElementById('progress-fill');

  // Leads tab
  const leadsFilterInput = document.getElementById('leads-filter-input');
  const leadsTableBody = document.getElementById('leads-table-body');
  const emailCountEl = document.getElementById('email-count');
  const phoneCountEl = document.getElementById('phone-count');
  const avgScoreEl = document.getElementById('avg-score');
  const selectAllLeadsEl = document.getElementById('select-all-leads');
  const clearLeadsBtn = document.getElementById('clear-leads-btn');
  const exportBtn = document.getElementById('export-btn');
  const exportMenu = document.getElementById('export-menu');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');
  const exportTxtBtn = document.getElementById('export-txt-btn');

  // Filters tab
  const filters = {
    sector: document.getElementById('sector-filter'),
    role: document.getElementById('role-filter'),
    location: document.getElementById('location-filter'),
    platform: document.getElementById('platform-filter'),
  };
  const minScoreSlider = document.getElementById('min-score');
  const minScoreValue = document.getElementById('min-score-value');
  const filterEmailsCheckbox = document.getElementById('filter-emails');
  const filterPhonesCheckbox = document.getElementById('filter-phones');
  const domainWhitelistTextarea = document.getElementById('domain-whitelist');
  const domainBlacklistFilterTextarea = document.getElementById('domain-blacklist-filter');
  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');

  // Settings tab
  const crawlDepthSelect = document.getElementById('crawl-depth');
  const crawlDelayInput = document.getElementById('crawl-delay');
  const maxPagesInput = document.getElementById('max-pages');
  const domainBlacklistTextarea = document.getElementById('domain-blacklist');
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const svgInput = document.getElementById('svg-input');
  const iconPreview = document.getElementById('icon-preview');
  const generateIconBtn = document.getElementById('generate-icon-btn');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const resetSettingsBtn = document.getElementById('reset-settings-btn');

  // --- GUIDE SYSTEM CONFIGURATION ---
  function initializeGuideSteps() {
    guideSteps = [
      {
        target: '[data-tab="search"]',
        title: 'Search Templates',
        description: 'Start here to browse thousands of pre-built search templates for finding leads.',
        tip: 'Templates are organized by category to help you find exactly what you need.',
        position: 'bottom'
      },
      {
        target: '#template-library-select',
        title: 'Choose Your Template Library',
        description: 'Select from different template collections. IT Jobs has thousands of job-specific templates.',
        tip: 'Each library contains templates optimized for different use cases.',
        position: 'bottom'
      },
      {
        target: '.category-chips',
        title: 'Filter by Category',
        description: 'Use these quick filters to narrow down templates by category, technology, location, or type.',
        tip: 'Numbers show how many templates are available in each category.',
        position: 'bottom'
      },
      {
        target: '#templates-container',
        title: 'Browse & Select Templates',
        description: 'Click on template cards to select them. You can select multiple templates at once.',
        tip: 'Selected templates are highlighted in blue. Use the search bar to find specific templates.',
        position: 'top'
      },
      {
        target: '[data-tab="crawl"]',
        title: 'Manage Your Crawl Queue',
        description: 'View and manage your selected templates here. Start crawling to find leads automatically.',
        tip: 'The crawl queue shows all templates ready to be processed.',
        position: 'bottom'
      },
      {
        target: '#start-crawl-btn',
        title: 'Start Finding Leads',
        description: 'Click here to start the automated crawling process. The extension will search for leads using your selected templates.',
        tip: 'Make sure to configure your settings first for optimal results.',
        position: 'top'
      },
      {
        target: '[data-tab="leads"]',
        title: 'View Your Leads',
        description: 'All discovered leads appear here with quality scores, source information, and export options.',
        tip: 'Email addresses get quality scores to help you focus on the best leads.',
        position: 'bottom'
      },
      {
        target: '[data-tab="filters"]',
        title: 'Advanced Filtering',
        description: 'Use advanced filters to refine your template selection and lead quality requirements.',
        tip: 'Set minimum quality scores and domain filters for better results.',
        position: 'bottom'
      },
      {
        target: '[data-tab="settings"]',
        title: 'Configure Settings',
        description: 'Adjust crawl depth, delays, and domain blacklists to optimize your lead generation.',
        tip: 'Higher crawl depth finds more leads but takes longer to complete.',
        position: 'bottom'
      }
    ];
  }

  // --- INITIALIZATION ---
  async function init() {
    await loadTemplates();
    await loadStateFromStorage();

    setupTabNavigation();
    setupEventListeners();
    setupChromeListeners();
    initializeGuideSteps();
    
    populateFilters();
    updateLibraryStats();
    updateCategoryCounts();
    renderTemplates();
    renderPopularTemplates();
    renderRecentTemplates();
    renderCrawlQueue();
    renderLeadsTable();
    renderSettings();
    updateHeaderStats();
    updateCrawlStatusUI();
    loadCustomIcon();
    
    // Show welcome modal for first-time users
    checkFirstTimeUser();
  }

  // Template file configuration
  const templateFiles = [
    { name: 'IT Jobs', file: 'assets/it jobs.json', category: 'Jobs & Sectors', icon: 'fas fa-laptop-code' },
    { name: 'IT Jobs Extended', file: 'assets/it-jobs json', category: 'Country-Wide Job Search', icon: 'fas fa-globe' },
    { name: 'Universal Templates', file: 'assets/univercal.json', category: 'Decision Maker Direct Contact', icon: 'fas fa-users' },
    { name: 'Advanced 2025', file: 'assets/templates_2025_adv.json', category: 'General', icon: 'fas fa-search' }
  ];

  let templateLibrary = {};
  let currentTemplateFile = 'assets/templates_2025_adv.json';

  async function loadTemplates() {
    try {
      // Load all template files
      for (const templateFile of templateFiles) {
        try {
          const response = await fetch(templateFile.file);
          const templates = await response.json();
          
          // Add metadata and unique IDs
          const processedTemplates = templates.map((template, index) => ({
            ...template,
            id: `${templateFile.name.toLowerCase().replace(/\s+/g, '-')}-${index}`,
            source: templateFile.name,
            sourceIcon: templateFile.icon,
            sourceCategory: templateFile.category
          }));
          
          templateLibrary[templateFile.file] = {
            ...templateFile,
            templates: processedTemplates,
            count: processedTemplates.length
          };
          
          console.log(`Loaded ${processedTemplates.length} templates from ${templateFile.name}`);
        } catch (error) {
          console.error(`Failed to load ${templateFile.name}:`, error);
          templateLibrary[templateFile.file] = {
            ...templateFile,
            templates: [],
            count: 0
          };
        }
      }
      
      // Set initial templates from default file
      allTemplates = templateLibrary[currentTemplateFile]?.templates || [];
      
    } catch (error) {
      console.error("Failed to load templates:", error);
      allTemplates = [];
    }
  }

  function loadStateFromStorage() {
    return new Promise(resolve => {
      chrome.storage.local.get({ 
        crawlQueue: [], 
        leads: [], 
        settings: { 
          domainBlacklist: [], 
          crawlDepth: 1,
          crawlDelay: 2,
          maxPages: 10
        } 
      }, (data) => {
        crawlQueue = data.crawlQueue || [];
        leads = data.leads || [];
        settings = { ...settings, ...data.settings };
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

  function setupTabNavigation() {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.tab;
        switchTab(targetTab);
      });
    });
  }

  function switchTab(tabName) {
    // Update active tab button
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update active tab panel
    tabPanels.forEach(panel => panel.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    currentTab = tabName;
  }

  function setupEventListeners() {
    // Search tab - Template Library
    templateLibrarySelect.addEventListener('change', handleLibraryChange);
    categoryChips.forEach(chip => chip.addEventListener('click', handleCategoryChip));
    templateSearchInput.addEventListener('input', debounce(handleTemplateSearch, 300));
    viewBtns.forEach(btn => btn.addEventListener('click', handleViewChange));
    sortSelect.addEventListener('change', handleSortChange);
    selectAllVisibleBtn.addEventListener('click', handleSelectAllVisible);
    addSelectedBtn.addEventListener('click', handleAddSelectedTemplates);
    addCustomQueryBtn.addEventListener('click', handleAddCustomQuery);
    prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));

    // Guide system events
    startGuideBtn.addEventListener('click', startGuide);
    guideCloseBtn.addEventListener('click', endGuide);
    guideSkipBtn.addEventListener('click', endGuide);
    guidePrevBtn.addEventListener('click', previousGuideStep);
    guideNextBtn.addEventListener('click', nextGuideStep);
    
    // Welcome modal events
    welcomeSkipBtn.addEventListener('click', closeWelcomeModal);
    welcomeStartGuideBtn.addEventListener('click', () => {
      closeWelcomeModal();
      startGuide();
    });
    
    // Close modals when clicking backdrop
    guideOverlay.addEventListener('click', (e) => {
      if (e.target === guideOverlay || e.target.classList.contains('guide-backdrop')) {
        endGuide();
      }
    });
    
    welcomeModal.addEventListener('click', (e) => {
      if (e.target === welcomeModal || e.target.classList.contains('welcome-backdrop')) {
        closeWelcomeModal();
      }
    });

    // Quick start guide events
    const quickStartCard = document.getElementById('quick-start-card');
    const quickStartClose = document.getElementById('quick-start-close');
    const quickStartGuideBtn = document.getElementById('quick-start-guide-btn');
    const quickStartDemoBtn = document.getElementById('quick-start-demo-btn');

    if (quickStartClose) {
      quickStartClose.addEventListener('click', () => {
        quickStartCard.style.display = 'none';
        chrome.storage.local.set({ hasSeenQuickStart: true });
      });
    }

    if (quickStartGuideBtn) {
      quickStartGuideBtn.addEventListener('click', startGuide);
    }

    if (quickStartDemoBtn) {
      quickStartDemoBtn.addEventListener('click', startDemo);
    }
    
    // Crawl tab
    startCrawlBtn.addEventListener('click', handleStartCrawl);
    clearQueueBtn.addEventListener('click', handleClearQueue);
    
    // Leads tab
    leadsFilterInput.addEventListener('input', renderLeadsTable);
    selectAllLeadsEl.addEventListener('change', handleSelectAllLeads);
    leadsTableBody.addEventListener('click', handleLeadsTableClick);
    clearLeadsBtn.addEventListener('click', handleClearLeads);
    exportBtn.addEventListener('click', toggleExportMenu);
    exportCsvBtn.addEventListener('click', () => handleExport('csv'));
    exportJsonBtn.addEventListener('click', () => handleExport('json'));
    exportTxtBtn.addEventListener('click', () => handleExport('txt'));
    
    // Filters tab
    Object.values(filters).forEach(select => select.addEventListener('change', renderTemplates));
    minScoreSlider.addEventListener('input', handleMinScoreChange);
    applyFiltersBtn.addEventListener('click', handleApplyFilters);
    resetFiltersBtn.addEventListener('click', handleResetFilters);
    
    // Settings tab
    saveSettingsBtn.addEventListener('click', handleSaveSettings);
    resetSettingsBtn.addEventListener('click', handleResetSettings);
    generateIconBtn.addEventListener('click', handleGenerateIcon);
    svgInput.addEventListener('input', () => updateIconPreview(svgInput.value));
    
    // Close export menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
        exportMenu.classList.remove('show');
      }
    });
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
        const { status, progress, newLeadsCount } = message.data;
        if (status) {
          crawlStatus = status;
          updateCrawlStatusUI();
        }
        if (progress) {
          crawlProgressEl.textContent = progress;
        }
        if (newLeadsCount) {
          showNotification(`Found ${newLeadsCount} new leads!`);
        }
      }
    });
  }

  // --- NEW HANDLER FUNCTIONS ---
  function handleLibraryChange(e) {
    currentTemplateFile = e.target.value;
    allTemplates = templateLibrary[currentTemplateFile]?.templates || [];
    selectedTemplates.clear();
    currentPage = 1;
    updateCategoryCounts();
    renderTemplates();
    updateLibraryStats();
  }

  function handleCategoryChip(e) {
    // Remove active from all chips
    categoryChips.forEach(chip => chip.classList.remove('active'));
    // Add active to clicked chip
    e.currentTarget.classList.add('active');
    
    currentCategory = e.currentTarget.dataset.category;
    currentPage = 1;
    renderTemplates();
  }

  function handleTemplateSearch() {
    currentPage = 1;
    renderTemplates();
  }

  function handleViewChange(e) {
    viewBtns.forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    currentView = e.currentTarget.dataset.view;
    templatesContainer.className = `templates-display ${currentView}-view`;
    renderTemplates();
  }

  function handleSortChange(e) {
    currentSort = e.target.value;
    renderTemplates();
  }

  function handleSelectAllVisible() {
    const visibleTemplates = getVisibleTemplates();
    const startIndex = (currentPage - 1) * templatesPerPage;
    const endIndex = startIndex + templatesPerPage;
    const pageTemplates = visibleTemplates.slice(startIndex, endIndex);
    
    const allSelected = pageTemplates.every(t => selectedTemplates.has(t.id));
    
    if (allSelected) {
      // Deselect all visible
      pageTemplates.forEach(t => selectedTemplates.delete(t.id));
    } else {
      // Select all visible
      pageTemplates.forEach(t => selectedTemplates.add(t.id));
    }
    
    renderTemplates();
  }

  function changePage(page) {
    const visibleTemplates = getVisibleTemplates();
    const totalPages = Math.ceil(visibleTemplates.length / templatesPerPage);
    
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      renderTemplates();
    }
  }

  // Utility function for debouncing search input
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

  function handleAddSelectedTemplates() {
    const newTemplates = Array.from(selectedTemplates).map(id => 
      allTemplates.find(t => t.id === id)
    ).filter(t => t && !crawlQueue.some(cq => cq.query === t.query));
    
    if (newTemplates.length > 0) {
      crawlQueue.push(...newTemplates);
      chrome.storage.local.set({ crawlQueue });
      
      // Add to recent templates
      newTemplates.forEach(template => {
        recentTemplates.unshift(template);
      });
      recentTemplates = recentTemplates.slice(0, 10); // Keep only last 10
      
      selectedTemplates.clear();
      renderTemplates();
      renderRecentTemplates();
      showNotification(`Added ${newTemplates.length} templates to queue`);
    }
  }

  function handleSelectAllLeads(e) {
    const checkboxes = leadsTableBody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
  }

  function handleLeadsTableClick(e) {
    if (e.target.classList.contains('delete-lead-btn')) {
      const leadId = e.target.dataset.leadId;
      leads = leads.filter(lead => lead.id !== leadId);
      chrome.storage.local.set({ leads });
    }
  }

  function toggleExportMenu() {
    exportMenu.classList.toggle('show');
  }

  function handleMinScoreChange() {
    minScoreValue.textContent = minScoreSlider.value;
  }

  function handleApplyFilters() {
    renderLeadsTable();
    showNotification('Filters applied successfully');
  }

  function handleResetFilters() {
    // Reset all filter controls
    Object.values(filters).forEach(select => select.selectedIndex = 0);
    minScoreSlider.value = 0;
    minScoreValue.textContent = '0';
    filterEmailsCheckbox.checked = true;
    filterPhonesCheckbox.checked = true;
    domainWhitelistTextarea.value = '';
    domainBlacklistFilterTextarea.value = '';
    
    renderTemplates();
    renderLeadsTable();
    showNotification('Filters reset to default');
  }

  function handleResetSettings() {
    settings = {
      domainBlacklist: [],
      crawlDepth: 1,
      crawlDelay: 2,
      maxPages: 10
    };
    renderSettings();
    showNotification('Settings reset to default');
  }

  function showNotification(message) {
    // Simple notification - could be enhanced with a toast system
    const originalText = saveSettingsBtn.textContent;
    saveSettingsBtn.textContent = message;
    setTimeout(() => {
      saveSettingsBtn.textContent = originalText;
    }, 2000);
  }

  // --- GUIDE SYSTEM FUNCTIONS ---
  function checkFirstTimeUser() {
    chrome.storage.local.get(['hasSeenWelcome', 'hasSeenQuickStart'], (data) => {
      if (!data.hasSeenWelcome) {
        showWelcomeModal();
      } else if (!data.hasSeenQuickStart) {
        // Show quick start card
        const quickStartCard = document.getElementById('quick-start-card');
        if (quickStartCard) {
          quickStartCard.style.display = 'block';
        }
      } else {
        // Hide quick start card for returning users
        const quickStartCard = document.getElementById('quick-start-card');
        if (quickStartCard) {
          quickStartCard.style.display = 'none';
        }
      }
    });
  }

  function showWelcomeModal() {
    welcomeModal.classList.add('active');
  }

  function closeWelcomeModal() {
    welcomeModal.classList.remove('active');
    
    if (welcomeDontShowAgain.checked) {
      chrome.storage.local.set({ hasSeenWelcome: true });
    }
  }

  function startGuide() {
    isGuideActive = true;
    currentGuideStep = 0;
    guideOverlay.classList.add('active');
    guideStepTotal.textContent = guideSteps.length;
    showGuideStep(currentGuideStep);
  }

  function endGuide() {
    isGuideActive = false;
    guideOverlay.classList.remove('active');
    removeHighlight();
    chrome.storage.local.set({ hasSeenWelcome: true });
  }

  function nextGuideStep() {
    if (currentGuideStep < guideSteps.length - 1) {
      currentGuideStep++;
      showGuideStep(currentGuideStep);
    } else {
      endGuide();
    }
  }

  function previousGuideStep() {
    if (currentGuideStep > 0) {
      currentGuideStep--;
      showGuideStep(currentGuideStep);
    }
  }

  function showGuideStep(stepIndex) {
    const step = guideSteps[stepIndex];
    if (!step) return;

    // Update step indicator
    guideStepCurrent.textContent = stepIndex + 1;
    
    // Update content
    guideTitle.textContent = step.title;
    guideDescription.textContent = step.description;
    
    if (step.tip) {
      guideTip.style.display = 'flex';
      guideTipText.textContent = step.tip;
    } else {
      guideTip.style.display = 'none';
    }
    
    // Update navigation buttons
    guidePrevBtn.disabled = stepIndex === 0;
    guideNextBtn.textContent = stepIndex === guideSteps.length - 1 ? 'Finish' : 'Next';
    
    // Highlight target element and position tooltip
    highlightElement(step.target);
    positionTooltip(step.target, step.position);
    
    // Switch to appropriate tab if needed
    const targetElement = document.querySelector(step.target);
    if (targetElement) {
      const tabElement = targetElement.closest('.tab-panel');
      if (tabElement) {
        const tabId = tabElement.id.replace('-tab', '');
        if (tabId !== currentTab) {
          switchTab(tabId);
        }
      }
    }
  }

  function highlightElement(selector) {
    removeHighlight();
    
    const element = document.querySelector(selector);
    if (element) {
      highlightedElement = element;
      element.classList.add('guide-highlight');
      
      // Scroll element into view if needed
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });
    }
  }

  function removeHighlight() {
    if (highlightedElement) {
      highlightedElement.classList.remove('guide-highlight');
      highlightedElement = null;
    }
  }

  function positionTooltip(selector, position = 'bottom') {
    const element = document.querySelector(selector);
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const tooltip = guideTooltip;
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top, left;
    
    switch (position) {
      case 'top':
        top = rect.top - tooltipRect.height - 16;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = rect.bottom + 16;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.left - tooltipRect.width - 16;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
        left = rect.right + 16;
        break;
      default:
        top = rect.bottom + 16;
        left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    }
    
    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < 16) left = 16;
    if (left + tooltipRect.width > viewportWidth - 16) {
      left = viewportWidth - tooltipRect.width - 16;
    }
    
    if (top < 16) top = 16;
    if (top + tooltipRect.height > viewportHeight - 16) {
      top = viewportHeight - tooltipRect.height - 16;
    }
    
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  // --- DEMO FUNCTION ---
  function startDemo() {
    // Hide quick start card
    const quickStartCard = document.getElementById('quick-start-card');
    if (quickStartCard) {
      quickStartCard.style.display = 'none';
    }

    // Auto-select IT Jobs library
    templateLibrarySelect.value = 'assets/it jobs.json';
    handleLibraryChange({ target: templateLibrarySelect });

    // Wait for templates to load, then auto-select some templates
    setTimeout(() => {
      // Select first few templates automatically
      const templateCards = document.querySelectorAll('.template-card');
      const templatesToSelect = Math.min(3, templateCards.length);
      
      for (let i = 0; i < templatesToSelect; i++) {
        const card = templateCards[i];
        const checkbox = card.querySelector('.template-checkbox');
        if (checkbox) {
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event('change'));
        }
      }

      // Show notification
      showNotification('Demo: Selected 3 IT job templates for you!');
      
      // Highlight the add selected button
      setTimeout(() => {
        addSelectedBtn.style.animation = 'pulse 1s ease-in-out 3';
      }, 1000);
      
    }, 500);
  }

  function updateHeaderStats() {
    totalLeadsStatEl.textContent = leads.length;
    queueStatEl.textContent = crawlQueue.length;
  }

  // --- TEMPLATE FILTERING AND RENDERING ---
  function getVisibleTemplates() {
    let templates = [...allTemplates];
    
    // Apply category filter
    if (currentCategory !== 'all') {
      templates = templates.filter(t => {
        if (currentCategory === 'Jobs & Sectors') {
          return t.category === 'Jobs & Sectors' || t.category === 'Country-Wide Job Search' || t.category === 'IT Hub Specific';
        } else if (currentCategory === 'Technology') {
          return t.sector === 'Technology' || t.sector === 'IT & Software';
        } else if (currentCategory === 'India') {
          return t.location && t.location.toLowerCase().includes('india');
        } else if (currentCategory === 'Remote') {
          return t.role && t.role.toLowerCase().includes('remote');
        }
        return t.category === currentCategory || t.sector === currentCategory;
      });
    }
    
    // Apply search filter
    const searchTerm = templateSearchInput.value.toLowerCase();
    if (searchTerm) {
      templates = templates.filter(t => 
        t.query.toLowerCase().includes(searchTerm) ||
        (t.sector && t.sector.toLowerCase().includes(searchTerm)) ||
        (t.location && t.location.toLowerCase().includes(searchTerm)) ||
        (t.role && t.role.toLowerCase().includes(searchTerm)) ||
        (t.category && t.category.toLowerCase().includes(searchTerm)) ||
        (t.intent_note && t.intent_note.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply sorting
    templates.sort((a, b) => {
      switch (currentSort) {
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'location':
          return (a.location || '').localeCompare(b.location || '');
        case 'sector':
          return (a.sector || '').localeCompare(b.sector || '');
        case 'relevance':
        default:
          // Simple relevance based on search term match
          if (searchTerm) {
            const aRelevance = getRelevanceScore(a, searchTerm);
            const bRelevance = getRelevanceScore(b, searchTerm);
            return bRelevance - aRelevance;
          }
          return 0;
      }
    });
    
    return templates;
  }

  function getRelevanceScore(template, searchTerm) {
    let score = 0;
    const term = searchTerm.toLowerCase();
    
    if (template.query.toLowerCase().includes(term)) score += 10;
    if (template.sector && template.sector.toLowerCase().includes(term)) score += 5;
    if (template.location && template.location.toLowerCase().includes(term)) score += 5;
    if (template.role && template.role.toLowerCase().includes(term)) score += 3;
    if (template.category && template.category.toLowerCase().includes(term)) score += 3;
    
    return score;
  }

  function renderTemplates() {
    const visibleTemplates = getVisibleTemplates();
    const totalTemplates = visibleTemplates.length;
    const startIndex = (currentPage - 1) * templatesPerPage;
    const endIndex = startIndex + templatesPerPage;
    const pageTemplates = visibleTemplates.slice(startIndex, endIndex);
    
    // Update showing count
    showingCountEl.textContent = `Showing ${startIndex + 1}-${Math.min(endIndex, totalTemplates)} of ${totalTemplates} templates`;
    
    // Clear container
    templatesContainer.innerHTML = '';
    
    if (pageTemplates.length === 0) {
      templatesContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
          <h3>No templates found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      `;
      renderPagination(0, 0);
      return;
    }

    // Render templates
    pageTemplates.forEach(template => {
      const isSelected = selectedTemplates.has(template.id);
      const templateCard = createTemplateCard(template, isSelected);
      templatesContainer.appendChild(templateCard);
    });
    
    // Render pagination
    renderPagination(totalTemplates, Math.ceil(totalTemplates / templatesPerPage));
    
    // Update selected count
    updateSelectedCount();
  }

  function createTemplateCard(template, isSelected) {
    const templateCard = document.createElement('div');
    templateCard.className = `template-card ${isSelected ? 'selected' : ''}`;
    
    const sourceInfo = template.source ? `
      <div class="template-source">
        <i class="${template.sourceIcon || 'fas fa-file'}"></i>
        ${template.source}
      </div>
    ` : '';
    
    const truncatedQuery = template.query.length > 100 ? 
      template.query.substring(0, 100) + '...' : template.query;
    
    templateCard.innerHTML = `
      <input type="checkbox" class="template-checkbox" ${isSelected ? 'checked' : ''} data-template-id="${template.id}">
      ${sourceInfo}
      <div class="template-query" title="${template.query}">${truncatedQuery}</div>
      <div class="template-meta">
        ${template.category ? `<div class="template-meta-item"><i class="fas fa-tag"></i> ${template.category}</div>` : ''}
        ${template.sector ? `<div class="template-meta-item"><i class="fas fa-industry"></i> ${template.sector}</div>` : ''}
        ${template.location ? `<div class="template-meta-item"><i class="fas fa-map-marker-alt"></i> ${template.location}</div>` : ''}
        ${template.role ? `<div class="template-meta-item"><i class="fas fa-user-tie"></i> ${template.role}</div>` : ''}
      </div>
    `;
    
    // Add click handlers
    templateCard.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox') {
        const checkbox = templateCard.querySelector('.template-checkbox');
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });
    
    const checkbox = templateCard.querySelector('.template-checkbox');
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedTemplates.add(template.id);
        templateCard.classList.add('selected');
      } else {
        selectedTemplates.delete(template.id);
        templateCard.classList.remove('selected');
      }
      updateSelectedCount();
    });
    
    return templateCard;
  }

  function renderPagination(totalItems, totalPages) {
    if (totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }
    
    paginationContainer.style.display = 'flex';
    paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    
    // Render page numbers
    pageNumbers.innerHTML = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => changePage(i));
      pageNumbers.appendChild(pageBtn);
    }
  }

  function updateSelectedCount() {
    const count = selectedTemplates.size;
    selectedCountEl.textContent = count;
    addSelectedBtn.disabled = count === 0;
    
    // Update select all button text
    const visibleTemplates = getVisibleTemplates();
    const startIndex = (currentPage - 1) * templatesPerPage;
    const endIndex = startIndex + templatesPerPage;
    const pageTemplates = visibleTemplates.slice(startIndex, endIndex);
    const allPageSelected = pageTemplates.length > 0 && pageTemplates.every(t => selectedTemplates.has(t.id));
    
    selectAllVisibleBtn.innerHTML = allPageSelected ? 
      '<i class="fas fa-square"></i> Deselect All Visible' : 
      '<i class="fas fa-check-square"></i> Select All Visible';
  }

  function updateCategoryCounts() {
    const counts = {
      all: allTemplates.length,
      'Jobs & Sectors': 0,
      'Technology': 0,
      'India': 0,
      'Remote': 0
    };
    
    allTemplates.forEach(t => {
      if (t.category === 'Jobs & Sectors' || t.category === 'Country-Wide Job Search' || t.category === 'IT Hub Specific') {
        counts['Jobs & Sectors']++;
      }
      if (t.sector === 'Technology' || t.sector === 'IT & Software') {
        counts['Technology']++;
      }
      if (t.location && t.location.toLowerCase().includes('india')) {
        counts['India']++;
      }
      if (t.role && t.role.toLowerCase().includes('remote')) {
        counts['Remote']++;
      }
    });
    
    // Update count displays
    document.getElementById('all-count').textContent = counts.all;
    document.getElementById('jobs-count').textContent = counts['Jobs & Sectors'];
    document.getElementById('tech-count').textContent = counts['Technology'];
    document.getElementById('india-count').textContent = counts['India'];
    document.getElementById('remote-count').textContent = counts['Remote'];
  }

  function updateLibraryStats() {
    const currentLibrary = templateLibrary[currentTemplateFile];
    if (currentLibrary) {
      totalTemplatesEl.textContent = currentLibrary.count.toLocaleString();
    }
  }

  function renderPopularTemplates() {
    // Simple popularity based on common keywords
    const popular = allTemplates
      .filter(t => t.query.toLowerCase().includes('email') || t.query.toLowerCase().includes('contact'))
      .slice(0, 5);
    
    popularTemplatesEl.innerHTML = '';
    popular.forEach(template => {
      const item = document.createElement('div');
      item.className = 'popular-item';
      item.innerHTML = `
        <div class="item-title">${template.query.substring(0, 50)}${template.query.length > 50 ? '...' : ''}</div>
        <div class="item-meta">${template.sector || 'General'} • ${template.location || 'Global'}</div>
      `;
      item.addEventListener('click', () => {
        selectedTemplates.add(template.id);
        renderTemplates();
      });
      popularTemplatesEl.appendChild(item);
    });
  }

  function renderRecentTemplates() {
    recentTemplatesEl.innerHTML = '';
    recentTemplates.slice(0, 5).forEach(template => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      item.innerHTML = `
        <div class="item-title">${template.query.substring(0, 50)}${template.query.length > 50 ? '...' : ''}</div>
        <div class="item-meta">${template.sector || 'General'} • ${template.location || 'Global'}</div>
      `;
      item.addEventListener('click', () => {
        selectedTemplates.add(template.id);
        renderTemplates();
      });
      recentTemplatesEl.appendChild(item);
    });
    
    if (recentTemplates.length === 0) {
      recentTemplatesEl.innerHTML = '<p style="color: var(--text-muted); font-size: 12px;">No recent templates</p>';
    }
  }

  function renderSettings() {
    domainBlacklistTextarea.value = settings.domainBlacklist.join('\n');
    crawlDepthSelect.value = settings.crawlDepth;
    crawlDelayInput.value = settings.crawlDelay;
    maxPagesInput.value = settings.maxPages;
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
      if (select) {
        select.innerHTML = '<option value="all">All</option>';
        [...unique[key]].sort().forEach(val => {
          const option = document.createElement('option');
          option.value = val;
          option.textContent = val;
          select.appendChild(option);
        });
      }
    }
    
    // Set initial filtered templates
    filteredTemplates = [...allTemplates];
  }

  // Remove the old applyFiltersAndRender and renderFilteredTemplates functions
  // They are replaced by the new renderTemplates function

  // This function is now replaced by renderTemplates()

  function renderCrawlQueue() {
    queueContainer.innerHTML = '';
    queueCountBadge.textContent = crawlQueue.length;
    
    if (crawlQueue.length === 0) {
      queueContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Queue is empty</p>';
    } else {
      crawlQueue.forEach((item, index) => {
        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        queueItem.innerHTML = `
          <div style="display: flex; justify-content: between; align-items: center;">
            <div style="flex: 1;">
              <div style="font-weight: 500; margin-bottom: 4px;">${item.query}</div>
              <div style="font-size: 12px; color: var(--text-muted);">
                ${item.sector || 'Custom'} • ${item.location || 'Global'}
              </div>
            </div>
            <button class="btn-outline" style="padding: 4px 8px; font-size: 12px;" onclick="removeFromQueue(${index})">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
        queueContainer.appendChild(queueItem);
      });
    }
    updateCrawlStatusUI();
    updateHeaderStats();
  }

  // Global function for removing items from queue
  window.removeFromQueue = function(index) {
    crawlQueue.splice(index, 1);
    chrome.storage.local.set({ crawlQueue });
  };

  function renderLeadsTable() {
    const filterText = (leadsFilterInput ? leadsFilterInput.value : '').toLowerCase();
    const minScore = parseInt(minScoreSlider.value);
    const showEmails = filterEmailsCheckbox.checked;
    const showPhones = filterPhonesCheckbox.checked;
    
    let filteredLeads = leads.filter(lead => {
      // Text filter
      const matchesText = !filterText || (
        lead.value.toLowerCase().includes(filterText) ||
        lead.type.toLowerCase().includes(filterText) ||
        lead.sourceUrl.toLowerCase().includes(filterText)
      );
      
      // Score filter
      const matchesScore = lead.type !== 'email' || lead.score >= minScore;
      
      // Type filter
      const matchesType = (lead.type === 'email' && showEmails) || (lead.type === 'phone' && showPhones);
      
      return matchesText && matchesScore && matchesType;
    });

    const sortedLeads = [...filteredLeads].sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Update stats
    const emailCount = leads.filter(l => l.type === 'email').length;
    const phoneCount = leads.filter(l => l.type === 'phone').length;
    const avgScore = leads.length > 0 ? 
      Math.round(leads.filter(l => l.type === 'email').reduce((sum, l) => sum + l.score, 0) / Math.max(emailCount, 1)) : 0;
    
    emailCountEl.textContent = emailCount;
    phoneCountEl.textContent = phoneCount;
    avgScoreEl.textContent = avgScore;
    
    // Render table
    leadsTableBody.innerHTML = '';
    
    if (sortedLeads.length === 0) {
      const message = leads.length > 0 ? 'No leads match your filters.' : 'No leads found yet.';
      leadsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">${message}</td></tr>`;
    } else {
      sortedLeads.forEach(lead => {
        const tr = document.createElement('tr');
        const leadDate = new Date(lead.firstSeenAt).toLocaleDateString();
        const scoreDisplay = lead.type === 'email' ? lead.score : '-';
        const typeIcon = lead.type === 'email' ? '<i class="fas fa-envelope"></i>' : '<i class="fas fa-phone"></i>';
        
        tr.innerHTML = `
          <td><input type="checkbox" data-lead-id="${lead.id}"></td>
          <td>${typeIcon} ${lead.type}</td>
          <td style="font-family: monospace;">${lead.value}</td>
          <td>${scoreDisplay}</td>
          <td><a href="${lead.sourceUrl}" target="_blank" title="${lead.sourceUrl}">${new URL(lead.sourceUrl).hostname}</a></td>
          <td>${leadDate}</td>
          <td>
            <button class="delete-lead-btn" data-lead-id="${lead.id}" title="Delete Lead" style="background: none; border: none; color: var(--danger-color); cursor: pointer; padding: 4px;">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
        leadsTableBody.appendChild(tr);
      });
    }
    
    const hasLeads = leads.length > 0;
    clearLeadsBtn.disabled = !hasLeads;
    exportCsvBtn.disabled = !hasLeads;
    exportJsonBtn.disabled = !hasLeads;
    exportTxtBtn.disabled = !hasLeads;
    
    updateHeaderStats();
  }

  function updateCrawlStatusUI() {
    const isCrawling = crawlStatus === "Crawling";
    
    crawlStatusEl.textContent = crawlStatus;
    
    if (isCrawling) {
      startCrawlBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Crawl';
      startCrawlBtn.className = 'btn-danger';
    } else {
      startCrawlBtn.innerHTML = '<i class="fas fa-play"></i> Start Crawl';
      startCrawlBtn.className = 'btn-success';
    }
    
    startCrawlBtn.disabled = crawlQueue.length === 0 && !isCrawling;
    clearQueueBtn.disabled = crawlQueue.length === 0 || isCrawling;
    
    // Update progress bar
    if (isCrawling) {
      progressFillEl.style.width = '100%';
      progressFillEl.style.animation = 'pulse 2s infinite';
    } else {
      progressFillEl.style.width = '0%';
      progressFillEl.style.animation = 'none';
    }
  }

  // --- HANDLER FUNCTIONS ---
  function handleSaveSettings() {
    settings.domainBlacklist = domainBlacklistTextarea.value.split('\n').map(d => d.trim()).filter(Boolean);
    settings.crawlDepth = parseInt(crawlDepthSelect.value, 10);
    settings.crawlDelay = parseInt(crawlDelayInput.value, 10);
    settings.maxPages = parseInt(maxPagesInput.value, 10);
    
    chrome.storage.local.set({ settings }, () => {
      showNotification('Settings saved successfully!');
    });
  }

  // Update handleAddCustomQuery to work with new form
  function handleAddCustomQuery() {
    const queryText = customQueryInput.value.trim();
    const sector = customSectorSelect.value;
    const location = customLocationInput.value.trim() || 'Global';
    
    if (queryText && !crawlQueue.some(item => item.query === queryText)) {
      const customTemplate = {
        query: queryText,
        sector: sector,
        location: location,
        platform: 'Google',
        role: 'Custom',
        intent_note: 'Custom search query'
      };
      
      crawlQueue.push(customTemplate);
      chrome.storage.local.set({ crawlQueue });
      
      // Clear form
      customQueryInput.value = '';
      customLocationInput.value = '';
      
      showNotification('Custom query added to queue');
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