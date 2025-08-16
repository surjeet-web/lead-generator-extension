// Listens for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractedLeads") {
    console.log("Received leads from:", sender.tab.url);
    // Store the leads in chrome.storage.local
    chrome.storage.local.get({ leads: [] }, (data) => {
      const existingLeads = data.leads;
      const newLeads = message.data.filter(
        (newLead) => !existingLeads.some((existing) => existing.email === newLead.email)
      );
      
      if (newLeads.length > 0) {
        const updatedLeads = [...existingLeads, ...newLeads];
        chrome.storage.local.set({ leads: updatedLeads }, () => {
          console.log(`${newLeads.length} new leads stored.`);
        });
      }
    });
  }
});