'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  Star,
  Clock,
  CheckCircle,
  ChevronRight,
  X,
  Loader2,
  Highlighter,
  MessageSquare,
  Target,
  Calendar,
  TrendingUp,
  BookMarked,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

// ============================================
// Types
// ============================================

interface Book {
  id: string;
  title: string;
  author: string | null;
  cover_image_url: string | null;
  total_pages: number | null;
  current_page: number;
  status: 'reading' | 'completed' | 'planned' | 'abandoned';
  rating: number | null;
  created_at: string;
}

interface Highlight {
  id: string;
  highlight_text: string;
  page_number: number | null;
  user_note: string | null;
  is_action: boolean;
  created_at: string;
}

// ============================================
// Add Book Modal
// ============================================

function AddBookModal({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onAdd: (book: Partial<Book>) => void;
}) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    await onAdd({
      title: title.trim(),
      author: author.trim() || null,
      total_pages: totalPages ? parseInt(totalPages) : null,
    });
    setIsLoading(false);
    setTitle('');
    setAuthor('');
    setTotalPages('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Buch hinzufügen
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Titel *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Das Harvard-Konzept"
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/50 outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Autor</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="z.B. Roger Fisher"
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/50 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Seitenzahl</label>
              <input
                type="number"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                placeholder="z.B. 300"
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/50 outline-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-indigo-300 text-sm">
                💡 Tipp: Wir suchen automatisch nach Cover und Details!
              </p>
            </div>

            <button
              type="submit"
              disabled={!title.trim() || isLoading}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                title.trim() && !isLoading
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Buch hinzufügen
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Add Highlight Modal
// ============================================

function AddHighlightModal({
  isOpen,
  onClose,
  bookId,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  onAdd: (highlight: Partial<Highlight>) => void;
}) {
  const [text, setText] = useState('');
  const [page, setPage] = useState('');
  const [note, setNote] = useState('');
  const [isAction, setIsAction] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    await onAdd({
      highlight_text: text.trim(),
      page_number: page ? parseInt(page) : null,
      user_note: note.trim() || null,
      is_action: isAction,
    });
    setIsLoading(false);
    setText('');
    setPage('');
    setNote('');
    setIsAction(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Highlighter className="w-5 h-5 text-yellow-400" />
              Highlight hinzufügen
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Zitat / Highlight *</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Die wichtigste Stelle aus dem Buch..."
                rows={4}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-500/50 outline-none resize-none"
                autoFocus
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-white/60 mb-2">Seite</label>
                <input
                  type="number"
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  placeholder="42"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-500/50 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Deine Notiz</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Was bedeutet das für dich?"
                rows={2}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-yellow-500/50 outline-none resize-none"
              />
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 cursor-pointer">
              <input
                type="checkbox"
                checked={isAction}
                onChange={(e) => setIsAction(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <div>
                <p className="font-medium text-rose-300">Als Action markieren</p>
                <p className="text-sm text-white/60">Diese Stelle enthält etwas zum Umsetzen</p>
              </div>
            </label>

            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                text.trim() && !isLoading
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Speichern
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Book Card
// ============================================

function BookCard({ 
  book, 
  onClick 
}: { 
  book: Book; 
  onClick: () => void;
}) {
  const progress = book.total_pages 
    ? Math.round((book.current_page / book.total_pages) * 100) 
    : 0;

  const statusColors = {
    reading: 'bg-blue-500',
    completed: 'bg-emerald-500',
    planned: 'bg-amber-500',
    abandoned: 'bg-gray-500',
  };

  const statusLabels = {
    reading: 'Lese ich',
    completed: 'Gelesen',
    planned: 'Geplant',
    abandoned: 'Abgebrochen',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left"
    >
      <div className="flex gap-4">
        {/* Cover */}
        <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {book.cover_image_url ? (
            <img 
              src={book.cover_image_url} 
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen className="w-8 h-8 text-indigo-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold truncate">{book.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[book.status]} text-white flex-shrink-0`}>
              {statusLabels[book.status]}
            </span>
          </div>
          
          {book.author && (
            <p className="text-sm text-white/60 mb-2">{book.author}</p>
          )}

          {book.status === 'reading' && book.total_pages && (
            <div className="space-y-1">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-white/40">
                {book.current_page} / {book.total_pages} Seiten ({progress}%)
              </p>
            </div>
          )}

          {book.status === 'completed' && book.rating && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= book.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
      </div>
    </motion.button>
  );
}

// ============================================
// Book Detail View
// ============================================

function BookDetailView({
  book,
  highlights,
  onClose,
  onUpdateProgress,
  onAddHighlight,
  onComplete,
}: {
  book: Book;
  highlights: Highlight[];
  onClose: () => void;
  onUpdateProgress: (page: number) => void;
  onAddHighlight: (highlight: Partial<Highlight>) => void;
  onComplete: (rating: number) => void;
}) {
  const [showAddHighlight, setShowAddHighlight] = useState(false);
  const [currentPage, setCurrentPage] = useState(book.current_page.toString());
  const [showComplete, setShowComplete] = useState(false);
  const [rating, setRating] = useState(book.rating || 0);

  const progress = book.total_pages 
    ? Math.round((book.current_page / book.total_pages) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0f0f1a] z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-[#0f0f1a]/80 backdrop-blur-xl border-b border-white/5 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
          <h1 className="font-semibold truncate mx-4">{book.title}</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Book Info */}
        <div className="flex gap-4">
          <div className="w-24 h-36 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center overflow-hidden">
            {book.cover_image_url ? (
              <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="w-12 h-12 text-indigo-400" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{book.title}</h2>
            {book.author && <p className="text-white/60 mb-3">{book.author}</p>}
            
            {book.status === 'reading' && book.total_pages && (
              <div className="space-y-2">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-sm text-white/60">{progress}% gelesen</p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Update */}
        {book.status === 'reading' && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/60 mb-3">Lesefortschritt aktualisieren</p>
            <div className="flex gap-3">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                placeholder="Aktuelle Seite"
                className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 outline-none"
              />
              <button
                onClick={() => onUpdateProgress(parseInt(currentPage) || 0)}
                className="px-4 py-3 rounded-xl bg-indigo-500 font-medium"
              >
                Speichern
              </button>
            </div>
            
            {book.total_pages && parseInt(currentPage) >= book.total_pages && (
              <button
                onClick={() => setShowComplete(true)}
                className="w-full mt-3 py-3 rounded-xl bg-emerald-500 font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Buch als gelesen markieren
              </button>
            )}
          </div>
        )}

        {/* Complete Modal */}
        {showComplete && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="font-medium mb-3">Wie bewertest du das Buch?</p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)}>
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
                    }`}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => { onComplete(rating); setShowComplete(false); }}
              className="w-full py-3 rounded-xl bg-emerald-500 font-semibold"
            >
              Abschließen
            </button>
          </div>
        )}

        {/* Highlights */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Highlighter className="w-5 h-5 text-yellow-400" />
              Highlights ({highlights.length})
            </h3>
            <button
              onClick={() => setShowAddHighlight(true)}
              className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Hinzufügen
            </button>
          </div>

          {highlights.length === 0 ? (
            <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
              <Highlighter className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/60">Noch keine Highlights</p>
              <p className="text-sm text-white/40">Speichere wichtige Stellen aus dem Buch</p>
            </div>
          ) : (
            <div className="space-y-3">
              {highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className={`p-4 rounded-xl border ${
                    highlight.is_action 
                      ? 'bg-rose-500/10 border-rose-500/30' 
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <p className="text-white/90 mb-2">"{highlight.highlight_text}"</p>
                  {highlight.user_note && (
                    <p className="text-sm text-white/60 mb-2">
                      💭 {highlight.user_note}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    {highlight.page_number && <span>Seite {highlight.page_number}</span>}
                    {highlight.is_action && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Action</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddHighlightModal
        isOpen={showAddHighlight}
        onClose={() => setShowAddHighlight(false)}
        bookId={book.id}
        onAdd={onAddHighlight}
      />
    </motion.div>
  );
}

// ============================================
// Main Page
// ============================================

export default function BuecherPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [filter, setFilter] = useState<'all' | 'reading' | 'completed'>('all');

  // Fetch books
  useEffect(() => {
    async function fetchBooks() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) return;

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', authUser.id)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setBooks(data);
      }
      setIsLoading(false);
    }

    fetchBooks();
  }, []);

  // Fetch highlights when book is selected
  useEffect(() => {
    async function fetchHighlights() {
      if (!selectedBook) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('book_highlights')
        .select('*')
        .eq('book_id', selectedBook.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setHighlights(data);
      }
    }

    fetchHighlights();
  }, [selectedBook]);

  const handleAddBook = async (bookData: Partial<Book>) => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return;

    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: authUser.id,
        title: bookData.title,
        author: bookData.author,
        total_pages: bookData.total_pages,
        status: 'reading',
        current_page: 0,
      })
      .select()
      .single();

    if (!error && data) {
      setBooks([data, ...books]);
    }
  };

  const handleUpdateProgress = async (page: number) => {
    if (!selectedBook) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('books')
      .update({ current_page: page, updated_at: new Date().toISOString() })
      .eq('id', selectedBook.id);

    if (!error) {
      setSelectedBook({ ...selectedBook, current_page: page });
      setBooks(books.map(b => b.id === selectedBook.id ? { ...b, current_page: page } : b));
    }
  };

  const handleComplete = async (rating: number) => {
    if (!selectedBook) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('books')
      .update({ 
        status: 'completed', 
        rating,
        current_page: selectedBook.total_pages || selectedBook.current_page,
        finished_reading_at: new Date().toISOString(),
      })
      .eq('id', selectedBook.id);

    if (!error) {
      const updatedBook = { 
        ...selectedBook, 
        status: 'completed' as const, 
        rating,
        current_page: selectedBook.total_pages || selectedBook.current_page,
      };
      setSelectedBook(updatedBook);
      setBooks(books.map(b => b.id === selectedBook.id ? updatedBook : b));
    }
  };

  const handleAddHighlight = async (highlightData: Partial<Highlight>) => {
    if (!selectedBook) return;

    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return;

    const { data, error } = await supabase
      .from('book_highlights')
      .insert({
        book_id: selectedBook.id,
        user_id: authUser.id,
        highlight_text: highlightData.highlight_text,
        page_number: highlightData.page_number,
        user_note: highlightData.user_note,
        is_action: highlightData.is_action || false,
      })
      .select()
      .single();

    if (!error && data) {
      setHighlights([data, ...highlights]);
    }
  };

  const filteredBooks = books.filter(book => {
    if (filter === 'all') return true;
    return book.status === filter;
  });

  const stats = {
    total: books.length,
    reading: books.filter(b => b.status === 'reading').length,
    completed: books.filter(b => b.status === 'completed').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <header className="sticky top-0 bg-[#0f0f1a]/80 backdrop-blur-xl border-b border-white/5 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                <BookMarked className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Bücher</h1>
                <p className="text-sm text-white/60">Deine Lese-Bibliothek</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddBook(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-medium flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Buch hinzufügen</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-white/60">Gesamt</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.reading}</p>
            <p className="text-sm text-white/60">Lese ich</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
            <p className="text-sm text-white/60">Gelesen</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(['all', 'reading', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Alle' : f === 'reading' ? 'Lese ich' : 'Gelesen'}
            </button>
          ))}
        </div>

        {/* Books List */}
        {filteredBooks.length === 0 ? (
          <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center">
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Keine Bücher</h3>
            <p className="text-white/60 text-sm mb-4">
              Füge dein erstes Buch hinzu und tracke deinen Fortschritt
            </p>
            <button
              onClick={() => setShowAddBook(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 font-medium"
            >
              Buch hinzufügen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => setSelectedBook(book)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <AddBookModal
        isOpen={showAddBook}
        onClose={() => setShowAddBook(false)}
        onAdd={handleAddBook}
      />

      <AnimatePresence>
        {selectedBook && (
          <BookDetailView
            book={selectedBook}
            highlights={highlights}
            onClose={() => { setSelectedBook(null); setHighlights([]); }}
            onUpdateProgress={handleUpdateProgress}
            onAddHighlight={handleAddHighlight}
            onComplete={handleComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

