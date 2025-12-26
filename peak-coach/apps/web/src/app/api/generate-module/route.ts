import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { EXPERT_KNOWLEDGE, detectCategoryFromGoal } from '@/lib/expertKnowledge';

export const dynamic = 'force-dynamic';

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
  rhetorik: '🎤',
  psychologie: '🧠',
  produktivitaet: '⚡',
  fitness: '💪',
  business: '💼',
  lernen: '📚',
  finanzen: '💰',
  beziehungen: '❤️',
  trt: '💉',
  health: '🏥',
  career: '💼',
  learning: '📚',
  finance: '💰',
  relationships: '❤️',
  personal: '🌟',
  supplements: '💊',
  verhandlung: '🤝',
  leadership: '👔',
};

// Learning path templates for structured progression
const LEARNING_PATH_TEMPLATES: Record<string, string[]> = {
  rhetorik: ['Stimme & Atmung', 'Körpersprache', 'Storytelling', 'Überzeugungstechniken', 'Improvisation'],
  psychologie: ['Selbstwahrnehmung', 'Emotionsregulation', 'Kognitive Verzerrungen', 'Verhaltensänderung', 'Beziehungsdynamik'],
  produktivitaet: ['Fokus & Deep Work', 'Zeitmanagement', 'Energie-Management', 'Gewohnheiten', 'Systeme & Automation'],
  fitness: ['Trainingsgrundlagen', 'Progressive Overload', 'Ernährung Basics', 'Regeneration', 'Langzeit-Progression'],
  business: ['Value Proposition', 'Kundengewinnung', 'Verkaufspsychologie', 'Skalierung', 'Leadership'],
  lernen: ['Lernstrategien', 'Active Recall', 'Spaced Repetition', 'Elaboration', 'Transfer'],
  finanzen: ['Budgetierung', 'Sparen & Investieren', 'Zinseszins', 'Risikomanagement', 'Vermögensaufbau'],
  verhandlung: ['BATNA & Vorbereitung', 'Interessen vs Positionen', 'Aktives Zuhören', 'Win-Win Strategien', 'Emotionen managen'],
  leadership: ['Vision kommunizieren', 'Feedback geben', 'Delegation', 'Konflikte lösen', 'Team motivieren'],
  default: ['Grundlagen', 'Kernkonzepte', 'Praktische Anwendung', 'Fortgeschrittene Techniken', 'Meisterschaft'],
};

