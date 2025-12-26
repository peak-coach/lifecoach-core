'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  BookOpen,
  Clock,
  Target,
  ChevronRight,
  Sparkles,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// ============================================
// Category Data
// ============================================

const CATEGORIES: Record<string, {
  name: string;
  description: string;
  icon: string;
  color: string;
  topics: string[];
}> = {
  rhetorik: {
    name: 'Rhetorik & Kommunikation',
    description: 'Überzeugend sprechen und präsentieren',
    icon: '🎤',
    color: '#ef4444',
    topics: [
      'Körpersprache & Präsenz',
      'Storytelling',
      'Überzeugungstechniken',
      'Stimme & Artikulation',
      'Umgang mit Lampenfieber',
      'Präsentationstechniken',
    ],
  },
  psychologie: {
    name: 'Psychologie & Mindset',
    description: 'Verhaltensänderung und mentale Stärke',
    icon: '🧠',
    color: '#8b5cf6',
    topics: [
      'Gewohnheiten aufbauen',
      'Motivation verstehen',
      'Emotionale Intelligenz',
      'Kognitive Verzerrungen',
      'Resilienz entwickeln',
      'Selbstdisziplin',
    ],
  },
  produktivitaet: {
    name: 'Produktivität & Fokus',
    description: 'Zeitmanagement und Deep Work',
    icon: '⚡',
    color: '#f59e0b',
    topics: [
      'Deep Work',
      'Zeitblöcke & Timeboxing',
      'Priorisierung (Eisenhower, Pareto)',
      'Ablenkungen eliminieren',
      'Energie-Management',
      'Getting Things Done (GTD)',
    ],
  },
  fitness: {
    name: 'Fitness & Gesundheit',
    description: 'Training und körperliche Optimierung',
    icon: '💪',
    color: '#10b981',
    topics: [
      'Krafttraining Grundlagen',
      'Ernährung & Makros',
      'Schlafoptimierung',
      'Recovery & Regeneration',
      'Supplements',
      'Cardio vs. Kraft',
    ],
  },
  business: {
    name: 'Business & Karriere',
    description: 'Unternehmertum und Leadership',
    icon: '💼',
    color: '#3b82f6',
    topics: [
      'Leadership Skills',
      'Verhandlungstechniken',
      'Networking',
      'Personal Branding',
      'Entscheidungsfindung',
      'Delegation & Management',
    ],
  },
  lernen: {
    name: 'Lernen & Wissen',
    description: 'Effektive Lernmethoden',
    icon: '📚',
    color: '#ec4899',
    topics: [
      'Spaced Repetition',
      'Active Recall',
      'Notizen & Second Brain',
      'Speed Reading',
      'Gedächtnistechniken',
      'Meta-Learning',
    ],
  },
  finanzen: {
    name: 'Finanzen & Investing',
    description: 'Vermögensaufbau',
    icon: '💰',
    color: '#14b8a6',
    topics: [
      'Budgetierung',
      'ETF & Index Investing',
      'Immobilien Grundlagen',
      'Steueroptimierung',
      'Finanzielle Unabhängigkeit',
      'Krypto Basics',
    ],
  },
  trt: {
    name: 'TRT & Enhanced',
    description: 'Hormonoptimierung',
    icon: '💉',
    color: '#7c3aed',
    topics: [
      'Testosteron verstehen',
      'TRT Protokolle',
      'Blutwerk & Monitoring',
      'Nebenwirkungen Management',
      'Lifestyle-Optimierung',
      'Supplements & Unterstützung',
    ],
  },
};

// ============================================
// Main Component
// ============================================

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  
  const category = CATEGORIES[slug];
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Kategorie nicht gefunden</h1>
          <button
            onClick={() => router.push('/akademie')}
            className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
          >
            Zurück zur Akademie
          </button>
        </div>
      </div>
    );
  }

  const handleStartLearning = (topic: string) => {
    setIsStarting(true);
    // Navigate to learning page with category and topic
    router.push(`/akademie/lernen?category=${slug}&topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#12121a] to-[#0a0a0f] text-white">
      {/* Header */}
      <div 
        className="relative py-12 px-4"
        style={{ 
          background: `linear-gradient(135deg, ${category.color}20 0%, transparent 50%)` 
        }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push('/akademie')}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Akademie
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${category.color}30` }}
            >
              {category.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{category.name}</h1>
              <p className="text-white/60">{category.description}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <button
            onClick={() => handleStartLearning(category.topics[0])}
            disabled={isStarting}
            className="w-full p-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isStarting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Play className="w-6 h-6" />
                Jetzt lernen starten
              </>
            )}
          </button>
        </motion.div>

        {/* Topics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Themen in dieser Kategorie
          </h2>

          <div className="grid gap-3">
            {category.topics.map((topic, index) => (
              <motion.button
                key={topic}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => handleStartLearning(topic)}
                disabled={isStarting}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <GraduationCap 
                      className="w-5 h-5" 
                      style={{ color: category.color }}
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{topic}</p>
                    <p className="text-sm text-white/50">Modul starten</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10"
        >
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Wie funktioniert's?
          </h3>
          <ul className="space-y-2 text-white/70 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">1.</span>
              Wähle ein Thema aus oder starte direkt
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">2.</span>
              Die KI generiert ein personalisiertes Lernmodul
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">3.</span>
              Lerne in 8 Schritten: Pre-Test → Warum → Lernen → Generieren → Üben → Quiz → Action → Reflexion
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-400">4.</span>
              Sammle XP und baue deine Skills auf
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

