import type { Question } from "../lib/types";

// Small question bank. Quizzes pull from here and are marked automatically.
export const QUESTIONS: Question[] = [
  { id: "q-qa-1", subject: "quant", topic: "Profit and loss", text: "A shopkeeper marks an item 25% above cost and allows a 12% discount. What is his profit percentage?", options: ["8%", "10%", "12.5%", "15%"], answer: 1 },
  { id: "q-qa-2", subject: "quant", topic: "Percentage", text: "Sugar becomes 20% costlier. By what percent should a family cut its use to keep the monthly spend the same?", options: ["15%", "16⅔%", "20%", "25%"], answer: 1 },
  { id: "q-qa-3", subject: "quant", topic: "Percentage", text: "A number is increased by 30% and then decreased by 30%. The net change is:", options: ["No change", "9% decrease", "9% increase", "10% decrease"], answer: 1 },
  { id: "q-qa-4", subject: "quant", topic: "Profit and loss", text: "A sells to B at 20% profit and B sells to C at 25% profit. If C pays ₹900, what did A pay?", options: ["₹540", "₹600", "₹625", "₹650"], answer: 1 },
  { id: "q-qa-5", subject: "quant", topic: "Percentage", text: "A town's population grew 10% in year one and 20% in year two, reaching 26,400. What was it two years ago?", options: ["18,000", "20,000", "22,000", "24,000"], answer: 1 },
  { id: "q-qa-6", subject: "quant", topic: "Number series", text: "Find the next term: 2, 6, 12, 20, 30, ?", options: ["38", "40", "42", "44"], answer: 2 },
  { id: "q-qa-7", subject: "quant", topic: "Time and work", text: "A can finish a job in 12 days and B in 18 days. Working together, how long will they take?", options: ["6 days", "7.2 days", "7.5 days", "8 days"], answer: 1 },
  { id: "q-qa-8", subject: "quant", topic: "Averages", text: "The average of 5 numbers is 24. When one is removed the average becomes 22. What was the number removed?", options: ["30", "32", "34", "36"], answer: 1 },
  { id: "q-qa-9", subject: "quant", topic: "Algebra", text: "What is the sum of the roots of x² − 7x + 12 = 0?", options: ["3", "4", "7", "12"], answer: 2 },
  { id: "q-qa-10", subject: "quant", topic: "Number series", text: "Find the next term: 3, 9, 27, 81, ?", options: ["162", "243", "324", "729"], answer: 1 },

  { id: "q-rs-1", subject: "reasoning", topic: "Syllogism", text: "All pens are books. Some books are bags.\nI. Some pens are bags.  II. Some bags are books.", options: ["Only I follows", "Only II follows", "Both follow", "Neither follows"], answer: 1 },
  { id: "q-rs-2", subject: "reasoning", topic: "Blood relations", text: "Pointing to a man, Rekha says, “He is the son of my mother's only brother.” How is he related to Rekha?", options: ["Brother", "Uncle", "Cousin", "Nephew"], answer: 2 },
  { id: "q-rs-3", subject: "reasoning", topic: "Series", text: "Find the next pair: AZ, BY, CX, ?", options: ["DW", "DV", "EW", "CW"], answer: 0 },
  { id: "q-rs-4", subject: "reasoning", topic: "Coding", text: "If CAT = 24 and DOG = 26 (A = 1, B = 2 …), what is BAT?", options: ["21", "22", "23", "24"], answer: 2 },
  { id: "q-rs-5", subject: "reasoning", topic: "Direction sense", text: "A man walks 5 km north, 3 km east and then 5 km south. How far is he from the start?", options: ["3 km", "5 km", "8 km", "13 km"], answer: 0 },

  { id: "q-en-1", subject: "english", topic: "Vocabulary", text: "Choose the word closest in meaning to CANDID.", options: ["Frank", "Secretive", "Cautious", "Rude"], answer: 0 },
  { id: "q-en-2", subject: "english", topic: "Vocabulary", text: "Choose the word opposite in meaning to SCARCE.", options: ["Rare", "Abundant", "Costly", "Small"], answer: 1 },
  { id: "q-en-3", subject: "english", topic: "Grammar", text: "She has been working here ____ 2019.", options: ["for", "since", "from", "by"], answer: 1 },
  { id: "q-en-4", subject: "english", topic: "Idioms", text: "“To burn the midnight oil” means:", options: ["To waste fuel", "To work or study late at night", "To get angry", "To start a fire"], answer: 1 },
  { id: "q-en-5", subject: "english", topic: "One word", text: "One word for “a person who loves books”:", options: ["Bibliophile", "Philanthropist", "Misanthrope", "Egoist"], answer: 0 },

  { id: "q-ga-1", subject: "ga", topic: "Polity", text: "Who appoints the Governor of an Indian State?", options: ["Chief Minister", "President", "Prime Minister", "Chief Justice"], answer: 1 },
  { id: "q-ga-2", subject: "ga", topic: "Geography", text: "Which river is known as the “Sorrow of Bihar”?", options: ["Gandak", "Kosi", "Son", "Ghaghara"], answer: 1 },
  { id: "q-ga-3", subject: "ga", topic: "Polity", text: "Which Article of the Constitution abolishes untouchability?", options: ["Article 14", "Article 15", "Article 17", "Article 21"], answer: 2 },
  { id: "q-ga-4", subject: "ga", topic: "Science", text: "Which gas is the most abundant in Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Argon"], answer: 1 },
  { id: "q-ga-5", subject: "ga", topic: "Economy", text: "The headquarters of the Reserve Bank of India is in:", options: ["New Delhi", "Kolkata", "Mumbai", "Chennai"], answer: 2 },
];

export const questionById = (id: string) => QUESTIONS.find((q) => q.id === id);
export const questionsFor = (subject: string, n = 5) => QUESTIONS.filter((q) => q.subject === subject).slice(0, n).map((q) => q.id);
