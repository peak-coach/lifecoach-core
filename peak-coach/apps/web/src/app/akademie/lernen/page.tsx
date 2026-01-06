'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  Lightbulb,
  Target,
  Sparkles,
  Trophy,
  X,
  Loader2,
  Zap,
  BookOpen,
  Play,
  RefreshCw,
  MessageSquare,
  Video,
  ExternalLink,
  PenLine,
  HelpCircle,
  Send,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { rollVariableReward, VariableReward } from '@/lib/rewards';
import { VariableRewardPopup } from '@/components/variable-reward';

// ============================================
// Types - Neue 8-Step Struktur
// ============================================

interface PreTestContent {
  question: string;
  options: string[];
  correctIndex: number;
  teaser: string;
}

interface WhyContent {
  hook: string;
  benefit: string;
  connection: string;
}

interface VideoRecommendation {
  title: string;
  url: string;
  duration: string;
}

interface LearnContent {
  concept: string;
  example: string;
  source: string;
  keyPoints?: string[];
  previousConnection?: string | null;
  analogy?: string | null;
  videoRecommendation?: VideoRecommendation | null;
}

interface GenerateContent {
  prompt: string;
  exampleAnswer: string;
  keyPointsToInclude: string[];
}

interface DoContent {
  title: string;
  instruction: string;
  duration_minutes: number;
  success_criteria: string;
}

interface TestQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  whyCorrect: string;
  whyOthersWrong: string;
}

interface ImplementationIntention {
  situation: string;
  behavior: string;
  formatted: string;
}

interface ActionContent {
  task: string;
  implementationIntention?: ImplementationIntention;
  triggerSuggestions?: string[];
  timingOptions?: string[];
  metric: string;
  when?: string; // Legacy support
}

interface ReflectContent {
  prompts: string[];
}

interface ModuleContent {
  preTest?: PreTestContent;
  why: WhyContent;
  learn: LearnContent;
  generate?: GenerateContent;
  do: DoContent;
  test: TestQuestion[];
  action: ActionContent;
  reflect?: ReflectContent;
  reviewQuestions?: string[];
}

interface Module {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  estimatedMinutes: number;
  moduleNumber: number;
  difficulty: string;
  topic: string;
  totalModules: number;
  content: ModuleContent;
  goalId?: string;
  skillId?: string;
}

type Step = 'diagnosis' | 'pretest' | 'why' | 'learn' | 'generate' | 'do' | 'test' | 'action' | 'reflect' | 'retry' | 'complete';

type DiagnosisLevel = 'beginner' | 'intermediate' | 'advanced';

// ============================================
// Progress Bar
// ============================================

function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="relative">
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-white/40">
        <span>Step {currentStep + 1} von {totalSteps + 1}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// ============================================
// Step 0: DIAGNOSIS - Eingangs-Assessment
// ============================================

