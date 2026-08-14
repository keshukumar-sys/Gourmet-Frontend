/**
 * The menu catalogue is organised by cuisine/format ("Indian", "Temari",
 * "Mini Sliders"), which is how the kitchen thinks but not how a menu is
 * built. Courses give the picker a top level that matches the conversation
 * a rep actually has with a client: starters, then mains, then dessert.
 *
 * Known categories are mapped explicitly; anything new an admin adds is
 * inferred from keywords, and falls back to "Other" rather than disappearing.
 */

export const COURSES = [
  { id: "all", label: "All" },
  { id: "starters", label: "Starters" },
  { id: "mains", label: "Main Course" },
  { id: "salads", label: "Salads" },
  { id: "desserts", label: "Desserts" },
  { id: "beverages", label: "Beverages" },
  { id: "other", label: "Other" }
];

const EXPLICIT = {
  "appetisers": "starters",
  "appetizers": "starters",
  "chaat": "starters",
  "mini sliders": "starters",
  "wraps and rolls": "starters",
  "sandwiches": "starters",
  "temari": "starters",
  "quiche": "starters",
  "dim sum": "starters",
  "flatbreads": "starters",
  "the antipasti table": "starters",

  "indian": "mains",
  "mediterranean": "mains",
  "oriental": "mains",

  "salad": "salads",
  "salads": "salads",

  "dessert": "desserts",
  "desserts": "desserts",

  "beverages": "beverages",
  "beverage": "beverages"
};

const KEYWORDS = [
  [/dessert|sweet|patisserie|cake|ice ?cream/i, "desserts"],
  [/beverage|drink|cocktail|mocktail|juice|coffee|tea|bar\b/i, "beverages"],
  [/salad/i, "salads"],
  [/main ?course|entree|entrée|curry|biryani|rice|noodle|pasta|grill/i, "mains"],
  [/appetis|appetiz|starter|snack|canap|small plate|finger|tapas|slider|roll|wrap|sandwich|dim sum|antipasti|bread/i, "starters"]
];

/** Which course a catalogue category belongs to. */
export function courseFor(category = "") {
  const key = String(category).trim().toLowerCase();
  if (EXPLICIT[key]) return EXPLICIT[key];

  for (const [pattern, course] of KEYWORDS) {
    if (pattern.test(key)) return course;
  }

  return "other";
}

/** Only the courses that actually have dishes, in canonical order. */
export function availableCourses(dishes = []) {
  const present = new Set(dishes.map((d) => courseFor(d.category)));
  return COURSES.filter((c) => c.id === "all" || present.has(c.id));
}
