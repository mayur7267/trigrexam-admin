// Plans and prices as listed on the Trigrexam pricing page (billed annually, + GST).
export type PlanId = "basic" | "pro" | "business";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  users: number;
  tagline: string;
}

export const PLANS: Plan[] = [
  { id: "basic", name: "Basic", price: 5000, users: 50, tagline: "For a small batch getting started" },
  { id: "pro", name: "Professional", price: 8000, users: 100, tagline: "For growing institutes" },
  { id: "business", name: "Business", price: 15000, users: 250, tagline: "For large institutes and colleges" },
];

// Every plan includes these.
export const INCLUDED = [
  "Unlimited tests",
  "5 free demo tests, unlimited users",
  "Personalized theme",
  "Android and iOS app",
  "No ads",
];

export const rupees = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;
export const planById = (id: PlanId) => PLANS.find((p) => p.id === id)!;

export const recommend = (users: number): Plan | null => PLANS.find((p) => users <= p.users) ?? null;

export const CONTACT = {
  email: "info@trigrexam.com",
  phones: ["+91-9540289135", "8958664808"],
  address: "97/2, Katwaria Sarai, Hauzkhas, New Delhi",
};

export const INVOICES = [
  { no: "INV-2026-0142", date: "14 Mar 2026", plan: "Professional", amount: 8000, status: "Paid" },
  { no: "INV-2025-0118", date: "14 Mar 2025", plan: "Basic", amount: 5000, status: "Paid" },
  { no: "INV-2024-0093", date: "12 Mar 2024", plan: "Basic", amount: 5000, status: "Paid" },
];
