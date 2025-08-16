import { useState } from "react";
import { LeadGenerator } from "@/components/LeadGenerator";
import { LeadManager } from "@/components/LeadManager";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Lead, Template } from "@/types";

const Index = () => {
  const [crawlQueue, setCrawlQueue] = useState<Template[]>([]);
  const [extractedLeads, setExtractedLeads] = useState<Lead[]>([]);

  const handleQueueForCrawl = (templates: Template[]) => {
    // Avoid adding duplicates
    const newTemplates = templates.filter(
      (t) => !crawlQueue.some((cq) => cq.query === t.query)
    );
    setCrawlQueue((prev) => [...prev, ...newTemplates]);
  };

  return (
    <div className="p-4 sm:p-8 bg-background text-foreground min-h-screen">
      <main className="container mx-auto">
        <LeadGenerator onQueueForCrawl={handleQueueForCrawl} />
        <LeadManager 
          queue={crawlQueue} 
          leads={extractedLeads}
          onUpdateLeads={setExtractedLeads}
          onClearQueue={() => setCrawlQueue([])}
        />
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;