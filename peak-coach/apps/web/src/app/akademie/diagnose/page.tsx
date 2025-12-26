'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Brain,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// ============================================
// Types
// ============================================

interface SkillAssessment {
  skill: string;
  category: string;
  selfRating: number; // 1-5
  importance: number; // 1-5
}

interface DiagnosisResult {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  prioritySkills: string[];
}

// ============================================
// Skill Categories for Diagnosis
// ============================================

const DIAGNOSIS_SKILLS = [
  { skill: 'Öffentliches Sprechen', category: 'Rhetorik' },
  { skill: 'Überzeugungskraft', category: 'Rhetorik' },
  { skill: 'Selbstdisziplin', category: 'Produktivität' },
  { skill: 'Zeitmanagement', category: 'Produktivität' },
  { skill: 'Fokus & Deep Work', category: 'Produktivität' },
  { skill: 'Stressmanagement', category: 'Psychologie' },
  { skill: 'Emotionale Intelligenz', category: 'Psychologie' },
  { skill: 'Körperliche Fitness', category: 'Fitness' },
  { skill: 'Ernährung & Gesundheit', category: 'Fitness' },
  { skill: 'Verhandlung', category: 'Business' },
  { skill: 'Leadership', category: 'Business' },
  { skill: 'Finanzielle Bildung', category: 'Finanzen' },
];

// ============================================
// Main Component
// ============================================

export default function DiagnosePage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState<'intro' | 'assessment' | 'results'>('intro');
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [assessments, setAssessments] = useState<SkillAssessment[]>([]);
  const [results, setResults] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const currentSkill = DIAGNOSIS_SKILLS[currentSkillIndex];
  const progress = ((currentSkillIndex + 1) / DIAGNOSIS_SKILLS.length) * 100;

  // Handle skill rating
  const handleRating = (selfRating: number, importance: number) => {
    const newAssessment: SkillAssessment = {
      skill: currentSkill.skill,
      category: currentSkill.category,
      selfRating,
      importance,
    };

    setAssessments([...assessments, newAssessment]);

    if (currentSkillIndex < DIAGNOSIS_SKILLS.length - 1) {
      setCurrentSkillIndex(currentSkillIndex + 1);
    } else {
      // Calculate results
      calculateResults([...assessments, newAssessment]);
    }
  };

  // Calculate diagnosis results
  const calculateResults = async (allAssessments: SkillAssessment[]) => {
    setLoading(true);
    setStep('results');

    // Sort by gap (importance - selfRating)
    const sorted = [...allAssessments].sort((a, b) => {
      const gapA = a.importance - a.selfRating;
      const gapB = b.importance - b.selfRating;
      return gapB - gapA;
    });

    // Weaknesses: high importance, low rating
    const weaknesses = sorted
      .filter(a => a.importance >= 4 && a.selfRating <= 2)
      .map(a => a.skill)
      .slice(0, 3);

    // Strengths: high rating
    const strengths = allAssessments
      .filter(a => a.selfRating >= 4)
      .map(a => a.skill)
      .slice(0, 3);

    // Priority skills: biggest gap with high importance
    const prioritySkills = sorted
      .filter(a => a.importance >= 3)
      .slice(0, 5)
      .map(a => a.skill);

    // Generate recommendations
    const recommendations = prioritySkills.map(skill => {
      const assessment = allAssessments.find(a => a.skill === skill);
      if (assessment && assessment.selfRating <= 2) {
        return `Starte mit Grundlagen in "${skill}" - kleine tägliche Übungen`;
      }
      return `Vertiefe "${skill}" durch praktische Anwendung`;
    });

    const diagnosisResult: DiagnosisResult = {
      strengths,
      weaknesses,
      recommendations,
      prioritySkills,
    };

    setResults(diagnosisResult);

    // Save to database
    if (user) {
      try {
        await supabase.from('diagnosis_results').upsert({
          user_id: user.id,
          assessments: allAssessments,
          results: diagnosisResult,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error saving diagnosis:', error);
      }
    }

    setLoading(false);
  };

  // ============================================
  // Render Steps
  // ============================================

  // Intro Step
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] text-white p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück
          </motion.button>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-2xl">
              <Brain className="w-16 h-16 text-emerald-400" />
            </div>

            <h1 className="text-3xl font-bold">Skill-Diagnose</h1>
            <p className="text-white/60 text-lg">
              Finde heraus, wo du stehst und welche Skills du priorisieren solltest.
            </p>

            <div className="bg-white/5 rounded-xl p-6 text-left space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                So funktioniert's:
              </h3>
              <ul className="space-y-3 text-white/70">
                <li className="flex items-start gap-3">
                  <span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</span>
                  <span>Bewerte {DIAGNOSIS_SKILLS.length} Skills nach deinem aktuellen Level</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</span>
                  <span>Gib an, wie wichtig jeder Skill für dich ist</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-emerald-500/20 text-emerald-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</span>
                  <span>Erhalte personalisierte Empfehlungen</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-white/40">
              ⏱️ Dauer: ca. 3-5 Minuten
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep('assessment')}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
            >
              Diagnose starten
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Assessment Step
  if (step === 'assessment') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] text-white p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-white/60 mb-2">
              <span>Skill {currentSkillIndex + 1} von {DIAGNOSIS_SKILLS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Current Skill */}
          <motion.div
            key={currentSkillIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <span className="text-sm text-white/40 uppercase tracking-wide">
                {currentSkill.category}
              </span>
              <h2 className="text-2xl font-bold mt-2">{currentSkill.skill}</h2>
            </div>

            {/* Self Rating */}
            <div className="bg-white/5 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold">Wie gut bist du darin?</h3>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => {
                      const importance = Math.floor(Math.random() * 3) + 3; // Temporary: random importance
                      handleRating(rating, importance);
                    }}
                    className="p-4 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/50 rounded-xl transition-all flex flex-col items-center gap-2"
                  >
                    <span className="text-2xl font-bold">{rating}</span>
                    <span className="text-xs text-white/60">
                      {rating === 1 && 'Anfänger'}
                      {rating === 2 && 'Grundlagen'}
                      {rating === 3 && 'Okay'}
                      {rating === 4 && 'Gut'}
                      {rating === 5 && 'Experte'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Results Step
  if (step === 'results') {
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] text-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
            <p className="text-white/60">Analysiere deine Ergebnisse...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] text-white p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex p-3 bg-emerald-500/20 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold">Deine Diagnose-Ergebnisse</h1>
          </motion.div>

          {/* Strengths */}
          {results?.strengths && results.strengths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-xl p-6 border border-emerald-500/30"
            >
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Deine Stärken
              </h3>
              <ul className="space-y-2">
                {results.strengths.map((strength, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {strength}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Weaknesses / Focus Areas */}
          {results?.weaknesses && results.weaknesses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl p-6 border border-amber-500/30"
            >
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-amber-400" />
                Fokus-Bereiche
              </h3>
              <ul className="space-y-2">
                {results.weaknesses.map((weakness, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/80">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Priority Skills */}
          {results?.prioritySkills && results.prioritySkills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 rounded-xl p-6 border border-white/10"
            >
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Empfohlene Prioritäten
              </h3>
              <div className="space-y-3">
                {results.prioritySkills.map((skill, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </span>
                      {skill}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-3"
          >
            <button
              onClick={() => router.push('/akademie')}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold"
            >
              Zur Akademie
            </button>
            <button
              onClick={() => {
                setStep('intro');
                setCurrentSkillIndex(0);
                setAssessments([]);
                setResults(null);
              }}
              className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all"
            >
              Diagnose wiederholen
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}

