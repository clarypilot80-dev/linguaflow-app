// ── Core types ────────────────────────────────────────────────────────────────

export type PhaseId = 'control' | 'connect' | 'expand';
export type PhaseStatus = 'active' | 'completed' | 'deferred';
export type FunctionTag = 'FLOW_CONTROL' | 'CAUSAL' | 'CONTRAST' | 'PIVOT' | 'CLARIFY' | 'SEQUENCE';
export type Difficulty = 1 | 2 | 3;
export type MasteryLevel = 'locked' | 'new' | 'learning' | 'mastered';
export type Theme = 'light' | 'dark';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

// ── SM-2 Spaced Repetition ────────────────────────────────────────────────────

export interface SM2Stats {
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReviewAt: number; // Unix ms — 0 = due now
}

export function calculateSM2(
  rating: 1 | 2 | 3 | 4 | 5,
  stats: SM2Stats
): SM2Stats {
  const { repetitions, interval, easeFactor } = stats;
  const now = Date.now();
  if (rating < 3) {
    return { repetitions: 0, interval: 1, easeFactor: Math.max(1.3, easeFactor - 0.2), nextReviewAt: now + 86400000 };
  }
  let newInterval: number;
  if (repetitions === 0) newInterval = 1;
  else if (repetitions === 1) newInterval = 6;
  else newInterval = Math.round(interval * easeFactor);
  const newEF = Math.max(1.3, easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)));
  return { repetitions: repetitions + 1, interval: newInterval, easeFactor: newEF, nextReviewAt: now + newInterval * 86400000 };
}

const DEFAULT_SM2: SM2Stats = { repetitions: 0, interval: 0, easeFactor: 2.5, nextReviewAt: 0 };

// ── Bridge (Structural Core) types ────────────────────────────────────────────

export interface Bridge extends SM2Stats {
  id: string;
  phaseId: PhaseId;
  phrase: string;
  phonetic?: string;
  translation: string;
  function: string;
  tag: FunctionTag;
  difficulty: Difficulty;
  examples: Array<{ sentence: string; translation: string }>;
  pitfall?: string;
  mastery: MasteryLevel;
  stars: number;
  audioClickCount: number;
  hesitationDwellTime: number;
}

export interface BridgeDrill {
  id: string;
  phaseId: PhaseId;
  conceptA: { text: string; translation: string };
  conceptB: { text: string; translation: string };
  bridgeId: string;
  fullSentence: string;
  fullTranslation: string;
}

export interface Phase {
  id: PhaseId;
  number: 1 | 2 | 3;
  name: string;
  tagline: string;
  description: string;
  mechanicalPurpose: string;
  color: string;
  accentColor: string;
  bgGradient: string;
  icon: string;
  bridges: Bridge[];
  drills: BridgeDrill[];
}

// ── Content Hierarchy: Collection → Dialogue → Sentence ──────────────────────

export interface Sentence extends SM2Stats {
  id: string;
  index: number;
  text: string;           // target language (e.g. French)
  translation: string;    // English
  phonetic?: string;      // pronunciation guide
  stars: number;          // 0–5 SM-2 self-rating (≥4 = mastered)
  audioClickCount: number;
  hesitationDwellTime: number; // running avg ms from render → Reveal
}

export interface Dialogue {
  id: string;
  title: string;
  description: string;
  icon: string;
  sentences: Sentence[];
}

export interface Collection {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  accentColor: string;
  dialogues: Dialogue[];
}

// ── Conversation Analyzer types ───────────────────────────────────────────────

export interface ConversationSession {
  id: string;
  title: string;
  location: string;
  duration: number;
  transcript: TranscriptLine[];
  bridgeMisses: BridgeMiss[];
  pacingScore: number;
  pronunciationNotes: string[];
  analyzedAt: string;
}

export interface TranscriptLine {
  id: string;
  speaker: 'user' | 'native';
  text: string;
  translation?: string;
  missedBridgeId?: string;
}

export interface BridgeMiss {
  id: string;
  lineId: string;
  description: string;
  suggestedBridge: Bridge;
  improvedSentence: string;
}

