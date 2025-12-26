// ============================================
// PEAK COACH - Goal Refinement Service
// ============================================
// AI-powered goal refinement using expert knowledge

import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { 
  getExpertKnowledge, 
  detectCategoryFromGoal, 
  formatExpertKnowledgeForPrompt,
  ExpertInsight 
} from './expertKnowledge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// INTERFACES
// ============================================

export interface RefinedGoal {
  originalTitle: string;
  refinedTitle: string;
  smartDescription: string;
  whyImportant: string;
  category: string;
  deadline: string;
  targetValue: number;
  suggestedMilestones: string[];
  expertInsights: string[];
  estimatedWeeks: number;
}

// ============================================
// CATEGORY MAPPING (AI → Database)
// ============================================
// Database only allows: career, health, learning, finance, relationships, personal

const CATEGORY_MAP: Record<string, string> = {
  // Direct matches
  'career': 'career',
  'health': 'health',
  'learning': 'learning',
  'finance': 'finance',
  'relationships': 'relationships',
  'personal': 'personal',
  
  // German → English
  'karriere': 'career',
  'gesundheit': 'health',
  'lernen': 'learning',
  'finanzen': 'finance',
  'beziehungen': 'relationships',
  'persoenlich': 'personal',
  
  // Specific mappings
  'fitness': 'health',
  'trt': 'health',
  'muskelaufbau': 'health',
  'abnehmen': 'health',
  'schlaf': 'health',
  
  'rhetorik': 'learning',
  'fuehrerschein': 'learning',
  'sprachen': 'learning',
  'ki': 'learning',
  'prompting': 'learning',
  
  'business': 'career',
  'produktivitaet': 'career',
  'job': 'career',
  
  'mental': 'personal',
  'mindset': 'personal',
  'gewohnheiten': 'personal',
  'other': 'personal',
};

function mapCategoryToDatabase(category: string): string {
  const normalized = category?.toLowerCase()?.trim() || 'personal';
  return CATEGORY_MAP[normalized] || 'personal';
}

// ============================================
// REFINE GOAL WITH EXPERT KNOWLEDGE
// ============================================

