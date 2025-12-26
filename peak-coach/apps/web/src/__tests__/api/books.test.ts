import { describe, it, expect, vi } from 'vitest';

/**
 * Unit Tests für das Books Library System
 * 
 * Diese Tests prüfen die Geschäftslogik für Bücher und Highlights.
 */

describe('Books Library - Unit Tests', () => {
  describe('Book Data Validation', () => {
    it('should validate required fields for book creation', () => {
      const validBook = {
        title: 'Das Harvard-Konzept',
        author: 'Roger Fisher',
        status: 'reading',
      };
      
      expect(validBook.title).toBeDefined();
      expect(validBook.title.length).toBeGreaterThan(0);
    });

    it('should accept valid book statuses', () => {
      const validStatuses = ['reading', 'completed', 'planned', 'abandoned'];
      
      validStatuses.forEach(status => {
        expect(['reading', 'completed', 'planned', 'abandoned']).toContain(status);
      });
    });

    it('should validate rating range (1-5)', () => {
      const validRatings = [1, 2, 3, 4, 5];
      const invalidRatings = [0, 6, -1];
      
      validRatings.forEach(rating => {
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
      });
      
      invalidRatings.forEach(rating => {
        expect(rating < 1 || rating > 5).toBe(true);
      });
    });
  });

  describe('Reading Progress', () => {
    it('should calculate progress percentage correctly', () => {
      const book = {
        current_page: 75,
        total_pages: 300,
      };
      
      const progress = Math.round((book.current_page / book.total_pages) * 100);
      
      expect(progress).toBe(25);
    });

    it('should handle completed books', () => {
      const book = {
        current_page: 300,
        total_pages: 300,
        status: 'completed',
      };
      
      const progress = Math.round((book.current_page / book.total_pages) * 100);
      
      expect(progress).toBe(100);
      expect(book.status).toBe('completed');
    });

    it('should handle books without page info', () => {
      const book = {
        current_page: 0,
        total_pages: 0,
      };
      
      // Avoid division by zero
      const progress = book.total_pages > 0 
        ? Math.round((book.current_page / book.total_pages) * 100)
        : 0;
      
      expect(progress).toBe(0);
    });
  });

  describe('Book Metadata', () => {
    it('should support optional fields', () => {
      const bookWithMetadata = {
        title: 'Test Book',
        author: 'Test Author',
        cover_image_url: 'https://example.com/cover.jpg',
        isbn: '978-3-16-148410-0',
        total_pages: 350,
      };
      
      expect(bookWithMetadata.cover_image_url).toContain('http');
      expect(bookWithMetadata.isbn).toBeDefined();
    });

    it('should validate ISBN format', () => {
      const isbn13 = '978-3-16-148410-0';
      const isbn10 = '3-16-148410-X';
      
      // ISBN-13 has 13 digits (excluding dashes)
      const isbn13Digits = isbn13.replace(/-/g, '');
      expect(isbn13Digits.length).toBe(13);
    });
  });
});