// Video-Empfehlungen (kuratierte YouTube-Videos)
const VIDEO_RECOMMENDATIONS: Record<string, { title: string; url: string; duration: string }[]> = {
  rhetorik: [
    { title: 'How to speak so that people want to listen - Julian Treasure', url: 'https://www.youtube.com/watch?v=eIho2S0ZahI', duration: '10:00' },
    { title: 'The power of vulnerability - Brené Brown', url: 'https://www.youtube.com/watch?v=iCvmsMzlF7o', duration: '20:19' },
  ],
  produktivitaet: [
    { title: 'How to gain control of your free time - Laura Vanderkam', url: 'https://www.youtube.com/watch?v=n3kNlFMXslo', duration: '11:54' },
    { title: 'Inside the mind of a master procrastinator - Tim Urban', url: 'https://www.youtube.com/watch?v=arj7oStGLkU', duration: '14:03' },
  ],
  psychologie: [
    { title: 'The psychology of self-motivation - Scott Geller', url: 'https://www.youtube.com/watch?v=7sxpKhIbr0E', duration: '17:00' },
  ],
  verhandlung: [
    { title: 'Never Split the Difference - Chris Voss', url: 'https://www.youtube.com/watch?v=MjhDkNmtjy0', duration: '45:00' },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OpenAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        module: generateFallbackModule('Allgemeines Lernen', 'learning'),
      });
    }

    const { 
      goalTitle, 
      category, 
      goalId,
      skillId,  // NEU: Skill-ID für Tracking
      skillName,  // NEU: Skill-Name für Kontext
      moduleNumber = 1, 
      totalModules = 5,
      userLevel = 'intermediate',
      isRetry = false,
      includeVideo = true,  // NEU: Video-Empfehlung?
    } = await request.json();

    // Detect category and get expert knowledge
    const detectedCategory = detectCategoryFromGoal(goalTitle) || category || 'learning';
    const knowledge = EXPERT_KNOWLEDGE[detectedCategory] || EXPERT_KNOWLEDGE.lernen;
    
    // Get learning path for this category
    const learningPath = LEARNING_PATH_TEMPLATES[detectedCategory] || LEARNING_PATH_TEMPLATES.default;
    const currentTopic = skillName || learningPath[Math.min(moduleNumber - 1, learningPath.length - 1)];
    const previousTopics = learningPath.slice(0, moduleNumber - 1);

    const openai = new OpenAI({ apiKey });

    // Level-specific adjustments
    const levelConfig = {
      beginner: {
        complexity: 'EINFACH - Verwende Alltagssprache, keine Fachbegriffe ohne Erklärung',
        examples: 'GRUNDLEGENDE, leicht nachvollziehbare Beispiele',
        exercises: 'EINFACHE Übungen für absolute Anfänger',
        preTestDifficulty: 'sehr einfach',
      },
      intermediate: {
        complexity: 'MITTEL - Fachbegriffe ok, aber erklärt',
        examples: 'PRAXISNAHE Beispiele mit etwas Tiefe',
        exercises: 'ANSPRUCHSVOLLE aber machbare Übungen',
        preTestDifficulty: 'mittel',
      },
      advanced: {
        complexity: 'FORTGESCHRITTEN - Fachsprache ok, Nuancen wichtig',
        examples: 'KOMPLEXE Fallstudien und Edge Cases',
        exercises: 'HERAUSFORDERNDE Übungen für Experten',
        preTestDifficulty: 'anspruchsvoll',
      },
    };
    
    const level = levelConfig[userLevel as keyof typeof levelConfig] || levelConfig.intermediate;

    // ERWEITERTER PROMPT mit allen 8 Steps
    const systemPrompt = `Du bist ein Elite-Lerncoach. Erstelle ein WISSENSCHAFTLICH OPTIMIERTES 12-Minuten Lernmodul.

📚 KONTEXT:
- Ziel des Users: "${goalTitle}"
- Kategorie: ${knowledge.category}
- Modul ${moduleNumber} von ${totalModules}: "${currentTopic}"
- User-Level: ${userLevel.toUpperCase()}
${skillId ? `- Skill-ID: ${skillId}` : ''}
${isRetry ? '- ⚠️ RETRY: User hat das Quiz nicht bestanden. Nutze ANDERE Beispiele und Erklärungsansätze!' : ''}
${previousTopics.length > 0 ? `- Bereits gelernt: ${previousTopics.join(', ')} (VERKNÜPFE damit!)` : '- Erstes Modul im Lernpfad'}

🎯 LEVEL-ANPASSUNG:
- Komplexität: ${level.complexity}
- Beispiele: ${level.examples}
- Übungen: ${level.exercises}
- Pre-Test: ${level.preTestDifficulty}

🧠 EXPERTENWISSEN (nutze diese Quellen!):
${knowledge.sources.slice(0, 5).join(', ')}

Kernprinzipien: ${knowledge.principles.slice(0, 3).join('; ')}

🎯 WISSENSCHAFTLICH OPTIMIERTE 8-STEP STRUKTUR:

═══════════════════════════════════════════════════════════
STEP 1: PRE-TEST (30 Sek) - Pretesting Effect
═══════════════════════════════════════════════════════════
- EINE Frage BEVOR der User das Konzept lernt
- User soll RATEN (darf falsch sein!)
- Aktiviert Neugier und verbessert späteres Lernen um 25%
- Multiple Choice mit 4 Optionen

═══════════════════════════════════════════════════════════
STEP 2: WHY (30 Sek) - Motivation & Relevanz
═══════════════════════════════════════════════════════════
- Warum ist dieses Thema WICHTIG für das Ziel "${goalTitle}"?
- Konkreter Nutzen/Benefit wenn man es beherrscht
- Emotionaler Hook (Schmerz vermeiden ODER Erfolg erreichen)

═══════════════════════════════════════════════════════════
STEP 3: LEARN (3-4 Min) - Konzept + Beispiel
═══════════════════════════════════════════════════════════
- EIN Kernkonzept (nicht mehrere!)
- Sofort mit konkretem Beispiel illustrieren
- Quelle angeben für Glaubwürdigkeit
- Key Points: 3-4 Stichpunkte die das Wichtigste zusammenfassen
${previousTopics.length > 0 ? `- VERKNÜPFE mit vorherigem Wissen: "${previousTopics[previousTopics.length - 1]}"` : ''}

═══════════════════════════════════════════════════════════
STEP 4: GENERATE (2 Min) - Generation Effect (+50% Retention!)
═══════════════════════════════════════════════════════════
- Prompt für den User: "Erkläre das Konzept in deinen eigenen Worten"
- Muster-Antwort für KI-Vergleich
- Key Points die in der Erklärung vorkommen sollten

═══════════════════════════════════════════════════════════
STEP 5: DO (3-4 Min) - Praktische Übung
═══════════════════════════════════════════════════════════
- JETZT machbar (nicht "später" oder "morgen")
- Messbar (User weiß wann fertig)
- Konkrete Zeitangabe (z.B. "2 Minuten")
- Schritt-für-Schritt Anleitung

═══════════════════════════════════════════════════════════
STEP 6: TEST (2 Min) - Quiz mit Elaboration + Confidence
═══════════════════════════════════════════════════════════
- 2-3 Fragen zum Konzept
- Bei JEDER Antwort: Erkläre WARUM richtig/falsch
- Verbinde mit dem Kernkonzept
- User gibt Confidence Rating (1-4) pro Frage

═══════════════════════════════════════════════════════════
STEP 7: ACTION (1 Min) - Implementation Intention
═══════════════════════════════════════════════════════════
- WAS genau tun? (spezifisch)
- WANN? (Situation beschreiben)
- WENN-DANN Format: "WENN [Situation], DANN [Verhalten]"
- Trigger-Vorschläge für den Builder

═══════════════════════════════════════════════════════════
STEP 8: REFLECT (30 Sek) - Reflection Prompts
═══════════════════════════════════════════════════════════
- 2-3 kurze Reflexionsfragen
- "Was war die wichtigste Erkenntnis?"
- "Wie verbindet sich das mit deinem Wissen?"

📤 OUTPUT FORMAT (JSON):
{
  "title": "Prägnanter Titel: ${currentTopic}",
  "moduleNumber": ${moduleNumber},
  "topic": "${currentTopic}",
  "difficulty": "beginner|intermediate|advanced",
  
  "preTest": {
    "question": "Frage VOR dem Lernen - User soll raten",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "teaser": "Spannend! Mal sehen ob du richtig liegst..."
  },
  
  "why": {
    "hook": "Emotionaler Einstieg - warum ist das wichtig?",
    "benefit": "Konkreter Nutzen wenn man es beherrscht",
    "connection": "Verbindung zum Ziel: ${goalTitle}"
  },
  
  "learn": {
    "concept": "Das EINE Kernkonzept erklärt (mit **Fettdruck** für wichtige Begriffe)",
    "example": "Konkretes, lebhaftes Beispiel das es verdeutlicht",
    "source": "Autor - Buch/Studie",
    "keyPoints": ["Punkt 1", "Punkt 2", "Punkt 3"],
    "previousConnection": "${previousTopics.length > 0 ? 'Verbindung zu: ' + previousTopics[previousTopics.length - 1] : null}",
    "analogy": "Eine Analogie zu etwas Bekanntem (optional)"
  },
  
  "generate": {
    "prompt": "Erkläre in 2-3 Sätzen: Was ist [Konzept] und warum ist es wichtig?",
    "exampleAnswer": "Eine gute Erklärung wäre...",
    "keyPointsToInclude": ["Begriff 1", "Begriff 2", "Zusammenhang"]
  },
  
  "do": {
    "title": "Übungs-Titel",
    "instruction": "Schritt 1: ...\\nSchritt 2: ...\\nSchritt 3: ...",
    "duration_minutes": 3,
    "success_criteria": "Du bist fertig wenn..."
  },
  
  "test": [
    {
      "question": "Frage 1?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "whyCorrect": "Das ist richtig weil...",
      "whyOthersWrong": "Die anderen sind falsch weil..."
    },
    {
      "question": "Frage 2?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 1,
      "whyCorrect": "Das ist richtig weil...",
      "whyOthersWrong": "Die anderen sind falsch weil..."
    }
  ],
  
  "action": {
    "task": "Konkrete Aufgabe",
    "implementationIntention": {
      "situation": "Beschreibung der Situation",
      "behavior": "Das konkrete Verhalten",
      "formatted": "WENN [situation], DANN werde ich [behavior]"
    },
    "triggerSuggestions": ["Trigger 1", "Trigger 2", "Trigger 3"],
    "timingOptions": ["heute", "morgen", "diese Woche", "bei Gelegenheit"],
    "metric": "Wie misst du Erfolg?"
  },
  
  "reflect": {
    "prompts": [
      "Was war die wichtigste Erkenntnis für dich?",
      "Wie verbindet sich das mit etwas, das du schon weißt?",
      "Was wirst du als erstes ausprobieren?"
    ]
  },
  
  "reviewQuestions": [
    "Frage für Spaced Repetition Review 1",
    "Frage für Spaced Repetition Review 2",
    "Frage für Spaced Repetition Review 3"
  ]
}`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Erstelle ein Lernmodul für das Ziel: "${goalTitle}"` },
      ],
      max_tokens: 3000,  // Erhöht für mehr Content
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({
        module: generateFallbackModule(goalTitle, detectedCategory),
      });
    }

    const generated = JSON.parse(content);

    // Validate test questions
    let test = generated.test || [];
    if (!Array.isArray(test) || test.length < 2) {
      test = generateFallbackTestQuestions(currentTopic);
    }
    test = test.slice(0, 3);

    // Video-Empfehlung hinzufügen (falls verfügbar)
    let videoRecommendation = null;
    if (includeVideo) {
      const categoryVideos = VIDEO_RECOMMENDATIONS[detectedCategory];
      if (categoryVideos && categoryVideos.length > 0) {
        // Rotiere durch Videos basierend auf Modul-Nummer
        videoRecommendation = categoryVideos[(moduleNumber - 1) % categoryVideos.length];
      }
    }

    // NEUE 8-STEP Modul-Struktur
    const module = {
      id: `ai-${Date.now()}`,
      title: generated.title || `${currentTopic}: ${goalTitle}`,
      category: knowledge.category,
      categoryIcon: CATEGORY_ICONS[detectedCategory] || '📚',
      estimatedMinutes: 12,  // Erhöht wegen mehr Steps
      moduleNumber: moduleNumber,
      topic: currentTopic,
      totalModules: totalModules,
      difficulty: generated.difficulty || 'intermediate',
      learningPath: learningPath,
      goalId,
      skillId,
      
      // NEUE 8-STEP STRUKTUR
      content: {
        // Step 1: PRE-TEST (NEU)
        preTest: generated.preTest || {
          question: `Was glaubst du: Was ist das Wichtigste bei "${currentTopic}"?`,
          options: ['Theorie verstehen', 'Viel üben', 'Feedback bekommen', 'Talent haben'],
          correctIndex: 2,
          teaser: 'Interessant! Mal sehen was die Wissenschaft sagt...',
        },
        
        // Step 2: WHY
        why: generated.why || {
          hook: `Warum ist "${currentTopic}" wichtig für dich?`,
          benefit: 'Du wirst schneller Fortschritte machen und bessere Ergebnisse erzielen.',
          connection: `Das bringt dich deinem Ziel "${goalTitle}" näher.`,
        },
        
        // Step 3: LEARN (erweitert)
        learn: {
          concept: generated.learn?.concept || 'Hier lernst du das wichtigste Kernkonzept.',
          example: generated.learn?.example || 'Ein praktisches Beispiel das es verdeutlicht.',
          source: generated.learn?.source || knowledge.sources[0],
          keyPoints: generated.learn?.keyPoints || [
            'Kernpunkt 1',
            'Kernpunkt 2',
            'Kernpunkt 3',
          ],
          previousConnection: generated.learn?.previousConnection || null,
          analogy: generated.learn?.analogy || null,
          videoRecommendation: videoRecommendation,  // NEU
        },
        
        // Step 4: GENERATE (NEU)
        generate: generated.generate || {
          prompt: `Erkläre in 2-3 Sätzen: Was ist "${currentTopic}" und warum ist es wichtig für "${goalTitle}"?`,
          exampleAnswer: `${currentTopic} bedeutet... Es ist wichtig weil...`,
          keyPointsToInclude: ['Kernbegriff', 'Warum wichtig', 'Praktische Anwendung'],
        },
        
        // Step 5: DO
        do: generated.do || {
          title: 'Praktische Übung',
          instruction: 'Schritt 1: Starte jetzt\nSchritt 2: Wende an\nSchritt 3: Reflektiere',
          duration_minutes: 3,
          success_criteria: 'Du bist fertig wenn du die Übung einmal durchgeführt hast.',
        },
        
        // Step 6: TEST (erweitert mit Confidence)
        test: test,
        
        // Step 7: ACTION (erweitert mit Implementation Intention)
        action: {
          task: generated.action?.task || 'Wende das Gelernte heute noch einmal an.',
          implementationIntention: generated.action?.implementationIntention || {
            situation: 'eine passende Situation auftritt',
            behavior: `das Gelernte über "${currentTopic}" anwenden`,
            formatted: `WENN eine passende Situation auftritt, DANN werde ich das Gelernte über "${currentTopic}" anwenden.`,
          },
          triggerSuggestions: generated.action?.triggerSuggestions || [
            'Im nächsten Gespräch',
            'Bei der nächsten Aufgabe',
            'Morgen früh als erstes',
          ],
          timingOptions: generated.action?.timingOptions || ['heute', 'morgen', 'diese Woche', 'bei Gelegenheit'],
          metric: generated.action?.metric || 'Du hast es geschafft wenn du die Übung im Alltag angewendet hast.',
        },
        
        // Step 8: REFLECT (NEU)
        reflect: generated.reflect || {
          prompts: [
            'Was war die wichtigste Erkenntnis für dich?',
            'Wie verbindet sich das mit etwas, das du schon weißt?',
            'Was wirst du als erstes ausprobieren?',
          ],
        },
        
        // Für Spaced Repetition
        reviewQuestions: generated.reviewQuestions || [
          `Was ist das Kernkonzept von "${currentTopic}"?`,
          `Wie wendest du "${currentTopic}" praktisch an?`,
          `Warum ist "${currentTopic}" wichtig für "${goalTitle}"?`,
        ],
      },
    };

    return NextResponse.json({ 
      module,
      learningPath: {
        topics: learningPath,
        currentIndex: moduleNumber - 1,
        nextTopic: learningPath[moduleNumber] || null,
        progress: Math.round((moduleNumber / totalModules) * 100),
      },
      meta: {
        generatedAt: new Date().toISOString(),
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        hasVideo: !!videoRecommendation,
        skillId,
      },
    });
  } catch (error) {
    console.error('Module generation error:', error);
    return NextResponse.json({
      module: generateFallbackModule('Allgemeines Lernen', 'learning'),
    });
  }
}

function generateFallbackTestQuestions(topic: string) {
  return [
    {
      question: `Was ist das Kernprinzip von "${topic}"?`,
      options: ['Konsistenz', 'Zufall', 'Glück', 'Passivität'],
      correctIndex: 0,
      whyCorrect: 'Konsistenz ist wissenschaftlich bewiesen der wichtigste Faktor für Erfolg.',
      whyOthersWrong: 'Zufall, Glück und Passivität führen nicht zu nachhaltigen Ergebnissen.',
    },
    {
      question: 'Was ist der beste nächste Schritt nach diesem Modul?',
      options: ['Sofort anwenden', 'Später nochmal lesen', 'Nichts tun', 'Alles vergessen'],
      correctIndex: 0,
      whyCorrect: 'Sofortige Anwendung verstärkt das Gelernte um 300%.',
      whyOthersWrong: 'Passives Wiederlesen oder Aufschieben führt zum Vergessen.',
    },
  ];
}

function generateFallbackModule(goalTitle: string, category: string) {
  return {
    id: `fallback-${Date.now()}`,
    title: `Deliberate Practice: ${goalTitle}`,
    category: 'Allgemein',
    categoryIcon: CATEGORY_ICONS[category] || '📚',
    estimatedMinutes: 12,
    moduleNumber: 1,
    topic: 'Deliberate Practice',
    totalModules: 5,
    difficulty: 'beginner',
    learningPath: ['Deliberate Practice', 'Fokus', 'Feedback', 'Wiederholung', 'Meisterschaft'],
    
    // NEUE 8-STEP STRUKTUR
    content: {
      // Step 1: PRE-TEST
      preTest: {
        question: 'Was glaubst du: Was macht den größten Unterschied beim Lernen?',
        options: ['Viel Zeit investieren', 'Talent haben', 'Gezielt an Schwächen arbeiten', 'Alles perfekt machen'],
        correctIndex: 2,
        teaser: 'Spannend! Die Antwort wird dich überraschen...',
      },
      
      // Step 2: WHY
      why: {
        hook: `Wusstest du, dass 10.000 Stunden passives Üben WENIGER wert sind als 100 Stunden fokussiertes Üben?`,
        benefit: `Mit Deliberate Practice erreichst du "${goalTitle}" 10x schneller als mit normalem Üben.`,
        connection: `Dieses Prinzip ist die GRUNDLAGE für jeden Erfolg - auch für dein Ziel "${goalTitle}".`,
      },
      
      // Step 3: LEARN
      learn: {
        concept: `**Deliberate Practice** ist der wissenschaftlich bewiesene Weg zur Meisterschaft.