export async function refineGoalWithExpertise(
  goalTitle: string,
  goalDescription?: string,
  userContext?: { why?: string; deadline?: string; }
): Promise<RefinedGoal> {
  try {
    // Detect category and get expert knowledge
    const detectedCategory = detectCategoryFromGoal(goalTitle, goalDescription);
    const expertKnowledge = detectedCategory ? getExpertKnowledge(detectedCategory) : null;
    
    logger.info(`Refining goal "${goalTitle}" with category: ${detectedCategory || 'unknown'}`);

    const prompt = buildRefinementPrompt(goalTitle, goalDescription, expertKnowledge, userContext);
    
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'Du bist ein Elite Performance Coach. Hilf dem User sein Ziel zu präzisieren und erstelle wissenschaftlich fundierte Meilensteine. Antworte NUR mit validem JSON.' 
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    // Parse JSON
    let jsonStr = content;
    if (content.includes('```')) {
      jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const refined = JSON.parse(jsonStr) as RefinedGoal;
    refined.originalTitle = goalTitle;
    
    // Map AI category to database-allowed category
    refined.category = mapCategoryToDatabase(refined.category);
    
    logger.info(`Refined goal: "${goalTitle}" → "${refined.refinedTitle}" (category: ${refined.category})`);
    
    return refined;

  } catch (error) {
    logger.error('Error refining goal:', error);
    
    // Fallback
    return {
      originalTitle: goalTitle,
      refinedTitle: goalTitle,
      smartDescription: goalDescription || '',
      whyImportant: '',
      category: detectCategoryFromGoal(goalTitle, goalDescription) || 'personal',
      deadline: '',
      targetValue: 100,
      suggestedMilestones: [],
      expertInsights: [],
      estimatedWeeks: 12,
    };
  }
}

// ============================================
// BUILD REFINEMENT PROMPT
// ============================================

function buildRefinementPrompt(
  goalTitle: string,
  goalDescription?: string,
  expertKnowledge?: ExpertInsight | null,
  userContext?: { why?: string; deadline?: string; }
): string {
  let prompt = `
# AUFGABE

Der User hat ein Ziel eingegeben. Hilf ihm es zu PRÄZISIEREN und erstelle WISSENSCHAFTLICH FUNDIERTE Meilensteine.

# USER'S ZIEL

Titel: "${goalTitle}"
${goalDescription ? `Beschreibung: "${goalDescription}"` : ''}
${userContext?.why ? `Warum wichtig: "${userContext.why}"` : ''}
${userContext?.deadline ? `Gewünschte Deadline: "${userContext.deadline}"` : ''}

`;

  // Add expert knowledge if available
  if (expertKnowledge) {
    prompt += formatExpertKnowledgeForPrompt(expertKnowledge);
    prompt += `
**Empfohlene Meilenstein-Struktur:**
${expertKnowledge.milestoneTemplate.map((m, i) => `${i + 1}. ${m}`).join('\n')}

`;
  }

  prompt += `
# DEINE AUFGABE

1. **PRÄZISIERE** das Ziel (SMART: Spezifisch, Messbar, Attraktiv, Realistisch, Terminiert)
2. **ERKLÄRE** warum dieses Ziel wichtig ist (emotional!)
3. **ERSTELLE** 5-7 wissenschaftlich fundierte Meilensteine
4. **GEBE** 2-3 Experten-Insights die der User kennen sollte

# OUTPUT FORMAT (JSON)

{
  "refinedTitle": "Präzisierter Zieltitel (SMART)",
  "smartDescription": "Detaillierte Beschreibung was genau erreicht werden soll",
  "whyImportant": "Emotionale Begründung warum dieses Ziel wichtig ist (2-3 Sätze)",
  "category": "rhetorik|fitness|karriere|finanzen|lernen|gewohnheiten|beziehungen|fuehrerschein|business|personal",
  "deadline": "YYYY-MM-DD (realistisch geschätzt)",
  "targetValue": 100,
  "estimatedWeeks": 12,
  "suggestedMilestones": [
    "Meilenstein 1: Konkret und messbar",
    "Meilenstein 2: ...",
    "..."
  ],
  "expertInsights": [
    "💡 Wichtiger Insight 1 (aus Expertenwissen)",
    "💡 Wichtiger Insight 2",
    "💡 Wichtiger Insight 3"
  ]
}

WICHTIG:
- Meilensteine müssen KONKRET und MESSBAR sein
- Basiere sie auf dem Expertenwissen wenn verfügbar
- Die ersten Meilensteine sollten EINFACH sein (Quick Wins!)
- Der letzte Meilenstein = Ziel erreicht
`;

  return prompt;
}

// ============================================
// FORMAT REFINED GOAL FOR TELEGRAM
// ============================================

export function formatRefinedGoalMessage(refined: RefinedGoal): string {
  let message = `🎯 *Dein Ziel - Optimiert!*\n\n`;
  
  if (refined.originalTitle !== refined.refinedTitle) {
    message += `_Vorher:_ ${refined.originalTitle}\n`;
    message += `✨ *Nachher:* ${refined.refinedTitle}\n\n`;
  } else {
    message += `✨ *${refined.refinedTitle}*\n\n`;
  }
  
  if (refined.smartDescription) {
    message += `📝 ${refined.smartDescription}\n\n`;
  }
  
  if (refined.whyImportant) {
    message += `❤️ *Warum das wichtig ist:*\n_"${refined.whyImportant}"_\n\n`;
  }
  
  message += `⏱️ Geschätzte Dauer: ~${refined.estimatedWeeks} Wochen\n`;
  if (refined.deadline) {
    message += `📅 Deadline: ${new Date(refined.deadline).toLocaleDateString('de-DE')}\n`;
  }
  message += `\n`;
  
  if (refined.suggestedMilestones.length > 0) {
    message += `📊 *Empfohlene Meilensteine:*\n`;
    refined.suggestedMilestones.forEach((m, i) => {
      message += `${i + 1}. ${m}\n`;
    });
    message += `\n`;
  }
  
  if (refined.expertInsights.length > 0) {
    message += `🧠 *Experten-Tipps:*\n`;
    refined.expertInsights.forEach(insight => {
      message += `${insight}\n`;
    });
  }
  
  return message;
}

// ============================================
// GET MILESTONE SUGGESTIONS FOR EXISTING GOAL
// ============================================

export async function suggestMilestonesForGoal(
  goalTitle: string,
  goalCategory?: string,
  currentMilestones?: string[]
): Promise<string[]> {
  try {
    const category = goalCategory || detectCategoryFromGoal(goalTitle);
    const expertKnowledge = category ? getExpertKnowledge(category) : null;
    
    if (expertKnowledge && expertKnowledge.milestoneTemplate.length > 0) {
      // Use expert template if available
      return expertKnowledge.milestoneTemplate;
    }
    
    // Fallback to AI generation
    const prompt = `
Erstelle 5-7 konkrete, messbare Meilensteine für dieses Ziel:
"${goalTitle}"

${currentMilestones?.length ? `Bereits vorhandene Meilensteine: ${currentMilestones.join(', ')}` : ''}

Antworte NUR mit einem JSON Array von Strings:
["Meilenstein 1", "Meilenstein 2", ...]
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'Antworte NUR mit validem JSON Array.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content || '[]';
    let jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonStr);
    
  } catch (error) {
    logger.error('Error suggesting milestones:', error);
    return [];
  }
}

