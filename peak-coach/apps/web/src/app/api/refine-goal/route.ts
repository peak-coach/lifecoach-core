import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { EXPERT_KNOWLEDGE, detectCategoryFromGoal, formatExpertKnowledgeForPrompt } from '@/lib/expertKnowledge';

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

// Initialize OpenAI lazily to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.OpenAI_API_KEY,
    });
  }
  return openaiClient;
}

// ============================================
// API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Check for API key first (accept both naming conventions)
    const apiKey = process.env.OPENAI_API_KEY || process.env.OpenAI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.error('OPENAI_API_KEY is not set or empty');
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        details: 'Bitte OPENAI_API_KEY in Vercel Environment Variables setzen.'
      }, { status: 500 });
    }

    const { title, category, whyImportant, goalType } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Detect the best matching category from goal title
    const detectedCategory = detectCategoryFromGoal(title) || 'persoenlich';
    const knowledge = EXPERT_KNOWLEDGE[detectedCategory] || EXPERT_KNOWLEDGE.persoenlich;

    // Format the full expert knowledge for the prompt
    const expertKnowledgePrompt = formatExpertKnowledgeForPrompt(knowledge);

    // Adjust context based on goal type
    const goalTypeContextMap: Record<string, string> = {
      long: 'Dies ist ein LANGZEIT-ZIEL (3-12+ Monate). Generiere 5-7 größere Meilensteine basierend auf dem Expertenwissen.',
      short: 'Dies ist ein KURZZEIT-ZIEL (1-4 Wochen). Generiere 3-4 konkrete Wochen-Ziele als Schritte zum Langzeit-Ziel.',
      sprint: 'Dies ist ein SPRINT (1-7 Tage). Generiere 2-3 sofort umsetzbare, konkrete Aktionen.',
    };
    const goalTypeContext = goalTypeContextMap[goalType || 'long'] || goalTypeContextMap.long;

    const systemPrompt = `
Du bist ein ELITE Peak Performance Coach mit Zugang zu wissenschaftlichem Expertenwissen.
Deine Aufgabe: Das Ziel des Users zu einem SMART Goal optimieren und wissenschaftlich fundierte Meilensteine vorschlagen.

${expertKnowledgePrompt}

# AUFGABE
${goalTypeContext}

# REGELN
1. Formuliere das Ziel SPEZIFISCH und MESSBAR
2. Füge eine realistische Zeitspanne hinzu (z.B. "in 12 Wochen")
3. Die Meilensteine MÜSSEN auf dem Expertenwissen oben basieren
4. Nutze die bewährte Meilenstein-Struktur aus dem Expertenwissen
5. Gib 3 konkrete Expert-Tipps - einer davon muss ein "häufiger Fehler" sein
6. Schlage ein emotionales "Why" vor wenn der User keins hat
7. Antworte NUR mit einem JSON-Objekt

# OUTPUT FORMAT (JSON)
{
  "title": "SMART formuliertes Ziel mit konkretem Zeitrahmen",
  "description": "Was dieses Ziel konkret bedeutet und warum es erreichbar ist",
  "suggestedMilestones": [
    "Meilenstein 1: Basierend auf Expertenwissen",
    "Meilenstein 2: Nächster logischer Schritt",
    "Meilenstein 3: Weiterer Fortschritt",
    "Meilenstein 4: Fast am Ziel",
    "Meilenstein 5: Ziel erreicht"
  ],
  "expertTips": [
    "💡 [Prinzip aus den Quellen]: Konkrete Anwendung",
    "⚠️ VERMEIDE: [Häufiger Fehler aus dem Expertenwissen]",
    "🚀 Profi-Tipp: [Best Practice für schnelleren Fortschritt]"
  ],
  "whySuggestion": "Emotionales, motivierendes 'Warum' das den User antreibt"
}
`;

    const response = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Originalziel: "${title}"${whyImportant ? `\n\nWarum wichtig für mich: "${whyImportant}"` : ''}` 
        },
      ],
      max_tokens: 1200,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const refinedGoal = JSON.parse(content);

    return NextResponse.json({
      success: true,
      originalTitle: title,
      detectedCategory: knowledge.category,
      sources: knowledge.sources,
      refined: refinedGoal,
    });
  } catch (error: unknown) {
    console.error('Goal refinement error:', error);
    
    // Better error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isOpenAIError = errorMessage.includes('API') || errorMessage.includes('key') || errorMessage.includes('401');
    
    return NextResponse.json({ 
      error: 'Failed to refine goal',
      details: isOpenAIError 
        ? 'OpenAI API Fehler - bitte API Key in Vercel prüfen' 
        : errorMessage
    }, { status: 500 });
  }
}