function DiagnosisStep({ 
  goalTitle, 
  category,
  onComplete 
}: { 
  goalTitle: string;
  category: string;
  onComplete: (level: DiagnosisLevel) => void;
}) {
  const [selectedLevel, setSelectedLevel] = useState<DiagnosisLevel | null>(null);

  const levels = [
    {
      id: 'beginner' as DiagnosisLevel,
      emoji: '🌱',
      title: 'Anfänger',
      description: 'Ich bin neu in diesem Bereich und möchte die Grundlagen lernen.',
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'intermediate' as DiagnosisLevel,
      emoji: '🌿',
      title: 'Fortgeschritten',
      description: 'Ich kenne die Basics, will aber tiefer einsteigen.',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'advanced' as DiagnosisLevel,
      emoji: '🌳',
      title: 'Experte',
      description: 'Ich habe Erfahrung und suche fortgeschrittene Strategien.',
      color: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-indigo-400 mb-6">
            <Brain className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">EINGANGS-ASSESSMENT</span>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            Wie gut kennst du dich mit "{category}" aus?
          </h2>
          <p className="text-white/60 mb-8">
            Das hilft uns, die Module auf dein Level anzupassen.
          </p>

          <div className="space-y-4">
            {levels.map((level) => (
              <motion.button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-5 rounded-xl text-left transition-all ${
                  selectedLevel === level.id
                    ? `bg-gradient-to-r ${level.color} border-2 border-white/30`
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{level.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{level.title}</h3>
                    <p className={`text-sm ${selectedLevel === level.id ? 'text-white/80' : 'text-white/60'}`}>
                      {level.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-indigo-300 text-sm">
              💡 Keine Sorge - du kannst das Level jederzeit anpassen. 
              Wir empfehlen: Lieber zu niedrig starten und schnell vorankommen!
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/10">
        <motion.button
          onClick={() => selectedLevel && onComplete(selectedLevel)}
          disabled={!selectedLevel}
          whileHover={{ scale: selectedLevel ? 1.02 : 1 }}
          whileTap={{ scale: selectedLevel ? 0.98 : 1 }}
          className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            selectedLevel
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          Starten
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================
// Step 1: PRE-TEST - Pretesting Effect (NEU!)
// ============================================

function PreTestStep({ 
  content, 
  onNext 
}: { 
  content: PreTestContent;
  onNext: (wasCorrect: boolean) => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowResult(true);
  };

  const isCorrect = selectedAnswer === content.correctIndex;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-cyan-400 mb-6">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">PRE-TEST • RATE MAL!</span>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <p className="text-white/60 text-sm mb-2">
              🧪 Bevor du lernst: Was denkst du?
            </p>
            <h2 className="text-xl md:text-2xl font-bold">
              {content.question}
            </h2>
          </motion.div>

          <p className="text-cyan-300/70 text-sm mb-6 italic">
            {content.teaser}
          </p>
          
          <div className="space-y-3">
            {content.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={selectedAnswer !== null}
                whileHover={selectedAnswer === null ? { scale: 1.02 } : {}}
                whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  selectedAnswer === null
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                    : selectedAnswer === index
                      ? index === content.correctIndex
                        ? 'bg-emerald-500/20 border border-emerald-500'
                        : 'bg-amber-500/20 border border-amber-500'
                      : index === content.correctIndex
                        ? 'bg-emerald-500/20 border border-emerald-500'
                        : 'bg-white/5 border border-white/10 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    selectedAnswer === null
                      ? 'bg-white/10'
                      : selectedAnswer === index
                        ? index === content.correctIndex
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                        : index === content.correctIndex
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/10'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Result Message */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-xl ${
                isCorrect 
                  ? 'bg-emerald-500/10 border border-emerald-500/30' 
                  : 'bg-amber-500/10 border border-amber-500/30'
              }`}
            >
              {isCorrect ? (
                <p className="text-emerald-300">
                  ✅ <strong>Gut geraten!</strong> Mal sehen, ob du weißt warum das stimmt...
                </p>
              ) : (
                <p className="text-amber-300">
                  🤔 <strong>Interessant!</strong> Das werden wir gleich aufklären. Pretesting verbessert dein Lernen um 25%!
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {showResult && (
        <div className="p-6 border-t border-white/10">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onNext(isCorrect)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            Jetzt lernen - Warum?
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Step 2: WHY - Motivation
// ============================================

function WhyStep({ content, goalTitle, onNext }: { 
  content: WhyContent; 
  goalTitle: string;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-amber-400 mb-6">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">WARUM DAS WICHTIG IST</span>
          </div>
          
          {/* Hook */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl md:text-3xl font-bold mb-8 leading-relaxed"
          >
            {content.hook}
          </motion.div>
          
          {/* Benefit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-amber-500/20">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-300 font-medium mb-1">Dein Nutzen:</p>
                <p className="text-white/80">{content.benefit}</p>
              </div>
            </div>
          </motion.div>
          
          {/* Connection to Goal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <p className="text-white/60 text-sm">
              <span className="text-indigo-400">🎯 Dein Ziel:</span> {goalTitle}
            </p>
            <p className="text-white/80 mt-2">{content.connection}</p>
          </motion.div>
        </div>
      </div>

      <div className="p-6 border-t border-white/10">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={onNext}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          Los geht's - Zeig mir das Konzept
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================
// Step 3: LEARN - Konzept + Beispiel + Video
// ============================================

function LearnStep({ content, onNext }: { content: LearnContent; onNext: () => void }) {
  const [showExample, setShowExample] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-indigo-400 mb-6">
            <Brain className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">DAS KONZEPT</span>
          </div>
          
          {/* Concept */}
          <div className="prose prose-invert max-w-none mb-6">
            <div 
              className="text-lg leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ 
                __html: content.concept
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-300">$1</strong>')
              }}
            />
          </div>

          {/* Key Points (NEU) */}
          {content.keyPoints && content.keyPoints.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-6"
            >
              <p className="text-indigo-300 font-medium mb-3">📌 Key Points:</p>
              <ul className="space-y-2">
                {content.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/80">
                    <span className="text-indigo-400 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Analogy (NEU) */}
          {content.analogy && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-6">
              <p className="text-purple-300 text-sm">
                💡 <strong>Analogie:</strong> {content.analogy}
              </p>
            </div>
          )}
          
          {/* Source */}
          <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
            <BookOpen className="w-4 h-4" />
            <span>Quelle: {content.source}</span>
          </div>

          {/* Previous Connection */}
          {content.previousConnection && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <p className="text-indigo-300 text-sm">
                📎 Verbindung zum vorherigen Modul: {content.previousConnection}
              </p>
            </div>
          )}

          {/* Video Recommendation (NEU) */}
          {content.videoRecommendation && (
            <motion.a
              href={content.videoRecommendation.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors mb-6"
            >
              <div className="p-3 rounded-xl bg-red-500/20">
                <Video className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-red-300 text-xs font-medium mb-1">📺 Video-Empfehlung</p>
                <p className="text-white font-medium">{content.videoRecommendation.title}</p>
                <p className="text-white/40 text-sm">{content.videoRecommendation.duration}</p>
              </div>
              <ExternalLink className="w-5 h-5 text-white/40" />
            </motion.a>
          )}
          
          {/* Example Toggle */}
          {!showExample ? (
            <motion.button
              onClick={() => setShowExample(true)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <span className="font-medium">Praktisches Beispiel anzeigen</span>
                </div>
                <ArrowRight className="w-5 h-5 text-white/40" />
              </div>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20"
            >
              <div className="flex items-center gap-2 text-yellow-400 mb-4">
                <Lightbulb className="w-5 h-5" />
                <span className="font-medium">Beispiel</span>
              </div>
              <div 
                className="text-white/80 whitespace-pre-line"
                dangerouslySetInnerHTML={{ 
                  __html: content.example
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-300">$1</strong>')
                }}
              />
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-white/10">
        <motion.button
          onClick={onNext}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          Verstanden - Jetzt selbst erklären
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================
// Step 4: GENERATE - Generation Effect (NEU!)
// ============================================

function GenerateStep({ 
  content, 
  onNext 
}: { 
  content: GenerateContent;
  onNext: (userExplanation: string) => void;
}) {
  const [explanation, setExplanation] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState(0);

  const handleSubmit = () => {
    // Simple scoring based on key points mentioned
    let score = 0;
    const lowerExplanation = explanation.toLowerCase();
    
    content.keyPointsToInclude.forEach(point => {
      if (lowerExplanation.includes(point.toLowerCase())) {
        score++;
      }
    });

    // Check minimum length
    if (explanation.split(' ').length >= 15) {
      score++;
    }

    setFeedbackScore(score);
    setShowFeedback(true);
  };

  const totalPoints = content.keyPointsToInclude.length + 1;
  const percentage = Math.round((feedbackScore / totalPoints) * 100);
  const isGood = percentage >= 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-emerald-400 mb-6">
            <PenLine className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">ERKLÄRE ES SELBST • +50% RETENTION!</span>
          </div>
          
          <h2 className="text-xl font-bold mb-2">
            Generation Effect
          </h2>
          <p className="text-white/60 mb-6">
            Wenn du etwas in eigenen Worten erklärst, behältst du es 50% besser! 
            Keine Sorge - es gibt keine falschen Antworten.
          </p>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <p className="text-emerald-300 font-medium mb-2">📝 Deine Aufgabe:</p>
            <p className="text-white">{content.prompt}</p>
          </div>

          {!showFeedback ? (
            <>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Schreibe hier deine Erklärung... (2-3 Sätze reichen)"
                className="w-full h-40 p-4 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none resize-none text-white placeholder-white/30"
              />
              
              <p className="text-white/40 text-sm mt-2">
                💡 Tipp: Versuche diese Begriffe einzubauen: {content.keyPointsToInclude.join(', ')}
              </p>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* User's explanation */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs mb-2">Deine Erklärung:</p>
                <p className="text-white">{explanation}</p>
              </div>

              {/* Feedback */}
              <div className={`p-4 rounded-xl ${
                isGood ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-amber-500/10 border border-amber-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {isGood ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="font-medium text-emerald-400">Super erklärt! 🎉</span>
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      <span className="font-medium text-amber-400">Guter Ansatz! Hier eine Musterlösung:</span>
                    </>
                  )}
                </div>
                
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-white/40 text-xs mb-1">Mustererklärung:</p>
                  <p className="text-white/80">{content.exampleAnswer}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-white/10">
        {!showFeedback ? (
          <motion.button
            onClick={handleSubmit}
            disabled={explanation.trim().length < 10}
            whileHover={{ scale: explanation.trim().length >= 10 ? 1.02 : 1 }}
            whileTap={{ scale: explanation.trim().length >= 10 ? 0.98 : 1 }}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
              explanation.trim().length >= 10
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
            Erklärung abschicken
          </motion.button>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onNext(explanation)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            Weiter zur Übung
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Step 5: DO - Praktische Übung
// ============================================

function DoStep({ content, onNext }: { content: DoContent; onNext: () => void }) {
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(content.duration_minutes * 60);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (started && timeLeft > 0 && !completed) {
      const timer = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [started, timeLeft, completed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-emerald-400 mb-6">
            <Play className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">JETZT ANWENDEN</span>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">{content.title}</h2>
          
          {/* Timer */}
          <div className="flex items-center justify-center mb-8">
            <div className={`text-5xl font-mono font-bold ${
              started && timeLeft <= 30 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          
          {/* Instructions */}
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <div 
              className="text-white/80 whitespace-pre-line"
              dangerouslySetInnerHTML={{ 
                __html: content.instruction
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-300">$1</strong>')
              }}
            />
          </div>
          
          {/* Success Criteria */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <p className="text-white/60 text-sm">Erfolgskriterium:</p>
                <p className="text-white/80">{content.success_criteria}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/10 space-y-3">
        {!started ? (
          <motion.button
            onClick={() => setStarted(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Timer starten ({content.duration_minutes} Min)
          </motion.button>
        ) : !completed ? (
          <motion.button
            onClick={() => setCompleted(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Übung abgeschlossen ✓
          </motion.button>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            Super! Weiter zum Quiz
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        )}
        
        {started && !completed && (
          <button
            onClick={() => setCompleted(true)}
            className="w-full py-2 text-white/40 hover:text-white/60 text-sm"
          >
            Überspringen
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Step 6: TEST - Quiz mit Confidence Rating
// ============================================

function TestStep({ 
  questions, 
  onComplete 
}: { 
  questions: TestQuestion[]; 
  onComplete: (score: number, confidenceData: { confidence: number; wasCorrect: boolean }[]) => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedConfidence, setSelectedConfidence] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
  const [confidenceData, setConfidenceData] = useState<{ confidence: number; wasCorrect: boolean }[]>([]);

  const question = questions[currentQ];
  const isCorrect = selectedAnswer === question.correctIndex;
  const isLastQuestion = currentQ === questions.length - 1;

  const confidenceLevels = [
    { level: 1, emoji: '😬', label: 'Geraten' },
    { level: 2, emoji: '🤔', label: 'Unsicher' },
    { level: 3, emoji: '😊', label: 'Ziemlich sicher' },
    { level: 4, emoji: '😎', label: '100% sicher' },
  ];

  const handleSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
  };

  const handleConfidenceSelect = (level: number) => {
    setSelectedConfidence(level);
    setShowFeedback(true);
    
    const wasCorrect = selectedAnswer === question.correctIndex;
    if (wasCorrect) {
      setCorrectAnswers(prev => [...prev, currentQ]);
    }
    
    setConfidenceData(prev => [...prev, { confidence: level, wasCorrect }]);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const finalScore = correctAnswers.length + (isCorrect && !correctAnswers.includes(currentQ) ? 1 : 0);
      onComplete(finalScore, confidenceData);
    } else {
      setCurrentQ(q => q + 1);
      setSelectedAnswer(null);
      setSelectedConfidence(null);
      setShowFeedback(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-purple-400">
              <Brain className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">QUIZ</span>
            </div>
            <span className="text-sm text-white/40">
              Frage {currentQ + 1} von {questions.length}
            </span>
          </div>
          
          <h2 className="text-xl font-bold mb-6">{question.question}</h2>
          
          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={selectedAnswer !== null}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  selectedAnswer === null
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                    : selectedAnswer === index
                      ? index === question.correctIndex
                        ? 'bg-emerald-500/20 border border-emerald-500'
                        : 'bg-red-500/20 border border-red-500'
                      : index === question.correctIndex && showFeedback
                        ? 'bg-emerald-500/20 border border-emerald-500'
                        : 'bg-white/5 border border-white/10 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    selectedAnswer === null
                      ? 'bg-white/10'
                      : selectedAnswer === index
                        ? index === question.correctIndex
                          ? 'bg-emerald-500 text-white'
                          : 'bg-red-500 text-white'
                        : index === question.correctIndex && showFeedback
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/10'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Confidence Rating (NEU) */}
          {selectedAnswer !== null && !showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
            >
              <p className="text-purple-300 font-medium mb-3">Wie sicher bist du?</p>
              <div className="grid grid-cols-4 gap-2">
                {confidenceLevels.map((conf) => (
                  <button
                    key={conf.level}
                    onClick={() => handleConfidenceSelect(conf.level)}
                    className={`p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-center ${
                      selectedConfidence === conf.level ? 'border-purple-500 bg-purple-500/20' : ''
                    }`}
                  >
                    <span className="text-2xl block mb-1">{conf.emoji}</span>
                    <span className="text-xs text-white/60">{conf.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Feedback with Elaboration */}
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-xl ${
                isCorrect 
                  ? 'bg-emerald-500/10 border border-emerald-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {isCorrect ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="font-medium text-emerald-400">Richtig!</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-red-400" />
                    <span className="font-medium text-red-400">Nicht ganz...</span>
                  </>
                )}
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <p className="text-emerald-300 font-medium mb-1">✓ Warum richtig:</p>
                  <p className="text-white/80">{question.whyCorrect}</p>
                </div>
                
                {!isCorrect && (
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <p className="text-red-300 font-medium mb-1">✗ Warum die anderen falsch:</p>
                    <p className="text-white/80">{question.whyOthersWrong}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {showFeedback && (
        <div className="p-6 border-t border-white/10">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            {isLastQuestion ? 'Quiz abschließen' : 'Nächste Frage'}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Step 7: ACTION - Implementation Intention Builder (Erweitert)
// ============================================

function ActionStep({ 
  content, 
  quizScore,
  totalQuestions,
  onComplete 
}: { 
  content: ActionContent;
  quizScore: number;
  totalQuestions: number;
  onComplete: (action: { trigger: string; behavior: string; timing: string }) => void;
}) {
  const [selectedTrigger, setSelectedTrigger] = useState(content.implementationIntention?.situation || '');
  const [customTrigger, setCustomTrigger] = useState('');
  const [selectedTiming, setSelectedTiming] = useState(content.timingOptions?.[0] || 'heute');
  const [committed, setCommitted] = useState(false);
  
  const percentage = Math.round((quizScore / totalQuestions) * 100);
  const effectiveTrigger = customTrigger || selectedTrigger;

  const timingOptions = content.timingOptions || ['heute', 'morgen', 'diese Woche', 'bei Gelegenheit'];
  const triggerSuggestions = content.triggerSuggestions || [
    'Nach dem Aufstehen',
    'Im nächsten Meeting',
    'Bei der nächsten Gelegenheit',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Quiz Result */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 text-amber-400 mb-3">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">QUIZ ERGEBNIS</span>
            </div>
            <div className="text-4xl font-bold mb-1">{percentage}%</div>
            <p className="text-white/60 text-sm">{quizScore} von {totalQuestions} richtig</p>
          </div>

          <div className="flex items-center gap-2 text-rose-400 mb-6">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">IMPLEMENTATION INTENTION</span>
          </div>
          
          <p className="text-white/60 mb-6">
            📌 Menschen die einen konkreten Plan machen, setzen 3x häufiger um!
          </p>

          {!committed ? (
            <>
              {/* Task Preview */}
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-6">
                <p className="text-rose-300 font-medium mb-2">Deine Aufgabe:</p>
                <p className="text-white">{content.task}</p>
              </div>

              {/* Trigger Selection */}
              <div className="mb-6">
                <p className="text-white/80 font-medium mb-3">WENN...</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {triggerSuggestions.map((trigger) => (
                    <button
                      key={trigger}
                      onClick={() => { setSelectedTrigger(trigger); setCustomTrigger(''); }}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        selectedTrigger === trigger && !customTrigger
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {trigger}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={customTrigger}
                  onChange={(e) => setCustomTrigger(e.target.value)}
                  placeholder="Oder eigenen Trigger eingeben..."
                  className="w-full p-3 rounded-lg bg-white/5 border border-white/10 focus:border-rose-500/50 outline-none text-white placeholder-white/30 text-sm"
                />
              </div>

              {/* Timing Selection */}
              <div className="mb-6">
                <p className="text-white/80 font-medium mb-3">WANN?</p>
                <div className="flex flex-wrap gap-2">
                  {timingOptions.map((timing) => (
                    <button
                      key={timing}
                      onClick={() => setSelectedTiming(timing)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all capitalize ${
                        selectedTiming === timing
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {timing}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {effectiveTrigger && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 border border-rose-500/30"
                >
                  <p className="text-rose-300 text-sm font-medium mb-2">📋 Dein Plan:</p>
                  <p className="text-white font-medium">
                    WENN <span className="text-rose-300">{effectiveTrigger}</span>, DANN werde ich <span className="text-pink-300">{content.implementationIntention?.behavior || content.task}</span>.
                  </p>
                  <p className="text-white/60 text-sm mt-2">
                    Zeitrahmen: <span className="text-white capitalize">{selectedTiming}</span>
                  </p>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-center"
            >
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-emerald-300 font-medium text-lg">Plan gespeichert! 💪</p>
              <p className="text-white mt-2">
                WENN {effectiveTrigger}, DANN {content.implementationIntention?.behavior || content.task}
              </p>
              <p className="text-white/60 text-sm mt-2">Wir erinnern dich {selectedTiming} daran.</p>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-white/10">
        {!committed ? (
          <motion.button
            onClick={() => setCommitted(true)}
            disabled={!effectiveTrigger}
            whileHover={{ scale: effectiveTrigger ? 1.02 : 1 }}
            whileTap={{ scale: effectiveTrigger ? 0.98 : 1 }}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
              effectiveTrigger
                ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            🤝 Ich verpflichte mich!
          </motion.button>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onComplete({ 
              trigger: effectiveTrigger, 
              behavior: content.implementationIntention?.behavior || content.task,
              timing: selectedTiming 
            })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            Weiter zur Reflexion
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Step 8: REFLECT - Reflection (NEU!)
// ============================================

function ReflectStep({ 
  content, 
  onComplete 
}: { 
  content: ReflectContent;
  onComplete: (reflections: string[]) => void;
}) {
  const [reflections, setReflections] = useState<string[]>(new Array(content.prompts.length).fill(''));
  const [currentPrompt, setCurrentPrompt] = useState(0);

  const handleChange = (value: string) => {
    const newReflections = [...reflections];
    newReflections[currentPrompt] = value;
    setReflections(newReflections);
  };

  const handleNext = () => {
    if (currentPrompt < content.prompts.length - 1) {
      setCurrentPrompt(currentPrompt + 1);
    } else {
      onComplete(reflections);
    }
  };

  const canProceed = reflections[currentPrompt].trim().length >= 5;
  const isLast = currentPrompt === content.prompts.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-violet-400 mb-6">
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">REFLEXION • METAKOGNITION</span>
          </div>
          
          <p className="text-white/60 mb-6">
            🧠 Kurze Reflexion verstärkt das Gelernte und verbessert zukünftiges Lernen.
          </p>

          {/* Progress */}
          <div className="flex gap-2 mb-6">
            {content.prompts.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index < currentPrompt 
                    ? 'bg-violet-500' 
                    : index === currentPrompt 
                      ? 'bg-violet-400/50' 
                      : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPrompt}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-6">
                <p className="text-violet-300 font-medium">
                  {content.prompts[currentPrompt]}
                </p>
              </div>

              <textarea
                value={reflections[currentPrompt]}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Deine Gedanken..."
                className="w-full h-32 p-4 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 outline-none resize-none text-white placeholder-white/30"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="p-6 border-t border-white/10 space-y-3">
        <motion.button
          onClick={handleNext}
          disabled={!canProceed}
          whileHover={{ scale: canProceed ? 1.02 : 1 }}
          whileTap={{ scale: canProceed ? 0.98 : 1 }}
          className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
            canProceed
              ? 'bg-gradient-to-r from-violet-500 to-purple-500'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {isLast ? 'Modul abschließen' : 'Nächste Frage'}
          <ArrowRight className="w-5 h-5" />
        </motion.button>
        
        <button
          onClick={() => onComplete(reflections)}
          className="w-full py-2 text-white/40 hover:text-white/60 text-sm"
        >
          Überspringen
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// Step: RETRY - Bei Quiz < 50%
// ============================================

function RetryStep({ 
  quizScore,
  totalQuestions,
  onRetry,
  onContinue
}: { 
  quizScore: number;
  totalQuestions: number;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const percentage = Math.round((quizScore / totalQuestions) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full items-center justify-center p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-6"
      >
        <Brain className="w-10 h-10 text-white" />
      </motion.div>

      <h2 className="text-2xl font-bold mb-2">Fast geschafft!</h2>
      <p className="text-white/60 mb-6">
        Du hast {percentage}% erreicht ({quizScore}/{totalQuestions} richtig)
      </p>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mb-8 max-w-md">
        <p className="text-amber-300 mb-4">
          🧠 <strong>Lernwissenschaft sagt:</strong> Bei weniger als 50% solltest du das Konzept nochmal durchgehen. 
          Wiederholung mit anderen Beispielen verbessert das Verständnis um 80%!
        </p>
        <p className="text-white/60 text-sm">
          Das ist kein Versagen - das ist effektives Lernen!
        </p>
      </div>

      <div className="space-y-3 w-full max-w-sm">
        <motion.button
          onClick={onRetry}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Modul wiederholen (empfohlen)
        </motion.button>
        
        <button
          onClick={onContinue}
          className="w-full py-3 text-white/40 hover:text-white/60 text-sm"
        >
          Trotzdem fortfahren →
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// Step COMPLETE - Zusammenfassung
// ============================================

function CompleteStep({ 
  module, 
  quizScore, 
  totalQuestions,
  onFinish,
  onNextModule,
  hasMoreModules,
}: { 
  module: Module;
  quizScore: number;
  totalQuestions: number;
  onFinish: () => void;
  onNextModule?: () => void;
  hasMoreModules?: boolean;
}) {
  const percentage = Math.round((quizScore / totalQuestions) * 100);

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-full items-center justify-center p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-6"
      >
        <Trophy className="w-12 h-12 text-white" />
      </motion.div>

      <h2 className="text-3xl font-bold mb-2">Modul abgeschlossen!</h2>
      <p className="text-white/60 mb-6">{module.title}</p>

      <div className="bg-white/5 rounded-xl p-6 mb-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/60">Quiz Ergebnis</span>
          <span className="text-2xl font-bold">{percentage}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`h-full rounded-full ${
              percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
          />
        </div>
      </div>

      {/* Progress Info */}
      <div className="bg-white/5 rounded-xl p-4 mb-6 w-full max-w-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Lernpfad Fortschritt</span>
          <span className="text-indigo-400 font-medium">
            Modul {module.moduleNumber} von {module.totalModules}
          </span>
        </div>
        {/* Progress Bar */}
        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(module.moduleNumber / module.totalModules) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="h-full bg-indigo-500 rounded-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-full">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span className="font-medium">+75 XP</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {/* Nächstes Modul Button - nur wenn es mehr Module gibt */}
        {hasMoreModules && onNextModule && (
          <motion.button
            onClick={onNextModule}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            Nächstes Modul starten
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        )}
        
        <motion.button
          onClick={onFinish}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
            hasMoreModules 
              ? 'bg-white/10 hover:bg-white/20 text-white/80' 
              : 'bg-gradient-to-r from-indigo-500 to-purple-600'
          }`}
        >
          {hasMoreModules ? 'Pause machen' : 'Zurück zur Akademie'}
          {!hasMoreModules && <ArrowRight className="w-5 h-5" />}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================
// Main Content Component
// ============================================

function LernenPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const goalId = searchParams.get('goalId');
  const goalTitle = searchParams.get('goalTitle') || 'Allgemeines Lernen';
  const category = searchParams.get('category') || 'learning';
  const moduleNum = parseInt(searchParams.get('moduleNumber') || '1');
  const skillId = searchParams.get('skillId');
  const isFirstModule = moduleNum === 1;

  const [currentStep, setCurrentStep] = useState<Step>(isFirstModule ? 'diagnosis' : 'pretest');
  const [userLevel, setUserLevel] = useState<DiagnosisLevel>('intermediate');
  const [quizScore, setQuizScore] = useState(0);
  const [confidenceData, setConfidenceData] = useState<{ confidence: number; wasCorrect: boolean }[]>([]);
  const [module, setModule] = useState<Module | null>(null);
  const [isGenerating, setIsGenerating] = useState(!isFirstModule);
  const [variableReward, setVariableReward] = useState<VariableReward | null>(null);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [userExplanation, setUserExplanation] = useState('');
  const [actionData, setActionData] = useState<{ trigger: string; behavior: string; timing: string } | null>(null);

  // Handle diagnosis completion
  const handleDiagnosisComplete = (level: DiagnosisLevel) => {
    setUserLevel(level);
    setCurrentStep('pretest');
    setIsGenerating(true);
  };

  // Generate module
  useEffect(() => {
    async function generateModule() {
      if (!isGenerating) return;

      try {
        const response = await fetch('/api/generate-module', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goalTitle: decodeURIComponent(goalTitle),
            category,
            goalId,
            skillId,
            moduleNumber: moduleNum,
            userLevel: userLevel,
            isRetry: retryCount > 0,
            includeVideo: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate module');
        }

        const data = await response.json();
        setModule(data.module);
      } catch (err) {
        console.error('Error generating module:', err);
      } finally {
        setIsGenerating(false);
      }
    }

    generateModule();
  }, [goalTitle, category, goalId, skillId, moduleNum, userLevel, isGenerating, retryCount]);

  // Define all steps
  const baseSteps: Step[] = ['pretest', 'why', 'learn', 'generate', 'do', 'test', 'action', 'reflect', 'complete'];
  const allSteps: Step[] = isFirstModule ? ['diagnosis', ...baseSteps] : baseSteps;
  
  // Calculate progress
  const progressSteps = baseSteps.filter(s => s !== 'complete' && s !== 'retry');
  const currentProgressIndex = progressSteps.indexOf(currentStep as any);
  const totalSteps = progressSteps.length;

  const goToNext = () => {
    const currentIndex = allSteps.indexOf(currentStep);
    const nextIndex = currentIndex + 1;
    if (nextIndex < allSteps.length) {
      setCurrentStep(allSteps[nextIndex]);
    }
  };

  const handlePreTestComplete = (wasCorrect: boolean) => {
    setCurrentStep('why');
  };

  const handleGenerateComplete = (explanation: string) => {
    setUserExplanation(explanation);
    setCurrentStep('do');
  };

  const handleQuizComplete = async (score: number, confData: { confidence: number; wasCorrect: boolean }[]) => {
    setQuizScore(score);
    setConfidenceData(confData);
    const totalQuestions = module?.content.test.length || 2;
    const percentage = (score / totalQuestions) * 100;

    if (percentage < 50) {
      setCurrentStep('retry');
      return;
    }
    setCurrentStep('action');
  };

  const handleActionComplete = (action: { trigger: string; behavior: string; timing: string }) => {
    setActionData(action);
    
    // Check if reflect step exists
    if (module?.content.reflect) {
      setCurrentStep('reflect');
    } else {
      handleModuleComplete();
    }
  };

  const handleReflectComplete = (reflections: string[]) => {
    handleModuleComplete(reflections);
  };

  const handleModuleComplete = async (reflections?: string[]) => {
    setCurrentStep('complete');

    // Roll for variable reward
    const reward = rollVariableReward();
    if (reward) {
      setTimeout(() => {
        setVariableReward(reward);
        setShowRewardPopup(true);
      }, 2000);
    }

    // Log learning activity + Create spaced repetition + Create action
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser?.id) {
        // WICHTIG: Verwende moduleNum (aus URL) statt module.moduleNumber
        // Das stellt sicher, dass der Progress korrekt inkrementiert wird
        const currentModuleNumber = moduleNum;
        
        console.log('[Module Complete] Saving progress:', {
          goalId,
          moduleNumber: currentModuleNumber,
          moduleTitle: module?.title,
        });

        // Log learning activity
        const learningResponse = await fetch('/api/learning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: authUser.id,
            activityType: 'module_completed',
            moduleId: module?.id,
            durationMinutes: module?.estimatedMinutes || 12,
            metadata: {
              goalId,
              skillId,
              goalTitle: decodeURIComponent(goalTitle),
              goalCategory: category,
              quizScore,
              confidenceData,
              userExplanation,
              moduleTitle: module?.title,
              moduleNumber: currentModuleNumber, // Verwende URL-Parameter
            },
          }),
        });
        
        if (!learningResponse.ok) {
          console.error('[Module Complete] Failed to save progress:', await learningResponse.text());
        } else {
          console.log('[Module Complete] Progress saved successfully. Next module:', currentModuleNumber + 1);
        }

        // Create spaced repetition review item
        const reviewQuestions = module?.content.reviewQuestions?.map(q => ({
          question: q,
          answer: module?.content.learn.concept || '',
        })) || [{
          question: `Was war das Kernkonzept von "${module?.title}"?`,
          answer: module?.content.learn.concept || '',
        }];

        await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: authUser.id,
            moduleId: module?.id,
            moduleTitle: module?.title,
            category: category,
            goalId: goalId,
            reviewQuestions: reviewQuestions,
            concept: module?.content.learn.concept,
          }),
        });

        // Create action in unified actions system (NEU)
        if (actionData) {
          await fetch('/api/actions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: authUser.id,
              source_type: 'module',
              source_id: module?.id,
              source_title: module?.title,
              action_description: module?.content.action.task,
              trigger_situation: actionData.trigger,
              intended_behavior: actionData.behavior,
              timing_type: actionData.timing === 'bei Gelegenheit' ? 'opportunity' : 
                          actionData.timing === 'heute' ? 'specific' :
                          actionData.timing === 'morgen' ? 'specific' : 'weekly',
            }),
          });
        }
      }
    } catch (err) {
      console.error('Error logging learning activity:', err);
    }
  };

  const handleFinish = () => {
    router.push('/akademie');
  };

  // Nächstes Modul starten
  const handleNextModule = () => {
    const nextModuleNum = moduleNum + 1;
    const params = new URLSearchParams({
      goalId: goalId || '',
      goalTitle: goalTitle,
      category: category,
      moduleNumber: nextModuleNum.toString(),
    });
    if (skillId) params.set('skillId', skillId);
    
    router.push(`/akademie/lernen?${params.toString()}`);
  };

  const handleRetry = () => {
    setQuizScore(0);
    setConfidenceData([]);
    setRetryCount(prev => prev + 1);
    setCurrentStep('pretest');
    setIsGenerating(true);
    setModule(null);
  };

  const handleRetrySkip = () => {
    setCurrentStep('action');
  };

  const handleClose = () => {
    if (confirm('Möchtest du das Modul wirklich verlassen?')) {
      router.push('/akademie');
    }
  };

  // Loading state
  if ((isGenerating || !module) && currentStep !== 'diagnosis') {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center text-white p-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-16 h-16 mb-6"
        >
          <Loader2 className="w-16 h-16 text-indigo-400" />
        </motion.div>
        <h2 className="text-xl font-bold mb-2">Erstelle dein Lernmodul...</h2>
        <p className="text-white/60">
          Personalisiert für: <span className="text-indigo-400">{decodeURIComponent(goalTitle)}</span>
        </p>
        {retryCount > 0 && (
          <p className="text-indigo-400 text-sm mt-2">
            ✨ Mit anderen Beispielen neu generiert...
          </p>
        )}
      </div>
    );
  }

  // Diagnosis step
  if (currentStep === 'diagnosis') {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">
        <header className="sticky top-0 z-40 bg-[#0f0f1a]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <p className="text-xs text-white/40">Vor dem Start</p>
                  <h1 className="font-semibold text-sm">Eingangs-Assessment</h1>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">
          <DiagnosisStep
            goalTitle={decodeURIComponent(goalTitle)}
            category={category}
            onComplete={handleDiagnosisComplete}
          />
        </main>
      </div>
    );
  }

  if (!module) return null;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{module.categoryIcon}</span>
              <div>
                <p className="text-xs text-white/40">Modul {module.moduleNumber}/{module.totalModules}</p>
                <h1 className="font-semibold text-sm">{module.title}</h1>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
          <ProgressBar currentStep={currentProgressIndex >= 0 ? currentProgressIndex : 0} totalSteps={totalSteps} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {currentStep === 'pretest' && module.content.preTest && (
            <PreTestStep
              key="pretest"
              content={module.content.preTest}
              onNext={handlePreTestComplete}
            />
          )}
          {currentStep === 'why' && (
            <WhyStep 
              key="why"
              content={module.content.why}
              goalTitle={decodeURIComponent(goalTitle)}
              onNext={goToNext} 
            />
          )}
          {currentStep === 'learn' && (
            <LearnStep 
              key="learn"
              content={module.content.learn} 
              onNext={goToNext} 
            />
          )}
          {currentStep === 'generate' && module.content.generate && (
            <GenerateStep
              key="generate"
              content={module.content.generate}
              onNext={handleGenerateComplete}
            />
          )}
          {currentStep === 'do' && (
            <DoStep 
              key="do"
              content={module.content.do} 
              onNext={goToNext} 
            />
          )}
          {currentStep === 'test' && (
            <TestStep 
              key="test"
              questions={module.content.test} 
              onComplete={handleQuizComplete} 
            />
          )}
          {currentStep === 'retry' && (
            <RetryStep
              key="retry"
              quizScore={quizScore}
              totalQuestions={module.content.test.length}
              onRetry={handleRetry}
              onContinue={handleRetrySkip}
            />
          )}
          {currentStep === 'action' && (
            <ActionStep 
              key="action"
              content={module.content.action}
              quizScore={quizScore}
              totalQuestions={module.content.test.length}
              onComplete={handleActionComplete} 
            />
          )}
          {currentStep === 'reflect' && module.content.reflect && (
            <ReflectStep
              key="reflect"
              content={module.content.reflect}
              onComplete={handleReflectComplete}
            />
          )}
          {currentStep === 'complete' && (
            <CompleteStep 
              key="complete"
              module={module}
              quizScore={quizScore}
              totalQuestions={module.content.test.length}
              onFinish={handleFinish}
              onNextModule={handleNextModule}
              hasMoreModules={moduleNum < (module.totalModules || 5)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Variable Reward Popup */}
      <VariableRewardPopup 
        reward={variableReward}
        show={showRewardPopup}
        onClose={() => setShowRewardPopup(false)}
      />
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function LernenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    }>
      <LernenPageContent />
    </Suspense>
  );
}
