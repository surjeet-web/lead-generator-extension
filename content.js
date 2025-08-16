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
  const emailUser = email.split('@')[0].toLowerCase();
  const emailDomain = email.split('@')[1].toLowerCase();

  // --- Positive Scoring ---
  // 1. Matches page domain (high confidence)
  if (domain && emailDomain.includes(domain)) {
    score += 30;
  }

  // 2. Contains high-value role keywords
  const highValueRoles = ['ceo', 'founder', 'cto', 'cfo', 'owner', 'partner', 'sales', 'marketing', 'president', 'director'];
  if (highValueRoles.some(role => emailUser.includes(role))) {
    score += 25;
  }

  // 3. Looks like a personal name (e.g., john.smith, jsmith)
  if (/[.-_]/.test(emailUser) || (emailUser.length > 6 && !highValueRoles.some(role => emailUser.includes(role)))) {
     score += 15;
  }

  // --- Negative Scoring ---
  // 1. Generic, non-contact roles
  const genericRoles = ['noreply', 'no-reply', 'support', 'info', 'contact', 'admin', 'hello', 'help', 'press', 'privacy', 'security', 'jobs', 'careers'];
  if (genericRoles.some(role => emailUser.includes(role))) {
    score -= 40;
  }

  // 2. Free email providers
  const freeProviders = ['gmail.com', 'outlook.com', 'yahoo.com', 'proton.me', 'aol.com', 'hotmail.com', 'icloud.com'];
  if (freeProviders.some(provider => emailDomain === provider)) {
    score -= 20;
  }
  
  // 3. Gibberish or random strings (e.g., s8df9s@...)
  if (/^[a-f0-9]{7,}/.test(emailUser)) {
      score -= 30;
  }

  return Math.max(0, Math.min(100, score));
}

const foundLeads = extractContacts();
if (foundLeads.length > 0) {
  chrome.runtime.sendMessage({ action: "extractedLeads", data: foundLeads });
}