export interface Template {
  platform: string;
  sector: string;
  role: string;
  location: string;
  intent_note: string;
  query: string;
}

export interface Lead {
  id: string;
  email: string;
  score: number;
  domain: string;
  sourceUrl: string;
  firstSeenAt: string;
}