"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Template } from "@/types";
import { toast } from "sonner";

interface LeadGeneratorProps {
  onQueueForCrawl: (templates: Template[]) => void;
}

export const LeadGenerator = ({ onQueueForCrawl }: LeadGeneratorProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filters, setFilters] = useState({
    sector: "all",
    role: "all",
    location: "all",
    platform: "all",
  });

  useEffect(() => {
    fetch("/data/templates_2025_adv.json")
      .then((res) => res.json())
      .then((data) => setTemplates(data))
      .catch(console.error);
  }, []);

  const uniqueValues = useMemo(() => {
    const sectors = [...new Set(templates.map((t) => t.sector))];
    const roles = [...new Set(templates.map((t) => t.role))];
    const locations = [...new Set(templates.map((t) => t.location))];
    const platforms = [...new Set(templates.map((t) => t.platform))];
    return { sectors, roles, locations, platforms };
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates
      .filter((t) => filters.sector === "all" || t.sector === filters.sector)
      .filter((t) => filters.role === "all" || t.role === filters.role)
      .filter((t) => filters.location === "all" || t.location === filters.location)
      .filter((t) => filters.platform === "all" || t.platform === filters.platform);
  }, [templates, filters]);

  const handleFilterChange = (filterName: keyof typeof filters) => (value: string) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
  };

  const handleOpenTop5 = () => {
    filteredTemplates.slice(0, 5).forEach(template => {
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
        window.open(searchUrl, '_blank');
    });
  };

  const handleQueueForCrawl = () => {
    onQueueForCrawl(filteredTemplates);
    toast.success(`${filteredTemplates.length} queries added to the crawl queue.`);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Targeted Search</CardTitle>
        <CardDescription>Use templates to find high-probability pages with contact info.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <FilterSelect label="Sector" value={filters.sector} options={uniqueValues.sectors} onChange={handleFilterChange("sector")} />
          <FilterSelect label="Role" value={filters.role} options={uniqueValues.roles} onChange={handleFilterChange("role")} />
          <FilterSelect label="Location" value={filters.location} options={uniqueValues.locations} onChange={handleFilterChange("location")} />
          <FilterSelect label="Platform" value={filters.platform} options={uniqueValues.platforms} onChange={handleFilterChange("platform")} />
        </div>
        
        <Separator className="my-4" />

        <h3 className="text-lg font-semibold mb-2">Top 5 Queries</h3>
        <div className="space-y-2 mb-6 min-h-[200px]">
          {filteredTemplates.slice(0, 5).map((template, index) => (
            <div key={index} className="p-3 border rounded-md bg-secondary/50">
              <p className="text-sm font-mono text-primary">{template.query}</p>
              <p className="text-xs text-muted-foreground pt-1">{template.platform} - {template.intent_note}</p>
            </div>
          ))}
          {filteredTemplates.length === 0 && <p className="text-sm text-muted-foreground text-center pt-8">No matching templates found.</p>}
        </div>

        <div className="flex gap-4">
          <Button onClick={handleOpenTop5} disabled={filteredTemplates.length === 0}>Open Top 5</Button>
          <Button variant="secondary" onClick={handleQueueForCrawl} disabled={filteredTemplates.length === 0}>Queue for Crawl</Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface FilterSelectProps {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
}

const FilterSelect = ({ label, value, options, onChange }: FilterSelectProps) => (
    <div className="space-y-1.5">
        <label className="text-sm font-medium">{label}</label>
        <Select onValueChange={onChange} defaultValue="all">
            <SelectTrigger>
                <SelectValue placeholder={`Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {options.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);