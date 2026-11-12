// Sample test packs for the store page. All titles, prices and numbers are made up for the demo.
export type PackCategory = "SSC" | "Banking" | "Railway" | "Placement";

export interface Pack {
  id: string;
  title: string;
  category: PackCategory;
  tests: number;
  questions: number;
  price: number;
  rating: number;
  sold: number;
  seller: string;
}

export const PACKS: Pack[] = [
  { id: "pk-free-ssc", title: "SSC CGL · Free Starter Pack", category: "SSC", tests: 5, questions: 250, price: 0, rating: 4.5, sold: 1840, seller: "Trigrexam" },
  { id: "pk-ssc-mock", title: "SSC CGL Tier 1 · 20 Full Mocks", category: "SSC", tests: 20, questions: 2000, price: 799, rating: 4.7, sold: 962, seller: "Neha Kapoor" },
  { id: "pk-ssc-quant", title: "Quant Speed Drills · 40 Sectionals", category: "SSC", tests: 40, questions: 1200, price: 499, rating: 4.6, sold: 640, seller: "Imran Qureshi" },
  { id: "pk-bank-prelims", title: "Bank PO Prelims · 15 Mocks", category: "Banking", tests: 15, questions: 1500, price: 699, rating: 4.6, sold: 718, seller: "Rahul Bansal" },
  { id: "pk-free-bank", title: "Banking Awareness · Free Pack", category: "Banking", tests: 6, questions: 300, price: 0, rating: 4.4, sold: 1210, seller: "Suresh Yadav" },
  { id: "pk-rail-cbt1", title: "Railway NTPC CBT-1 · 12 Mocks", category: "Railway", tests: 12, questions: 1200, price: 599, rating: 4.5, sold: 503, seller: "Suresh Yadav" },
  { id: "pk-rail-gk", title: "Railway GK Daily · 30 Quizzes", category: "Railway", tests: 30, questions: 900, price: 299, rating: 4.3, sold: 389, seller: "Suresh Yadav" },
  { id: "pk-place-apt", title: "Placement Aptitude · 25 Tests", category: "Placement", tests: 25, questions: 1500, price: 899, rating: 4.7, sold: 421, seller: "Rahul Bansal" },
  { id: "pk-free-place", title: "Placement · Free English Pack", category: "Placement", tests: 5, questions: 200, price: 0, rating: 4.2, sold: 980, seller: "Priya Menon" },
];
