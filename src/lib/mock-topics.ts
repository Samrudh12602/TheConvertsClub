/**
 * Labels each question with a topic so the analysis can say "weak on coding-decoding", not only "weak on reasoning".
 * Plain rules on the question text; first match wins. Anything unmatched falls back to its section name, and the importer can
 * be given an explicit override per question.
 */
const RULES: { topic: string; re: RegExp }[] = [
  // English
  { topic: "Para jumbles", re: /jumbled|correct order|coherent paragraph/i },
  { topic: "Error spotting", re: /contains an error|identify the part of the sentence/i },
  { topic: "Voice (active/passive)", re: /passive voice|active voice/i },
  { topic: "Narration (direct/indirect)", re: /indirect speech|direct speech/i },
  { topic: "Parts of speech", re: /parts of speech/i },
  { topic: "Figures of speech", re: /figure of speech/i },
  { topic: "One-word substitution", re: /one word that can replace|replace the given phrase/i },
  { topic: "Idioms & phrases", re: /\bidiom\b|\bphrase\b.*complete/i },
  { topic: "Antonyms", re: /opposite in meaning|antonym/i },
  { topic: "Synonyms", re: /similar in meaning|synonym|nearest in meaning/i },
  { topic: "Vocabulary in context", re: /fills both blanks|fill in the blank|_{3,}/i },
  { topic: "Reading comprehension", re: /passage|according to the (author|passage)/i },
  // Reasoning
  { topic: "Coding-decoding", re: /code language|is written as|coded as/i },
  { topic: "Courses of action", re: /course[s]? of action/i },
  { topic: "Assumptions", re: /assumptions?\b.*implicit|implicit/i },
  { topic: "Critical reasoning", re: /concluded|weaken|strengthen|argument|which of the following (best|most)/i },
  { topic: "Matrix & figure puzzles", re: /matrix|missing number in the/i },
  { topic: "Syllogisms", re: /\ball\s+\w+\s+are\b|\bsome\s+\w+\s+are\b|\bno\s+\w+\s+is\b/i },
  { topic: "Cause and effect", re: /cause|effect of independent|effects of a common/i },
  { topic: "Inequalities", re: /[≥≤]|statements?:.*[<>=]/ },
  { topic: "Statements & conclusions", re: /conclusion|inference|statements?:/i },
  { topic: "Number & letter series", re: /next term|missing term|series|what comes next|\bnext\b.*\?/i },
  { topic: "Calendar", re: /day of the week|calendar|leap year/i },
  { topic: "Clocks", re: /clock|minute hand|hour hand|minutes past/i },
  { topic: "Directions", re: /\b(north|south|east|west)\b.*(km|metres|meters|turn)/i },
  { topic: "Seating & ordering", re: /\bsits?\b|seated|\brow\b|\bcircle\b|\bfacing\b|\bqueue\b|\brank\b/i },
  { topic: "Blood relations", re: /\b(brother|sister|father|mother|uncle|aunt|nephew|niece|son|daughter)\b/i },
  { topic: "Input-output", re: /input|machine rearranges|step\s*\d/i },
  { topic: "Odd one out", re: /odd one out/i },
  { topic: "Symbols & arrangements", re: /arrangement below|symbols? in the/i },
  { topic: "Logical puzzles", re: /exactly one of|statements? (is|are) true|who (leaked|stole|is lying)|lying/i },
  // Quant & DI
  { topic: "Data sufficiency", re: /sufficient to answer|statement 1|statement i\b/i },
  { topic: "Data interpretation", re: /study the (table|chart|graph)|refer to the table|bar graph|pie chart|line graph/i },
  { topic: "Progressions", re: /arithmetic progression|geometric progression|\bA\.?P\.?\b|\bG\.?P\.?\b|nth term/i },
  { topic: "Trigonometry", re: /\b(sin|cos|tan|sec|cosec|cot)\b/i },
  { topic: "Probability", re: /probab/i },
  { topic: "Permutations & combinations", re: /in how many ways|arranged|permutation|combination|selected from/i },
  { topic: "Time, speed & distance", re: /\btrain\b|km\/h|speed|platform|relative speed|upstream|downstream/i },
  { topic: "Geometry & mensuration", re: /triangle|circle|radius|circumradius|inradius|perimeter|\barea\b|volume|cylinder|cone|sphere|rectangle/i },
  { topic: "Profit, loss & discount", re: /profit|loss|discount|marked price|cost price|selling price/i },
  { topic: "Interest", re: /simple interest|compound interest|per annum/i },
  { topic: "Time & work", re: /\bwork\b.*days|pipe|tap|cistern|alone can/i },
  { topic: "Mixtures & alligation", re: /mixture|alligation|solution|acid|vessel|replaced with water|litres of (pure )?(milk|water)/i },
  { topic: "Averages", re: /\baverage\b|\bmean\b/i },
  { topic: "Percentages & ratios", re: /percent|%|ratio|proportion|average/i },
  { topic: "Number system", re: /divisible|remainder|\bhcf\b|\blcm\b|\bprime\b|\bfactors?\b|digits?/i },
  { topic: "Algebra", re: /equation|roots?|quadratic|polynomial|inequality|\bx\b.*\by\b|1\/x|x[²³]|\|x\s*[−-]|integer values of x/i },
  { topic: "Logarithms & indices", re: /\blog\b|logarithm|index|indices|surd/i },
];

