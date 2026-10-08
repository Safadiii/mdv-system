import { BadgeVariant } from "../types/BadgeVariant";

export const stockStatus = (stock: number): BadgeVariant =>
  stock === 0 ? "critical" : stock <= 5 ? "low" : "healthy";

export const fmt$ = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(n);

export const initials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });