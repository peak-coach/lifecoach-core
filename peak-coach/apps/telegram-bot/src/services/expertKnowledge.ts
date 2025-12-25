// ============================================
// PEAK COACH - Expert Knowledge Base
// ============================================
// Key insights from top books & scientific research
// Used for goal refinement and task generation

export interface ExpertInsight {
  category: string;
  sources: string[];
  principles: string[];
  bestPractices: string[];
  commonMistakes: string[];
  milestoneTemplate: string[];
}

// ============================================
// EXPERTENWISSEN NACH KATEGORIEN
// ============================================

export const EXPERT_KNOWLEDGE: Record<string, ExpertInsight> = {
  
  // ==========================================
  // KOMMUNIKATION & RHETORIK
  // ==========================================
  'rhetorik': {
    category: 'Kommunikation & Rhetorik',
    sources: [
      'K. Anders Ericsson - Deliberate Practice',
      'Chris Anderson - TED Talks',
      'Dale Carnegie - How to Win Friends',
      'Toastmasters International Methods',
    ],
    principles: [
      'Deliberate Practice > passives Lernen (10x effektiver)',
      'Feedback-Loops sind ALLES: Aufnehmen → Analysieren → Verbessern',
      'Micro-Skills isoliert üben: Pausen, Blickkontakt, Gestik, Stimme',
      'Exposure Therapy: Häufigkeit > Perfektion',
      'Struktur: Problem → Lösung → Call-to-Action',
    ],
    bestPractices: [
      'Täglich 5 Min Rede zu beliebigem Thema aufnehmen',
      'Eigene Aufnahmen analysieren (Filler-Words, Pausen, Tempo)',
      'Erfolgreiche Redner studieren & Techniken kopieren',
      'Vor Spiegel üben für Gestik-Bewusstsein',
      'Toastmasters oder ähnliche Gruppen besuchen',
    ],
    commonMistakes: [
      '❌ Bücher lesen ohne zu üben',
      '❌ Auf "den perfekten Moment" warten',
      '❌ Große Präsentationen ohne kleine Übungen vorher',
      '❌ Keine Aufnahmen von sich selbst machen',
    ],
    milestoneTemplate: [
      'Baseline erstellen: Erste 2-Min Rede aufnehmen & analysieren',
      'Micro-Skill 1: Eine Woche nur Pausen üben',
      'Micro-Skill 2: Eine Woche Blickkontakt üben',
      '5 Reden aufnehmen und Fortschritt dokumentieren',
      'Vor 2-3 Freunden/Familie präsentieren (Feedback holen)',
      'Öffentlich sprechen: Meeting, Toastmasters, oder Event',
      'Finale Präsentation vor Zielpublikum',
    ],
  },

  // ==========================================
  // FITNESS & ABNEHMEN
  // ==========================================
  'fitness': {
    category: 'Fitness & Abnehmen',
    sources: [
      'Tim Ferriss - The 4-Hour Body',
      'James Clear - Atomic Habits',
      'Dr. Andy Galpin - Exercise Science',
      'Dr. Peter Attia - Longevity',
    ],
    principles: [
      'Krafttraining > Cardio für Fettabbau (erhöht Grundumsatz)',
      'Progressive Overload: Stetige Steigerung ist der Schlüssel',
      'Protein 1.6-2.2g/kg Körpergewicht für Muskelerhalt',
      'Schlaf ist #1 für Recovery und Hormonbalance',
      'NEAT (Alltagsbewegung) oft wichtiger als Gym',
      'Minimum Effective Dose: 2-3x Training/Woche reicht',
    ],
    bestPractices: [
      'Compound Movements priorisieren: Squats, Deadlifts, Bench, Rows',
      'Trainingslog führen (Gewichte, Reps, Sets)',
      'Moderate Kaloriendefizite (300-500kcal) sind nachhaltig',
      'Protein bei jeder Mahlzeit',
      '10.000 Schritte täglich als Baseline',
    ],
    commonMistakes: [
      '❌ Nur Cardio für Fettabbau',
      '❌ Zu aggressive Diäten (>1000kcal Defizit)',
      '❌ Training ohne Tracking/Progression',
      '❌ Schlaf vernachlässigen',
    ],
    milestoneTemplate: [
      'Baseline: Aktuelle Werte messen (Gewicht, Maße, Kraftwerte)',
      'Gym-Routine etablieren: 3x/Woche für 4 Wochen',
      'Ernährung tracken: 2 Wochen Kalorientracking',
      'Erste Kraftziele: +10% bei Hauptübungen',
      'Habit gefestigt: 12 Wochen konsistentes Training',
      'Zielwerte erreicht (Gewicht/Kraft/Aussehen)',
    ],
  },

  // ==========================================
  // PRODUKTIVITÄT & KARRIERE
  // ==========================================
  'karriere': {
    category: 'Produktivität & Karriere',
    sources: [
      'Cal Newport - Deep Work',
      'Greg McKeown - Essentialism',
      'Gary Keller - The One Thing',
      'David Allen - Getting Things Done',
    ],
    principles: [
      'Deep Work: 90-Min Fokusblöcke ohne Ablenkung',
      'Eat the Frog: Wichtigstes zuerst (morgens)',
      'Pareto: 20% der Arbeit = 80% der Ergebnisse',
      'Single-Tasking > Multi-Tasking',
      'Die ONE Thing Frage: "Was ist das EINE, das alles andere einfacher macht?"',
      'Essentialism: Weniger aber besser',
    ],
    bestPractices: [
      'Morgenroutine: Erste 2-3h für wichtigste Arbeit',
      'Timeblocking: Kalender für Deep Work reservieren',
      'Batch Processing: Ähnliche Aufgaben zusammen',
      'Weekly Review: Wöchentliche Reflexion & Planung',
      'Email nur 2x täglich checken',
    ],
    commonMistakes: [
      '❌ Reaktiver statt proaktiver Arbeitsstil',
      '❌ Keine Priorisierung (alles ist "wichtig")',
      '❌ Meetings ohne klare Agenda',
      '❌ Ständig erreichbar sein',
    ],
    milestoneTemplate: [
      'Audit: Eine Woche Zeit tracken (wo geht Zeit hin?)',
      'Fokus-Zeit blocken: Täglich 2h Deep Work',
      'Ablenkungen eliminieren: Phone-free Arbeitszeiten',
      'Weekly Review etablieren',
      'Wichtigstes Projekt identifizieren & priorisieren',
      'Karriereziel definieren & Roadmap erstellen',
    ],
  },

  // ==========================================
  // FINANZEN
  // ==========================================
  'finanzen': {
    category: 'Finanzen & Vermögen',
    sources: [
      'Morgan Housel - Psychology of Money',
      'Ramit Sethi - I Will Teach You To Be Rich',
      'JL Collins - Simple Path to Wealth',
      'Robert Kiyosaki - Rich Dad Poor Dad',
    ],
    principles: [
      'Pay Yourself First: Sparen automatisieren',
      'Einnahmen erhöhen > Ausgaben kürzen',
      'Compound Interest: Zeit im Markt > Timing',
      'Investieren ist langweilig (und das ist gut)',
      'Emergency Fund: 3-6 Monate Ausgaben',
      'Assets kaufen, Liabilities vermeiden',
    ],
    bestPractices: [
      'Automatische Sparrate: Min. 10-20% vom Netto',
      '50/30/20 Regel: Needs/Wants/Savings',
      'Breit diversifizierte ETFs für Langzeit',
      'Lifestyle Inflation vermeiden',
      'Einkommensströme diversifizieren',
    ],
    commonMistakes: [
      '❌ Kein Budget/Überblick über Ausgaben',
      '❌ Lifestyle Inflation bei Gehaltserhöhung',
      '❌ Market Timing versuchen',
      '❌ Kein Emergency Fund',
    ],
    milestoneTemplate: [
      'Überblick: Alle Konten & Ausgaben erfassen',
      'Budget erstellen: 50/30/20 oder ähnlich',
      'Automatisieren: Daueraufträge einrichten',
      'Emergency Fund: Erste 1.000€ sparen',
      'Emergency Fund: 3 Monate Ausgaben',
      'Investieren starten: Erster ETF-Sparplan',
      'Einnahmen erhöhen: Side Income oder Gehaltsverhandlung',
    ],
  },

  // ==========================================
  // LERNEN & SKILLS
  // ==========================================
  'lernen': {
    category: 'Lernen & Skills',
    sources: [
      'Barbara Oakley - Learning How to Learn',
      'K. Anders Ericsson - Peak',
      'Josh Kaufman - The First 20 Hours',
      'Ultralearning - Scott Young',
    ],
    principles: [
      'Active Recall > passives Lesen (3x effektiver)',
      'Spaced Repetition für Langzeitgedächtnis',
      'Deliberate Practice: Gezielt Schwächen üben',
      'Feynman Technik: Erkläre es einem Kind',
      'Interleaving: Themen mischen statt blocken',
      '20-Stunden-Regel: Basics in 20h fokussiertem Üben',
    ],
    bestPractices: [
      'Pomodoro: 25 Min fokus, 5 Min Pause',
      'Nach dem Lernen: Ohne Notizen zusammenfassen',
      'Anki/Flashcards für Fakten',
      'Projekt-basiertes Lernen: Sofort anwenden',
      'Lehre anderen was du lernst',
    ],
    commonMistakes: [
      '❌ Passives Highlighten/Lesen',
      '❌ Cramming statt Spacing',
      '❌ Nur konsumieren, nie produzieren',
      '❌ Keine Anwendung des Gelernten',
    ],
    milestoneTemplate: [
      'Ziel definieren: Was genau will ich können?',
      'Ressourcen sammeln: Top 3 Quellen identifizieren',
      'Grundlagen: Erste 20h fokussiertes Lernen',
      'Erstes Projekt: Wissen praktisch anwenden',
      'Feedback holen: Von Experten oder Community',
      'Vertiefen: Schwächen gezielt üben',
      'Meistern: Anderen beibringen',
    ],
  },

  // ==========================================
  // GEWOHNHEITEN & MINDSET
  // ==========================================
  'gewohnheiten': {
    category: 'Gewohnheiten & Mindset',
    sources: [
      'James Clear - Atomic Habits',
      'BJ Fogg - Tiny Habits',
      'Charles Duhigg - The Power of Habit',
      'Carol Dweck - Mindset',
    ],
    principles: [
      '1% besser jeden Tag = 37x besser in einem Jahr',
      'Habit Stacking: Neue Gewohnheit an bestehende knüpfen',
      'Implementation Intentions: "Wenn X, dann Y"',
      '2-Minuten-Regel: Starte mit winziger Version',
      'Environment Design > Willenskraft',
      'Identity-Based Habits: Werde die Person, die X tut',
    ],
    bestPractices: [
      'Trigger → Routine → Belohnung verstehen',
      'Gewohnheit sichtbar, attraktiv, einfach, befriedigend machen',
      'Habit Tracking: Kette nicht brechen',
      'Accountability Partner finden',
      'Nach Rückfall sofort wieder starten',
    ],
    commonMistakes: [
      '❌ Zu viele Gewohnheiten gleichzeitig starten',
      '❌ Auf Motivation warten',
      '❌ Keine klaren Trigger definieren',
      '❌ Nach einem Ausrutscher komplett aufgeben',
    ],
    milestoneTemplate: [
      'Eine Gewohnheit auswählen (die wichtigste)',
      'Trigger definieren: Wann genau?',
      '2-Minuten-Version starten',
      '7 Tage Streak erreichen',
      '30 Tage Streak erreichen',
      'Gewohnheit steigern (Zeit/Intensität)',
      'Nächste Gewohnheit hinzufügen',
    ],
  },

  // ==========================================
  // BEZIEHUNGEN & SOZIALES
  // ==========================================
  'beziehungen': {
    category: 'Beziehungen & Soziales',
    sources: [
      'Dale Carnegie - How to Win Friends',
      'Gary Chapman - 5 Love Languages',
      'John Gottman - 7 Principles',
      'Brené Brown - Daring Greatly',
    ],
    principles: [
      'Active Listening: Wirklich zuhören, nicht nur antworten warten',
      'Interesse zeigen > interessant sein',
      '5:1 Ratio: 5 positive Interaktionen auf 1 negative',
      'Quality Time > Quantity',
      'Verletzlichkeit schafft Verbindung',
      'Namen merken und verwenden',
    ],
    bestPractices: [
      'Wöchentliche Quality Time mit wichtigen Menschen',
      'Aktiv Fragen stellen und zuhören',
      'Dankbarkeit und Wertschätzung ausdrücken',
      'Konflikte ansprechen statt vermeiden',
      'Kleine Gesten der Aufmerksamkeit',
    ],
    commonMistakes: [
      '❌ Handy während Gesprächen',
      '❌ Nur über sich selbst reden',
      '❌ Beziehungen als selbstverständlich nehmen',
      '❌ Konflikte vermeiden statt lösen',
    ],
    milestoneTemplate: [
      'Inventar: Wichtigste Beziehungen identifizieren',
      'Quality Time planen: Wöchentlich feste Zeit',
      'Active Listening üben: Eine Woche nur zuhören',
      'Dankbarkeit: Täglich einer Person danken',
      'Tiefere Gespräche: Über Oberflächliches hinaus',
      'Regelmäßige Check-ins etablieren',
    ],
  },

  // ==========================================
  // FÜHRERSCHEIN / PRÜFUNGEN
  // ==========================================
  'fuehrerschein': {
    category: 'Führerschein & Prüfungen',
    sources: [
      'Spaced Repetition Research',
      'Deliberate Practice Theory',
      'Test-Taking Strategies',
    ],
    principles: [
      'Spaced Repetition für Theorie (Apps nutzen!)',
      'Praktische Stunden > nur Theorie',
      'Früh anfangen, regelmäßig üben',
      'Prüfungssimulation unter echten Bedingungen',
      'Schwächen gezielt üben',
    ],
    bestPractices: [
      'Führerschein-App täglich 15-20 Min',
      'Falsche Antworten wiederholen bis 100%',
      'Fahrstunden früh buchen (Wartezeiten!)',
      'Nach jeder Fahrstunde Notizen machen',
      'Prüfungsrouten vorher abfahren',
    ],
    commonMistakes: [
      '❌ Nur Theorie-Buch lesen (keine App)',
      '❌ Zu lange warten mit Anmeldung',
      '❌ Fahrstunden nicht vor-/nachbereiten',
      '❌ Prüfungsangst durch mangelnde Übung',
    ],
    milestoneTemplate: [
      'Fahrschule auswählen und anmelden',
      'Sehtest + Erste-Hilfe-Kurs erledigen',
      'Theorie-App installieren, täglich üben',
      'Erste Fahrstunde absolvieren',
      'Theorie-Prüfung bestehen',
      'Praktische Fahrstunden (Min. 12 Pflicht)',
      'Prüfungsvorbereitung: Sonderfahrten',
      'Praktische Prüfung bestehen',
    ],
  },

  // ==========================================
  // BUSINESS / EIGENES PRODUKT
  // ==========================================
  'business': {
    category: 'Business & Eigenes Produkt',
    sources: [
      'Eric Ries - The Lean Startup',
      'Peter Thiel - Zero to One',
      'Rob Fitzpatrick - The Mom Test',
      'Naval Ravikant - How to Get Rich',
    ],
    principles: [
      'Build → Measure → Learn (schnelle Iterationen)',
      'MVP: Minimum Viable Product zuerst',
      'Talk to customers before building',
      'Ship fast, iterate faster',
      'Solve a real problem (nicht was du cool findest)',
      'Distribution > Product (Marketing ist alles)',
    ],
    bestPractices: [
      '10 potenzielle Kunden interviewen bevor du baust',
      'Landing Page vor dem Produkt',
      'Pre-Sales/Waitlist validiert Nachfrage',
      'Erste Version in 2-4 Wochen shippen',
      'Pricing early: Würden Leute zahlen?',
    ],
    commonMistakes: [
      '❌ Monate in "stealth mode" bauen',
      '❌ Freunde/Familie als Validierung',
      '❌ Features > Problem-Solution Fit',
      '❌ Perfektionismus vor Launch',
    ],
    milestoneTemplate: [
      'Problem identifizieren: Was nervt Leute?',
      '10 Problem-Interviews durchführen',
      'Lösungsidee validieren (würden Leute zahlen?)',
      'MVP in 2 Wochen bauen',
      'Erste 10 User/Kunden gewinnen',
      'Feedback sammeln und iterieren',
      'Ersten Euro verdienen',
      'Product-Market Fit finden',
    ],
  },

  // ==========================================
  // PERSÖNLICHE ENTWICKLUNG
  // ==========================================
  'persoenlich': {
    category: 'Persönliche Entwicklung',
    sources: [
      'Stephen Covey - The 7 Habits of Highly Effective People',
      'Carol Dweck - Mindset',
      'Viktor Frankl - Man\'s Search for Meaning',
      'Jordan Peterson - 12 Rules for Life',
      'Tony Robbins - Awaken the Giant Within',
      'Mark Manson - The Subtle Art of Not Giving a F*ck',
      'Ryan Holiday - The Obstacle Is the Way (Stoizismus)',
    ],
    principles: [
      'Growth Mindset: Fähigkeiten sind entwickelbar, nicht fix',
      'Begin with the End in Mind: Klare Vision haben',
      'Stoizismus: Kontrolliere was du kontrollieren kannst',
      'Radical Responsibility: Du bist für dein Leben verantwortlich',
      'Ikigai: Schnittmenge aus Passion, Mission, Beruf, Berufung',
      'Memento Mori: Zeit ist begrenzt - handle entsprechend',
      'Amor Fati: Liebe dein Schicksal, auch die Hindernisse',
    ],
    bestPractices: [
      'Morning Routine: Journaling, Meditation, Bewegung',
      'Evening Review: Was lief gut? Was kann besser werden?',
      'Wöchentliche Reflexion: Big Picture nicht verlieren',
      'Dankbarkeits-Praxis: 3 Dinge täglich',
      'Bücher lesen: 1 Buch/Monat Minimum',
      'Mentoren suchen: Von den Besten lernen',
      'Comfort Zone verlassen: Regelmäßig neue Dinge tun',
    ],
    commonMistakes: [
      '❌ Konsum ohne Umsetzung (Bücher lesen aber nichts ändern)',
      '❌ Zu viele Ziele gleichzeitig',
      '❌ External Validation suchen statt Internal',
      '❌ Vergleich mit anderen statt mit gestern-Ich',
      '❌ Perfektionismus statt Progress',
    ],
    milestoneTemplate: [
      'Selbstreflexion: Wo stehe ich? Wo will ich hin?',
      'Core Values definieren: Was ist mir wirklich wichtig?',
      'Morning Routine etablieren (30 Tage)',
      'Journaling-Praxis starten',
      '3 Bücher zur persönlichen Entwicklung lesen',
      'Eine große Fear Face: Comfort Zone verlassen',
      'Quarterly Review: Fortschritt messen',
      'Nächstes Level: Größeres Ziel definieren',
    ],
  },

  // ==========================================
  // FITNESS MIT TRT / STEROIDE (250mg Test E)
  // ==========================================
  'trt': {
    category: 'Fitness & Hormonoptimierung (TRT/AAS)',
    sources: [
      'Dr. Andrew Huberman - Huberman Lab Podcast',
      'Derek (More Plates More Dates)',
      'Dr. Peter Attia - Longevity & Performance',
      'Vigorous Steve - Harm Reduction',
      'Renaissance Periodization - Dr. Mike Israetel',
      'r/steroids Wiki - Community Knowledge',
    ],
    principles: [
      '250mg Test E/Woche = Solide TRT+ / Light Cruise Dosis',
      'E2 Management: Bei 250mg meist kein AI nötig, aber monitoren',
      'Injection Frequency: 2x/Woche (E3.5D) für stabilere Werte',
      'Bloodwork ist PFLICHT: Pre-Cycle, 6 Wochen, 12 Wochen',
      'Training: Progressive Overload - Test allein baut keine Muskeln',
      'Cardio: 150+ Min Zone 2/Woche - LVH Prevention!',
      'Blutdruck unter 130/80 halten',
      'Recovery besser, aber Training muss stimmen',
    ],
    bestPractices: [
      'Injection: 125mg E3.5D (z.B. Mo/Do) für stabile Spiegel',
      'Bloodwork checken: Total T, Free T, E2, Hämatokrit, Lipide, Leber, Niere',
      'Hämatokrit >52%? Blutspenden oder Dosis reduzieren',
      'E2 Symptoms (Nippel, Wassereinlagerung)? Erst Bloodwork, dann handeln',
      'Kein AI prophylaktisch - nur bei hohem E2 + Symptomen',
      'Training: PPL oder Upper/Lower, 5-6x/Woche',
      'Protein: 2.2-2.5g/kg bei Aufbau',
      'Cardio: 30 Min Zone 2 an Trainingstagen',
      'Blutdruck täglich messen (morgens)',
      'Supplements: Omega-3, Citrus Bergamot für Lipide',
    ],
    commonMistakes: [
      '❌ Kein Bloodwork vor dem Start',
      '❌ AI (Aromatasehemmer) prophylaktisch nehmen',
      '❌ E2 zu stark crashen (Gelenkschmerzen, Libido weg)',
      '❌ Cardio komplett weglassen (LVH Risiko!)',
      '❌ Denken "Test macht die Arbeit" - Training bleibt wichtig',
      '❌ Zu schnell Dosis erhöhen',
      '❌ Blutdruck ignorieren',
      '❌ Keine PCT Planung wenn Absetzen geplant',
    ],
    milestoneTemplate: [
      'Pre-Cycle Bloodwork: Baseline aller Marker',
      'Start: 250mg Test E, E3.5D Injections',
      'Woche 2-3: Einpegeln, Wohlbefinden tracken',
      'Woche 6: Follow-up Bloodwork (E2, Hämatokrit!)',
      'Training optimieren: Volume hochfahren',
      'Woche 12: Umfassendes Bloodwork',
      'Körperkomposition: Progress Fotos + Messungen',
      'Health Markers: Alle im grünen Bereich?',
    ],
  },

  // ==========================================
  // KI & KÜNSTLICHE INTELLIGENZ
  // ==========================================
  'ki': {
    category: 'KI & Künstliche Intelligenz',
    sources: [
      'Anthropic - Claude Documentation',
      'OpenAI - GPT-4 Best Practices',
      'Andrej Karpathy - AI Education',
      'Simon Willison - AI Engineering',
      'Cursor AI - IDE Integration',
      'Langchain / LlamaIndex - RAG Systems',
    ],
    principles: [
      'Prompting ist eine Skill: Je besser der Prompt, desto besser das Ergebnis',
      'Context is King: Je mehr relevanten Kontext, desto besser',
      'Chain of Thought: AI schrittweise denken lassen',
      'Few-Shot Learning: Beispiele geben für bessere Outputs',
      'AI als Partner, nicht als Ersatz für Denken',
      'Iterieren: Erste Antwort ist selten perfekt',
      'Spezialisierte Tools > General Purpose',
    ],
    bestPractices: [
      'Klare, spezifische Prompts schreiben',
      'Rolle/Persona definieren: "Du bist ein X Experte..."',
      'Output-Format vorgeben (JSON, Markdown, etc.)',
      'Bei komplexen Tasks: Aufgabe in Schritte brechen',
      'Cursor AI für Coding: Kontext durch offene Files',
      'Claude für Reasoning: Längere, komplexere Aufgaben',
      'GPT-4 für kreative Tasks',
      'Perplexity für Research mit Quellen',
      'RAG für eigenes Wissen: Dokumente + Vector DB',
    ],
    commonMistakes: [
      '❌ Vage Prompts ohne Kontext',
      '❌ AI-Output ungeprüft übernehmen',
      '❌ Zu lange Konversationen (Context-Verlust)',
      '❌ Falsches Tool für die Aufgabe',
      '❌ Keine Iteration / First Try = Final',
      '❌ AI für Fakten ohne Verification',
    ],
    milestoneTemplate: [
      'Grundlagen: Prompting Basics verstehen',
      'Tool-Landschaft: Claude, GPT-4, Cursor, Perplexity kennenlernen',
      'Prompting Advanced: Chain of Thought, Few-Shot',
      'Coding mit AI: Cursor/Copilot produktiv nutzen',
      'Eigene Workflows: AI in tägliche Arbeit integrieren',
      'Automatisierung: n8n, Zapier mit AI',
      'RAG: Eigenes Wissen für AI zugänglich machen',
      'AI-First Projekte: Produkte mit AI bauen',
    ],
  },

  // ==========================================
  // PROMPTING & AI ENGINEERING
  // ==========================================
  'prompting': {
    category: 'Prompting & AI Engineering',
    sources: [
      'Anthropic Prompt Engineering Guide',
      'OpenAI Cookbook',
      'Lilian Weng - Prompt Engineering',
      'DAIR.AI - Prompt Engineering Guide',
      'Learn Prompting (learnprompting.org)',
    ],
    principles: [
      'Clarity > Cleverness: Klare Anweisungen schlagen "Tricks"',
      'Be Specific: Details machen den Unterschied',
      'Show, Don\'t Tell: Beispiele > Beschreibungen',
      'Structured Output: Format vorgeben für konsistente Ergebnisse',
      'Role Prompting: Persona gibt Kontext',
      'Chain of Thought: "Denke Schritt für Schritt"',
      'Temperature: 0 für Fakten, 0.7+ für Kreativität',
    ],
    bestPractices: [
      'System Prompt für Kontext/Rolle',
      'User Prompt für spezifische Aufgabe',
      'Beispiele geben (1-3 Examples)',
      '"Let\'s think step by step" für Reasoning',
      'Output-Format definieren (JSON, Markdown, Liste)',
      'Negative Constraints: "Nicht X machen"',
      'Iterieren: Prompt verfeinern basierend auf Output',
      'Prompt Templates für wiederkehrende Tasks',
    ],
    commonMistakes: [
      '❌ Zu vage: "Schreib mir was über X"',
      '❌ Zu viele Aufgaben in einem Prompt',
      '❌ Keine Beispiele bei komplexen Outputs',
      '❌ Format nicht spezifiziert',
      '❌ Kontext fehlt',
      '❌ Nicht iterieren',
    ],
    milestoneTemplate: [
      'Basics: Klare, spezifische Prompts schreiben',
      'Role Prompting: Personas effektiv nutzen',
      'Few-Shot: Beispiele für bessere Outputs',
      'Chain of Thought: Komplexe Reasoning-Aufgaben',
      'Structured Output: JSON/Format Kontrolle',
      'Prompt Templates: Wiederverwendbare Prompts',
      'Evaluation: Prompt-Qualität messen',
      'Production: Prompts in Apps integrieren',
    ],
  },

  // ==========================================
  // SPRACHEN LERNEN
  // ==========================================
  'sprachen': {
    category: 'Sprachen lernen',
    sources: [
      'Stephen Krashen - Input Hypothesis',
      'Benny Lewis - Fluent in 3 Months',
      'Gabriel Wyner - Fluent Forever',
      'Matt vs Japan - Immersion Learning',
      'Refold Method - Immersion-Based Learning',
      'Anki - Spaced Repetition',
    ],
    principles: [
      'Comprehensible Input: Verstehen > Pauken (Krashen)',
      'Immersion ist König: So viel wie möglich hören/lesen',
      'Active Recall + Spaced Repetition (Anki)',
      'Output kommt nach Input: Erst verstehen, dann sprechen',
      'Konsistenz > Intensität: 30 Min täglich > 3h am Wochenende',
      'Fehler sind Teil des Prozesses',
      'Sprache = Skill, nicht Wissen',
    ],
    bestPractices: [
      'Täglich 30+ Min Immersion (Podcasts, YouTube, Netflix)',
      'Anki: 20-30 neue Karten/Tag, Reviews nie skippen',
      'Sentence Mining: Sätze aus Content extrahieren',
      'Shadowing: Muttersprachler nachsprechen',
      'Language Exchange: Tandem Partner finden',
      'Content in Zielsprache konsumieren (Interessen nutzen!)',
      'Früh mit Output starten, aber nicht forcieren',
    ],
    commonMistakes: [
      '❌ Nur Grammatik pauken ohne Input',
      '❌ Perfektionismus beim Sprechen',
      '❌ Zu wenig Immersion (nur Kurs/App)',
      '❌ Vokabeln isoliert lernen (ohne Kontext)',
      '❌ Inkonsistenz: Mal 2h, dann Tage nichts',
      '❌ Zu früh aufgeben (Plateau ist normal)',
    ],
    milestoneTemplate: [
      'Basics: Alphabet, Zahlen, häufigste 100 Wörter',
      'Anki Setup: Deck erstellen, täglich nutzen',
      'Erste Immersion: 30 Min/Tag Content konsumieren',
      'A1: Einfache Sätze verstehen und bilden',
      'Sentence Mining: Erste 500 Sätze gesammelt',
      'A2: Alltagsgespräche führen können',
      'B1: Podcasts/Videos ohne Untertitel verstehen',
      'B2: Fließend über die meisten Themen sprechen',
    ],
  },

  // ==========================================
  // SCHLAF-OPTIMIERUNG
  // ==========================================
  'schlaf': {
    category: 'Schlaf-Optimierung',
    sources: [
      'Dr. Matthew Walker - Why We Sleep',
      'Dr. Andrew Huberman - Sleep Toolkit',
      'Dr. Peter Attia - Sleep Optimization',
      'Nick Littlehales - Sleep Coach (90-Min Zyklen)',
      'Oura Ring / Whoop - Sleep Tracking',
    ],
    principles: [
      'Schlaf ist nicht verhandelbar: 7-9h für Erwachsene',
      '90-Min Schlafzyklen: 5 Zyklen = 7.5h ideal',
      'Zirkadiane Rhythmus: Konsistente Zeiten sind key',
      'Schlafqualität > Schlafdauer (Deep + REM)',
      'Licht kontrolliert alles: Morgens Sonne, abends dunkel',
      'Temperatur: Kühl schlafen (18-19°C)',
      'Schlaf-Schulden existieren - und kosten Performance',
    ],
    bestPractices: [
      'Aufstehzeit fixieren: Jeden Tag gleich (auch Wochenende)',
      'Morgensonne: 10-30 Min direktes Licht nach Aufwachen',
      'Koffein-Cutoff: 10-12h vor dem Schlafen',
      'Alkohol vermeiden: Zerstört REM-Schlaf',
      'Schlafzimmer: Dunkel, kühl, nur fürs Schlafen',
      'Screen-Cutoff: 1-2h vor dem Schlafen',
      'Wind-Down Routine: 30-60 Min vor dem Bett',
      'Tracking: Oura/Whoop für objektive Daten',
    ],
    commonMistakes: [
      '❌ Inkonsistente Schlafzeiten',
      '❌ Blaues Licht bis kurz vor dem Schlafen',
      '❌ Koffein nach 14 Uhr',
      '❌ Alkohol als "Schlafmittel"',
      '❌ Zu warm schlafen',
      '❌ "Ich komme mit 5h aus" (Lüge)',
      '❌ Wochenend-Ausschlafen stört Rhythmus',
    ],
    milestoneTemplate: [
      'Baseline: Aktuelle Schlafgewohnheiten tracken',
      'Fixe Aufstehzeit etablieren (7 Tage konsistent)',
      'Morgensonne-Routine: 10 Min nach Aufwachen',
      'Koffein-Cutoff: Nicht nach 14 Uhr',
      'Schlafzimmer optimieren: Dunkel + kühl',
      'Wind-Down Routine etablieren',
      '2 Wochen: Schlafqualität subjektiv besser?',
      '4 Wochen: Tracking zeigt Verbesserung',
    ],
  },

  // ==========================================
  // PRODUKTIVITÄT
  // ==========================================
  'produktivitaet': {
    category: 'Produktivität & Deep Work',
    sources: [
      'Cal Newport - Deep Work',
      'James Clear - Atomic Habits',
      'David Allen - Getting Things Done (GTD)',
      'Francesco Cirillo - Pomodoro Technique',
      'Tiago Forte - Building a Second Brain',
      'Ali Abdaal - Feel-Good Productivity',
    ],
    principles: [
      'Deep Work > Shallow Work: Fokussierte Arbeit zählt',
      'Energie-Management > Zeit-Management',
      'Eat the Frog: Wichtigstes zuerst',
      'Single-Tasking: Multitasking ist Mythos',
      'Environment Design: Umgebung beeinflusst Verhalten',
      'Weekly Review: Regelmäßige Reflexion',
      'Capture Everything: Gehirn zum Denken, nicht Speichern',
    ],
    bestPractices: [
      'Morning Block: 2-4h Deep Work ohne Unterbrechungen',
      'Pomodoro: 25 Min fokussiert, 5 Min Pause',
      'Time Blocking: Kalender für Deep Work reservieren',
      'Notifications aus: Handy auf DND während Deep Work',
      'MIT (Most Important Tasks): Max 3 pro Tag',
      'Weekly Review: Sonntag 30 Min Woche planen',
      'Brain Dump: Alles aufschreiben, dann priorisieren',
      'Energy Audit: Wann bin ich am produktivsten?',
    ],
    commonMistakes: [
      '❌ Morgens E-Mails checken (reaktiv statt proaktiv)',
      '❌ Zu viele Tasks auf der Liste',
      '❌ Keine klaren Prioritäten',
      '❌ Ständig unterbrochen werden',
      '❌ Multitasking versuchen',
      '❌ Keine Pausen (Burnout)',
      '❌ Produktivitäts-Porno: Tools > Arbeit',
    ],
    milestoneTemplate: [
      'Energy Audit: Wann bin ich am produktivsten?',
      'MIT System: Jeden Morgen 3 wichtigste Tasks',
      'Morning Block: 2h Deep Work etablieren',
      'Notifications Management: DND während Focus',
      'Pomodoro testen: Passt der Rhythmus?',
      'Weekly Review: Jeden Sonntag 30 Min',
      'Time Blocking: Kalender für Deep Work nutzen',
      'System optimieren: Was funktioniert, was nicht?',
    ],
  },

  // ==========================================
  // MUSKELAUFBAU (Natural & Enhanced)
  // ==========================================
  'muskelaufbau': {
    category: 'Muskelaufbau & Bodybuilding',
    sources: [
      'Dr. Mike Israetel - Renaissance Periodization',
      'Jeff Nippard - Science Explained',
      'Dr. Eric Helms - Muscle & Strength Pyramids',
      'Menno Henselmans - Bayesian Bodybuilding',
      'Stan Efferding - Vertical Diet',
    ],
    principles: [
      'Progressive Overload: Mehr Gewicht/Reps/Sets über Zeit',
      'Mechanical Tension ist der #1 Hypertrophie-Treiber',
      'Volume: 10-20 Sets pro Muskelgruppe pro Woche',
      'Frequenz: 2x pro Muskelgruppe pro Woche optimal',
      'Protein: 1.6-2.2g/kg (Enhanced: bis 2.5g/kg)',
      'Surplus für Aufbau: +300-500kcal',
      'Deload alle 4-6 Wochen',
    ],
    bestPractices: [
      'Trainingslog führen: Gewichte, Reps, RPE tracken',
      'Mind-Muscle Connection: Zielmuskel spüren',
      'Full Range of Motion > Ego Lifting',
      'Compound First, Isolation Second',
      'Rest Periods: 2-3 Min für Compounds, 60-90s für Isolation',
      'Sleep 7-9h: Wachstum passiert in der Recovery',
      'Creatine: 5g täglich (einziges bewiesenes Supplement)',
    ],
    commonMistakes: [
      '❌ Ego Lifting: Zu schwer, schlechte Form',
      '❌ Zu wenig Volumen (unter 10 Sets/Woche)',
      '❌ Keine Progression tracken',
      '❌ Training bis zum Versagen in jedem Satz',
      '❌ Zu wenig Protein',
      '❌ Zu wenig Schlaf',
      '❌ Programm-Hopping alle 2 Wochen',
    ],
    milestoneTemplate: [
      'Programm wählen: PPL, Upper/Lower, Full Body',
      'Baseline: Aktuelle 1RM/Maße dokumentieren',
      '4 Wochen: Programm konsistent durchziehen',
      '8 Wochen: Erste Progress-Fotos vergleichen',
      'Kraftziele: +10% bei Hauptübungen',
      '12 Wochen: Erster Mini-Cut oder Bulk-Continuation',
      '6 Monate: Signifikante optische Veränderung',
    ],
  },

  // ==========================================
  // PSYCHOLOGIE & VERHALTENSÄNDERUNG
  // ==========================================
  'psychologie': {
    category: 'Psychologie & Verhaltensänderung',
    sources: [
      'Daniel Kahneman - Thinking, Fast and Slow',
      'Robert Cialdini - Influence & Pre-Suasion',
      'BJ Fogg - Tiny Habits',
      'James Clear - Atomic Habits',
      'Martin Seligman - Flourish (Positive Psychology)',
      'Mihaly Csikszentmihalyi - Flow',
      'Deci & Ryan - Self-Determination Theory',
      'Dan Ariely - Predictably Irrational',
      'Chip & Dan Heath - Switch & Made to Stick',
      'Carol Dweck - Mindset',
      'Angela Duckworth - Grit',
      'Kelly McGonigal - The Willpower Instinct',
      'Nir Eyal - Hooked & Indistractable',
      'Charles Duhigg - The Power of Habit',
      'Richard Thaler - Nudge (Behavioral Economics)',
    ],
    principles: [
      // Verhaltensänderung
      'Behavior = Motivation × Ability × Trigger (Fogg Behavior Model)',
      'Tiny Habits: Klein anfangen, dann steigern - Verhalten ist ein Skill',
      'Environment Design > Willpower: Umgebung gestalten, nicht kämpfen',
      'Implementation Intentions: "Wenn X, dann Y" verdoppelt Erfolgsrate',
      'Identity-Based Change: "Ich BIN jemand der..." > "Ich will..."',
      // Kognitive Psychologie
      'System 1 vs. System 2: Schnelles (automatisch) vs. Langsames Denken (bewusst)',
      'Loss Aversion: Verluste wiegen 2x so schwer wie Gewinne',
      'Anchoring: Erste Zahl beeinflusst alle folgenden Schätzungen',
      // Motivation
      'Intrinsic > Extrinsic Motivation: Autonomie, Kompetenz, Verbundenheit',
      'Flow State: Optimale Herausforderung + klare Ziele + Feedback = Flow',
      'Variable Rewards: Unvorhersehbare Belohnungen = mehr Dopamin',
      'Goal Gradient Effect: Je näher das Ziel, desto mehr Effort',
      // Sozialpsychologie
      'Social Proof: Menschen tun was andere tun',
      'Commitment & Consistency: Kleine Commitments → größere Commitments',
      'Reciprocity: Menschen wollen zurückgeben was sie bekommen',
    ],
    bestPractices: [
      // Verhaltensänderung
      'Habit Stacking: Neue Gewohnheit an bestehende knüpfen',
      '2-Minute Rule: Jede neue Gewohnheit auf 2 Min reduzieren',
      'Temptation Bundling: Wollen + Müssen kombinieren',
      'Friction Design: Gutes einfacher, Schlechtes schwerer machen',
      'Visual Cues: Trigger sichtbar machen',
      // Motivation hacken
      'Progress Bars: Visuellen Fortschritt zeigen (Goal Gradient)',
      'Streaks: Unbroken Chains nutzen (Loss Aversion)',
      'Fresh Starts: Neue Anfänge nutzen (Montag, 1. des Monats)',
      'Implementation Intentions: "Um [ZEIT] werde ich [VERHALTEN] an [ORT]"',
      'Accountability: Öffentlich committen oder Partner finden',
      // Kognitive Strategien
      'Pre-Commitment: Entscheidungen im Voraus treffen',
      'Mental Contrasting: Ziel UND Hindernisse visualisieren',
      'Reframing: Situation neu interpretieren (Challenge vs. Threat)',
      'Self-Compassion: Bei Rückschlägen nicht selbst verurteilen',
    ],
    commonMistakes: [
      '❌ Auf Motivation warten (Action creates motivation)',
      '❌ Zu große Schritte (Überwältigung → Aufgeben)',
      '❌ Willenskraft überschätzen (Environment Design ist nachhaltiger)',
      '❌ Extrinsische Motivation zu sehr betonen',
      '❌ All-or-Nothing Thinking (80% Konsistenz > 100% manchmal)',
      '❌ Negative Self-Talk nach Rückschlägen',
      '❌ Outcome-Focus statt Process-Focus',
      '❌ Social Comparison (mit anderen statt mit gestern-Ich)',
    ],
    milestoneTemplate: [
      'Selbstanalyse: Welche Verhaltensweisen will ich ändern?',
      'Trigger identifizieren: Was löst ungewolltes Verhalten aus?',
      'Tiny Habit definieren: 2-Minuten-Version des Zielverhaltens',
      'Implementation Intention: "Wenn [TRIGGER], dann [VERHALTEN]"',
      'Environment Design: Umgebung für Erfolg optimieren',
      '7-Tage Streak: Kleine Konsistenz aufbauen',
      '30-Tage Challenge: Habit Festigung',
      'Identity Shift: "Ich bin jemand, der [VERHALTEN] tut"',
    ],
  },

  // ==========================================
  // SUPPLEMENTS & NAHRUNGSERGÄNZUNG ⭐ NEU
  // ==========================================
  'supplements': {
    category: 'Supplements & Nahrungsergänzung',
    sources: [
      'Examine.com - Unabhängige Supplement-Forschung',
      'Dr. Rhonda Patrick - FoundMyFitness Research',
      'Dr. Andrew Huberman - Huberman Lab Podcast',
      'Dr. Peter Attia - The Drive Podcast',
      'Layne Norton PhD - BioLayne Research Reviews',
      'Eric Helms PhD - MASS Research Review',
      'Chris Masterjohn PhD - Nutritional Sciences',
      'Bryan Johnson - Blueprint Protocol',
      'David Sinclair PhD - Lifespan Research',
      'ConsumerLab.com - Independent Testing',
    ],
    principles: [
      'Evidence-Based: Nur Supplements mit solider Studienlage (RCTs, Meta-Analysen)',
      'Dosierung matters: Zu wenig = kein Effekt, zu viel = Toxizität',
      'Timing ist entscheidend: Fettlöslich mit Fett, nüchtern vs. mit Mahlzeit',
      'Interaktionen beachten: Zink/Kupfer, Calcium/Magnesium, Eisen/Zink',
      'Qualität > Preis: Third-Party Testing (NSF, USP, ConsumerLab)',
      'Baseline Testing: Blutwerte VOR Supplementierung messen',
      'Food First: Supplements ergänzen, ersetzen keine gute Ernährung',
      'Hierarchie: Schlaf → Ernährung → Training → DANN Supplements',
      'Bioavailability: Form des Supplements beeinflusst Aufnahme massiv',
    ],
    bestPractices: [
      'Vitamin D3: 2000-5000 IU/Tag (Ziel: 40-60 ng/ml), mit Fett + K2',
      'Omega-3 (EPA/DHA): 2-3g/Tag, triglyceride Form > Ethyl Ester',
      'Magnesium: 300-400mg/Tag, Glycinat/Threonat > Oxid (abends)',
      'Vitamin K2 (MK-7): 100-200mcg mit D3 für Calcium-Routing',
      'Kreatin Monohydrat: 5g/Tag täglich, günstigstes High-ROI Supplement',
      'Koffein: 100-200mg strategisch, 8h vor Schlaf stoppen',
      'L-Theanin: 100-200mg mit Koffein für Focus ohne Jitter',
      'Magnesium Glycinat: 300-400mg 1h vor Schlaf',
      'Glycin: 3g vor Schlaf für Tiefschlaf-Qualität',
      'Alpha-GPC: 300mg für Acetylcholin & Focus',
      'Lions Mane: 500-1000mg für NGF & Neuroplastizität',
    ],
    commonMistakes: [
      '❌ Keine Blutwerte vor Supplementierung (blinde Supplementierung)',
      '❌ Zu viele Supplements auf einmal starten (keine Kausalität erkennbar)',
      '❌ Billigste Option kaufen (schlechte Absorption, Verunreinigungen)',
      '❌ Mega-Dosierungen ohne Grund (mehr ≠ besser)',
      '❌ Timing ignorieren (fettlöslich ohne Fett, Magnesium morgens)',
      '❌ Interaktionen ignorieren (Zink dauerhaft ohne Kupfer)',
      '❌ Supplements als Ersatz für Basics (Schlaf, Ernährung, Training)',
      '❌ Proprietäre Blends kaufen (versteckte Unterdosierungen)',
    ],
    milestoneTemplate: [
      'Baseline Blutbild: Vitamin D, B12, Ferritin, Magnesium, Zink messen',
      'Foundation Stack: D3+K2, Omega-3, Magnesium einführen',
      'Timing optimieren: Morgen/Abend/Mit Mahlzeit systematisieren',
      'Performance Stack: Kreatin, Koffein+Theanin testen',
      'Sleep Stack: Magnesium Glycinat, Glycin, Apigenin',
      'Re-Test: Blutwerte nach 3 Monaten kontrollieren',
    ],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getExpertKnowledge(category: string): ExpertInsight | null {
  // Normalize category
  const normalizedCategory = category.toLowerCase()
    .replace(/[äöü]/g, match => ({ 'ä': 'a', 'ö': 'o', 'ü': 'u' }[match] || match))
    .replace(/[^a-z]/g, '');
  
  // Direct match
  if (EXPERT_KNOWLEDGE[normalizedCategory]) {
    return EXPERT_KNOWLEDGE[normalizedCategory];
  }
  
  // Keyword matching
  const keywordMap: Record<string, string> = {
    'rhetorik': 'rhetorik',
    'kommunikation': 'rhetorik',
    'praesentation': 'rhetorik',
    'reden': 'rhetorik',
    'sprechen': 'rhetorik',
    
    'fitness': 'fitness',
    'abnehmen': 'fitness',
    'sport': 'fitness',
    'training': 'fitness',
    'muskel': 'fitness',
    'gewicht': 'fitness',
    'gesundheit': 'fitness',
    
    'karriere': 'karriere',
    'job': 'karriere',
    'arbeit': 'karriere',
    'beforderung': 'karriere',
    
    'finanzen': 'finanzen',
    'geld': 'finanzen',
    'sparen': 'finanzen',
    'investieren': 'finanzen',
    'vermogen': 'finanzen',
    
    'lernen': 'lernen',
    'skill': 'lernen',
    'studium': 'lernen',
    'weiterbildung': 'lernen',
    
    'gewohnheit': 'gewohnheiten',
    'habit': 'gewohnheiten',
    'routine': 'gewohnheiten',
    
    'beziehung': 'beziehungen',
    'freund': 'beziehungen',
    'partner': 'beziehungen',
    'sozial': 'beziehungen',
    'netzwerk': 'beziehungen',
    
    'fuhrerschein': 'fuehrerschein',
    'auto': 'fuehrerschein',
    'fahren': 'fuehrerschein',
    'prufung': 'fuehrerschein',
    
    'business': 'business',
    'produkt': 'business',
    'startup': 'business',
    'grunden': 'business',
    'unternehmen': 'business',
    'selbstandig': 'business',
    
    // Persönliche Entwicklung
    'personlich': 'persoenlich',
    'entwicklung': 'persoenlich',
    'selbstverbesserung': 'persoenlich',
    'wachstum': 'persoenlich',
    'selbstbewusstsein': 'persoenlich',
    'disziplin': 'persoenlich',
    'stoizismus': 'persoenlich',
    
    // TRT / Enhanced Fitness
    'trt': 'trt',
    'testosteron': 'trt',
    'hormon': 'trt',
    'enhanced': 'trt',
    'steroid': 'trt',
    'enantat': 'trt',
    'cypionat': 'trt',
    
    // Muskelaufbau
    'muskelaufbau': 'muskelaufbau',
    'bodybuilding': 'muskelaufbau',
    'hypertrophie': 'muskelaufbau',
    'masse': 'muskelaufbau',
    'bulk': 'muskelaufbau',
    'gainz': 'muskelaufbau',
    
    // KI / AI
    'ki': 'ki',
    'kunstlich': 'ki',
    'ai': 'ki',
    'chatgpt': 'ki',
    'claude': 'ki',
    'gpt': 'ki',
    'llm': 'ki',
    'machine': 'ki',
    
    // Prompting
    'prompting': 'prompting',
    'prompt': 'prompting',
    
    // Sprachen
    'sprache': 'sprachen',
    'sprachen': 'sprachen',
    'englisch': 'sprachen',
    'deutsch': 'sprachen',
    'spanisch': 'sprachen',
    'franzosisch': 'sprachen',
    'japanisch': 'sprachen',
    'chinesisch': 'sprachen',
    'anki': 'sprachen',
    'vokabel': 'sprachen',
    'immersion': 'sprachen',
    
    // Schlaf
    'schlaf': 'schlaf',
    'schlafen': 'schlaf',
    'sleep': 'schlaf',
    'mude': 'schlaf',
    'energie': 'schlaf',
    'aufwachen': 'schlaf',
    'bett': 'schlaf',
    
    // Produktivität
    'produktiv': 'produktivitaet',
    'produktivitat': 'produktivitaet',
    'fokus': 'produktivitaet',
    'deepwork': 'produktivitaet',
    'pomodoro': 'produktivitaet',
    'gtd': 'produktivitaet',
    'zeitmanagement': 'produktivitaet',
    
    // Psychologie
    'psychologie': 'psychologie',
    'psychology': 'psychologie',
    'verhalten': 'psychologie',
    'behavior': 'psychologie',
    'kognitiv': 'psychologie',
    'bias': 'psychologie',
    'willenskraft': 'psychologie',
    'prokrastination': 'psychologie',
    'selbstkontrolle': 'psychologie',
    'dopamin': 'psychologie',
    
    // Supplements
    'supplements': 'supplements',
    'supplement': 'supplements',
    'nahrungserganzung': 'supplements',
    'vitamine': 'supplements',
    'vitamin': 'supplements',
    'mineralien': 'supplements',
    'kreatin': 'supplements',
    'creatine': 'supplements',
    'omega3': 'supplements',
    'fischol': 'supplements',
    'magnesium': 'supplements',
    'zink': 'supplements',
    'nmn': 'supplements',
    'nad': 'supplements',
    'resveratrol': 'supplements',
    'nootropics': 'supplements',
    'stack': 'supplements',
    'preworkout': 'supplements',
  };
  
  for (const [keyword, mappedCategory] of Object.entries(keywordMap)) {
    if (normalizedCategory.includes(keyword)) {
      return EXPERT_KNOWLEDGE[mappedCategory];
    }
  }
  
  return null;
}

export function detectCategoryFromGoal(goalTitle: string, goalDescription?: string): string | null {
  const text = `${goalTitle} ${goalDescription || ''}`.toLowerCase();
  
  const categoryKeywords: Record<string, string[]> = {
    // Specific categories first (more specific = higher priority)
    'trt': ['trt', 'testosteron', 'enantat', 'cypionat', 'hormon', 'enhanced', 'steroid', 'zyklus', 'cycle', '250mg', 'injektion'],
    'ki': ['ki', 'künstliche intelligenz', 'ai', 'chatgpt', 'claude', 'gpt', 'llm', 'machine learning', 'cursor'],
    'prompting': ['prompting', 'prompt engineering', 'prompt schreiben'],
    'schlaf': ['schlaf', 'sleep', 'aufwachen', 'müde', 'energie morgens', 'schlafqualität', 'einschlafen', '7.5 stunden'],
    'produktivitaet': ['produktivität', 'produktiv', 'deep work', 'fokus', 'pomodoro', 'gtd', 'zeitmanagement', 'konzentration'],
    'sprachen': ['sprache lernen', 'englisch', 'spanisch', 'französisch', 'japanisch', 'anki', 'vokabeln', 'immersion', 'fluent'],
    'muskelaufbau': ['muskelaufbau', 'bodybuilding', 'hypertrophie', 'masse', 'bulk', 'gainz', 'muskeln aufbauen'],
    'persoenlich': ['persönlich', 'entwicklung', 'selbst', 'wachstum', 'stoizismus', 'selbstbewusstsein'],
    'psychologie': ['psychologie', 'psychology', 'verhalten', 'behavior', 'prokrastination', 'willenskraft', 'kognitiv', 'bias', 'selbstkontrolle', 'dopamin', 'belohnung', 'trigger', 'motivation verstehen'],
    'supplements': ['supplements', 'supplement', 'nahrungsergänzung', 'vitamine', 'vitamin', 'mineralien', 'kreatin', 'creatine', 'omega-3', 'omega3', 'fischöl', 'magnesium', 'zink', 'nmn', 'nad', 'resveratrol', 'nootropics', 'stack', 'pre-workout', 'preworkout', 'alpha-gpc', 'lions mane', 'ashwagandha', 'd3', 'k2'],
    
    // General categories
    'rhetorik': ['rhetorik', 'präsentation', 'reden', 'sprechen', 'kommunikation', 'vortrag'],
    'fitness': ['fitness', 'abnehmen', 'sport', 'training', 'gewicht', 'kg', 'gym', 'kraft', 'laufen', 'cardio'],
    'karriere': ['karriere', 'job', 'beförderung', 'gehalt', 'arbeit', 'chef'],
    'finanzen': ['finanzen', 'geld', 'sparen', 'investieren', 'vermögen', 'euro', '€', 'budget'],
    'lernen': ['lernen', 'skill', 'kurs', 'zertifikat', 'weiterbildung', 'studium', 'programmieren'],
    'gewohnheiten': ['gewohnheit', 'habit', 'routine', 'täglich', 'meditation', 'morgen'],
    'beziehungen': ['beziehung', 'freund', 'partner', 'familie', 'sozial', 'netzwerk'],
    'fuehrerschein': ['führerschein', 'auto', 'fahren', 'fahrschule', 'mpu'],
    'business': ['business', 'produkt', 'startup', 'gründen', 'verkaufen', 'kunden', 'unternehmen'],
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      return category;
    }
  }
  
  return null;
}

export function formatExpertKnowledgeForPrompt(insight: ExpertInsight): string {
  return `
## 📚 EXPERTENWISSEN: ${insight.category}

**Quellen:** ${insight.sources.join(', ')}

**Kernprinzipien:**
${insight.principles.map(p => `• ${p}`).join('\n')}

**Best Practices:**
${insight.bestPractices.map(p => `• ${p}`).join('\n')}

**Häufige Fehler (VERMEIDE!):**
${insight.commonMistakes.join('\n')}
`;
}

