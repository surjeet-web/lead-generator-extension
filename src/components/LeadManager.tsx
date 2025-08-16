"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Lead, Template } from "@/types";
import { toCSV } from "@/lib/utils";
import { toast } from "sonner";

interface LeadManagerProps {
  queue: Template[];
  onClearQueue: () => void;
}

export const LeadManager = ({ queue, onClearQueue }: LeadManagerProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isCrawling, setIsCrawling] = useState(false);

  // Effect to load leads from storage and listen for updates
  useEffect(() => {
    const getLeads = () => {
      chrome.storage.local.get({ leads: [] }, (data) => {
        setLeads(data.leads.sort((a, b) => b.score - a.score));
      });
    };

    getLeads(); // Initial load

    const storageListener = (changes, area) => {
      if (area === 'local' && changes.leads) {
        getLeads(); // Reload on change
      }
    };

    chrome.storage.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  const handleStartCrawling = async () => {
    if (queue.length === 0) return;
    setIsCrawling(true);
    toast.info(`Starting crawl for ${queue.length} queries...`);

    for (const template of queue) {
      let searchUrl;
      switch (template.platform.toLowerCase()) {
        case 'google':
          searchUrl = `https://www.google.com/search?q=${encodeURIComponent(template.query)}`;
          break;
        case 'bing':
          searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(template.query)}`;
          break;
        case 'linkedin':
          searchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(template.query)}`;
          break;
        default:
          searchUrl = `https://www.google.com/search?q=${encodeURIComponent(template.query)}`;
      }
      
      // Open a new tab for the search query
      const tab = await chrome.tabs.create({ url: searchUrl, active: false });
      
      // Give the page a moment to load before closing
      await new Promise(resolve => setTimeout(resolve, 5000)); 
      
      // The content script runs automatically, so we just close the tab
      if (tab.id) {
        await chrome.tabs.remove(tab.id);
      }
    }

    setIsCrawling(false);
    toast.success("Crawl finished!");
    onClearQueue();
  };

  const handleExport = () => {
    if (leads.length === 0) {
      toast.error("No leads to export.");
      return;
    }
    const csvContent = toCSV(leads);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "leads.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Leads exported successfully!");
  };

  const handleClearLeads = () => {
    chrome.storage.local.set({ leads: [] }, () => {
      setLeads([]);
      toast.success("All leads have been cleared.");
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Lead Manager</CardTitle>
        <CardDescription>Manage your crawl queue and export extracted leads.</CardDescription>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">Crawl Queue ({queue.length})</h3>
        <div className="space-y-2 mb-4 p-3 border rounded-md bg-secondary/50 min-h-[100px]">
          {queue.length > 0 ? (
            queue.slice(0, 3).map((template, index) => (
              <p key={index} className="text-sm font-mono text-primary truncate" title={template.query}>{template.query}</p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center pt-8">Queue is empty.</p>
          )}
          {queue.length > 3 && <p className="text-sm text-muted-foreground text-center">...and {queue.length - 3} more.</p>}
        </div>
        <div className="flex gap-4 mb-6">
          <Button onClick={handleStartCrawling} disabled={queue.length === 0 || isCrawling}>
            {isCrawling ? "Crawling..." : "Start Crawling"}
          </Button>
          <Button variant="outline" onClick={onClearQueue} disabled={queue.length === 0 || isCrawling}>Clear Queue</Button>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Extracted Leads ({leads.length})</h3>
          <div className="flex gap-4">
            <Button variant="destructive" onClick={handleClearLeads} disabled={leads.length === 0}>Clear Leads</Button>
            <Button onClick={handleExport} disabled={leads.length === 0}>Export to CSV</Button>
          </div>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="w-[100px]">Score</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length > 0 ? (
                leads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.email}</TableCell>
                    <TableCell>{lead.score}</TableCell>
                    <TableCell>{lead.domain}</TableCell>
                    <TableCell><a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary truncate max-w-[150px] block" title={lead.sourceUrl}>{lead.sourceUrl}</a></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">No leads found yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};