// ── Languages ─────────────────────────────────────────────────────────────────

export const LANGUAGES: Language[] = [
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
];

// ── RPG Skill Tree ────────────────────────────────────────────────────────────

export const BRIDGE_TREE: Record<PhaseId, Record<string, string[]>> = {
  control: {
    'p1-b1': ['p1-b3'],
    'p1-b2': ['p1-b4'],
    'p1-b3': ['p1-b5'],
    'p1-b4': ['p1-b6'],
  },
  connect: {
    'p2-b1': ['p2-b2', 'p2-b5', 'p2-b7'],
    'p2-b3': ['p2-b4'],
    'p2-b2': ['p2-b6'],
  },
  expand: {
    'p3-b1': ['p3-b3', 'p3-b7'],
    'p3-b2': ['p3-b5'],
    'p3-b3': ['p3-b4'],
    'p3-b5': ['p3-b6'],
  },
};

// ── Phase 1: Control Mechanisms ───────────────────────────────────────────────

const PHASE1_BRIDGES: Bridge[] = [
  { id: 'p1-b1', phaseId: 'control', phrase: 'Tu peux parler moins vite ?', phonetic: 'too puh par-LAY mwan VEET', translation: "Can you speak a bit slower?", function: "Reduces pace to give you processing time — no panic, just recalibrate.", tag: 'FLOW_CONTROL', difficulty: 1, mastery: 'new', stars: 0, examples: [{ sentence: "Désolé — tu peux parler moins vite ? Je suis encore en train d'apprendre.", translation: "Sorry — can you speak a bit slower? I'm still learning." }, { sentence: "C'est trop rapide pour moi. Tu peux ralentir un peu ?", translation: "That's too fast for me. Can you slow down a bit?" }], pitfall: "\"Pourriez-vous\" sounds stiff in casual conversation. \"Tu peux\" lands naturally with anyone under 40.", ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p1-b2', phaseId: 'control', phrase: 'Je comprends pas ce mot-là.', phonetic: 'zhuh kom-PRON pah suh MO-lah', translation: "I don't get that word.", function: "Pins a single unknown word mid-conversation without shutting the whole exchange down.", tag: 'CLARIFY', difficulty: 1, mastery: 'new', stars: 0, examples: [{ sentence: "Je comprends pas ce mot-là — \"dépaysement\", ça veut dire quoi ?", translation: "I don't get that word — \"dépaysement\", what does that mean?" }], pitfall: "Dropping \"ne\" (\"je comprends pas\" vs \"je ne comprends pas\") is standard casual French — not a mistake.", ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p1-b3', phaseId: 'control', phrase: 'Tu peux répéter ?', phonetic: 'too puh ray-pay-TAY', translation: "Can you say that again?", function: "Gets you a second pass at something you missed — zero embarrassment.", tag: 'FLOW_CONTROL', difficulty: 1, mastery: 'locked', stars: 0, examples: [{ sentence: "Pardon — tu peux répéter ? J'ai pas bien entendu.", translation: "Sorry — can you say that again? I didn't quite catch it." }], ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p1-b4', phaseId: 'control', phrase: 'Ça se dit comment… en français ?', phonetic: 'sah suh dee koh-MON… on fron-SAY', translation: "How do you say… in French?", function: "Acquires vocabulary on the spot, live from a native speaker.", tag: 'CLARIFY', difficulty: 1, mastery: 'locked', stars: 0, examples: [{ sentence: "Ça se dit comment \"sidewalk\" en français ?", translation: "How do you say \"sidewalk\" in French?" }], ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p1-b5', phaseId: 'control', phrase: "Tu peux l'écrire ?", phonetic: "too puh lay-KREER", translation: "Can you write it down?", function: "Converts heard speech to visible text when audio comprehension breaks down.", tag: 'CLARIFY', difficulty: 2, mastery: 'locked', stars: 0, examples: [{ sentence: "Ce nom est chelou pour moi — tu peux l'écrire ?", translation: "That name is strange to me — can you write it down?" }], ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p1-b6', phaseId: 'control', phrase: 'Tu veux dire quoi exactement ?', phonetic: 'too vuh DEER kwah eg-zakt-MON', translation: "What exactly do you mean?", function: "Requests a conceptual explanation — signals engagement rather than raw confusion.", tag: 'CLARIFY', difficulty: 2, mastery: 'locked', stars: 0, examples: [{ sentence: "C'est intéressant — mais tu veux dire quoi exactement par \"typiquement français\" ?", translation: "That's interesting — but what exactly do you mean by \"typically French\"?" }], pitfall: "\"Grave\" here means \"for real\"/\"seriously\". Very common casual filler.", ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
];