Die 3 Kernelemente:
1. **Fokus auf Schwächen** - Nicht das üben was du kannst, sondern was du NICHT kannst
2. **Sofortiges Feedback** - Wissen ob du es richtig machst, WÄHREND du übst
3. **Außerhalb der Komfortzone** - Wenn es sich leicht anfühlt, lernst du nichts

Der Unterschied zu normalem Üben? **Intention und Aufmerksamkeit**.`,
        example: `**Beispiel: Zwei Musiker üben das gleiche Stück**

❌ Musiker A (passiv):
"Ich spiele das Stück 10 mal durch" → Nach 1 Jahr: Kaum Verbesserung

✅ Musiker B (Deliberate Practice):
"Ich identifiziere die 4 Takte die mir schwer fallen.
Ich übe NUR diese 4 Takte, langsam.
Ich nehme mich auf und höre die Fehler.
Ich wiederhole bis es sitzt." → Nach 1 Monat: Deutliche Verbesserung

**10x schnellerer Fortschritt** durch fokussiertes Üben.`,
        source: 'K. Anders Ericsson - Peak: Secrets from the New Science of Expertise',
        keyPoints: [
          'Fokus auf spezifische Schwächen',
          'Sofortiges Feedback ist essentiell',
          'Komfortzone verlassen = Lernen',
        ],
        previousConnection: null,
        analogy: 'Wie ein Chirurg: Erst die schwierigsten Eingriffe üben, nicht die leichten.',
        videoRecommendation: null,
      },
      
      // Step 4: GENERATE
      generate: {
        prompt: 'Erkläre in 2-3 Sätzen: Was ist Deliberate Practice und wie unterscheidet es sich von normalem Üben?',
        exampleAnswer: 'Deliberate Practice ist gezieltes Üben an spezifischen Schwächen mit sofortigem Feedback. Im Gegensatz zu normalem Üben konzentriert man sich nicht auf das was man schon kann, sondern arbeitet bewusst außerhalb der Komfortzone.',
        keyPointsToInclude: ['Schwächen', 'Feedback', 'Komfortzone'],
      },
      
      // Step 5: DO
      do: {
        title: 'Identifiziere deine Schwachstelle',
        instruction: `**Wende Deliberate Practice JETZT auf "${goalTitle}" an:**

