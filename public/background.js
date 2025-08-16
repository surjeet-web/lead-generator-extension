let crawlQueue = [];
let isCrawling = false;
let currentQueryIndex = 0;
let currentLinks = [];
let currentLinkIndex = 0;

// --- Main Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startCrawl") {
    handleStartCrawl(message.data);
  } else if (message.action === "stopCrawl") {
    handleStopCrawl();
  } else if (message.action === "extractedLeads") {
    handleExtractedLeads(message.data);
  }
  // Keep the message channel open for asynchronous responses
  return true;
});

// --- Crawl Control Functions ---
function handleStartCrawl(queue) {
  if (isCrawling) return;
  isCrawling = true;
  crawlQueue = queue;
  currentQueryIndex = 0;
  console.log("Starting crawl with queue:", crawlQueue);
  processQueue();
}

function handleStopCrawl() {
  console.log("Stopping crawl.");
  isCrawling = false;
  crawlQueue = [];
  updateUI({ status: "Stopped" });
}

function processQueue() {
  if (!isCrawling || currentQueryIndex >= crawlQueue.length) {
    console.log("Crawl finished.");
    isCrawling = false;
    updateUI({ status: "Finished", progress: "Crawl complete!" });
    return;
  }

  const template = crawlQueue[currentQueryIndex];
  const progressText = `Query ${currentQueryIndex + 1}/${crawlQueue.length}: ${template.query}`;
  console.log(progressText);
  updateUI({ status: "Crawling", progress: progressText });

  let searchUrl;
  switch (template.platform.toLowerCase()) {
    case 'google':
      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(template.query)}`;
      break;
    case 'bing':
      searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(template.query)}`;
      break;
    default:
      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(template.query)}`;
  }

  chrome.tabs.create({ url: searchUrl, active: false }, (tab) => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        injectSerpParser(tab.id);
      }
    });
  });
}

// --- Page Processing Functions ---
function injectSerpParser(tabId) {
  console.log("Injecting SERP parser into tab:", tabId);
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: scrapeSerpLinks,
  }, (injectionResults) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      chrome.tabs.remove(tabId);
      moveToNextQuery();
      return;
    }
    const links = injectionResults[0].result;
    console.log(`Found ${links.length} links from SERP.`);
    chrome.tabs.remove(tabId);
    currentLinks = links;
    currentLinkIndex = 0;
    processLinks();
  });
}

function processLinks() {
  if (!isCrawling || currentLinkIndex >= currentLinks.length) {
    moveToNextQuery();
    return;
  }

  const url = currentLinks[currentLinkIndex];
  console.log(`Visiting link ${currentLinkIndex + 1}/${currentLinks.length}: ${url}`);
  chrome.tabs.create({ url, active: false }, (tab) => {
    // The content.js script will run automatically.
    // We'll just close the tab after a delay.
    setTimeout(() => {
      if (tab.id) {
        chrome.tabs.remove(tab.id).catch(e => console.log(`Error removing tab: ${e.message}`));
      }
      currentLinkIndex++;
      processLinks();
    }, 7000); // 7-second timeout for page load and script execution
  });
}

function moveToNextQuery() {
  currentQueryIndex++;
  processQueue();
}

// This function is injected into the SERP page
function scrapeSerpLinks() {
  // This selector is reasonably good for Google's main organic results
  const anchors = document.querySelectorAll('div.g a[href^="http"]');
  const links = new Set();
  anchors.forEach(a => {
    try {
      const url = new URL(a.href);
      if (url.protocol === "https:" && !url.hostname.includes("google.com") && !url.hostname.includes("youtube.com")) {
        links.add(url.href);
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  });
  return Array.from(links);
}

// --- Data & UI Communication ---
function handleExtractedLeads(leads) {
  console.log(`Received ${leads.length} leads.`);
  chrome.storage.local.get({ leads: [] }, (data) => {
    const existingLeads = data.leads;
    const newLeads = leads.filter(
      (newLead) => !existingLeads.some((existing) => existing.email === newLead.email)
    );

    if (newLeads.length > 0) {
      const updatedLeads = [...existingLeads, ...newLeads];
      chrome.storage.local.set({ leads: updatedLeads }, () => {
        console.log(`${newLeads.length} new leads stored.`);
        updateUI({ newLeadsCount: newLeads.length });
      });
    }
  });
}

function updateUI(message) {
  chrome.runtime.sendMessage({ action: "crawlUpdate", data: message });
}