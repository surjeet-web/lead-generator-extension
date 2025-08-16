function extractEmails() {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const bodyText = document.body.innerText;
  const matches = bodyText.match(emailRegex) || [];
  return [...new Set(matches)]; // Return unique emails
}

function scoreEmail(email, domain) {
  let score = 50; // Base score
  if (domain && email.endsWith('@' + domain)) {
    score += 20;
  }
  if (/noreply|no-reply|support|info|contact|admin/.test(email)) {
    score -= 30;
  }
  if (/@(gmail|outlook|yahoo|proton)\./.test(email)) {
    score -= 10;
  }
  return Math.max(0, Math.min(100, score)); // Clamp score between 0 and 100
}

// Run extraction and send data back to the service worker
const foundEmails = extractEmails();
if (foundEmails.length > 0) {
  const pageDomain = window.location.hostname;
  const leads = foundEmails.map(email => ({
    id: self.crypto.randomUUID(),
    email: email,
    score: scoreEmail(email, pageDomain),
    domain: email.split('@')[1],
    sourceUrl: window.location.href,
    firstSeenAt: new Date().toISOString(),
  }));

  chrome.runtime.sendMessage({ action: "extractedLeads", data: leads });
}