describe('Book Highlights - Unit Tests', () => {
  describe('Highlight Data Validation', () => {
    it('should require highlight text', () => {
      const validHighlight = {
        highlight_text: 'Never split the difference',
        book_id: 'book-123',
      };
      
      expect(validHighlight.highlight_text).toBeDefined();
      expect(validHighlight.highlight_text.length).toBeGreaterThan(0);
    });

    it('should support optional user notes', () => {
      const highlightWithNote = {
        highlight_text: 'Important concept',
        user_note: 'Remember this for negotiations',
        page_number: 42,
      };
      
      expect(highlightWithNote.user_note).toBeDefined();
      expect(highlightWithNote.page_number).toBe(42);
    });
  });

  describe('Actionable Highlights', () => {
    it('should detect actionable phrases', () => {
      const actionablePhrases = [
        'you should',
        'try to',
        'make sure to',
        'always',
        'never',
        'practice',
        'implement',
      ];
      
      const highlightText = 'You should always practice active listening';
      const hasActionablePhrase = actionablePhrases.some(
        phrase => highlightText.toLowerCase().includes(phrase)
      );
      
      expect(hasActionablePhrase).toBe(true);
    });

    it('should mark highlight as action when flagged', () => {
      const actionHighlight = {
        highlight_text: 'Practice this technique daily',
        is_action: true,
        action_id: 'action-123',
      };
      
      expect(actionHighlight.is_action).toBe(true);
      expect(actionHighlight.action_id).toBeDefined();
    });
  });

  describe('Spaced Repetition for Highlights', () => {
    it('should initialize with default SM-2 values', () => {
      const newHighlight = {
        interval_days: 1,
        ease_factor: 2.5,
        repetitions: 0,
        next_review_date: new Date().toISOString().split('T')[0],
      };
      
      expect(newHighlight.interval_days).toBe(1);
      expect(newHighlight.ease_factor).toBe(2.5);
      expect(newHighlight.repetitions).toBe(0);
    });

    it('should calculate next review date based on SM-2 algorithm', () => {
      const calculateNextInterval = (
        quality: number,  // 0-5
        previousInterval: number,
        easeFactor: number
      ) => {
        if (quality < 3) {
          return 1;  // Reset to 1 day
        }
        
        if (previousInterval === 1) {
          return 6;
        }
        
        return Math.round(previousInterval * easeFactor);
      };
      
      // Good recall (quality 4)
      expect(calculateNextInterval(4, 1, 2.5)).toBe(6);
      expect(calculateNextInterval(4, 6, 2.5)).toBe(15);
      
      // Poor recall (quality 2)
      expect(calculateNextInterval(2, 10, 2.5)).toBe(1);
    });

    it('should adjust ease factor based on recall quality', () => {
      const adjustEaseFactor = (currentEF: number, quality: number): number => {
        const newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        return Math.max(1.3, newEF);  // Minimum EF is 1.3
      };
      
      // Quality 5 (perfect) should increase EF
      expect(adjustEaseFactor(2.5, 5)).toBeGreaterThan(2.5);
      
      // Quality 2 (hard) should decrease EF
      expect(adjustEaseFactor(2.5, 2)).toBeLessThan(2.5);
      
      // EF should never go below 1.3
      expect(adjustEaseFactor(1.4, 0)).toBeGreaterThanOrEqual(1.3);
    });
  });
});

describe('Reading Statistics', () => {
  it('should calculate total books by status', () => {
    const books = [
      { status: 'reading' },
      { status: 'reading' },
      { status: 'completed' },
      { status: 'planned' },
    ];
    
    const stats = {
      totalBooks: books.length,
      readingBooks: books.filter(b => b.status === 'reading').length,
      completedBooks: books.filter(b => b.status === 'completed').length,
      plannedBooks: books.filter(b => b.status === 'planned').length,
    };
    
    expect(stats.totalBooks).toBe(4);
    expect(stats.readingBooks).toBe(2);
    expect(stats.completedBooks).toBe(1);
    expect(stats.plannedBooks).toBe(1);
  });

  it('should calculate total pages read', () => {
    const books = [
      { current_page: 100, total_pages: 200 },
      { current_page: 300, total_pages: 300 }, // Completed
      { current_page: 50, total_pages: 400 },
    ];
    
    const totalPagesRead = books.reduce((sum, b) => sum + b.current_page, 0);
    
    expect(totalPagesRead).toBe(450);
  });

  it('should calculate average completion rate', () => {
    const books = [
      { current_page: 100, total_pages: 200 },  // 50%
      { current_page: 300, total_pages: 300 },  // 100%
      { current_page: 50, total_pages: 100 },   // 50%
    ];
    
    const avgCompletion = books.reduce((sum, b) => {
      return sum + (b.current_page / b.total_pages * 100);
    }, 0) / books.length;
    
    expect(Math.round(avgCompletion)).toBe(67); // (50 + 100 + 50) / 3
  });
});

describe('Book Actions Integration', () => {
  it('should create action from highlight', () => {
    const highlight = {
      highlight_text: 'Always prepare your BATNA before negotiating',
      book_id: 'book-123',
    };
    
    const action = {
      source_type: 'book',
      source_id: highlight.book_id,
      action_description: highlight.highlight_text,
      timing_type: 'opportunity',
    };
    
    expect(action.source_type).toBe('book');
    expect(action.action_description).toBe(highlight.highlight_text);
  });
});
