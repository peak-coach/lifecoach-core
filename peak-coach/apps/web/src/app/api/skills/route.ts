import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

// Supabase Admin Client (für Server-Side)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// GET: Hole Skills für ein Ziel
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const goalId = searchParams.get('goalId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Wenn goalId angegeben, hole Skills für dieses Ziel
    if (goalId) {
      const { data: skills, error } = await supabaseAdmin
        .from('goal_skills')
        .select('*')
        .eq('user_id', userId)
        .eq('goal_id', goalId)
        .order('skill_category', { ascending: true })
        .order('skill_order', { ascending: true });

      if (error) throw error;

      // Strukturiere Skills hierarchisch
      const categories = skills?.filter(s => !s.parent_skill_id) || [];
      const subSkills = skills?.filter(s => s.parent_skill_id) || [];

      const structuredSkills = categories.map(cat => ({
        ...cat,
        subSkills: subSkills.filter(s => s.parent_skill_id === cat.id),
      }));

      // Berechne Gesamtfortschritt
      const totalMastery = subSkills.length > 0
        ? Math.round(subSkills.reduce((sum, s) => sum + (s.mastery_level || 0), 0) / subSkills.length)
        : 0;

      const weaknesses = subSkills.filter(s => s.is_weakness);

      return NextResponse.json({
        skills: structuredSkills,
        flatSkills: skills,
        summary: {
          totalSkills: subSkills.length,
          completedSkills: subSkills.filter(s => s.mastery_level >= 80).length,
          avgMastery: totalMastery,
          weaknessCount: weaknesses.length,
          weaknesses: weaknesses.map(w => ({ id: w.id, name: w.skill_name, mastery: w.mastery_level })),
        },
      });
    }

    // Sonst: Hole alle Skills des Users (gruppiert nach Ziel)
    const { data: skills, error } = await supabaseAdmin
      .from('goal_skills')
      .select(`
        *,
        goals:goal_id (
          id,
          title,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

// ============================================
// POST: Generiere Skills für ein Ziel (KI)
// ============================================
export async function POST(request: NextRequest) {
  try {
    const { userId, goalId, goalTitle, goalCategory } = await request.json();

    if (!userId || !goalId || !goalTitle) {
      return NextResponse.json(
        { error: 'userId, goalId, and goalTitle required' },
        { status: 400 }
      );
    }

    // Prüfe ob bereits Skills existieren
    const { data: existingSkills } = await supabaseAdmin
      .from('goal_skills')
      .select('id')
      .eq('goal_id', goalId)
      .eq('user_id', userId)
      .limit(1);

    if (existingSkills && existingSkills.length > 0) {
      return NextResponse.json(
        { error: 'Skills already exist for this goal', existingSkillCount: existingSkills.length },
        { status: 409 }
      );
    }

    // Versuche zuerst ein passendes Template zu finden
    const { data: templates } = await supabaseAdmin
      .from('skill_templates')
      .select('*')
      .eq('is_active', true);

    let skillStructure = null;

    // Suche nach passendem Template
    if (templates) {
      const matchingTemplate = templates.find(t => {
        const keywords = t.goal_keywords || [];
        const titleLower = goalTitle.toLowerCase();
        return keywords.some((kw: string) => titleLower.includes(kw.toLowerCase()));
      });

      if (matchingTemplate) {
        skillStructure = matchingTemplate.skill_structure;
        
        // Update usage count
        await supabaseAdmin
          .from('skill_templates')
          .update({ usage_count: (matchingTemplate.usage_count || 0) + 1 })
          .eq('id', matchingTemplate.id);
      }
    }

    // Wenn kein Template gefunden, generiere mit KI
    if (!skillStructure) {
      const apiKey = process.env.OPENAI_API_KEY || process.env.OpenAI_API_KEY;
      
      if (!apiKey) {
        // Fallback Skill-Struktur
        skillStructure = generateFallbackSkillStructure(goalTitle);
      } else {
        const openai = new OpenAI({ apiKey });

        const response = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `Du bist ein Experte für Skill-Analyse. Zerlege Ziele in lernbare Sub-Skills.

REGELN:
1. Erstelle 3-4 Hauptkategorien
2. Pro Kategorie 2-4 konkrete Sub-Skills
3. Jeder Sub-Skill muss LERNBAR und ÜBBAR sein
4. Schätze Schwierigkeit und benötigte Module realistisch

OUTPUT FORMAT (JSON):
{
  "categories": [
    {
      "name": "Kategorie-Name",
      "description": "Kurze Beschreibung",
      "skills": [
        {
          "name": "Skill-Name",
          "description": "Was dieser Skill bedeutet",
          "difficulty": "beginner|intermediate|advanced",
          "modules": 2-4
        }
      ]
    }
  ]
}`
            },
            {
              role: 'user',
              content: `Analysiere dieses Ziel und erstelle eine Skill-Map: "${goalTitle}" (Kategorie: ${goalCategory || 'personal'})`
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
          skillStructure = JSON.parse(content);
        } else {
          skillStructure = generateFallbackSkillStructure(goalTitle);
        }
      }
    }

    // Skills in DB speichern
    const createdSkills = [];

    for (const category of skillStructure.categories || []) {
      // Erstelle Kategorie (Parent Skill)
      const { data: parentSkill, error: parentError } = await supabaseAdmin
        .from('goal_skills')
        .insert({
          goal_id: goalId,
          user_id: userId,
          skill_name: category.name,
          skill_description: category.description,
          skill_category: category.name,
          parent_skill_id: null,
          skill_order: skillStructure.categories.indexOf(category),
          difficulty: 'intermediate',
          estimated_modules: category.skills?.reduce((sum: number, s: any) => sum + (s.modules || 3), 0) || 10,
        })
        .select()
        .single();

      if (parentError) {
        console.error('Error creating parent skill:', parentError);
        continue;
      }

      createdSkills.push(parentSkill);

      // Erstelle Sub-Skills
      for (const skill of category.skills || []) {
        const { data: subSkill, error: subError } = await supabaseAdmin
          .from('goal_skills')
          .insert({
            goal_id: goalId,
            user_id: userId,
            skill_name: skill.name,
            skill_description: skill.description,
            skill_category: category.name,
            parent_skill_id: parentSkill.id,
            skill_order: category.skills.indexOf(skill),
            difficulty: skill.difficulty || 'intermediate',
            estimated_modules: skill.modules || 3,
          })
          .select()
          .single();

        if (subError) {
          console.error('Error creating sub-skill:', subError);
          continue;
        }

        createdSkills.push(subSkill);
      }
    }

    return NextResponse.json({
      success: true,
      skillCount: createdSkills.length,
      skills: createdSkills,
      structure: skillStructure,
    });
  } catch (error) {
    console.error('Error generating skills:', error);
    return NextResponse.json({ error: 'Failed to generate skills' }, { status: 500 });
  }
}

// ============================================
// PATCH: Update Skill (Mastery, etc.)
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const { skillId, userId, updates } = await request.json();

    if (!skillId || !userId) {
      return NextResponse.json({ error: 'skillId and userId required' }, { status: 400 });
    }

    const allowedUpdates = ['mastery_level', 'is_weakness', 'weakness_reason', 'last_practiced_at'];
    const filteredUpdates: Record<string, any> = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    filteredUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('goal_skills')
      .update(filteredUpdates)
      .eq('id', skillId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, skill: data });
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

// ============================================
// DELETE: Lösche Skills für ein Ziel
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const goalId = searchParams.get('goalId');

    if (!userId || !goalId) {
      return NextResponse.json({ error: 'userId and goalId required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('goal_skills')
      .delete()
      .eq('goal_id', goalId)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting skills:', error);
    return NextResponse.json({ error: 'Failed to delete skills' }, { status: 500 });
  }
}

// ============================================
// Fallback Skill-Struktur Generator
// ============================================
function generateFallbackSkillStructure(goalTitle: string) {
  return {
    categories: [
      {
        name: 'Grundlagen',
        description: 'Basis-Wissen und Konzepte',
        skills: [
          { name: 'Kernkonzepte verstehen', difficulty: 'beginner', modules: 3 },
          { name: 'Grundlegende Techniken', difficulty: 'beginner', modules: 2 },
        ],
      },
      {
        name: 'Praktische Anwendung',
        description: 'Umsetzung in der Praxis',
        skills: [
          { name: 'Erste Schritte', difficulty: 'beginner', modules: 2 },
          { name: 'Übung & Wiederholung', difficulty: 'intermediate', modules: 3 },
          { name: 'Feedback einarbeiten', difficulty: 'intermediate', modules: 2 },
        ],
      },
      {
        name: 'Fortgeschritten',
        description: 'Vertiefung und Optimierung',
        skills: [
          { name: 'Fortgeschrittene Strategien', difficulty: 'advanced', modules: 3 },
          { name: 'Edge Cases meistern', difficulty: 'advanced', modules: 2 },
        ],
      },
    ],
  };
}

