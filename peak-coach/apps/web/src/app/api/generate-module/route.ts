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
  default: ['Grundlagen', 'Kernkonzepte', 'Praktische Anwendung', 'Fortgeschrittene Techniken', 'Meisterschaft'],
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
      moduleNumber = 1, 
      totalModules = 5,
      userLevel = 'intermediate',
      isRetry = false
    } = await request.json();

    // Detect category and get expert knowledge
    const detectedCategory = detectCategoryFromGoal(goalTitle) || category || 'learning';
    const knowledge = EXPERT_KNOWLEDGE[detectedCategory] || EXPERT_KNOWLEDGE.lernen;
    
    // Get learning path for this category
    const learningPath = LEARNING_PATH_TEMPLATES[detectedCategory] || LEARNING_PATH_TEMPLATES.default;
    const currentTopic = learningPath[Math.min(moduleNumber - 1, learningPath.length - 1)];
    const previousTopics = learningPath.slice(0, moduleNumber - 1);

    const openai = new OpenAI({ apiKey });

    // Level-specific adjustments
    const levelConfig = {
      beginner: {
        complexity: 'EINFACH - Verwende Alltagssprache, keine Fachbegriffe ohne Erklärung',
        examples: 'GRUNDLEGENDE, leicht nachvollziehbare Beispiele',
        exercises: 'EINFACHE Übungen für absolute Anfänger',
      },
      intermediate: {
        complexity: 'MITTEL - Fachbegriffe ok, aber erklärt',
        examples: 'PRAXISNAHE Beispiele mit etwas Tiefe',
        exercises: 'ANSPRUCHSVOLLE aber machbare Übungen',
      },
      advanced: {
        complexity: 'FORTGESCHRITTEN - Fachsprache ok, Nuancen wichtig',
        examples: 'KOMPLEXE Fallstudien und Edge Cases',
        exercises: 'HERAUSFORDERNDE Übungen für Experten',
      },
    };
    
    const level = levelConfig[userLevel as keyof typeof levelConfig] || levelConfig.intermediate;

    const systemPrompt = `Du bist ein Elite-Lerncoach. Erstelle ein FOKUSSIERTES 10-Minuten Lernmodul.

📚 KONTEXT:
- Ziel des Users: "${goalTitle}"
- Kategorie: ${knowledge.category}
- Modul ${moduleNumber} von ${totalModules}: "${currentTopic}"
- User-Level: ${userLevel.toUpperCase()}
${isRetry ? '- ⚠️ RETRY: User hat das Quiz nicht bestanden. Nutze ANDERE Beispiele und Erklärungsansätze!' : ''}
${previousTopics.length > 0 ? `- Bereits gelernt: ${previousTopics.join(', ')} (VERKNÜPFE damit!)` : '- Erstes Modul im Lernpfad'}

🎯 LEVEL-ANPASSUNG:
- Komplexität: ${level.complexity}
- Beispiele: ${level.examples}
- Übungen: ${level.exercises}

🧠 EXPERTENWISSEN (nutze diese Quellen!):
${knowledge.sources.slice(0, 5).join(', ')}

Kernprinzipien: ${knowledge.principles.slice(0, 3).join('; ')}

🎯 WISSENSCHAFTLICH OPTIMIERTE 5-STEP STRUKTUR:

═══════════════════════════════════════════════════════════
STEP 1: WHY (30 Sek) - Motivation & Relevanz
═══════════════════════════════════════════════════════════
- Warum ist dieses Thema WICHTIG für das Ziel "${goalTitle}"?
- Konkreter Nutzen/Benefit wenn man es beherrscht
- Emotionaler Hook (Schmerz vermeiden ODER Erfolg erreichen)

═══════════════════════════════════════════════════════════
STEP 2: LEARN (3-4 Min) - Konzept + Beispiel ZUSAMMEN
═══════════════════════════════════════════════════════════
- EIN Kernkonzept (nicht mehrere!)
- Sofort mit konkretem Beispiel illustrieren
- Quelle angeben für Glaubwürdigkeit
${previousTopics.length > 0 ? `- VERKNÜPFE mit vorherigem Wissen: "${previousTopics[previousTopics.length - 1]}"` : ''}

═══════════════════════════════════════════════════════════
STEP 3: DO (3-4 Min) - Praktische Übung
═══════════════════════════════════════════════════════════
- JETZT machbar (nicht "später" oder "morgen")
- Messbar (User weiß wann fertig)
- Konkrete Zeitangabe (z.B. "2 Minuten")
- Schritt-für-Schritt Anleitung

═══════════════════════════════════════════════════════════
STEP 4: TEST (2 Min) - Quiz mit Elaboration
═══════════════════════════════════════════════════════════
- 2-3 Fragen zum Konzept
- Bei JEDER Antwort: Erkläre WARUM richtig/falsch
- Verbinde mit dem Kernkonzept

═══════════════════════════════════════════════════════════
STEP 5: ACTION (1 Min) - Konkreter nächster Schritt
═══════════════════════════════════════════════════════════
- WAS genau tun? (spezifisch)
- WANN? (heute, diese Woche)
- WIE messen ob erfolgreich?

📤 OUTPUT FORMAT (JSON):
{
  "title": "Prägnanter Titel: ${currentTopic}",
  "moduleNumber": ${moduleNumber},
  "topic": "${currentTopic}",
  "difficulty": "beginner|intermediate|advanced",
  "why": {
    "hook": "Emotionaler Einstieg - warum ist das wichtig?",
    "benefit": "Konkreter Nutzen wenn man es beherrscht",
    "connection": "Verbindung zum Ziel: ${goalTitle}"
  },
  "learn": {
    "concept": "Das EINE Kernkonzept erklärt (mit **Fettdruck** für wichtige Begriffe)",
    "example": "Konkretes, lebhaftes Beispiel das es verdeutlicht",
    "source": "Autor - Buch/Studie",
    "previousConnection": "${previousTopics.length > 0 ? 'Verbindung zu: ' + previousTopics[previousTopics.length - 1] : null}"
  },
  "do": {
    "title": "Übungs-Titel",
    "instruction": "Schritt 1: ...\nSchritt 2: ...\nSchritt 3: ...",
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
    "task": "Konkrete Aufgabe für heute/diese Woche",
    "when": "heute|morgen|diese Woche",
    "metric": "Wie misst du Erfolg?"
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
      max_tokens: 2000,
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

    // Validate test questions (neue Struktur)
    let test = generated.test || [];
    if (!Array.isArray(test) || test.length < 2) {
      test = [
        {
          question: `Was ist das Kernprinzip von "${currentTopic}"?`,
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
    test = test.slice(0, 3);

    // Neue optimierte 5-Step Modul-Struktur
    const module = {
      id: `ai-${Date.now()}`,
      title: generated.title || `${currentTopic}: ${goalTitle}`,
      category: knowledge.category,
      categoryIcon: CATEGORY_ICONS[detectedCategory] || '📚',
      estimatedMinutes: 10,
      moduleNumber: moduleNumber,
      topic: currentTopic,
      totalModules: totalModules,
      difficulty: generated.difficulty || 'intermediate',
      learningPath: learningPath,
      
      // NEUE 5-STEP STRUKTUR
      content: {
        // Step 1: WHY - Motivation
        why: generated.why || {
          hook: `Warum ist "${currentTopic}" wichtig für dich?`,
          benefit: 'Du wirst schneller Fortschritte machen und bessere Ergebnisse erzielen.',
          connection: `Das bringt dich deinem Ziel "${goalTitle}" näher.`,
        },
        
        // Step 2: LEARN - Konzept + Beispiel zusammen
        learn: generated.learn || {
          concept: 'Hier lernst du das wichtigste Kernkonzept.',
          example: 'Ein praktisches Beispiel das es verdeutlicht.',
          source: knowledge.sources[0],
          previousConnection: null,
        },
        
        // Step 3: DO - Praktische Übung
        do: generated.do || {
          title: 'Praktische Übung',
          instruction: 'Schritt 1: Starte jetzt\nSchritt 2: Wende an\nSchritt 3: Reflektiere',
          duration_minutes: 3,
          success_criteria: 'Du bist fertig wenn du die Übung einmal durchgeführt hast.',
        },
        
        // Step 4: TEST - Quiz mit Elaboration
        test: test,
        
        // Step 5: ACTION - Konkreter nächster Schritt
        action: generated.action || {
          task: 'Wende das Gelernte heute noch einmal an.',
          when: 'heute',
          metric: 'Du hast es geschafft wenn du die Übung im Alltag angewendet hast.',
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
    });
  } catch (error) {
    console.error('Module generation error:', error);
    return NextResponse.json({
      module: generateFallbackModule('Allgemeines Lernen', 'learning'),
    });
  }
}

function generateFallbackModule(goalTitle: string, category: string) {
  return {
    id: `fallback-${Date.now()}`,
    title: `Deliberate Practice: ${goalTitle}`,
    category: 'Allgemein',
    categoryIcon: CATEGORY_ICONS[category] || '📚',
    estimatedMinutes: 10,
    moduleNumber: 1,
    topic: 'Deliberate Practice',
    totalModules: 5,
    difficulty: 'beginner',
    learningPath: ['Deliberate Practice', 'Fokus', 'Feedback', 'Wiederholung', 'Meisterschaft'],
    
    // NEUE 5-STEP STRUKTUR
    content: {
      // Step 1: WHY
      why: {
        hook: `Wusstest du, dass 10.000 Stunden passives Üben WENIGER wert sind als 100 Stunden fokussiertes Üben?`,
        benefit: `Mit Deliberate Practice erreichst du "${goalTitle}" 10x schneller als mit normalem Üben.`,
        connection: `Dieses Prinzip ist die GRUNDLAGE für jeden Erfolg - auch für dein Ziel "${goalTitle}".`,
      },
      
      // Step 2: LEARN
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
        previousConnection: null,
      },
      
      // Step 3: DO
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
      
      // Step 4: TEST
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
      
      // Step 5: ACTION
      action: {
        task: 'Führe heute eine 5-minütige Deliberate Practice Session für deine identifizierte Schwachstelle durch.',
        when: 'heute',
        metric: 'Du hast es geschafft wenn du 5 Minuten fokussiert an deiner Schwachstelle gearbeitet hast.',
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

