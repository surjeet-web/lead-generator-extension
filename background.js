let crawlQueue = [];
let isCrawling = false;
let currentQueryIndex = 0;
let currentLinks = [];
let currentLinkIndex = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startCrawl") handleStartCrawl(message.data);
  else if (message.action === "stopCrawl") handleStopCrawl();
  else if (message.action === "extractedLeads") handleExtractedLeads(message.data);
  return true;
});

function handleStartCrawl(queue) {
  if (isCrawling) return;
  isCrawling = true;
  crawlQueue = queue;
  currentQueryIndex = 0;
  console.log("Starting deep crawl with queue:", crawlQueue);
  processQueue();
}

function handleStopCrawl() {
  console.log("Stopping crawl.");
  isCrawling = false;
  crawlQueue = [];
  updateUI({ status: "Stopped", progress: "" });
}

function processQueue() {
  if (!isCrawling || currentQueryIndex >= crawlQueue.length) {
    isCrawling = false;
    updateUI({ status: "Finished", progress: "Crawl complete!" });
    return;
  }

  const template = crawlQueue[currentQueryIndex];
  const progressText = `Query ${currentQueryIndex + 1}/${crawlQueue.length}: ${template.query}`;
  updateUI({ status: "Crawling", progress: progressText });

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(template.query)}`;
  chrome.tabs.create({ url: searchUrl, active: false }, (tab) => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        injectSerpParser(tab.id);
      }
    });
  });
}

function injectSerpParser(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: scrapeSerpLinks,
  }, (injectionResults) => {
    chrome.tabs.remove(tabId);
    if (chrome.runtime.lastError || !injectionResults || !injectionResults[0]) {
      moveToNextQuery();
      return;
    }
    currentLinks = injectionResults[0].result || [];
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
  chrome.tabs.create({ url, active: false }, (tab) => {
    const tabId = tab.id;
    chrome.tabs.onUpdated.addListener(function listener(_tabId, info) {
      if (_tabId === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js'],
        }, () => {
          setTimeout(() => {
            chrome.tabs.remove(tabId).catch(()=>{});
            currentLinkIndex++;
            processLinks();
          }, 2000);
        });
      }
    });
  });
}

function moveToNextQuery() {
  currentQueryIndex++;
  processQueue();
}

function scrapeSerpLinks() {
  const selectors = ['div.g a[href^="http"]', 'a[jsname][href^="http"]', 'li.b_algo h2 a'];
  const links = new Set();
  document.querySelectorAll(selectors.join(', ')).forEach(a => {
    try {
      const url = new URL(a.href);
      if (url.protocol === "https:" && !/google\.com|bing\.com|youtube\.com|microsoft\.com/.test(url.hostname)) {
        links.add(url.href);
      }
    } catch (e) {}
  });
  return Array.from(links);
}

function handleExtractedLeads(leads) {
  chrome.storage.local.get({ leads: [] }, (data) => {
    const existingLeads = data.leads;
    const newLeads = leads.filter(
      (newLead) => !existingLeads.some((existing) => existing.value === newLead.value && existing.type === newLead.type)
    );
    if (newLeads.length > 0) {
      const updatedLeads = [...existingLeads, ...newLeads];
      chrome.storage.local.set({ leads: updatedLeads }, () => {
        updateUI({ newLeadsCount: newLeads.length });
      });
    }
  });
}

function updateUI(message) {
  chrome.runtime.sendMessage({ action: "crawlUpdate", data: message });
}