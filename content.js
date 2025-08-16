function extractContacts() {
  const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gi;
  const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
  
  const bodyText = document.body.innerText;
  const pageUrl = window.location.href;
  const pageDomain = window.location.hostname;
  const leads = [];

  // Extract Emails
  const emailMatches = bodyText.match(EMAIL_REGEX) || [];
  [...new Set(emailMatches)].forEach(email => {
    leads.push({
      id: self.crypto.randomUUID(),
      type: 'email',
      value: email,
      score: scoreEmail(email, pageDomain),
      sourceUrl: pageUrl,
      firstSeenAt: new Date().toISOString(),
    });
  });

  // Extract Phone Numbers
  const phoneMatches = bodyText.match(PHONE_REGEX) || [];
  [...new Set(phoneMatches)].forEach(phone => {
    // Basic cleanup and validation for phone numbers
    const cleanedPhone = phone.replace(/\s/g, '');
    if (cleanedPhone.length >= 7) { // Simple validation
      leads.push({
        id: self.crypto.randomUUID(),
        type: 'phone',
        value: phone.trim(),
        score: 0, // Score is not applicable for phones
        sourceUrl: pageUrl,
        firstSeenAt: new Date().toISOString(),
      });
    }
  });

  return leads;
}

function scoreEmail(email, domain) {
  let score = 50;
  if (domain && email.endsWith('@' + domain)) score += 20;
  if (/noreply|no-reply|support|info|contact|admin/.test(email)) score -= 30;
  if (/@(gmail|outlook|yahoo|proton)\./.test(email)) score -= 10;
  return Math.max(0, Math.min(100, score));
}

const foundLeads = extractContacts();
if (foundLeads.length > 0) {
  chrome.runtime.sendMessage({ action: "extractedLeads", data: foundLeads });
}