Schritt 1: Denke an dein Ziel "${goalTitle}"
Schritt 2: Was ist der EINE Teil, der dir am schwersten fällt?
Schritt 3: Schreibe es auf (Notiz-App oder Papier)
Schritt 4: Plane eine 5-minütige fokussierte Übung NUR für diesen Teil

Beispiel:
- Ziel: "Besser präsentieren"
- Schwachstelle: "Ich sage zu viele Füllwörter"
- Übung: "5 Min frei reden und bei jedem 'ähm' neu starten"`,
        duration_minutes: 3,
        success_criteria: 'Du bist fertig wenn du deine größte Schwachstelle aufgeschrieben hast.',
      },
      
      // Step 6: TEST
      test: [
        {
          question: 'Was ist der Kern von Deliberate Practice?',
          options: [
            'Möglichst viel Zeit investieren',
            'Fokussiertes Üben an spezifischen Schwächen',
            'Nur das üben was Spaß macht',
            'Passiv Inhalte konsumieren',
          ],
          correctIndex: 1,
          whyCorrect: 'Deliberate Practice bedeutet gezieltes, fokussiertes Üben an den Bereichen wo du am schwächsten bist.',
          whyOthersWrong: 'Viel Zeit, Spaß oder passives Konsumieren führen nicht zu gezielter Verbesserung.',
        },
        {
          question: 'Warum ist sofortiges Feedback so wichtig?',
          options: [
            'Um Fehler schnell zu korrigieren',
            'Um sich motiviert zu fühlen',
            'Es ist eigentlich nicht wichtig',
            'Um anderen zu imponieren',
          ],
          correctIndex: 0,
          whyCorrect: 'Sofortiges Feedback ermöglicht es, Fehler zu erkennen und zu korrigieren BEVOR sie sich einschleifen.',
          whyOthersWrong: 'Motivation, Eindruck auf andere oder das Ignorieren von Feedback führen nicht zu Verbesserung.',
        },
      ],
      
      // Step 7: ACTION
      action: {
        task: 'Führe eine 5-minütige Deliberate Practice Session für deine identifizierte Schwachstelle durch.',
        implementationIntention: {
          situation: 'ich heute Abend 10 Minuten Zeit habe',
          behavior: '5 Minuten fokussiert an meiner Schwachstelle arbeiten',
          formatted: 'WENN ich heute Abend 10 Minuten Zeit habe, DANN werde ich 5 Minuten fokussiert an meiner Schwachstelle arbeiten.',
        },
        triggerSuggestions: [
          'Nach dem Abendessen',
          'Vor dem Schlafengehen',
          'Morgen früh als erstes',
        ],
        timingOptions: ['heute', 'morgen', 'diese Woche', 'bei Gelegenheit'],
        metric: 'Du hast es geschafft wenn du 5 Minuten fokussiert an deiner Schwachstelle gearbeitet hast.',
      },
      
      // Step 8: REFLECT
      reflect: {
        prompts: [
          'Was war die wichtigste Erkenntnis über Deliberate Practice für dich?',
          'Welche Schwachstelle hast du identifiziert?',
          'Wie wirst du sicherstellen dass du regelmäßig fokussiert übst?',
        ],
      },
      
      // Für Spaced Repetition
      reviewQuestions: [
        'Was sind die 3 Kernelemente von Deliberate Practice?',
        'Was ist deine größte Schwachstelle bei deinem aktuellen Ziel?',
        'Wie unterscheidet sich Deliberate Practice von normalem Üben?',
      ],
    },
  };
}
