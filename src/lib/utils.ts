import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toCSV<T extends object>(rows: T[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof T];
          const stringValue =
            value === null || value === undefined ? "" : String(value);
          return `"${stringValue.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ];
  return csvRows.join("\n");
}