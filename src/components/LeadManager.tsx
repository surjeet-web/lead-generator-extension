"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Lead, Template } from "@/types";
import { toCSV } from "@/lib/utils";
import { toast } from "sonner";

interface LeadManagerProps {
  queue: Template[];
  onClearQueue: () => void;
}

export const LeadManager = ({ queue, onClearQueue }: LeadManagerProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [crawlStatus, setCrawlStatus] = useState("Idle");
  const [crawlProgress, setCrawlProgress] = useState("");

  const isCrawling = crawlStatus === "Crawling";

  // Effect to load leads from storage and listen for updates
  useEffect(() => {
    const getLeads = () => {
      chrome.storage.local.get({ leads: [] }, (data) => {
        setLeads(data.leads.sort((a, b) => b.score - a.score));
      });
    };
    getLeads();
    const storageListener = (changes, area) => {
      if (area === 'local' && changes.leads) getLeads();
    };
    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, []);

  // Effect to listen for crawl status updates from background script
  useEffect(() => {
    const messageListener = (message) => {
      if (message.action === "crawlUpdate") {
        const { status, progress, newLeadsCount } = message.data;
        if (status) setCrawlStatus(status);
        if (progress) setCrawlProgress(progress);
        if (newLeadsCount) toast.success(`Found ${newLeadsCount} new leads!`);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  const handleStartCrawling = () => {
    if (queue.length === 0) return;
    chrome.runtime.sendMessage({ action: "startCrawl", data: queue });
    setCrawlStatus("Crawling");
    setCrawlProgress("Initializing...");
  };

  const handleStopCrawling = () => {
    chrome.runtime.sendMessage({ action: "stopCrawl" });
    setCrawlStatus("Idle");
    setCrawlProgress("");
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
        <div className="flex gap-4 mb-2">
          {!isCrawling ? (
            <Button onClick={handleStartCrawling} disabled={queue.length === 0}>Start Deep Crawl</Button>
          ) : (
            <Button variant="destructive" onClick={handleStopCrawling}>Stop Crawl</Button>
          )}
          <Button variant="outline" onClick={onClearQueue} disabled={queue.length === 0 || isCrawling}>Clear Queue</Button>
        </div>
        {isCrawling && (
          <div className="space-y-1 mt-4">
            <p className="text-sm font-medium text-muted-foreground">{crawlProgress}</p>
            <Progress value={isCrawling ? 100 : 0} className="w-full h-2 animate-pulse" />
          </div>
        )}

        <Separator className="my-6" />

        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Extracted Leads ({leads.length})</h3>
          <div className="flex gap-4">
            <Button variant="outline" size="sm" onClick={handleClearLeads} disabled={leads.length === 0 || isCrawling}>Clear Leads</Button>
            <Button size="sm" onClick={handleExport} disabled={leads.length === 0}>Export to CSV</Button>
          </div>
        </div>
        <div className="border rounded-md max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="w-[100px]">Score</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length > 0 ? (
                leads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.email}</TableCell>
                    <TableCell>{lead.score}</TableCell>
                    <TableCell><a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary truncate max-w-[200px] block" title={lead.sourceUrl}>{lead.sourceUrl}</a></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">No leads found yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};