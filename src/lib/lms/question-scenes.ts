/** Contextual scene imagery for LMS questions / scenarios (African enterprise settings). */

export type QuestionScene = {
  imageUrl: string;
  label: string;
  caption: string;
};

const SCENES = {
  port: {
    imageUrl:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",
    label: "Port & customs",
    caption: "Operations teams under pressure at the gate",
  },
  factory: {
    imageUrl:
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=80",
    label: "Plant floor",
    caption: "Leaders balancing schedule, safety and integrity",
  },
  boardroom: {
    imageUrl:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1600&q=80",
    label: "Leadership table",
    caption: "Decisions that set the tone for the whole organisation",
  },
  handshake: {
    imageUrl:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80",
    label: "Partners & deals",
    caption: "Relationships should never replace transparent process",
  },
  market: {
    imageUrl:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=80",
    label: "Market reality",
    caption: "Growth markets reward discipline, not shortcuts",
  },
  office: {
    imageUrl:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80",
    label: "Office floor",
    caption: "Everyday choices in procurement, finance and ops",
  },
  team: {
    imageUrl:
      "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=1600&q=80",
    label: "People at work",
    caption: "Colleagues who speak up protect the enterprise",
  },
  hospitality: {
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    label: "Hospitality",
    caption: "Gifts and entertainment need clear green / amber / red lines",
  },
  city: {
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80",
    label: "City & licences",
    caption: "Officials, renewals and transparent channels",
  },
  finance: {
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1600&q=80",
    label: "Books & records",
    caption: "Accurate expenses and transparent ledgers",
  },
  speakup: {
    imageUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
    label: "Speak up",
    caption: "Safe reporting protects people and the business",
  },
  agent: {
    imageUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1600&q=80",
    label: "Intermediaries",
    caption: "Agents and consultants acting on your behalf",
  },
} as const satisfies Record<string, QuestionScene>;

type SceneKey = keyof typeof SCENES;

const RULES: { key: SceneKey; patterns: RegExp }[] = [
  {
    key: "port",
    patterns: /customs|port|shipment|cargo|clearance|freight|mobile money|handling fee/i,
  },
  {
    key: "hospitality",
    patterns: /gift|hospitality|resort|lunch|ticket|safari|entertainment|branded/i,
  },
  {
    key: "factory",
    patterns: /plant|factory|manufactur|expansion|operations lead|shop floor/i,
  },
  {
    key: "city",
    patterns: /licen[cs]e|ministry|regulator|permit|official|government/i,
  },
  {
    key: "finance",
    patterns: /expense|books|records|invoice|cash|ledger|accounting|miscellaneous/i,
  },
  {
    key: "speakup",
    patterns: /speak.?up|whistle|retaliat|report|confidential/i,
  },
  {
    key: "agent",
    patterns: /agent|intermediar|consultant|third.?party|distributor|commission/i,
  },
  {
    key: "handshake",
    patterns: /procure|tender|supplier|contract|kickback|cousin|family|bidding|award/i,
  },
  {
    key: "boardroom",
    patterns: /leadership|talanton|board|managing director|md\b|tone/i,
  },
  {
    key: "market",
    patterns: /facilitation|bribe|corruption|market|africa/i,
  },
  {
    key: "team",
    patterns: /conflict|colleague|team|employee|staff/i,
  },
];

export function resolveQuestionScene(text: string, seed = 0): QuestionScene {
  const haystack = text || "";
  for (const rule of RULES) {
    if (rule.patterns.test(haystack)) return SCENES[rule.key];
  }
  const keys = Object.keys(SCENES) as SceneKey[];
  return SCENES[keys[Math.abs(seed) % keys.length] ?? "office"];
}

export function sceneForQuestion(options: {
  stem: string;
  id?: string;
  imageUrl?: string | null;
  sceneLabel?: string | null;
}): QuestionScene {
  if (options.imageUrl) {
    return {
      imageUrl: options.imageUrl,
      label: options.sceneLabel || "Scenario",
      caption: options.sceneLabel || "Consider the situation carefully",
    };
  }
  const seed = options.id
    ? Array.from(options.id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    : 0;
  return resolveQuestionScene(options.stem, seed);
}
