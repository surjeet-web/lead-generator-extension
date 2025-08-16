import { useState, useEffect } from "react";
import { LeadGenerator } from "@/components/LeadGenerator";
import { LeadManager } from "@/components/LeadManager";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Template } from "@/types";

const Index = () => {
  const [crawlQueue, setCrawlQueue] = useState<Template[]>([]);

  // Load queue from storage on initial render
  useEffect(() => {
    chrome.storage.local.get({ crawlQueue: [] }, (data) => {
      setCrawlQueue(data.crawlQueue);
    });
  }, []);

  // Persist queue to storage whenever it changes
  useEffect(() => {
    chrome.storage.local.set({ crawlQueue });
  }, [crawlQueue]);

  const handleQueueForCrawl = (templates: Template[]) => {
    const newTemplates = templates.filter(
      (t) => !crawlQueue.some((cq) => cq.query === t.query)
    );
    setCrawlQueue((prev) => [...prev, ...newTemplates]);
  };

  const handleClearQueue = () => {
    setCrawlQueue([]);
  };

  return (
    <div className="p-4 sm:p-8 bg-background text-foreground min-h-screen w-[600px]">
      <main className="container mx-auto">
        <LeadGenerator onQueueForCrawl={handleQueueForCrawl} />
        <LeadManager 
          queue={crawlQueue} 
          onClearQueue={handleClearQueue}
        />
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;