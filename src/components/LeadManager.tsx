"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Lead, Template } from "@/types";
import { toCSV } from "@/lib/utils";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface LeadManagerProps {
  queue: Template[];
  leads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
  onClearQueue: () => void;
}

export const LeadManager = ({ queue, leads, onUpdateLeads, onClearQueue }: LeadManagerProps) => {
  
  const handleStartCrawling = () => {
    toast.info("Backend required for crawling", {
      description: "This feature requires a backend to fetch and process web pages. You can add one using Supabase.",
      action: {
        label: "Learn More",
        onClick: () => console.log("Learn more about adding a backend."),
      },
    });
  };

  const handleGenerateMocks = () => {
    const mockLeads: Lead[] = [
      { id: uuidv4(), email: "ceo@techcorp.com", score: 95, domain: "techcorp.com", sourceUrl: "https://techcorp.com/about", firstSeenAt: new Date().toLocaleDateString() },
      { id: uuidv4(), email: "contact@startup.io", score: 82, domain: "startup.io", sourceUrl: "https://startup.io/contact", firstSeenAt: new Date().toLocaleDateString() },
      { id: uuidv4(), email: "jane.doe@example.com", score: 75, domain: "example.com", sourceUrl: "https://example.com/team", firstSeenAt: new Date().toLocaleDateString() },
    ];
    onUpdateLeads([...leads, ...mockLeads]);
    toast.success("Generated 3 mock leads.");
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
          <Button onClick={handleStartCrawling} disabled={queue.length === 0}>Start Crawling</Button>
          <Button variant="outline" onClick={onClearQueue} disabled={queue.length === 0}>Clear Queue</Button>
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Extracted Leads ({leads.length})</h3>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={handleGenerateMocks}>Generate Mock Leads</Button>
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
                    <TableCell><a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{lead.sourceUrl}</a></TableCell>
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