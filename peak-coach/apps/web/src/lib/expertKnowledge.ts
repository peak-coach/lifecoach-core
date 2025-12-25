// ============================================
// PEAK COACH - Expert Knowledge Base (Web App)
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
  // KOMMUNIKATION & RHETORIK ⭐ ERWEITERT
  // ==========================================
  'rhetorik': {
    category: 'Kommunikation & Rhetorik',
    sources: [
      'K. Anders Ericsson - Peak: Deliberate Practice',
      'Chris Anderson - TED Talks: The Official Guide',
      'Dale Carnegie - How to Win Friends and Influence People',
      'Carmine Gallo - Talk Like TED',
      'Nancy Duarte - Resonate & Slide:ology',
      'Toastmasters International - Competent Communicator',
      'Jordan Peterson - Lecture Techniques',
      'Simon Sinek - Start With Why (Golden Circle)',
      'Vinh Giang - Stage Presence & Magic',
      'Vanessa Van Edwards - Captivate (Body Language)',
    ],
    principles: [
      'Deliberate Practice > passives Lernen (10x effektiver)',
      'Feedback-Loops: Aufnehmen → Analysieren → Verbessern → Wiederholen',
      'Micro-Skills isoliert üben: Pausen, Blickkontakt, Gestik, Stimme, Tempo',
      'Exposure Therapy: Häufigkeit > Perfektion (100 schlechte Reden = 1 gute)',
      'Struktur: Hook → Problem → Lösung → Call-to-Action',
      'Stories > Facts: Menschen erinnern Geschichten 22x besser',
      'Rule of Three: 3 Hauptpunkte, nicht mehr',
      'Power of the Pause: Stille ist mächtiger als Worte',
      'Start strong, end stronger: Erster und letzter Eindruck zählen',
      'Know your audience: Sprache und Beispiele anpassen',
    ],
    bestPractices: [
      'Täglich 5 Min Rede zu beliebigem Thema aufnehmen',
      'Eigene Aufnahmen analysieren (Filler-Words, Pausen, Tempo, Energie)',
      'Erfolgreiche Redner auf YouTube studieren & Techniken kopieren',
      'Vor Spiegel üben: Gestik, Mimik, Körperhaltung bewusst machen',
      'Toastmasters besuchen: Strukturiertes Feedback, regelmäßige Übung',
      'Impromptu Speaking: Table Topics für spontanes Reden',
      'Storytelling-Framework: STAR (Situation, Task, Action, Result)',
      'Vocal Variety üben: Laut/Leise, Schnell/Langsam, Hoch/Tief',
      'Slides: Bilder > Text, 1 Idee pro Slide',
      'Nervosität umframen: Aufregung, nicht Angst',
    ],
    commonMistakes: [
      '❌ Bücher lesen ohne zu üben',
      '❌ Auf "den perfekten Moment" warten',
      '❌ Große Präsentationen ohne kleine Übungen vorher',
      '❌ Keine Aufnahmen von sich selbst machen',
      '❌ Zu viel Text auf Slides',
      '❌ Monotone Stimme ohne Variation',
      '❌ Kein klarer Call-to-Action am Ende',
      '❌ Zu viele Filler-Words (ähm, also, quasi)',
    ],
    milestoneTemplate: [
      'Baseline: Erste 2-Min Rede aufnehmen & brutal ehrlich analysieren',
      'Woche 1-2: Nur Pausen üben (3 Sekunden nach jedem Satz)',
      'Woche 3-4: Blickkontakt üben (5 Sek pro Person)',
      'Woche 5-6: Gestik bewusst einsetzen',
      '10 Reden aufnehmen und Fortschritt dokumentieren',
      'Vor 3-5 Freunden/Familie präsentieren (strukturiertes Feedback)',
      'Erste öffentliche Rede: Meeting, Toastmasters, oder kleines Event',
      'Finale Präsentation: Vor Zielpublikum mit hohem Stakes',
    ],
  },

  // ==========================================
  // FITNESS & ABNEHMEN ⭐ ERWEITERT
  // ==========================================
  'fitness': {
    category: 'Fitness & Abnehmen',
    sources: [
      'Dr. Andy Galpin - Huberman Lab Guest (Exercise Science)',
      'Dr. Peter Attia - Outlive (Longevity)',
      'Dr. Layne Norton - Fat Loss Forever',
      'Tim Ferriss - The 4-Hour Body',
      'James Clear - Atomic Habits',
      'Lyle McDonald - The Rapid Fat Loss Handbook',
      'Alan Aragon - Research Reviews',
      'Brad Schoenfeld - Science of Muscle Hypertrophy',
      'Eric Helms - The Muscle & Strength Pyramids',
      'Stan Efferding - The Vertical Diet',
    ],
    principles: [
      'Krafttraining > Cardio für Fettabbau (erhöht Grundumsatz langfristig)',
      'Progressive Overload: Stetige Steigerung ist der Schlüssel',
      'Protein: 1.6-2.2g/kg für Muskelerhalt im Defizit',
      'Moderate Defizite (300-500kcal) sind nachhaltig, Crash-Diäten nicht',
      'Schlaf 7-9h ist #1 für Recovery, Hormone, Willenskraft',
      'NEAT (Non-Exercise Activity): Oft wichtiger als Gym-Zeit',
      'Adherence > Perfektion: Die beste Diät ist die, die du durchhältst',
      'Refeeds/Diet Breaks: Metabolische Anpassung managen',
      'Minimum Effective Dose: 2-3x Training/Woche reicht für Anfänger',
      'Hunger ist normal im Defizit, aber sollte managebar sein',
    ],
    bestPractices: [
      'Compound Movements priorisieren: Squats, Deadlifts, Bench, Rows, OHP',
      'Trainingslog führen: Gewichte, Reps, Sets - was du nicht trackst...',
      'Kalorientracking: Mindestens 2-4 Wochen für Awareness',
      'Protein bei jeder Mahlzeit: 30-50g verteilt',
      '10.000 Schritte täglich als NEAT-Baseline',
      'Wöchentlich wiegen: Durchschnitt > Einzelwerte (Wasserfluktuationen)',
      'Fotos alle 2-4 Wochen: Spiegel lügt, Fotos nicht',
      'Sleep Hygiene: Gleiche Zeit, dunkel, kühl, keine Screens',
      'Fiber 25-35g für Sättigung',
      'Meal Prep: Entscheidungen vorwegnehmen',
    ],
    commonMistakes: [
      '❌ Nur Cardio für Fettabbau (Muskelverlust!)',
      '❌ Zu aggressive Defizite (>1000kcal = Crash)',
      '❌ Training ohne Tracking/Progression',
      '❌ Schlaf vernachlässigen (Cortisol, Hunger)',
      '❌ "Clean Eating" ohne Kalorien zählen',
      '❌ Cardio-Kompensation: Mehr Cardio = mehr Hunger',
      '❌ Waage als einziges Maß (Maße, Fotos, Kraft!)',
      '❌ All-or-Nothing Denken nach "Ausrutscher"',
    ],
    milestoneTemplate: [
      'Baseline: Gewicht, Maße, Kraftwerte, Fotos dokumentieren',
      'Tracking starten: 2 Wochen Kalorien & Makros loggen',
      'Defizit berechnen: TDEE - 300-500kcal',
      'Gym-Routine etablieren: 3x/Woche für 4 Wochen',
      '4 Wochen: Erste Fortschritte (meist Wasser + etwas Fett)',
      '8 Wochen: Kraftwerte checken (sollten stabil bleiben)',
      '12 Wochen: Signifikanter visueller Unterschied',
      'Goal erreicht: Reverse Diet zum Maintenance',
    ],
  },

  // ==========================================
  // MUSKELAUFBAU ⭐ ERWEITERT
  // ==========================================
  'muskelaufbau': {
    category: 'Muskelaufbau & Bodybuilding',
    sources: [
      'Dr. Mike Israetel - Renaissance Periodization (RP)',
      'Jeff Nippard - Science Applied (YouTube)',
      'Dr. Eric Helms - Muscle & Strength Pyramids',
      'Menno Henselmans - Bayesian Bodybuilding',
      'Stan Efferding - The Vertical Diet',
      'Brad Schoenfeld - Science and Development of Muscle Hypertrophy',
      'Dr. Andy Galpin - Adapt Podcast',
      'Greg Nuckols - Stronger by Science',
      'John Meadows - Mountain Dog Training (RIP)',
      'Chris Beardsley - Hypertrophy Research',
      'Bret Contreras - Glute Lab',
    ],
    principles: [
      'Progressive Overload: Mehr Gewicht/Reps/Sets über Zeit ist PFLICHT',
      'Mechanical Tension ist der #1 Hypertrophie-Treiber',
      'Volume: 10-20 Sets pro Muskelgruppe pro Woche (MEV → MRV)',
      'Frequenz: 2x pro Muskelgruppe pro Woche meist optimal',
      'Protein: 1.6-2.2g/kg Natural, bis 2.5g/kg Enhanced',
      'Kalorienüberschuss: +200-500kcal für Lean Bulk',
      'Deload alle 4-6 Wochen oder bei Akkumulation von Fatigue',
      'Mind-Muscle Connection: Bewusstes Spüren des Zielmuskels',
      'Training Close to Failure: 0-3 RIR für Hypertrophie',
      'Compound + Isolation: Beide haben ihren Platz',
    ],
    bestPractices: [
      'Trainingslog führen: Gewichte, Reps, RPE/RIR tracken',
      'Full Range of Motion > Ego Lifting (Stretch + Contraction)',
      'Compound First: Squats, Bench, Rows, Deadlift, OHP',
      'Isolation Second: Curls, Flies, Lateral Raises, etc.',
      'Rest Periods: 2-3 Min für Compounds, 60-90s für Isolation',
      'Sleep 7-9h: Wachstum passiert in der Recovery, nicht im Gym',
      'Creatine: 5g täglich (einziges bewiesenes Supplement)',
      'Intra-Set Stretching bei letztem Satz für extra Stimulus',
      'Video Recording: Form checken, Progress dokumentieren',
      'Weekly Volume checken: Zu viel = Diminishing Returns',
    ],
    commonMistakes: [
      '❌ Ego Lifting: Zu schwer, schlechte Form, kein MMC',
      '❌ Junk Volume: Sets ohne echten Stimulus (zu leicht)',
      '❌ Zu wenig Volumen (unter 10 Sets/Woche/Muskel)',
      '❌ Keine Progression tracken ("Ich weiß was ich letzte Woche hatte")',
      '❌ Jeder Satz bis zum Failure (= zu viel Fatigue)',
      '❌ Zu wenig Protein',
      '❌ Zu wenig Schlaf',
      '❌ Programm-Hopping alle 2 Wochen',
      '❌ Nur Maschinen, keine freien Gewichte',
      '❌ Stabilisatoren ignorieren',
    ],
    milestoneTemplate: [
      'Programm wählen: PPL, Upper/Lower, Full Body, Arnold Split',
      'Baseline: Aktuelle 1RM oder 5RM bei Hauptübungen dokumentieren',
      '4 Wochen: Programm konsistent durchziehen (Neuroadaptation)',
      '8 Wochen: Erste Progress-Fotos vergleichen',
      'Kraftziele: +5-10% bei Hauptübungen',
      '12 Wochen: Erster Deload, dann weiter oder Mini-Cut',
      '6 Monate: Signifikante optische Veränderung (3-6kg LBM Natural)',
      '1 Jahr: Serious Progress (6-10kg LBM Natural)',
    ],
  },

  // ==========================================
  // TRT / ENHANCED FITNESS ⭐ ERWEITERT
  // ==========================================
  'trt': {
    category: 'Fitness & Hormonoptimierung (TRT/AAS)',
    sources: [
      'Dr. Andrew Huberman - Huberman Lab Podcast (Hormones)',
      'Derek (More Plates More Dates) - MPMD YouTube/Website',
      'Dr. Peter Attia - The Drive Podcast (Longevity)',
      'Vigorous Steve - Harm Reduction YouTube',
      'Dr. Mike Israetel - Renaissance Periodization',
      'Dr. Thomas OConnor - Anabolic Doc',
      'r/steroids Wiki - Community Compiled Knowledge',
      'William Llewellyn - Anabolics (Reference Book)',
      'Dr. Rand McClain - Testosterone Expert',
      'Seth Feroce - Enhanced Athlete Experience',
      'Greg Doucette - Practical Enhanced Advice',
    ],
    principles: [
      '250mg Test E/Woche = Solide TRT+/Light Enhanced Dosis',
      'Injection Frequency: 2x/Woche (E3.5D) minimum für stabile Spiegel',
      'Bloodwork ist PFLICHT: Pre, 6 Wochen, 12 Wochen, dann regelmäßig',
      'E2 Management: Bei 250mg meist kein AI nötig - erst bei Symptomen + hohen Werten',
      'Cardio 150+ Min Zone 2/Woche: LVH-Prevention ist nicht optional!',
      'Blutdruck unter 130/80 halten - jeden Tag messen',
      'Test macht nicht die Arbeit - Training + Ernährung müssen stimmen',
      'Hämatokrit-Management: >52-54% = Risiko für Blutgerinnsel',
      'Lipid Management: HDL sinkt, LDL steigt - proaktiv handeln',
      'Recovery verbessert sich, aber Sehnen/Bänder hinken hinterher',
    ],
    bestPractices: [
      'Injection Protocol: 125mg E3.5D (z.B. Mo morgens, Do abends)',
      'Injection Sites rotieren: Delts, VG, Quads (SubQ auch möglich)',
      'Bloodwork Panel: Total T, Free T, E2, SHBG, Hämatokrit, CBC, CMP, Lipide',
      'E2-Symptome (Nippel, Wasser, ED): Erst Bloodwork, dann AI wenn E2 >40-50',
      'AI dosieren: 0.25-0.5mg Anastrozol bei Bedarf, nie prophylaktisch',
      'Training: PPL oder Upper/Lower, 5-6x/Woche mit erhöhtem Volume',
      'Protein: 2.2-2.5g/kg - du baust mehr, du brauchst mehr',
      'Cardio: 30-45 Min Zone 2 an Trainingstagen oder täglich',
      'BP-Management: LISS, Kochsalz reduzieren, ggf. ARB/ACE-Hemmer',
      'Supplements: Omega-3 (3-5g), Citrus Bergamot, NAC, Taurin',
      'Hämatokrit hoch? Blutspende, Grapefruit-Naringin, oder Dosis senken',
    ],
    commonMistakes: [
      '❌ Kein Bloodwork vor dem Start (keine Baseline!)',
      '❌ AI prophylaktisch nehmen ("Ich will keine Gyno")',
      '❌ E2 zu stark crashen (Gelenke, Libido, Stimmung = kaputt)',
      '❌ Cardio komplett weglassen (LVH ist still aber tödlich)',
      '❌ Denken "Test macht die Arbeit" - du musst trotzdem arbeiten',
      '❌ Zu schnell Dosis erhöhen ("Mehr = Besser")',
      '❌ Blutdruck ignorieren (140/90 ist NICHT okay)',
      '❌ Keine PCT-Planung wenn temporär (HPTA-Suppression!)',
      '❌ UGL-Gear ohne zu testen (LabMax oder ähnlich)',
      '❌ Anderen Leuten erzählen (niemand muss es wissen)',
    ],
    milestoneTemplate: [
      'Pre-Cycle Bloodwork: Vollständiges Panel als Baseline',
      'Gear-Source validieren: Reputation, ggf. LabMax',
      'Start: 250mg Test E, E3.5D Injections etablieren',
      'Woche 2-3: Einpegeln, Wohlbefinden, Libido, Energie tracken',
      'Woche 6: Follow-up Bloodwork (E2, Hämatokrit, Lipide)',
      'Training optimieren: Volume um 20-30% erhöhen',
      'Woche 12: Umfassendes Bloodwork, alle Health-Marker',
      'Körperkomposition: Progress Fotos + Messungen alle 4 Wochen',
      'Ongoing: Bloodwork alle 3-6 Monate, BP täglich, Cardio nie skippen',
    ],
  },

  // ==========================================
  // PRODUKTIVITÄT & KARRIERE ⭐ ERWEITERT
  // ==========================================
  'karriere': {
    category: 'Produktivität & Karriere',
    sources: [
      'Cal Newport - Deep Work & So Good They Cant Ignore You',
      'Greg McKeown - Essentialism',
      'Gary Keller - The ONE Thing',
      'David Allen - Getting Things Done (GTD)',
      'Stephen Covey - 7 Habits of Highly Effective People',
      'Angela Duckworth - Grit',
      'Ramit Sethi - I Will Teach You To Be Rich (Karriere)',
      'Seth Godin - Linchpin',
      'Ryan Holiday - Ego Is the Enemy',
      'Peter Thiel - Zero to One (Career Strategy)',
    ],
    principles: [
      'Deep Work: 90-Min Fokusblöcke ohne Ablenkung = 10x Output',
      'Eat the Frog: Wichtigstes zuerst (morgens, wenn Willenskraft max)',
      'Pareto: 20% der Arbeit = 80% der Ergebnisse - finde die 20%',
      'Single-Tasking > Multi-Tasking (Multitasking ist Mythos)',
      'Die ONE Thing Frage: "Was ist das EINE, das alles andere einfacher macht?"',
      'Essentialism: Weniger aber besser - Hell Yes or No',
      'So Good They Cant Ignore You: Skills > Passion',
      'Career Capital: Rare & Valuable Skills akkumulieren',
      'Deliberate Practice: Gezielte Verbesserung, nicht nur Wiederholung',
      'Be a Linchpin: Unverzichtbar werden durch einzigartige Kombination',
    ],
    bestPractices: [
      'Morgenroutine: Erste 2-3h für wichtigste Arbeit (Deep Work)',
      'Timeblocking: Kalender für Deep Work reservieren, nicht nur Meetings',
      'Batch Processing: Ähnliche Aufgaben zusammen (E-Mails, Calls)',
      'Weekly Review: Wöchentliche Reflexion & Planung (Sonntag 30 Min)',
      'Email nur 2x täglich checken (10:00 und 16:00)',
      'Nein sagen lernen: Jedes Ja ist ein Nein zu etwas anderem',
      'Skill Stacking: 2-3 Skills kombinieren für einzigartige Positionierung',
      'Quarterly Goals: Große Ziele in 90-Tage-Sprints',
      '1-on-1s: Regelmäßig mit Chef/Mentor für Feedback',
      'Build in Public: Arbeit sichtbar machen für Opportunities',
    ],
    commonMistakes: [
      '❌ Reaktiver statt proaktiver Arbeitsstil',
      '❌ Keine Priorisierung (alles ist "wichtig")',
      '❌ Meetings ohne klare Agenda und Action Items',
      '❌ Ständig erreichbar sein (Slack/Email 24/7)',
      '❌ Busy Work vs. Real Work verwechseln',
      '❌ Nur im Job arbeiten, nie am Job (keine Skill-Entwicklung)',
      '❌ Networking nur wenn man etwas braucht',
      '❌ Passion vor Skills (erst gut werden, dann leidenschaftlich)',
    ],
    milestoneTemplate: [
      'Audit: Eine Woche Zeit tracken (wo geht Zeit wirklich hin?)',
      'Fokus-Zeit blocken: Täglich 2h Deep Work etablieren',
      'Ablenkungen eliminieren: Phone-free Arbeitszeiten',
      'Weekly Review etablieren: Jeden Sonntag 30 Min',
      'TOP 3 Career Skills identifizieren (wo willst du hinwachsen?)',
      'Karriereziel definieren: 5-Jahre-Vision erstellen',
      'Skill Development Plan: 1 Skill pro Quartal vertiefen',
      'Network aufbauen: 2-3 strategische Kontakte pro Monat',
    ],
  },

  // ==========================================
  // PRODUKTIVITÄT ⭐ ERWEITERT (Deep Work System)
  // ==========================================
  'produktivitaet': {
    category: 'Produktivität & Deep Work',
    sources: [
      'Cal Newport - Deep Work & Digital Minimalism',
      'James Clear - Atomic Habits',
      'David Allen - Getting Things Done (GTD)',
      'Francesco Cirillo - The Pomodoro Technique',
      'Tiago Forte - Building a Second Brain (BASB)',
      'Ali Abdaal - Feel-Good Productivity',
      'Nir Eyal - Indistractable',
      'Jake Knapp - Make Time',
      'Greg McKeown - Essentialism',
      'Oliver Burkeman - Four Thousand Weeks',
      'BJ Fogg - Tiny Habits',
    ],
    principles: [
      'Deep Work > Shallow Work: Fokussierte Arbeit ist 10x wertvoller',
      'Energie-Management > Zeit-Management (Chronotyp beachten)',
      'Eat the Frog: Wichtigstes zuerst (höchste Willenskraft morgens)',
      'Single-Tasking: Multitasking reduziert IQ um 10 Punkte',
      'Environment Design > Willenskraft: Umgebung für Erfolg gestalten',
      'Weekly Review: Regelmäßige Reflexion für Course Correction',
      'Capture Everything: Gehirn zum Denken, nicht zum Speichern',
      'Time is finite: 4000 Wochen im Leben - nicht verschwenden',
      'Highlight Method: Jeden Tag EINE Sache, die zählt',
      'Protected Time: Kalender verteidigen wie dein Leben',
    ],
    bestPractices: [
      'Morning Block: 2-4h Deep Work ohne jegliche Unterbrechung',
      'Pomodoro: 25 Min fokussiert, 5 Min Pause (oder 52/17)',
      'Time Blocking: Kalender für Deep Work reservieren, nicht Reste',
      'Notifications komplett aus: Handy auf DND während Deep Work',
      'MIT (Most Important Tasks): Max 3 pro Tag, nicht 20',
      'Weekly Review: Sonntag 30 Min - was lief gut, was nicht?',
      'Brain Dump: Alles aus dem Kopf auf Papier, dann priorisieren',
      'Energy Audit: Chronotyp identifizieren (Lark vs. Owl)',
      'Shutdown Ritual: Klarer End-of-Day für Mental Detachment',
      'Second Brain: Notizen-System für externes Gedächtnis (Notion, Obsidian)',
      'Batching: E-Mails 2x/Tag, Calls gebündelt, Admin-Block',
      '2-Minute Rule: Unter 2 Min? Sofort erledigen',
    ],
    commonMistakes: [
      '❌ Morgens als erstes E-Mails checken (reaktiv statt proaktiv)',
      '❌ Zu viele Tasks auf der Liste (Decision Fatigue)',
      '❌ Keine klaren Prioritäten (alles ist "urgent")',
      '❌ Ständig unterbrochen werden (kein Protected Time)',
      '❌ Multitasking versuchen (Context Switching kostet 23 Min)',
      '❌ Keine Pausen (Burnout, Diminishing Returns)',
      '❌ Produktivitäts-Porno: Tools optimieren statt arbeiten',
      '❌ Kein Shutdown Ritual (Arbeit nimmt mit nach Hause)',
      '❌ Perfektionismus vor Progress',
    ],
    milestoneTemplate: [
      'Energy Audit: Wann bin ich am produktivsten? (1 Woche tracken)',
      'MIT System: Jeden Morgen 3 wichtigste Tasks identifizieren',
      'Morning Block: 2h ungestörte Deep Work etablieren',
      'Notifications Management: DND/Focus Mode während Deep Work',
      'Pomodoro oder Time Blocking: Rhythmus finden der funktioniert',
      'Weekly Review: Jeden Sonntag 30 Min etablieren',
      'Second Brain Setup: Notizen-System einrichten (Obsidian/Notion)',
      'Shutdown Ritual: End-of-Day Routine für Mental Clarity',
      'System Review: Nach 4 Wochen - was funktioniert, was nicht?',
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
  // LERNEN & SKILLS ⭐ ERWEITERT
  // ==========================================
  'lernen': {
    category: 'Lernen & Skills',
    sources: [
      'Barbara Oakley - Learning How to Learn (Coursera)',
      'K. Anders Ericsson - Peak: Deliberate Practice',
      'Josh Kaufman - The First 20 Hours',
      'Scott Young - Ultralearning',
      'Cal Newport - So Good They Cant Ignore You',
      'Make It Stick - Brown, Roediger, McDaniel',
      'Jim Kwik - Limitless (Memory & Speed Reading)',
      'Tony Buzan - Mind Maps',
      'Daniel Coyle - The Talent Code',
      'Anders Ericsson - Cambridge Handbook of Expertise',
      'Mortimer Adler - How to Read a Book',
    ],
    principles: [
      'Active Recall > passives Lesen (3x effektiver für Retention)',
      'Spaced Repetition: Vergessenskurve hacken mit Anki',
      'Deliberate Practice: Gezielt Schwächen üben, nicht Stärken',
      'Feynman Technik: Erkläre es so einfach, dass ein Kind es versteht',
      'Interleaving: Themen mischen > Block-Learning',
      '20-Stunden-Regel: Basics jedes Skills in 20h fokussiertem Üben',
      'Desirable Difficulty: Schwieriger = besseres Lernen',
      'Testing Effect: Sich selbst testen ist Lernen, nicht nur Prüfung',
      'Sleep consolidation: Schlaf nach Lernen festigt Wissen',
      'Focused vs. Diffuse Mode: Beides nutzen (Pausen sind produktiv)',
    ],
    bestPractices: [
      'Pomodoro: 25 Min fokussiert, 5 Min Pause (Diffuse Mode)',
      'Nach dem Lernen: Ohne Notizen zusammenfassen (Recall)',
      'Anki/Flashcards für Fakten-basiertes Wissen',
      'Projekt-basiertes Lernen: Sofort anwenden > Theorie',
      'Lehre anderen was du lernst (Protégé Effect)',
      'SQ3R: Survey, Question, Read, Recite, Review',
      'Mind Maps für Zusammenhänge und Übersicht',
      'Elaborative Interrogation: "Warum?" fragen',
      'Varied Practice: Gleiche Skills in verschiedenen Kontexten',
      'Pre-Test: Vor dem Lernen testen (Priming)',
      'Interleaved Practice: Themen mischen in einer Session',
      'Sleep on it: Wichtiges vor dem Schlafen reviewen',
    ],
    commonMistakes: [
      '❌ Passives Highlighten/Lesen (Illusion of Competence)',
      '❌ Cramming statt Spacing (vergisst du in 1 Woche)',
      '❌ Nur konsumieren, nie produzieren/anwenden',
      '❌ Keine Anwendung des Gelernten (Use it or lose it)',
      '❌ Re-reading statt Testing (ineffizienteste Methode)',
      '❌ Massed Practice (10h am Stück < 10x 1h)',
      '❌ Tutorial Hell: Nur zuschauen, nie selbst machen',
      '❌ Keine Feedback-Loops (blind üben)',
      '❌ Perfektionismus: Erst alles verstehen wollen vor Anwendung',
    ],
    milestoneTemplate: [
      'Ziel definieren: Was genau will ich können? (specific outcome)',
      'Deconstruct: Skill in Sub-Skills aufbrechen',
      'Ressourcen sammeln: Top 3-5 Quellen identifizieren',
      'Learning Plan: Strukturierter 20h-Plan erstellen',
      'Grundlagen: Erste 20h fokussiertes Lernen (Deliberate Practice)',
      'Erstes Projekt: Wissen praktisch anwenden (Build something)',
      'Feedback holen: Von Experten oder Community',
      'Anki Deck: Wichtigstes als Flashcards für Langzeit',
      'Teach: Jemandem beibringen oder Content erstellen',
      'Vertiefen: Schwächen gezielt üben mit Deliberate Practice',
      'Advanced: Nächstes Level - komplexere Anwendung',
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
  // PERSÖNLICHE ENTWICKLUNG ⭐ ERWEITERT
  // ==========================================
  'persoenlich': {
    category: 'Persönliche Entwicklung',
    sources: [
      'Stephen Covey - The 7 Habits of Highly Effective People',
      'Carol Dweck - Mindset: The New Psychology of Success',
      'Viktor Frankl - Mans Search for Meaning',
      'Jordan Peterson - 12 Rules for Life & Beyond Order',
      'Tony Robbins - Awaken the Giant Within',
      'Mark Manson - The Subtle Art of Not Giving a F*ck',
      'Ryan Holiday - The Obstacle Is the Way & Ego Is the Enemy',
      'Marcus Aurelius - Meditations (Stoizismus)',
      'Seneca - Letters from a Stoic',
      'Epictetus - The Enchiridion',
      'David Goggins - Cant Hurt Me',
      'Jocko Willink - Extreme Ownership',
      'Naval Ravikant - Almanack of Naval Ravikant',
      'James Clear - Atomic Habits',
      'Brené Brown - Daring Greatly',
    ],
    principles: [
      'Growth Mindset: Fähigkeiten sind entwickelbar, nicht fix (Dweck)',
      'Begin with the End in Mind: Klare Vision & Werte (Covey)',
      'Stoizismus: Kontrolliere was du kontrollieren kannst, akzeptiere den Rest',
      'Radical Responsibility: Du bist 100% für dein Leben verantwortlich (Jocko)',
      'Ikigai: Schnittmenge aus Passion, Mission, Beruf, Berufung finden',
      'Memento Mori: Zeit ist begrenzt - handle entsprechend (Stoiker)',
      'Amor Fati: Liebe dein Schicksal, auch die Hindernisse (Nietzsche)',
      'The Obstacle Is the Way: Probleme sind Wachstumschancen (Holiday)',
      'Callusing the Mind: Unbequemes tun stärkt (Goggins)',
      'Dichotomy of Control: Fokus nur auf Beeinflussbares (Epictetus)',
      'Compound Effect: Kleine Schritte täglich = massive Resultate',
      'Anti-Fragility: Durch Stress stärker werden (Taleb)',
    ],
    bestPractices: [
      'Morning Routine: Journaling, Meditation, Bewegung, Cold Shower',
      'Evening Review: Was lief gut? Was kann besser werden?',
      'Wöchentliche Reflexion: Big Picture nicht verlieren',
      'Dankbarkeits-Praxis: 3 Dinge täglich aufschreiben',
      'Bücher lesen: 1 Buch/Monat Minimum (audiobooks zählen)',
      'Mentoren suchen: Von den Besten lernen (auch Bücher/Podcasts)',
      'Comfort Zone verlassen: Täglich eine Sache die unangenehm ist',
      'Negative Visualization: Worst Case durchdenken (Stoiker)',
      'Physical Challenge: Körperliche Härte für mentale Stärke',
      'Digital Minimalism: Social Media & News reduzieren',
      'Journaling: Morning Pages oder Evening Reflection',
      '5-Minuten-Journal: Dankbarkeit + Intention + Reflection',
      'Fear Setting: Ängste aufschreiben und durcharbeiten (Ferriss)',
      'Weekly Accountability: Coach, Mastermind oder Partner',
    ],
    commonMistakes: [
      '❌ Konsum ohne Umsetzung (Bücher lesen aber nichts ändern)',
      '❌ Zu viele Ziele gleichzeitig (Focus on ONE thing)',
      '❌ External Validation suchen statt Internal Standards',
      '❌ Vergleich mit anderen statt mit gestern-Ich',
      '❌ Perfektionismus statt Progress (done > perfect)',
      '❌ Waiting for motivation (Action creates motivation)',
      '❌ Avoiding discomfort (Growth happens outside comfort zone)',
      '❌ Blaming circumstances (Extreme Ownership fehlt)',
      '❌ All-or-Nothing Thinking (80% consistency > 100% sometimes)',
    ],
    milestoneTemplate: [
      'Selbstreflexion: Wo stehe ich? Wo will ich hin? (Life Audit)',
      'Core Values definieren: Top 5 Werte identifizieren',
      'Morning Routine etablieren: 30 Tage Challenge',
      'Journaling-Praxis: Täglich 5-10 Min schreiben',
      '3 Foundational Bücher lesen (Covey, Dweck, Holiday)',
      'Fear Face: Eine große Angst konfrontieren',
      'Physical Challenge: Etwas Hartes durchziehen (5am Club, Cold Shower)',
      'Quarterly Review: Fortschritt messen und adjustieren',
      'Mentor finden: Coach, Mastermind oder Accountability Partner',
      'Nächstes Level: Größeres Ziel definieren und committen',
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
  // BUSINESS / EIGENES PRODUKT ⭐ ERWEITERT
  // ==========================================
  'business': {
    category: 'Business & Eigenes Produkt',
    sources: [
      'Eric Ries - The Lean Startup',
      'Peter Thiel - Zero to One',
      'Rob Fitzpatrick - The Mom Test',
      'Naval Ravikant - Almanack of Naval (How to Get Rich)',
      'Alex Hormozi - $100M Offers & $100M Leads',
      'Seth Godin - Purple Cow & This Is Marketing',
      'Simon Sinek - Start With Why',
      'Jason Fried - Rework & Getting Real',
      'Paul Graham - Essays (YC Founder)',
      'Marc Andreessen - The pmarca Guide to Startups',
      'Justin Welsh - The LinkedIn Playbook',
      'Russell Brunson - DotCom Secrets',
      'MJ DeMarco - The Millionaire Fastlane',
      'Daniel Priestley - Oversubscribed',
    ],
    principles: [
      'Build → Measure → Learn: Schnelle Iterationen schlagen perfekte Pläne',
      'MVP: Minimum Viable Product - so wenig wie möglich, so viel wie nötig',
      'Talk to customers BEFORE building: Validierung > Annahmen',
      'Ship fast, iterate faster: Done > Perfect',
      'Solve a real problem: Problem Market fit vor Product Market Fit',
      'Distribution > Product: Ein mittelmäßiges Produkt mit großartigem Marketing schlägt umgekehrt',
      'Grand Slam Offer (Hormozi): So gut, dass Nein dumm wäre',
      'Specific Avatar > Everyone: Nische dominieren, dann expandieren',
      'Cash Flow > Funding: Profitabilität von Tag 1 anstreben',
      'Personal Brand = Leverage: Audience aufbauen vor Produkt',
      'Value Equation: Dream Outcome × Perceived Likelihood / Time × Effort',
      '1000 True Fans (Kevin Kelly): Du brauchst keine Millionen',
    ],
    bestPractices: [
      '20+ potenzielle Kunden interviewen (Mom Test: Echte Probleme finden)',
      'Landing Page vor dem Produkt (Smoke Test)',
      'Pre-Sales/Waitlist validiert echte Nachfrage (Payment > Interesse)',
      'Erste Version in 2-4 Wochen shippen (nicht 6 Monate)',
      'Pricing early: Würden Leute ZAHLEN? (Geld spricht Wahrheit)',
      'Nische dominieren: 1000 echte Fans > 1M Follower',
      'Build in Public: Audience aufbauen während du baust',
      'Content Marketing: Wert geben bevor du verkaufst',
      'Email List: Eigene Audience > Social Media Followers',
      'Iterate on feedback: Weekly User Interviews',
      'Metrics that matter: Revenue, Churn, LTV, CAC',
      'Automation: Prozesse systematisieren für Scale',
    ],
    commonMistakes: [
      '❌ Monate in "stealth mode" bauen (niemand klaut deine Idee)',
      '❌ Freunde/Familie als Validierung (sie lügen aus Höflichkeit)',
      '❌ Features > Problem-Solution Fit (Lösung für Problem das nicht existiert)',
      '❌ Perfektionismus vor Launch (Done > Perfect)',
      '❌ Zu früh skalieren (Retention vor Growth)',
      '❌ Kein klarer ICP (Ideal Customer Profile)',
      '❌ Pricing zu niedrig (Undercharging = Untergang)',
      '❌ Zu viele Features (Feature Creep)',
      '❌ Solo alles machen wollen (Leverage nutzen!)',
      '❌ Vanity Metrics tracken (Followers ≠ Revenue)',
    ],
    milestoneTemplate: [
      'Problem identifizieren: Was nervt eine spezifische Gruppe?',
      '20 Problem-Interviews durchführen (Mom Test)',
      'ICP definieren: Wer ist der ideale Kunde? (specific avatar)',
      'Offer erstellen: Grand Slam Offer (Hormozi Framework)',
      'Landing Page: Smoke Test mit Waitlist',
      'Pre-Sales: Können Leute JETZT kaufen?',
      'MVP in 2-4 Wochen bauen (80/20)',
      'Erste 10 zahlende Kunden gewinnen',
      'Feedback Loop: Weekly User Calls',
      'Iterate: Product verbessern basierend auf Feedback',
      'Unit Economics: CAC, LTV, Churn verstehen',
      'Scale: Wenn Retention stimmt, Growth pushen',
    ],
  },

  // ==========================================
  // MEDITATION & MINDFULNESS
  // ==========================================
  'meditation': {
    category: 'Meditation & Mindfulness',
    sources: [
      'Sam Harris - Waking Up (App & Buch)',
      'Jon Kabat-Zinn - Full Catastrophe Living (MBSR)',
      'Dr. Andrew Huberman - Huberman Lab (Meditation Science)',
      'Joseph Goldstein - Insight Meditation',
      'Thich Nhat Hanh - The Miracle of Mindfulness',
      'Dan Harris - 10% Happier',
      'Michael Singer - The Untethered Soul',
      'Eckhart Tolle - The Power of Now',
      'Headspace - Andy Puddicombe',
    ],
    principles: [
      'Meditation ist Gehirntraining, nicht Entspannung',
      'Konsistenz > Dauer: 10 Min täglich > 1h gelegentlich',
      'Der Gedanke ist nicht das Problem - die Identifikation damit schon',
      'Focused Attention → Open Awareness → Non-Dual (Progression)',
      'Atem als Anker: Immer verfügbar, immer präsent',
      'NSDR (Non-Sleep Deep Rest) für schnelle Erholung',
      'Meditation verändert Gehirnstruktur (Neuroplastizität)',
      'Default Mode Network beruhigen = weniger Gedankenkreisen',
    ],
    bestPractices: [
      'Morgens meditieren: Bevor das Handy angeht',
      'Gleiche Zeit, gleicher Ort = Habit-Trigger',
      'Waking Up App für geführte Meditationen',
      'Mit 5-10 Minuten starten, langsam steigern',
      'NSDR/Yoga Nidra für tiefe Erholung (10-30 Min)',
      'Atem-Fokus: 4-7-8 oder Box Breathing',
      'Body Scan für Körperbewusstsein',
      'Nicht urteilen wenn Gedanken kommen - zurück zum Atem',
      'Retreat besuchen für intensive Praxis',
    ],
    commonMistakes: [
      '❌ "Ich kann nicht meditieren, meine Gedanken stoppen nicht"',
      '❌ Erwarten dass es sofort "funktioniert"',
      '❌ Nur meditieren wenn gestresst (zu spät)',
      '❌ Zu lange Sessions am Anfang (führt zu Aufgeben)',
      '❌ Keine feste Zeit/Routine',
      '❌ Meditation als Performance sehen',
      '❌ Aufgeben nach ein paar Tagen',
    ],
    milestoneTemplate: [
      'App wählen: Waking Up, Headspace, oder Timer',
      '7 Tage Streak: Täglich 5 Min meditieren',
      '30 Tage Streak: Habit gefestigt',
      'Auf 10-15 Min erhöhen',
      'Verschiedene Techniken testen (Atem, Body Scan, Open Awareness)',
      'Erste "Aha-Momente": Gedanken beobachten ohne Reaktion',
      'Meditation in Alltag integrieren (Mini-Pausen)',
      '3 Monate konsistent: Spürbare Veränderung in Stressreaktion',
    ],
  },

  // ==========================================
  // KAMPFSPORT & SELBSTVERTEIDIGUNG
  // ==========================================
  'kampfsport': {
    category: 'Kampfsport & Selbstverteidigung',
    sources: [
      'Jocko Willink - Discipline Equals Freedom',
      'Joe Rogan - JRE Martial Arts Episodes',
      'Firas Zahabi - Tristar Gym / YouTube',
      'John Danaher - BJJ Instructionals',
      'Bas Rutten - MMA Pioneer',
      'Rickson Gracie - Breathe (Dokumentation)',
      'Bruce Lee - Tao of Jeet Kune Do',
      'Georges St-Pierre - The Way of the Fight',
      'Kron Gracie / Gracie Family - BJJ Fundamentals',
    ],
    principles: [
      'BJJ ist das effektivste 1v1 System (Gracie Challenge bewiesen)',
      'Position before Submission: Kontrolle > Finish',
      'Tap early, tap often: Ego tötet Progress',
      'Drilling macht Techniken zu Reflexen',
      'Sparring ist der ultimative Test',
      'Cardio ist dein bester Freund im Fight',
      'Mindset: Der Kampf beginnt wenn du müde bist',
      'Selbstverteidigung = Awareness + De-escalation + Technik',
    ],
    bestPractices: [
      'BJJ als Basis: 2-3x pro Woche Gi oder NoGi',
      'Striking ergänzen: Boxen oder Muay Thai 1-2x',
      'Drilling: Techniken 100+ Mal wiederholen',
      'Sparring: Mindestens 1x pro Woche mit verschiedenen Partnern',
      'Video-Analyse: Eigene Rolls aufnehmen und analysieren',
      'Instructionals schauen: Danaher, Gordon Ryan, etc.',
      'Cardio separat: Laufen, Schwimmen, Rudern',
      'Recovery priorisieren: Schlaf, Stretching, Sauna',
      'Competition als Benchmark (optional aber wertvoll)',
    ],
    commonMistakes: [
      '❌ Zu hart rollen als Anfänger (Verletzungen)',
      '❌ Ego nicht am Eingang lassen',
      '❌ Nur Offense, keine Defense',
      '❌ Techniken nicht drillen (nur sparren)',
      '❌ Cardio vernachlässigen',
      '❌ Schlechte Gym-Wahl (Kultur ist wichtig)',
      '❌ Zu früh aufgeben (Blau-Gurt-Depression)',
      '❌ Street Fight suchen statt vermeiden',
    ],
    milestoneTemplate: [
      'Gym finden: Probetraining, Kultur checken',
      'Erste 10 Sessions: Grundpositionen verstehen',
      'Erste Submissions lernen: RNC, Armbar, Triangle',
      '3 Monate: Grundlagen sitzen, Flow entwickelt sich',
      '6 Monate: Eigenes Spiel entwickeln',
      'Erster Wettkampf (optional): Nervenstärke testen',
      'Blaugurt: ~1.5-2 Jahre (BJJ) - Grundlagen gemeistert',
      'Lebenslanges Lernen: Jeder Gurt ist ein neuer Anfang',
    ],
  },

  // ==========================================
  // BIOHACKING & LONGEVITY
  // ==========================================
  'biohacking': {
    category: 'Biohacking & Longevity',
    sources: [
      'Dr. Peter Attia - Outlive (Buch) & The Drive Podcast',
      'Dr. Andrew Huberman - Huberman Lab Podcast',
      'Bryan Johnson - Blueprint Protocol',
      'Dr. Rhonda Patrick - FoundMyFitness',
      'David Sinclair - Lifespan (Buch)',
      'Ben Greenfield - Boundless',
      'Tim Ferriss - The 4-Hour Body',
      'Dr. Mark Hyman - The Pegan Diet',
      'Wim Hof - The Wim Hof Method',
    ],
    principles: [
      'Die 4 Säulen der Longevity: Bewegung, Ernährung, Schlaf, Stress',
      'Zone 2 Cardio ist der Longevity-Gamechanger (3-4h/Woche)',
      'Krafttraining für Muskelmasse = Longevity-Versicherung',
      'VO2 Max ist der beste Prädiktor für Langlebigkeit',
      'Metabolische Gesundheit: Blutzucker stabil halten',
      'Autophagie: Zelluläre Reinigung durch Fasten',
      'Hormesis: Kontrollierten Stress = Anpassung (Kälte, Hitze)',
      'Bloodwork ist Pflicht: Was du nicht misst, kannst du nicht verbessern',
    ],
    bestPractices: [
      'Zone 2 Cardio: 3-4x 45-60 Min/Woche (Nasenatemtest)',
      'Krafttraining: 2-3x/Woche, Progressive Overload',
      'Schlaf: 7-9h, Konsistente Zeiten, 18°C Schlafzimmer',
      'Kälte-Exposition: 11 Min/Woche verteilt (Dusche, Eisbad)',
      'Sauna: 3-4x 20 Min bei 80-100°C (Kreislauf, Hitzeshock-Proteine)',
      'Time-Restricted Eating: 16:8 oder ähnlich',
      'Bloodwork: 2x/Jahr umfassend (Lipide, Hormone, Entzündung)',
      'Supplements: Omega-3, Vitamin D, Magnesium als Basis',
      'CGM (Continuous Glucose Monitor) für Blutzucker-Insights',
      'HRV Tracking: Oura, Whoop für Recovery-Messung',
    ],
    commonMistakes: [
      '❌ Supplements ohne Bloodwork (raten statt messen)',
      '❌ Zu viel High Intensity, zu wenig Zone 2',
      '❌ Schlaf vernachlässigen für mehr Training',
      '❌ Trends folgen ohne Grundlagen (Kälte ohne Schlaf ist sinnlos)',
      '❌ Fasten zu extrem (Muskelverlust)',
      '❌ Zu viele Supplements auf einmal starten',
      '❌ Kurzfristig denken statt 10-30 Jahre voraus',
    ],
    milestoneTemplate: [
      'Baseline Bloodwork: Lipide, Hormone, Entzündungsmarker',
      'Schlaf optimieren: 7.5h, konsistente Zeiten',
      'Zone 2 starten: 3x 30 Min/Woche aufbauen',
      'Krafttraining: 2x/Woche, Hauptübungen',
      'Kälte/Hitze: Kalte Duschen, ggf. Sauna',
      'Ernährung: Time-Restricted Eating testen',
      'Follow-up Bloodwork: Nach 3 Monaten',
      'Tracking optimieren: HRV, Schlaf, Gewohnheiten',
      'Jährlicher Longevity-Check: VO2 Max, DEXA, umfassendes Bloodwork',
    ],
  },

  // ==========================================
  // NETWORKING & AKQUISE / SALES
  // ==========================================
  'networking': {
    category: 'Networking & Akquise / Sales',
    sources: [
      'Alex Hormozi - $100M Leads & $100M Offers',
      'Jeb Blount - Fanatical Prospecting',
      'Grant Cardone - The 10X Rule',
      'Jordan Belfort - Way of the Wolf',
      'Dale Carnegie - How to Win Friends and Influence People',
      'Chris Voss - Never Split the Difference',
      'Zig Ziglar - Secrets of Closing the Sale',
      'Keith Ferrazzi - Never Eat Alone',
      'Daniel Pink - To Sell Is Human',
    ],
    principles: [
      'Volume ist King: 100 Nein führen zu 10+ Ja',
      'Give first, ask second: Wert liefern bevor du fragst',
      'People buy from people they like and trust',
      'Pain > Pleasure als Motivator (Problem-Fokus)',
      'Follow-up ist alles: 80% der Deals passieren nach 5+ Kontakten',
      'Der beste Closer ist der beste Zuhörer',
      'Networking = Langzeit-Investment, nicht Quick-Win',
      'Cold Outreach funktioniert wenn personalisiert und wertvoll',
    ],
    bestPractices: [
      '50-100 Outreach-Aktivitäten pro Tag (Calls, DMs, Emails)',
      'Personalisierung: Recherche vor dem Kontakt',
      'Problem-erste Kommunikation: "Ich sehe dass X ein Problem ist..."',
      'CRM pflegen: Jeden Kontakt dokumentieren',
      'Follow-up System: 5-12 Touchpoints pro Lead',
      'Warm Intros > Cold Outreach (LinkedIn, gemeinsame Kontakte)',
      'Content als Magnet: LinkedIn Posts, YouTube, Newsletter',
      'Events besuchen: Konferenzen, Meetups, Messen',
      'Geben ohne Erwartung: Kontakte vernetzen, Empfehlungen geben',
    ],
    commonMistakes: [
      '❌ Aufgeben nach 1-2 Versuchen',
      '❌ Pitch-first statt Listen-first',
      '❌ Keine Personalisierung (Copy-Paste)',
      '❌ Zu viel reden, zu wenig fragen',
      '❌ Kein Follow-up System',
      '❌ Nur nehmen, nie geben',
      '❌ Networking nur wenn man etwas braucht',
      '❌ Preis zu früh nennen (Wert erst etablieren)',
    ],
    milestoneTemplate: [
      'Zielgruppe definieren: Wer ist mein idealer Kunde/Kontakt?',
      'Outreach-System aufbauen: CRM, Templates, Tracking',
      'Erste 100 Cold Outreaches (Email/LinkedIn)',
      'Antwortrate analysieren: Was funktioniert?',
      'Erste 10 Gespräche/Meetings',
      'Follow-up System etablieren: 5+ Touchpoints',
      'Erster Deal/Kunde durch Cold Outreach',
      'Referral-System: Bestehende Kunden um Empfehlungen bitten',
      'Thought Leadership: Content der Zielgruppe anspricht',
    ],
  },

  // ==========================================
  // LESEN & WISSEN AUFBAUEN
  // ==========================================
  'lesen': {
    category: 'Lesen & Wissen aufbauen',
    sources: [
      'Mortimer Adler - How to Read a Book',
      'Ryan Holiday - Reading List & Methods',
      'Naval Ravikant - Reading Advice',
      'Tiago Forte - Building a Second Brain',
      'Sönke Ahrens - How to Take Smart Notes (Zettelkasten)',
      'Cal Newport - Slow Productivity',
      'Shane Parrish - Farnam Street / The Great Mental Models',
      'Tim Ferriss - Reading & Learning Methods',
    ],
    principles: [
      'Lesen ist Compound Interest für den Geist',
      'Quality > Quantity: 1 Buch tief verstehen > 10 überfliegen',
      'Aktives Lesen: Markieren, Notizen, Zusammenfassen',
      'Second Brain: Wissen externalisieren (Notion, Obsidian)',
      'Zettelkasten: Atomare Notizen, verlinkt für Insights',
      'Bücher nicht zu Ende lesen müssen - Zeit ist endlich',
      'Re-Reading der besten Bücher > Neue mittelmäßige Bücher',
      'Wissen ohne Anwendung ist nutzlos',
    ],
    bestPractices: [
      '30-60 Min Lesezeit täglich blocken (morgens ideal)',
      'Physische Bücher für Deep Reading, Kindle für Convenience',
      'Marginalia: Im Buch markieren und notieren',
      'Nach jedem Kapitel: Was habe ich gelernt? Was wende ich an?',
      'Buchzusammenfassung schreiben: 1 Seite nach Abschluss',
      'Zettelkasten/Notion: Ideen verlinken und ausbauen',
      'Bücher kuratieren: Bestseller-Listen, Empfehlungen von Experten',
      'Hörbücher für Commute, Gym, Hausarbeit',
      'Antilibrary: Bücher die man noch lesen will als Inspiration',
      'Book Clubs: Diskussion verstärkt Verständnis',
    ],
    commonMistakes: [
      '❌ Bücher kaufen aber nie lesen',
      '❌ Passiv lesen ohne Notizen',
      '❌ Zu viele Bücher parallel',
      '❌ Nur Sachbücher oder nur Fiction (Balance)',
      '❌ Nie wiederholen - einmal lesen und vergessen',
      '❌ Schlechte Bücher zu Ende lesen (Sunk Cost)',
      '❌ Wissen konsumieren ohne anzuwenden',
      '❌ Keine Routine/feste Lesezeit',
    ],
    milestoneTemplate: [
      'Lesezeit blocken: Täglich 30 Min fest einplanen',
      'Erstes Buch mit aktivem Lesen (Markieren, Notizen)',
      'Buchzusammenfassung schreiben',
      '3 Bücher im ersten Monat',
      'Notiz-System aufbauen: Notion, Obsidian, oder Zettelkasten',
      'Ideen verknüpfen: Verbindungen zwischen Büchern finden',
      '12 Bücher im ersten Jahr (1/Monat)',
      'Wissen anwenden: Mindestens 1 Insight pro Buch umsetzen',
      'Top-Bücher re-readen nach 1 Jahr',
    ],
  },

  // ==========================================
  // PSYCHOLOGIE & VERHALTENSÄNDERUNG ⭐ NEU
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
      'Identity-Based Change > Outcome-Based: "Ich BIN jemand der..." > "Ich will..."',
      
      // Kognitive Psychologie
      'System 1 vs. System 2: Schnelles Denken (automatisch) vs. Langsames Denken (bewusst)',
      'Cognitive Biases: Confirmation Bias, Sunk Cost, Loss Aversion kennen',
      'Loss Aversion: Verluste wiegen 2x so schwer wie Gewinne',
      'Availability Heuristic: Was leicht abrufbar ist, scheint häufiger',
      'Anchoring: Erste Zahl beeinflusst alle folgenden Schätzungen',
      
      // Motivation
      'Intrinsic > Extrinsic Motivation: Autonomie, Kompetenz, Verbundenheit (SDT)',
      'Flow State: Optimale Herausforderung + klare Ziele + Feedback = Flow',
      'Variable Rewards: Unvorhersehbare Belohnungen = mehr Dopamin',
      'Progress Principle: Sichtbarer Fortschritt ist der stärkste Motivator',
      'Goal Gradient Effect: Je näher das Ziel, desto mehr Effort',
      
      // Sozialpsychologie
      'Social Proof: Menschen tun was andere tun (besonders Ähnliche)',
      'Commitment & Consistency: Kleine Commitments → größere Commitments',
      'Reciprocity: Menschen wollen zurückgeben was sie bekommen haben',
      'Scarcity: Knappes wirkt wertvoller',
      'Authority: Experten wird mehr vertraut',
    ],
    bestPractices: [
      // Verhaltensänderung
      'Habit Stacking: Neue Gewohnheit an bestehende knüpfen',
      '2-Minute Rule: Jede neue Gewohnheit auf 2 Min reduzieren',
      'Temptation Bundling: Wollen + Müssen kombinieren',
      'Friction Design: Gutes einfacher, Schlechtes schwerer machen',
      'Visual Cues: Trigger sichtbar machen (z.B. Sportkleidung rauslegen)',
      
      // Motivation hacken
      'Progress Bars: Visuellen Fortschritt zeigen (Goal Gradient)',
      'Streaks: Unbroken Chains nutzen (Loss Aversion)',
      'Fresh Starts: Neue Anfänge nutzen (Montag, 1. des Monats, Geburtstag)',
      'Implementation Intentions: "Um [ZEIT] werde ich [VERHALTEN] an [ORT]"',
      'Accountability: Öffentlich committen oder Partner finden',
      
      // Kognitive Strategien
      'Pre-Commitment: Entscheidungen im Voraus treffen (wenn System 2 aktiv)',
      'Mental Contrasting: Ziel visualisieren UND Hindernisse antizipieren',
      'Reframing: Situation neu interpretieren (Challenge vs. Threat)',
      'Self-Compassion: Bei Rückschlägen nicht selbst verurteilen',
      'Peak-End Rule: Erlebnisse positiv beenden',
    ],
    commonMistakes: [
      '❌ Auf Motivation warten (Action creates motivation, not vice versa)',
      '❌ Zu große Schritte (Überwältigung → Aufgeben)',
      '❌ Willenskraft überschätzen (Environment Design ist nachhaltiger)',
      '❌ Extrinsische Motivation zu sehr betonen (unterminiert intrinsische)',
      '❌ All-or-Nothing Thinking (80% Konsistenz > 100% manchmal)',
      '❌ Negative Self-Talk nach Rückschlägen (What-The-Hell Effect)',
      '❌ Outcome-Focus statt Process-Focus',
      '❌ Social Comparison (dich mit anderen vergleichen statt mit dir gestern)',
      '❌ Kognitive Biases ignorieren (wir alle haben sie)',
      '❌ Abstrakte Ziele ohne konkrete Implementation Intentions',
    ],
    milestoneTemplate: [
      'Selbstanalyse: Welche Gewohnheiten/Verhaltensweisen will ich ändern?',
      'Trigger identifizieren: Was löst ungewolltes Verhalten aus?',
      'Tiny Habit definieren: 2-Minuten-Version des Zielverhaltens',
      'Implementation Intention: "Wenn [TRIGGER], dann [VERHALTEN]"',
      'Environment Design: Umgebung für Erfolg optimieren',
      '7-Tage Streak: Kleine Konsistenz aufbauen',
      '30-Tage Challenge: Habit Festigung',
      'Identity Shift: "Ich bin jemand, der [VERHALTEN] tut"',
      'Habit Stacking: Nächste Gewohnheit an etablierte knüpfen',
      'System Review: Was funktioniert? Was anpassen?',
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
      'Alan Aragon - Research Review',
      'Chris Masterjohn PhD - Nutritional Sciences',
      'Bryan Johnson - Blueprint Protocol',
      'David Sinclair PhD - Lifespan Research',
      'Tim Ferriss - Tools of Titans (Supplement Stacks)',
      'Ben Greenfield - Boundless (Biohacking)',
      'ConsumerLab.com - Independent Testing',
      'Labdoor.com - Supplement Purity Testing',
      'PubMed - Peer-Reviewed Studies',
    ],
    principles: [
      'Evidence-Based: Nur Supplements mit solider Studienlage (RCTs, Meta-Analysen)',
      'Dosierung matters: Zu wenig = kein Effekt, zu viel = Toxizität',
      'Timing ist entscheidend: Fettlöslich mit Fett, nüchtern vs. mit Mahlzeit',
      'Interaktionen beachten: Zink/Kupfer, Calcium/Magnesium, Eisen/Zink',
      'Qualität > Preis: Third-Party Testing (NSF, USP, ConsumerLab)',
      'Baseline Testing: Blutwerte VOR Supplementierung messen',
      'N=1 Experimentation: Individuell testen, was wirkt',
      'Cycling: Manche Supplements zyklisch nehmen (nicht dauerhaft)',
      'Food First: Supplements ergänzen, ersetzen keine gute Ernährung',
      'Hierarchie: Schlaf → Ernährung → Training → DANN Supplements',
      'Cost-Benefit: ROI pro Dollar/Euro berechnen',
      'Bioavailability: Form des Supplements beeinflusst Aufnahme massiv',
    ],
    bestPractices: [
      // GRUNDLAGEN (Jeder sollte testen)
      'Vitamin D3: 2000-5000 IU/Tag (Ziel: 40-60 ng/ml), mit Fett + K2',
      'Omega-3 (EPA/DHA): 2-3g/Tag, triglyceride Form > Ethyl Ester',
      'Magnesium: 300-400mg/Tag, Glycinat/Threonat > Oxid (abends)',
      'Vitamin K2 (MK-7): 100-200mcg mit D3 für Calcium-Routing',
      'Zink: 15-30mg nur bei Mangel, nicht dauerhaft (Kupfer-Balance)',
      
      // PERFORMANCE & ENERGIE
      'Kreatin Monohydrat: 5g/Tag täglich, günstigstes High-ROI Supplement',
      'Koffein: 100-200mg strategisch, 8h vor Schlaf stoppen',
      'L-Theanin: 100-200mg mit Koffein für Focus ohne Jitter',
      'Beta-Alanin: 3-5g/Tag für Ausdauer (Tingeln ist normal)',
      'Citrullin Malat: 6-8g pre-workout für Pump & Ausdauer',
      
      // SCHLAF & RECOVERY
      'Magnesium Glycinat: 300-400mg 1h vor Schlaf',
      'Glycin: 3g vor Schlaf für Tiefschlaf-Qualität',
      'Apigenin: 50mg vor Schlaf (aus Kamille)',
      'L-Theanin: 200mg vor Schlaf für Entspannung',
      'Tart Cherry: 500mg für natürliches Melatonin',
      
      // KOGNITION & FOCUS
      'Alpha-GPC: 300mg für Acetylcholin & Focus',
      'Lions Mane: 500-1000mg für NGF & Neuroplastizität',
      'Bacopa Monnieri: 300mg für Gedächtnis (12 Wochen für Effekt)',
      'Rhodiola Rosea: 200-400mg für Stress-Resilienz',
      'Phosphatidylserin: 100-300mg für Cortisol-Reduktion',
      
      // LONGEVITY & HEALTH
      'NMN/NR: 250-500mg für NAD+ (Longevity, umstritten)',
      'Resveratrol: 500mg mit Fett (Synergist für NMN)',
      'Sulforaphan: Brokkolisprossen > Supplements',
      'Curcumin: 500mg mit Piperin/Fett für Absorption',
      'Berberine: 500mg 3x täglich (Metformin-Alternative)',
      
      // IMMUNSYSTEM
      'Vitamin C: 500-1000mg nur bei Erkältung/Stress',
      'Quercetin: 500mg als Zink-Ionophor',
      'Elderberry: Bei ersten Erkältungssymptomen',
      'NAC: 600-1200mg für Glutathion-Produktion',
    ],
    commonMistakes: [
      '❌ Keine Blutwerte vor Supplementierung (blinde Supplementierung)',
      '❌ Zu viele Supplements auf einmal starten (keine Kausalität erkennbar)',
      '❌ Billigste Option kaufen (schlechte Absorption, Verunreinigungen)',
      '❌ Mega-Dosierungen ohne Grund (mehr ≠ besser)',
      '❌ Timing ignorieren (fettlöslich ohne Fett, Magnesium morgens)',
      '❌ Interaktionen ignorieren (Zink dauerhaft ohne Kupfer)',
      '❌ Supplements als Ersatz für Basics (Schlaf, Ernährung, Training)',
      '❌ Marketing-Hypes folgen (Einzelstudien ≠ Evidenz)',
      '❌ Nicht zyklisch nehmen (Adaptionen, Rezeptor-Downregulation)',
      '❌ Subjektive Wirkung als Beweis (Placebo ist stark)',
      '❌ Proprietäre Blends kaufen (versteckte Unterdosierungen)',
      '❌ Vergessen dass Ernährung 90% ausmacht',
    ],
    milestoneTemplate: [
      'Baseline Blutbild: Vitamin D, B12, Ferritin, Magnesium, Zink messen',
      'Foundation Stack: D3+K2, Omega-3, Magnesium einführen',
      'Timing optimieren: Morgen/Abend/Mit Mahlzeit systematisieren',
      'Performance Stack: Kreatin, Koffein+Theanin testen',
      'Sleep Stack: Magnesium Glycinat, Glycin, Apigenin',
      'Cognitive Stack: Alpha-GPC, Lions Mane evaluieren',
      'Re-Test: Blutwerte nach 3 Monaten kontrollieren',
      'Optimierung: Basierend auf Werten anpassen',
    ],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getExpertKnowledge(category: string): ExpertInsight | null {
  const normalizedCategory = category.toLowerCase()
    .replace(/[äöü]/g, match => ({ 'ä': 'a', 'ö': 'o', 'ü': 'u' }[match] || match))
    .replace(/[^a-z]/g, '');
  
  if (EXPERT_KNOWLEDGE[normalizedCategory]) {
    return EXPERT_KNOWLEDGE[normalizedCategory];
  }
  
  const keywordMap: Record<string, string> = {
    // New categories (highest priority)
    'meditation': 'meditation', 'meditieren': 'meditation', 'mindfulness': 'meditation', 'achtsamkeit': 'meditation', 'nsdr': 'meditation', 'breathwork': 'meditation',
    'kampfsport': 'kampfsport', 'bjj': 'kampfsport', 'mma': 'kampfsport', 'boxen': 'kampfsport', 'muaythai': 'kampfsport', 'judo': 'kampfsport', 'selbstverteidigung': 'kampfsport',
    'biohacking': 'biohacking', 'longevity': 'biohacking', 'langlebigkeit': 'biohacking', 'vo2max': 'biohacking', 'autophagie': 'biohacking', 'zone2': 'biohacking',
    'networking': 'networking', 'akquise': 'networking', 'sales': 'networking', 'vertrieb': 'networking', 'coldcalling': 'networking', 'leads': 'networking', 'outreach': 'networking',
    'lesen': 'lesen', 'bucher': 'lesen', 'buch': 'lesen', 'reading': 'lesen', 'zettelkasten': 'lesen', 'secondbrain': 'lesen',
    // Supplements
    'supplements': 'supplements', 'supplement': 'supplements', 'nahrungserganzung': 'supplements', 'vitamine': 'supplements', 
    'vitamin': 'supplements', 'mineralien': 'supplements', 'kreatin': 'supplements', 'creatine': 'supplements', 
    'omega3': 'supplements', 'fischol': 'supplements', 'magnesium': 'supplements', 'zink': 'supplements',
    'nmn': 'supplements', 'nad': 'supplements', 'resveratrol': 'supplements', 'nootropics': 'supplements',
    'stack': 'supplements', 'longevitysupplements': 'supplements', 'preworkout': 'supplements',
    // Psychologie (specific keywords only - no duplicates)
    'psychologie': 'psychologie', 'psychology': 'psychologie', 'verhalten': 'psychologie', 'behavior': 'psychologie',
    'kognitiv': 'psychologie', 'bias': 'psychologie', 'willenskraft': 'psychologie',
    'prokrastination': 'psychologie', 'selbstkontrolle': 'psychologie', 'dopamin': 'psychologie',
    // Existing categories
    'rhetorik': 'rhetorik', 'kommunikation': 'rhetorik', 'praesentation': 'rhetorik', 'reden': 'rhetorik', 'sprechen': 'rhetorik',
    'fitness': 'fitness', 'abnehmen': 'fitness', 'sport': 'fitness', 'training': 'fitness', 'gewicht': 'fitness', 'gesundheit': 'fitness',
    'muskelaufbau': 'muskelaufbau', 'bodybuilding': 'muskelaufbau', 'hypertrophie': 'muskelaufbau', 'masse': 'muskelaufbau', 'bulk': 'muskelaufbau',
    'trt': 'trt', 'testosteron': 'trt', 'hormon': 'trt', 'enhanced': 'trt', 'steroid': 'trt', 'enantat': 'trt', 'cypionat': 'trt',
    'karriere': 'karriere', 'job': 'karriere', 'arbeit': 'karriere', 'beforderung': 'karriere',
    'produktiv': 'produktivitaet', 'produktivitat': 'produktivitaet', 'fokus': 'produktivitaet', 'deepwork': 'produktivitaet', 'pomodoro': 'produktivitaet',
    'finanzen': 'finanzen', 'geld': 'finanzen', 'sparen': 'finanzen', 'investieren': 'finanzen', 'vermogen': 'finanzen',
    'lernen': 'lernen', 'skill': 'lernen', 'studium': 'lernen', 'weiterbildung': 'lernen',
    'sprache': 'sprachen', 'englisch': 'sprachen', 'spanisch': 'sprachen', 'japanisch': 'sprachen', 'anki': 'sprachen', 'vokabel': 'sprachen',
    'schlaf': 'schlaf', 'schlafen': 'schlaf', 'sleep': 'schlaf', 'mude': 'schlaf',
    'ki': 'ki', 'kunstlich': 'ki', 'ai': 'ki', 'chatgpt': 'ki', 'claude': 'ki', 'gpt': 'ki', 'llm': 'ki',
    'prompting': 'prompting', 'prompt': 'prompting',
    'gewohnheit': 'gewohnheiten', 'habit': 'gewohnheiten', 'routine': 'gewohnheiten',
    'personlich': 'persoenlich', 'entwicklung': 'persoenlich', 'selbstverbesserung': 'persoenlich', 'wachstum': 'persoenlich', 'disziplin': 'persoenlich',
    'mindset': 'persoenlich', 'motivation': 'persoenlich', 'flow': 'persoenlich',
    'beziehung': 'beziehungen', 'freund': 'beziehungen', 'partner': 'beziehungen', 'sozial': 'beziehungen',
    'fuhrerschein': 'fuehrerschein', 'auto': 'fuehrerschein', 'fahren': 'fuehrerschein', 'prufung': 'fuehrerschein',
    'business': 'business', 'produkt': 'business', 'startup': 'business', 'grunden': 'business', 'unternehmen': 'business',
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
    // Specific categories first (higher priority)
    'trt': ['trt', 'testosteron', 'enantat', 'cypionat', 'hormon', 'enhanced', 'steroid', 'zyklus', 'cycle', '250mg', 'injektion'],
    'biohacking': ['biohacking', 'longevity', 'langlebigkeit', 'zone 2', 'vo2 max', 'autophagie', 'fasten', 'kälte', 'sauna', 'bloodwork', 'cgm', 'hrv', 'oura', 'whoop', 'peter attia', 'huberman'],
    'meditation': ['meditation', 'meditieren', 'mindfulness', 'achtsamkeit', 'yoga', 'nsdr', 'yoga nidra', 'waking up', 'headspace', 'calm', 'atmen', 'breathwork', 'box breathing'],
    'kampfsport': ['kampfsport', 'bjj', 'brazilian jiu jitsu', 'mma', 'boxen', 'muay thai', 'judo', 'karate', 'wrestling', 'selbstverteidigung', 'martial arts', 'grappling', 'kickboxen'],
    'networking': ['networking', 'akquise', 'kaltakquise', 'cold calling', 'cold email', 'sales', 'verkaufen', 'leads', 'outreach', 'linkedin', 'kontakte', 'b2b', 'vertrieb'],
    'lesen': ['lesen', 'bücher', 'buch', 'reading', 'zettelkasten', 'notizen', 'second brain', 'wissen', 'sachbuch', 'literatur'],
    'psychologie': ['psychologie', 'psychology', 'verhalten', 'behavior', 'motivation', 'prokrastination', 'disziplin', 'willenskraft', 'gewohnheit ändern', 'habit', 'mindset', 'kognitiv', 'bias', 'selbstkontrolle', 'dopamin', 'belohnung', 'trigger'],
    'ki': ['ki', 'künstliche intelligenz', 'ai', 'chatgpt', 'claude', 'gpt', 'llm', 'machine learning', 'cursor'],
    'prompting': ['prompting', 'prompt engineering', 'prompt schreiben'],
    'schlaf': ['schlaf', 'sleep', 'aufwachen', 'müde', 'energie morgens', 'schlafqualität', 'einschlafen', '7.5 stunden'],
    'produktivitaet': ['produktivität', 'produktiv', 'deep work', 'fokus', 'pomodoro', 'gtd', 'zeitmanagement', 'konzentration'],
    'sprachen': ['sprache lernen', 'englisch', 'spanisch', 'französisch', 'japanisch', 'anki', 'vokabeln', 'immersion', 'fluent'],
    'muskelaufbau': ['muskelaufbau', 'bodybuilding', 'hypertrophie', 'masse', 'bulk', 'gainz', 'muskeln aufbauen'],
    'persoenlich': ['persönlich', 'entwicklung', 'selbst', 'mindset', 'wachstum', 'disziplin', 'stoizismus', 'selbstbewusstsein'],
    'rhetorik': ['rhetorik', 'präsentation', 'reden', 'sprechen', 'kommunikation', 'vortrag'],
    'fitness': ['fitness', 'abnehmen', 'sport', 'training', 'gewicht', 'kg', 'gym', 'kraft', 'laufen', 'cardio'],
    'karriere': ['karriere', 'job', 'beförderung', 'gehalt', 'arbeit', 'chef'],
    'finanzen': ['finanzen', 'geld', 'sparen', 'investieren', 'vermögen', 'euro', '€', 'budget'],
    'lernen': ['lernen', 'skill', 'kurs', 'zertifikat', 'weiterbildung', 'studium', 'programmieren'],
    'gewohnheiten': ['gewohnheit', 'habit', 'routine', 'täglich'],
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

**Bewährte Meilenstein-Struktur:**
${insight.milestoneTemplate.map((m, i) => `${i + 1}. ${m}`).join('\n')}
`;
}

