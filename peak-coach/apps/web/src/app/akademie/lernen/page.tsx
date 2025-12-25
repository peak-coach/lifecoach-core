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
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import { rollVariableReward, VariableReward } from '@/lib/rewards';
import { VariableRewardPopup } from '@/components/variable-reward';

// ============================================
// Types - Neue 5-Step Struktur
// ============================================

interface WhyContent {
  hook: string;
  benefit: string;
  connection: string;
}

interface LearnContent {
  concept: string;
  example: string;
  source: string;
  previousConnection?: string | null;
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

interface ActionContent {
  task: string;
  when: string;
  metric: string;
}

interface ModuleContent {
  why: WhyContent;
  learn: LearnContent;
  do: DoContent;
  test: TestQuestion[];
  action: ActionContent;
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
}

type Step = 'diagnosis' | 'why' | 'learn' | 'do' | 'test' | 'action' | 'retry' | 'complete';

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
// Step 1: WHY - Motivation
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
// Step 2: LEARN - Konzept + Beispiel
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
          <div className="prose prose-invert max-w-none mb-8">
            <div 
              className="text-lg leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ 
                __html: content.concept
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-300">$1</strong>')
              }}
            />
          </div>
          
          {/* Source */}
          <div className="flex items-center gap-2 text-white/40 text-sm mb-8">
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
          Verstanden - Jetzt anwenden
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ============================================
// Step 3: DO - Praktische Übung
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
// Step 4: TEST - Quiz mit Elaboration
// ============================================