const PHASE1_DRILLS: BridgeDrill[] = [
  { id: 'p1-d1', phaseId: 'control', conceptA: { text: 'Le train arrive à dix-sept heures.', translation: 'The train arrives at 5 PM.' }, conceptB: { text: '[blank] — vous parlez trop vite.', translation: '[blank] — you\'re speaking too fast.' }, bridgeId: 'p1-b1', fullSentence: 'Le train arrive à dix-sept heures — tu peux parler moins vite ?', fullTranslation: 'The train arrives at 5 PM — can you speak a bit slower?' },
  { id: 'p1-d2', phaseId: 'control', conceptA: { text: "C'est à côté de la mairie.", translation: "It's next to the town hall." }, conceptB: { text: '« La mairie » — [blank].', translation: '"La mairie" — [blank].' }, bridgeId: 'p1-b2', fullSentence: "C'est à côté de la mairie — je comprends pas ce mot-là.", fullTranslation: "It's next to the town hall — I don't get that word." },
];

// ── Phase 2: Logical Connectors ───────────────────────────────────────────────

const PHASE2_BRIDGES: Bridge[] = [
  { id: 'p2-b1', phaseId: 'connect', phrase: 'À cause de…', phonetic: 'ah KOHZ duh', translation: 'Because of…', function: "Establishes a causal link between an outcome and an external factor.", tag: 'CAUSAL', difficulty: 1, mastery: 'new', stars: 0, examples: [{ sentence: "Je suis en retard à cause du trafic — c'est de ouf là-bas.", translation: "I'm late because of traffic — it's insane out there." }], pitfall: "\"À cause de\" carries negative/neutral connotation. Use \"grâce à\" when the cause is positive.", ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p2-b2', phaseId: 'connect', phrase: 'Ce qui veut dire que…', phonetic: 'suh kee vuh DEER kuh', translation: 'Which means that…', function: "Draws a logical conclusion from what was just said.", tag: 'CAUSAL', difficulty: 2, mastery: 'locked', stars: 0, examples: [{ sentence: "Le magasin ferme à dix-huit heures, ce qui veut dire qu'on doit partir maintenant.", translation: "The shop closes at 6 PM, which means we need to leave now." }], ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p2-b3', phaseId: 'connect', phrase: 'Au lieu de…', phonetic: 'oh LYUH duh', translation: 'Instead of…', function: "Contrasts what happened vs. what was expected.", tag: 'CONTRAST', difficulty: 1, mastery: 'new', stars: 0, examples: [{ sentence: "Au lieu de prendre le bus, j'ai décidé de marcher — c'était carré.", translation: "Instead of taking the bus, I decided to walk — it was spot on." }], pitfall: "\"C'est carré\" = it's sorted/spot-on. A solid street French affirmation.", ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p2-b4', phaseId: 'connect', phrase: 'Malgré…', phonetic: 'mal-GRAY', translation: 'Despite…', function: "Acknowledges an obstacle while asserting it didn't prevent the outcome.", tag: 'CONTRAST', difficulty: 2, mastery: 'locked', stars: 0, examples: [{ sentence: "Malgré la fatigue, j'ai continué — pas le choix.", translation: "Despite the tiredness, I carried on — no choice." }], pitfall: "\"Malgré\" is a preposition — must be followed by a noun/pronoun, never directly by a verb.", ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p2-b5', phaseId: 'connect', phrase: 'De sorte que…', phonetic: 'duh SORT kuh', translation: 'So that… / In such a way that…', function: "States the intended outcome or result of an action.", tag: 'CAUSAL', difficulty: 3, mastery: 'locked', stars: 0, examples: [{ sentence: "Il a parlé doucement, de sorte que tout le monde puisse l'entendre.", translation: "He spoke softly, so that everyone could hear him." }], ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p2-b6', phaseId: 'connect', phrase: 'Par conséquent…', phonetic: 'par kon-say-KON', translation: 'As a result… / Therefore…', function: "Signals a formal logical consequence — precise and deliberate.", tag: 'CAUSAL', difficulty: 2, mastery: 'locked', stars: 0, examples: [{ sentence: "Il pleuvait de ouf ; par conséquent, le match a été annulé.", translation: "It was raining like crazy; as a result, the match was cancelled." }], pitfall: "\"Par conséquent\" is more formal than \"du coup\" — both mean \"as a result\" but \"du coup\" is what you'll hear in the street.", ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p2-b7', phaseId: 'connect', phrase: 'Du coup…', phonetic: 'doo KOO', translation: 'So… / As a result… / And then…', function: "The most-used casual consequence connector in modern spoken French.", tag: 'SEQUENCE', difficulty: 1, mastery: 'locked', stars: 0, examples: [{ sentence: "Il était pas là, du coup j'ai laissé un message.", translation: "He wasn't there, so I left a message." }], pitfall: "Native speakers use \"du coup\" constantly — sometimes as pure filler. Mastering it sounds effortlessly native.", ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
];

const PHASE2_DRILLS: BridgeDrill[] = [
  { id: 'p2-d1', phaseId: 'connect', conceptA: { text: 'Je suis arrivé en retard.', translation: 'I arrived late.' }, conceptB: { text: 'Le trafic était de ouf.', translation: 'The traffic was insane.' }, bridgeId: 'p2-b1', fullSentence: "Je suis arrivé en retard à cause du trafic — c'était de ouf.", fullTranslation: "I arrived late because of the traffic — it was insane." },
  { id: 'p2-d2', phaseId: 'connect', conceptA: { text: "J'ai pris le taxi.", translation: 'I took the taxi.' }, conceptB: { text: "J'aurais pu prendre le métro.", translation: 'I could have taken the metro.' }, bridgeId: 'p2-b3', fullSentence: "Au lieu de prendre le métro, j'ai pris le taxi.", fullTranslation: "Instead of taking the metro, I took the taxi." },
  { id: 'p2-d3', phaseId: 'connect', conceptA: { text: "Il était pas là.", translation: "He wasn't there." }, conceptB: { text: "J'ai laissé un message.", translation: "I left a message." }, bridgeId: 'p2-b7', fullSentence: "Il était pas là, du coup j'ai laissé un message.", fullTranslation: "He wasn't there, so I left a message." },
];

// ── Phase 3: Topic Expanders ──────────────────────────────────────────────────

const PHASE3_BRIDGES: Bridge[] = [
  { id: 'p3-b1', phaseId: 'expand', phrase: 'En parlant de ça…', phonetic: 'on par-LON duh SAH', translation: 'Speaking of that…', function: "Natural pivot to a related topic — uses what was just said as a springboard.", tag: 'PIVOT', difficulty: 1, mastery: 'new', stars: 0, examples: [{ sentence: "On a visité le Louvre. En parlant de ça, t'as déjà vu la Joconde en vrai ?", translation: "We visited the Louvre. Speaking of that, have you ever seen the Mona Lisa in person?" }], ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p3-b2', phaseId: 'expand', phrase: 'Pour changer de sujet…', phonetic: 'poor shon-ZHAY duh soo-ZHAY', translation: 'To change the subject…', function: "A transparent pivot — steer toward topics where your vocabulary is strongest.", tag: 'PIVOT', difficulty: 1, mastery: 'new', stars: 0, examples: [{ sentence: "C'est compliqué. Pour changer de sujet — t'as pensé quoi du resto hier soir ?", translation: "It's complicated. To change the subject — what did you think of the restaurant last night?" }], pitfall: "Being transparent signals self-awareness, not weakness. Native speakers do this too.", ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p3-b3', phaseId: 'expand', phrase: "D'ailleurs…", phonetic: 'dah-YEUR', translation: 'By the way… / Besides…', function: "Introduces a tangential thought without breaking flow.", tag: 'PIVOT', difficulty: 2, mastery: 'locked', stars: 0, examples: [{ sentence: "C'est un bon hôtel. D'ailleurs, mon pote y a séjourné l'été dernier.", translation: "It's a good hotel. By the way, my mate stayed there last summer." }], ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p3-b4', phaseId: 'expand', phrase: 'Ça me rappelle que…', phonetic: 'sah muh rah-PEL kuh', translation: 'That reminds me that…', function: "Introduces a related memory or fact — creates warmth and connection.", tag: 'PIVOT', difficulty: 2, mastery: 'locked', stars: 0, examples: [{ sentence: "Ce quartier est de ouf. Ça me rappelle que j'ai lu un bouquin sur l'histoire de ce coin de Paris.", translation: "This neighbourhood is wild. That reminds me that I read a book about the history of this part of Paris." }], ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p3-b5', phaseId: 'expand', phrase: 'Si on parlait de… ?', phonetic: 'see on par-LAY duh', translation: 'What if we talked about… ?', function: "Gently proposes a new topic — steers toward your vocabulary comfort zone.", tag: 'PIVOT', difficulty: 1, mastery: 'locked', stars: 0, examples: [{ sentence: "C'est fascinant. Si on parlait de la bouffe régionale plutôt ?", translation: "That's fascinating. What if we talked about regional food instead?" }], ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p3-b6', phaseId: 'expand', phrase: 'À ce propos…', phonetic: 'ah suh pro-PO', translation: 'On that note… / In that regard…', function: "Links the current topic to a broader point — signals intellectual engagement.", tag: 'SEQUENCE', difficulty: 3, mastery: 'locked', stars: 0, examples: [{ sentence: "La culture française est riche. À ce propos, t'as remarqué comment les repas durent plus longtemps ici ?", translation: "French culture is rich. On that note, have you noticed how meals last much longer here?" }], ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
  { id: 'p3-b7', phaseId: 'expand', phrase: 'Franchement…', phonetic: 'fronsh-MON', translation: 'Honestly… / Frankly…', function: "Opens a candid opinion — signals authenticity and directness.", tag: 'PIVOT', difficulty: 1, mastery: 'locked', stars: 0, examples: [{ sentence: "Franchement, je m'attendais pas à ça — c'est de ouf.", translation: "Honestly, I wasn't expecting that — it's insane." }], pitfall: "\"Franchement\" = \"look, real talk…\" — more direct than a formal \"frankly\". Use it to sound natural.", ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0 },
];

const PHASE3_DRILLS: BridgeDrill[] = [
  { id: 'p3-d1', phaseId: 'expand', conceptA: { text: 'On a visité le château de Versailles.', translation: 'We visited the Palace of Versailles.' }, conceptB: { text: 'Le jardin du Palais-Royal est aussi de ouf.', translation: 'The Palais-Royal garden is also incredible.' }, bridgeId: 'p3-b1', fullSentence: "On a visité le château de Versailles. En parlant de ça, le jardin du Palais-Royal est aussi de ouf.", fullTranslation: "We visited the Palace of Versailles. Speaking of that, the Palais-Royal garden is also incredible." },
  { id: 'p3-d2', phaseId: 'expand', conceptA: { text: "C'est vraiment chelou comme situation.", translation: "It's a really strange situation." }, conceptB: { text: "Je m'attendais pas à ça.", translation: "I wasn't expecting that." }, bridgeId: 'p3-b7', fullSentence: "Franchement, c'est vraiment chelou comme situation — je m'attendais pas à ça.", fullTranslation: "Honestly, it's a really strange situation — I wasn't expecting that." },
];

// ── Phases registry ───────────────────────────────────────────────────────────

export const PHASES: Phase[] = [
  { id: 'control', number: 1, name: 'Control Mechanisms', tagline: 'Emergency Brakes', description: 'Phrases that control the flow, pace, and input of the native speaker.', mechanicalPurpose: 'Eliminates conversational panic. Lets you acquire new vocabulary in real-time by requesting clarification mid-conversation — naturally.', color: '#f59e0b', accentColor: '#fbbf24', bgGradient: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)', icon: '🛑', bridges: PHASE1_BRIDGES, drills: PHASE1_DRILLS },
  { id: 'connect', number: 2, name: 'Logical Connectors', tagline: 'Bridge Builder', description: 'Words that establish cause, effect, and contrast to link simple ideas.', mechanicalPurpose: 'Elevates you from fragmented sentences to demonstrating intellectual flow — the difference between tourist-speak and real fluency.', color: '#3b82f6', accentColor: '#60a5fa', bgGradient: 'linear-gradient(135deg, #1e3a5f 0%, #0c1a2e 100%)', icon: '⛓', bridges: PHASE2_BRIDGES, drills: PHASE2_DRILLS },
  { id: 'expand', number: 3, name: 'Topic Expanders', tagline: 'Conversation Steering', description: 'Phrases designed to pivot the conversation and maintain engagement.', mechanicalPurpose: 'Prevents conversational dead ends. Steers discussions toward topics where your vocabulary is strongest — you control the room.', color: '#10b981', accentColor: '#34d399', bgGradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', icon: '🧭', bridges: PHASE3_BRIDGES, drills: PHASE3_DRILLS },
];

// ── The Core 100: Collections → Dialogues → Sentences ────────────────────────
// High-frequency, authentic spoken French — zero tourist content.
// Mastery = stars >= 4. Collection N+1 unlocks at 80% mastery of Collection N.

const makeSentence = (id: string, index: number, text: string, translation: string, phonetic?: string): Sentence => ({
  id, index, text, translation, phonetic,
  stars: 0, ...DEFAULT_SM2, audioClickCount: 0, hesitationDwellTime: 0,
});

export const COLLECTIONS: Collection[] = [
  {
    id: 'phase-1-engine',
    name: 'Phase 1: The Engine',
    subtitle: 'Base States & Movement',
    description: 'Focus exclusively on the present tense of Être (to be), Avoir (to have), Faire (to do/make), and Aller (to go).',
    icon: '⚙️',
    color: '#6366f1',
    accentColor: '#818cf8',
    dialogues: [
      {
        id: 'dial-state-possession',
        title: 'State & Possession',
        description: 'Être and Avoir base states.',
        icon: '🧘',
        sentences: [
          makeSentence('c1-s1', 1, "Je suis fatigué.", "I am tired.", "zhuh swee fah-tee-gay"),
          makeSentence('c1-s2', 2, "Tu es prêt ?", "Are you ready?", "too ay pray"),
          makeSentence('c1-s3', 3, "C'est important.", "It is important.", "say am-por-ton"),
          makeSentence('c1-s4', 4, "C'est pas grave.", "It's no big deal.", "say pah grahv"),
          makeSentence('c1-s5', 5, "J'ai besoin de ça.", "I need that.", "zhay buh-zwan duh sah"),
          makeSentence('c1-s6', 6, "Tu as le temps ?", "Do you have time?", "too ah luh ton"),
          makeSentence('c1-s7', 7, "J'ai chaud.", "I am hot.", "zhay sho"),
          makeSentence('c1-s8', 8, "On est d'accord.", "We agree.", "on ay dah-kor"),
          makeSentence('c1-s9', 9, "Ils ont raison.", "They are right.", "eel-zon ray-zon"),
          makeSentence('c1-s10', 10, "C'est pas pour moi.", "It's not for me.", "say pah poor mwah"),
          makeSentence('c1-s11', 11, "J'ai faim.", "I'm hungry.", "zhay fan"),
          makeSentence('c1-s12', 12, "Tu es sûr ?", "Are you sure?", "too ay soor"),
          makeSentence('c1-s13', 13, "C'est trop cher.", "It's too expensive.", "say tro shair"),
          makeSentence('c1-s14', 14, "J'ai envie de ça.", "I feel like doing/having that.", "zhay an-vee duh sah"),
          makeSentence('c1-s15', 15, "C'est pas loin.", "It's not far.", "say pah lwan"),
        ],
      },
      {
        id: 'dial-action-movement',
        title: 'Action & Movement',
        description: 'Faire and Aller present tense actions.',
        icon: '🏃',
        sentences: [
          makeSentence('c1-s16', 1, "Je vais faire ça.", "I'm going to do that.", "zhuh vay fair sah"),
          makeSentence('c1-s17', 2, "Tu vas où ?", "Where are you going?", "too vah oo"),
          makeSentence('c1-s18', 3, "Je vais m'entraîner.", "I am going to train.", "zhuh vay man-treh-nay"),
          makeSentence('c1-s19', 4, "Qu'est-ce que tu fais ?", "What are you doing?", "kes-kuh too fay"),
          makeSentence('c1-s20', 5, "Je pars pour Paris demain.", "I am leaving for Paris tomorrow.", "zhuh par poor pah-ree duh-man"),
          makeSentence('c1-s21', 6, "Je vais voir.", "I'm going to see.", "zhuh vay vwar"),
          makeSentence('c1-s22', 7, "Tu fais quoi ce soir ?", "What are you doing tonight?", "too fay kwah suh swar"),
          makeSentence('c1-s23', 8, "Je vais y aller.", "I'm going to go.", "zhuh vay ee ah-lay"),
          makeSentence('c1-s24', 9, "On fait comme ça.", "Let's do it that way.", "on fay kom sah"),
          makeSentence('c1-s25', 10, "Il fait beau aujourd'hui.", "The weather is nice today.", "eel fay bo o-zhoor-dwee"),
          makeSentence('c1-s26', 11, "Je vais travailler.", "I'm going to work.", "zhuh vay trah-vah-yay"),
          makeSentence('c1-s27', 12, "Tu vas voir.", "You will see.", "too vah vwar"),
          makeSentence('c1-s28', 13, "Je fais de mon mieux.", "I'm doing my best.", "zhuh fay duh mon mee-uh"),
          makeSentence('c1-s29', 14, "On va où maintenant ?", "Where are we going now?", "on vah oo man-tnan"),
          makeSentence('c1-s30', 15, "Ça fait du bien.", "That feels good.", "sah fay doo byan"),
        ],
      },
    ],
  },
  {
    id: 'phase-2-modals',
    name: 'Phase 2: Intent & Obligation',
    subtitle: 'The Modals',
    description: 'Focus strictly on Vouloir (to want), Devoir (to have to/must), and Pouvoir (to be able to/can) combined with Phase 1 verbs.',
    icon: '🎯',
    color: '#ec4899',
    accentColor: '#f472b6',
    dialogues: [
      {
        id: 'dial-volition',
        title: 'Volition (Vouloir)',
        description: 'Expressing desire, willingness, and boundaries.',
        icon: '🔥',
        sentences: [
          makeSentence('v1', 1, "Je veux voir ça.", "I want to see that.", "zhuh vuh vwar sah"),
          makeSentence('v2', 2, "Tu veux quoi ?", "What do you want?", "too vuh kwah"),
          makeSentence('v3', 3, "Je veux bien.", "I'd like to. / I'd love to.", "zhuh vuh byah"),
          makeSentence('v4', 4, "Il veut pas.", "He doesn't want to.", "eel vuh pah"),
          makeSentence('v5', 5, "Si tu veux.", "If you want.", "see too vuh"),
        ],
      },
      {
        id: 'dial-necessity',
        title: 'Necessity (Devoir / Pouvoir)',
        description: 'Establishing rules, capability, and obligation.',
        icon: '⚖️',
        sentences: [
          makeSentence('n1', 1, "Je dois y aller.", "I have to go.", "zhuh dwah ee ah-LAY"),
          makeSentence('n2', 2, "Je peux pas capter.", "I can't understand/get it.", "zhuh puh pah cap-TAY"),
          makeSentence('n3', 3, "Tu peux m'aider ?", "Can you help me?", "too puh may-DAY"),
          makeSentence('n4', 4, "Je dois le faire.", "I have to do it.", "zhuh dwah luh fair"),
          makeSentence('n5', 5, "On peut y aller ?", "Can we go?", "on puh ee ah-LAY"),
        ],
      },
    ],
  },
];

// ── Tag metadata ──────────────────────────────────────────────────────────────

export const TAG_META: Record<FunctionTag, { label: string; color: string; bg: string }> = {
  FLOW_CONTROL: { label: 'Flow Control', color: '#f59e0b', bg: '#78350f22' },
  CAUSAL:       { label: 'Causal',       color: '#3b82f6', bg: '#1e3a5f22' },
  CONTRAST:     { label: 'Contrast',     color: '#8b5cf6', bg: '#4c1d9522' },
  PIVOT:        { label: 'Pivot',        color: '#10b981', bg: '#064e3b22' },
  CLARIFY:      { label: 'Clarify',      color: '#ec4899', bg: '#83183622' },
  SEQUENCE:     { label: 'Sequence',     color: '#6b7280', bg: '#11182722' },
};

export const CEFR_LEVELS = [
  { level: 'A0', label: 'Pre-beginner', color: '#f8fafc', textColor: '#64748b', border: '#e2e8f0' },
  { level: 'A1', label: 'Beginner',     color: '#eff6ff', textColor: '#1d4ed8', border: '#bfdbfe' },
  { level: 'A2', label: 'Elementary',   color: '#f0fdf4', textColor: '#15803d', border: '#bbf7d0' },
  { level: 'B1', label: 'Intermediate', color: '#fffbeb', textColor: '#b45309', border: '#fde68a' },
  { level: 'B2', label: 'Upper Int.',   color: '#faf5ff', textColor: '#7c3aed', border: '#ddd6fe' },
  { level: 'C1', label: 'Advanced',     color: '#fdf2f8', textColor: '#be185d', border: '#fbcfe8' },
];

// ── Conversation Analyzer demo data ──────────────────────────────────────────

export const DEMO_SESSION: ConversationSession = {
  id: 'demo-1',
  title: 'Café interaction — Rue de Rivoli',
  location: 'Paris, France',
  duration: 94,
  analyzedAt: new Date().toISOString(),
  pacingScore: 62,
  pronunciationNotes: [
    'The "r" in "réservation" was good — nice back-of-throat friction.',
    'The nasal in "vin" was slightly over-nasalised — aim lighter.',
    'Word stress on "café" went first syllable — should land on the second.',
  ],
  transcript: [
    { id: 't1', speaker: 'user', text: 'Bonjour, je voudrais une table pour deux personnes.', translation: "Hello, I'd like a table for two." },
    { id: 't2', speaker: 'native', text: 'Bien sûr, vous avez une réservation ?', translation: 'Of course, do you have a reservation?' },
    { id: 't3', speaker: 'user', text: "Non, on a pas de réservation. C'est possible ?", translation: "No, we don't have a reservation. Is it possible?", missedBridgeId: 'p1-b1' },
    { id: 't4', speaker: 'native', text: 'Oui, mais faudra attendre environ vingt minutes. Ça vous convient ?', translation: "Yes, but you'll need to wait about twenty minutes. Does that work?" },
    { id: 't5', speaker: 'user', text: "Oui, d'accord. Merci.", translation: "Yes, that's fine. Thank you.", missedBridgeId: 'p3-b1' },
    { id: 't6', speaker: 'native', text: "Parfait. Je vous appelle dès qu'une table se libère.", translation: "Perfect. I'll call you as soon as a table opens up." },
  ],
  bridgeMisses: [
    { id: 'miss-1', lineId: 't3', description: "The native speaker's response was rapid. A Control Mechanism would have given you processing time.", suggestedBridge: PHASE1_BRIDGES[0], improvedSentence: "Non, on a pas de réservation — tu peux parler moins vite ? C'est possible ?" },
    { id: 'miss-2', lineId: 't5', description: "You closed off the conversation. A Topic Expander would have extended the interaction naturally.", suggestedBridge: PHASE3_BRIDGES[0], improvedSentence: "Oui, d'accord. En parlant de ça, tu peux nous recommander un plat du jour ?" },
  ],
};
