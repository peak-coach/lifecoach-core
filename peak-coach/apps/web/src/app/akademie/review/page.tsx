'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  CheckCircle,
  RefreshCw,
  X,
  Loader2,
  Sparkles,
  Clock,
  Zap,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  BookOpen,
  Quote,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase';
import confetti from 'canvas-confetti';

// ============================================
// Types
// ============================================

interface ReviewItem {
  id: string;
  type: 'module' | 'book';
  module_id: string;
  module_title: string;
  category: string;
  concept?: string;
  // Book-specific fields
  highlight_text?: string;
  user_note?: string;
  page_number?: number;
  book_author?: string;
  review_questions: {
    question: string;
    answer: string;
  }[];
  interval_days: number;
  repetitions: number;
  next_review_date: string;
}

type ReviewQuality = 'forgot' | 'hard' | 'good' | 'easy';

// ============================================
// Review Card Component
// ============================================

function ReviewCard({
  review,
  onComplete,
  isLast,
}: {
  review: ReviewItem;
  onComplete: (quality: ReviewQuality) => void;
  isLast: boolean;
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const questions = review.review_questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // If no questions, use concept as the review content
  const reviewContent = currentQuestion || {
    question: `Was war das Kernkonzept von "${review.module_title}"?`,
    answer: review.concept || 'Denke an die wichtigsten Erkenntnisse aus diesem Modul.',
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleQualitySelect = (quality: ReviewQuality) => {
    if (currentQuestionIndex < questions.length - 1) {
      // More questions to go
      setCurrentQuestionIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Complete this review
      onComplete(quality);
    }
  };

  const qualityButtons = [
    { quality: 'forgot' as ReviewQuality, label: 'Vergessen', icon: RotateCcw, color: 'bg-red-500/20 hover:bg-red-500/30 text-red-300', value: 0 },
    { quality: 'hard' as ReviewQuality, label: 'Schwer', icon: ThumbsDown, color: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300', value: 3 },
    { quality: 'good' as ReviewQuality, label: 'Gut', icon: ThumbsUp, color: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300', value: 4 },
    { quality: 'easy' as ReviewQuality, label: 'Leicht', icon: Zap, color: 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300', value: 5 },
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
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            {review.type === 'book' ? (
              <>
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-medium uppercase tracking-wider text-amber-400">BUCH-HIGHLIGHT</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-medium uppercase tracking-wider text-indigo-400">SPACED REPETITION</span>
              </>
            )}
          </div>

          {/* Module/Book Info */}
          <div className={`rounded-xl p-4 mb-6 ${
            review.type === 'book' 
              ? 'bg-amber-500/10 border border-amber-500/20' 
              : 'bg-white/5'
          }`}>
            <div className="flex items-center gap-2">
              {review.type === 'book' && <BookOpen className="w-4 h-4 text-amber-400" />}
              <p className="text-sm text-white/60">{review.category}</p>
            </div>
            <h3 className="font-semibold">{review.module_title}</h3>
            {review.book_author && (
              <p className="text-sm text-white/50">von {review.book_author}</p>
            )}
            {review.page_number && (
              <p className="text-xs text-white/40 mt-1">Seite {review.page_number}</p>
            )}
            <p className="text-xs text-white/40 mt-2">
              Wiederholung #{review.repetitions + 1} • 
              Nächste in {review.interval_days} Tag{review.interval_days !== 1 ? 'en' : ''}
            </p>
          </div>

          {/* Question / Highlight */}
          <div className={`rounded-xl p-6 border mb-6 ${
            review.type === 'book'
              ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30'
              : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30'
          }`}>
            {review.type === 'book' ? (
              <>
                <div className="flex items-start gap-2 mb-3">
                  <Quote className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                  <p className="text-lg font-medium">Was bedeutet dieses Highlight für dich?</p>
                </div>
                <blockquote className="pl-4 border-l-2 border-amber-500/50 text-white/80 italic">
                  "{review.highlight_text}"
                </blockquote>
              </>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">🧠 Erinnerst du dich?</p>
                <p className="text-white/80">{reviewContent.question}</p>
              </>
            )}
          </div>

          {/* Answer / Reveal Button */}
          <AnimatePresence mode="wait">
            {!showAnswer ? (
              <motion.button
                key="reveal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleShowAnswer}
                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Brain className="w-5 h-5" />
                Antwort zeigen
              </motion.button>
            ) : (
              <motion.div
                key="answer"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-6"
              >
                {/* Answer */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                  <p className="text-emerald-300 font-medium mb-2">💡 Antwort:</p>
                  <p className="text-white/80">{reviewContent.answer}</p>
                </div>

                {/* Quality Selection */}
                <div>
                  <p className="text-center text-white/60 mb-4">Wie gut hast du dich erinnert?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {qualityButtons.map((btn) => (
                      <motion.button
                        key={btn.quality}
                        onClick={() => handleQualitySelect(btn.quality)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-xl font-medium transition-colors flex flex-col items-center gap-2 ${btn.color}`}
                      >
                        <btn.icon className="w-6 h-6" />
                        <span>{btn.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress indicator for multiple questions */}
          {questions.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx === currentQuestionIndex
                      ? 'bg-indigo-400'
                      : idx < currentQuestionIndex
                      ? 'bg-emerald-400'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Completion Screen
// ============================================

function CompletionScreen({ 
  reviews,
  onFinish 
}: { 
  reviews: ReviewItem[];
  onFinish: () => void;
}) {
  const moduleCount = reviews.filter(r => r.type === 'module').length;
  const bookCount = reviews.filter(r => r.type === 'book').length;
  const totalCount = reviews.length;

  useEffect(() => {
    // Celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#22c55e'],
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full text-center p-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6"
      >
        <CheckCircle className="w-12 h-12 text-white" />
      </motion.div>

      <h2 className="text-2xl font-bold mb-2">Reviews abgeschlossen! 🎉</h2>
      <p className="text-white/60 mb-4">
        Du hast {totalCount} Konzept{totalCount !== 1 ? 'e' : ''} wiederholt.
      </p>

      {/* Breakdown */}
      <div className="flex gap-4 mb-6">
        {moduleCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/20 rounded-lg">
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            <span className="text-sm">{moduleCount} Module</span>
          </div>
        )}
        {bookCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 rounded-lg">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="text-sm">{bookCount} Buch-Highlights</span>
          </div>
        )}
      </div>

      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 mb-8 max-w-sm">
        <p className="text-indigo-300 text-sm">
          🧠 <strong>Wissenschaft:</strong> Spaced Repetition verbessert die Langzeit-Erinnerung um bis zu 200% gegenüber normalem Lernen.
        </p>
      </div>

      <motion.button
        onClick={onFinish}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl font-semibold flex items-center gap-2"
      >
        Fertig
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function ReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user ID and reviews
  useEffect(() => {
    async function fetchReviews() {
      if (!user?.email) return;

      try {
        const supabase = createClient();
        
        // Get AUTH user ID - spaced_repetition uses auth.users(id), not users(id)
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser?.id) {
          setIsLoading(false);
          return;
        }

        setUserId(authUser.id);

        // Fetch due reviews - uses AUTH user ID
        const response = await fetch(`/api/reviews?userId=${authUser.id}`);
        const data = await response.json();

        setReviews(data.reviews || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, [user]);

  const handleReviewComplete = async (quality: ReviewQuality) => {
    const qualityMap = { forgot: 0, hard: 3, good: 4, easy: 5 };
    const currentReview = reviews[currentIndex];
    
    try {
      // Update review in backend (includes type for book highlights)
      await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: currentReview.id,
          userId,
          quality: qualityMap[quality],
          type: currentReview.type || 'module',
        }),
      });
    } catch (error) {
      console.error('Error updating review:', error);
    }

    // Move to next review or complete
    if (currentIndex < reviews.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleClose = () => {
    if (confirm('Möchtest du die Review-Session wirklich beenden?')) {
      router.push('/akademie');
    }
  };

  const handleFinish = () => {
    router.push('/akademie');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-white/60">Lade Reviews...</p>
      </div>
    );
  }

  // No reviews
  if (reviews.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Keine Reviews fällig!</h2>
        <p className="text-white/60 mb-8 max-w-md">
          Du bist auf dem neuesten Stand. Neue Reviews werden nach Abschluss von Lernmodulen erstellt.
        </p>
        <motion.button
          onClick={() => router.push('/akademie')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-indigo-500 rounded-xl font-medium"
        >
          Zurück zur Akademie
        </motion.button>
      </div>
    );
  }

  // Completion screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-white">
        <CompletionScreen reviews={reviews} onFinish={handleFinish} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f0f1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <RefreshCw className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-white/40">Spaced Repetition</p>
                <h1 className="font-semibold text-sm">Review {currentIndex + 1} von {reviews.length}</h1>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / reviews.length) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            />
          </div>
        </div>
      </header>

      {/* Review Content */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <ReviewCard
            key={reviews[currentIndex].id}
            review={reviews[currentIndex]}
            onComplete={handleReviewComplete}
            isLast={currentIndex === reviews.length - 1}
          />
        </AnimatePresence>
      </main>
    </div>
  );
}