export function topicFor(section: string, text: string, number?: number): string {
  if (/ethic|moral|value/i.test(section)) return "Ethical dilemmas";
  // Check the directions line and the question itself, but not the options (they carry noise like "Only I follows").
  for (const r of RULES) if (r.re.test(text)) return r.topic;
  return section.replace(/&/g, "and").replace(/\s+/g, " ").trim() + (number === undefined ? "" : "");
}

/** The broader skill area a topic belongs to, so a single question doesn't make a "topic" of its own. */
const AREA: Record<string, string> = {
  "Error spotting": "Grammar and usage", "Voice (active/passive)": "Grammar and usage", "Narration (direct/indirect)": "Grammar and usage", "Parts of speech": "Grammar and usage",
  "Vocabulary in context": "Vocabulary", "Idioms & phrases": "Vocabulary", Antonyms: "Vocabulary", Synonyms: "Vocabulary", "One-word substitution": "Vocabulary", "Figures of speech": "Vocabulary",
  "Para jumbles": "Reading and flow", "Reading comprehension": "Reading and flow",
  "Courses of action": "Verbal logic", "Cause and effect": "Verbal logic", "Statements & conclusions": "Verbal logic", Syllogisms: "Verbal logic", Assumptions: "Verbal logic", "Critical reasoning": "Verbal logic", Inequalities: "Verbal logic",
  "Coding-decoding": "Coding, series and patterns", "Number & letter series": "Coding, series and patterns", "Matrix & figure puzzles": "Coding, series and patterns", "Input-output": "Coding, series and patterns", "Odd one out": "Coding, series and patterns", "Symbols & arrangements": "Coding, series and patterns",
  "Seating & ordering": "Arrangements and puzzles", "Logical puzzles": "Arrangements and puzzles", "Blood relations": "Arrangements and puzzles", Directions: "Arrangements and puzzles", Calendar: "Arrangements and puzzles", Clocks: "Arrangements and puzzles",
  "Percentages & ratios": "Arithmetic", Averages: "Arithmetic", "Profit, loss & discount": "Arithmetic", Interest: "Arithmetic", "Time & work": "Arithmetic", "Mixtures & alligation": "Arithmetic", "Time, speed & distance": "Arithmetic",
  Algebra: "Algebra and numbers", Progressions: "Algebra and numbers", "Number system": "Algebra and numbers", "Logarithms & indices": "Algebra and numbers",
  "Geometry & mensuration": "Geometry and trigonometry", Trigonometry: "Geometry and trigonometry",
  "Data interpretation": "Data and counting", "Data sufficiency": "Data and counting", Probability: "Data and counting", "Permutations & combinations": "Data and counting",
  "Ethical dilemmas": "Ethics and values",
};
export const areaFor = (topic: string | null, section: string): string => (topic && AREA[topic]) || section.replace(/&/g, "and").replace(/\s+/g, " ").trim();