function TestStep({ 
  questions, 
  onComplete 
}: { 
  questions: TestQuestion[]; 
  onComplete: (score: number) => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);

  const question = questions[currentQ];
  const isCorrect = selectedAnswer === question.correctIndex;
  const isLastQuestion = currentQ === questions.length - 1;

  const handleSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowFeedback(true);
    if (index === question.correctIndex) {
      setCorrectAnswers(prev => [...prev, currentQ]);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const finalScore = correctAnswers.length + (isCorrect && !correctAnswers.includes(currentQ) ? 1 : 0);
      onComplete(finalScore);
    } else {
      setCurrentQ(q => q + 1);
      setSelectedAnswer(null);
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
                      : index === question.correctIndex
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
                        : index === question.correctIndex
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
// Step 5: ACTION - Konkreter nächster Schritt
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
  onComplete: () => void;
}) {
  const [committed, setCommitted] = useState(false);
  const percentage = Math.round((quizScore / totalQuestions) * 100);

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
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-amber-400 mb-4">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">QUIZ ERGEBNIS</span>
            </div>
            <div className="text-4xl font-bold mb-2">{percentage}%</div>
            <p className="text-white/60">{quizScore} von {totalQuestions} richtig</p>
          </div>

          <div className="flex items-center gap-2 text-rose-400 mb-6">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">DEIN NÄCHSTER SCHRITT</span>
          </div>
          
          <h2 className="text-xl font-bold mb-6">
            Wissen ohne Anwendung ist nutzlos. Hier ist dein Action Step:
          </h2>
          
          {/* Action Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20 mb-6">
            <div className="space-y-4">
              <div>
                <p className="text-rose-300 text-sm font-medium mb-2">📌 Aufgabe:</p>
                <p className="text-white text-lg">{content.task}</p>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-xs mb-1">Wann:</p>
                  <p className="text-white font-medium capitalize">{content.when}</p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-white/5">
                  <p className="text-white/40 text-xs mb-1">Erfolgsmessung:</p>
                  <p className="text-white font-medium">{content.metric}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Commitment */}
          {!committed ? (
            <button
              onClick={() => setCommitted(true)}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🤝</span>
                <span className="font-medium">Ich verpflichte mich, das zu tun!</span>
              </div>
            </button>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-center"
            >
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-300 font-medium">Commitment gespeichert! 💪</p>
              <p className="text-white/60 text-sm mt-1">Wir erinnern dich morgen daran.</p>
            </motion.div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-white/10">
        <motion.button
          onClick={onComplete}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          Modul abschließen
          <ArrowRight className="w-5 h-5" />
        </motion.button>
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
// Step 6: COMPLETE - Zusammenfassung
// ============================================

function CompleteStep({ 
  module, 
  quizScore, 
  totalQuestions,
  onFinish 
}: { 
  module: Module;
  quizScore: number;
  totalQuestions: number;
  onFinish: () => void;
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
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-full">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span className="font-medium">+50 XP</span>
        </div>
      </div>

      <motion.button
        onClick={onFinish}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full max-w-sm py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-semibold flex items-center justify-center gap-2"
      >
        Zurück zur Akademie
        <ArrowRight className="w-5 h-5" />
      </motion.button>
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
  const isFirstModule = moduleNum === 1;

  const [currentStep, setCurrentStep] = useState<Step>(isFirstModule ? 'diagnosis' : 'why');
  const [userLevel, setUserLevel] = useState<DiagnosisLevel>('intermediate');
  const [quizScore, setQuizScore] = useState(0);
  const [module, setModule] = useState<Module | null>(null);
  const [isGenerating, setIsGenerating] = useState(!isFirstModule); // Don't generate until after diagnosis
  const [variableReward, setVariableReward] = useState<VariableReward | null>(null);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Handle diagnosis completion
  const handleDiagnosisComplete = (level: DiagnosisLevel) => {
    setUserLevel(level);
    setCurrentStep('why');
    setIsGenerating(true);
  };

  // Generate module on load (or after diagnosis)
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
            moduleNumber: moduleNum,
            userLevel: userLevel,
            isRetry: retryCount > 0,
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
  }, [goalTitle, category, goalId, moduleNum, userLevel, isGenerating, retryCount]);

  // Define steps based on whether we need diagnosis
  const baseSteps: Step[] = ['why', 'learn', 'do', 'test', 'action', 'complete'];
  const allSteps: Step[] = isFirstModule ? ['diagnosis', ...baseSteps] : baseSteps;
  
  // Calculate progress (exclude diagnosis from progress bar)
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

  const handleQuizComplete = async (score: number) => {
    setQuizScore(score);
    const totalQuestions = module?.content.test.length || 2;
    const percentage = (score / totalQuestions) * 100;

    // Adaptive Difficulty: If < 50%, show retry step
    if (percentage < 50) {
      setCurrentStep('retry');
      return;
    }
    setCurrentStep('action');
  };

  const handleModuleComplete = async () => {
    setCurrentStep('complete');

    // Roll for variable reward
    const reward = rollVariableReward();
    if (reward) {
      setTimeout(() => {
        setVariableReward(reward);
        setShowRewardPopup(true);
      }, 2000);
    }

    // Log learning activity + Create spaced repetition review
    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser?.id) {
        // Log learning activity - use authUser.id (Supabase Auth ID) to match learning_* tables
        await fetch('/api/learning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: authUser.id,
            activityType: 'module_completed',
            moduleId: module?.id,
            durationMinutes: module?.estimatedMinutes || 10,
            metadata: {
              goalId,
              goalTitle: decodeURIComponent(goalTitle),
              goalCategory: category, // For interleaving
              quizScore,
              moduleTitle: module?.title,
              moduleNumber: module?.moduleNumber,
            },
          }),
        });

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
      }
    } catch (err) {
      console.error('Error logging learning activity:', err);
    }
  };

  const handleFinish = () => {
    router.push('/akademie');
  };

  const handleRetry = () => {
    // Reset quiz state and regenerate module
    setQuizScore(0);
    setRetryCount(prev => prev + 1);
    setCurrentStep('why');
    setIsGenerating(true);
    setModule(null);
  };

  const handleRetrySkip = () => {
    // Continue despite low score
    setCurrentStep('action');
  };

  const handleClose = () => {
    if (confirm('Möchtest du das Modul wirklich verlassen?')) {
      router.push('/akademie');
    }
  };

  // Loading state (but not during diagnosis)
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

  // If we're in diagnosis, show diagnosis UI
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
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
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

  // TypeScript guard: at this point module should not be null
  if (!module) {
    return null;
  }

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
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
          <ProgressBar currentStep={currentProgressIndex >= 0 ? currentProgressIndex : 0} totalSteps={totalSteps} />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
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
              onComplete={handleModuleComplete} 
            />
          )}
          {currentStep === 'complete' && (
            <CompleteStep 
              key="complete"
              module={module}
              quizScore={quizScore}
              totalQuestions={module.content.test.length}
              onFinish={handleFinish} 
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
