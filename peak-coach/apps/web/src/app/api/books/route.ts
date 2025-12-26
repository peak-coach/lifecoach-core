import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Supabase Admin Client (lazy initialization)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Google Books API Base URL
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

// ============================================
// GET: Hole Bücher für einen User
// ============================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const bookId = searchParams.get('bookId');
    const status = searchParams.get('status'); // reading, completed, want_to_read, all
    const includeHighlights = searchParams.get('includeHighlights') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Einzelnes Buch mit Details
    if (bookId) {
      const { data: book, error } = await getSupabaseAdmin()
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      let highlights = null;
      if (includeHighlights) {
        const { data: highlightData } = await getSupabaseAdmin()
          .from('book_highlights')
          .select('*')
          .eq('book_id', bookId)
          .eq('user_id', userId)
          .order('page_number', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true });

        highlights = highlightData;
      }

      return NextResponse.json({ book, highlights });
    }

    // Alle Bücher
    let query = getSupabaseAdmin()
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: books, error } = await query;

    if (error) throw error;

    // Statistiken
    const stats = {
      total: books?.length || 0,
      reading: books?.filter(b => b.status === 'reading').length || 0,
      completed: books?.filter(b => b.status === 'completed').length || 0,
      wantToRead: books?.filter(b => b.status === 'want_to_read').length || 0,
      totalHighlights: books?.reduce((sum, b) => sum + (b.highlight_count || 0), 0) || 0,
    };

    return NextResponse.json({ books, stats });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}

// ============================================
// POST: Neues Buch hinzufügen
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, searchQuery, googleBooksId, manualData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    let bookData: Record<string, any> = {
      user_id: userId,
      status: 'reading',
      started_at: new Date().toISOString().split('T')[0],
    };

    // Option 1: Google Books ID angegeben
    if (googleBooksId) {
      const metadata = await fetchGoogleBooksById(googleBooksId);
      if (metadata) {
        bookData = { ...bookData, ...metadata };
      }
    }
    // Option 2: Suche nach Titel
    else if (searchQuery || title) {
      const metadata = await searchGoogleBooks(searchQuery || title);
      if (metadata) {
        bookData = { ...bookData, ...metadata };
      } else {
        // Fallback: Manueller Titel
        bookData.title = title || searchQuery;
      }
    }
    // Option 3: Manuelle Daten
    else if (manualData) {
      bookData = {
        ...bookData,
        title: manualData.title,
        authors: manualData.authors,
        page_count: manualData.pageCount,
      };
    }

    if (!bookData.title) {
      return NextResponse.json({ error: 'Book title required' }, { status: 400 });
    }

    // Prüfe ob Buch bereits existiert (gleicher Titel + User)
    const { data: existing } = await getSupabaseAdmin()
      .from('books')
      .select('id, title')
      .eq('user_id', userId)
      .ilike('title', bookData.title)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Book already exists', existingBook: existing[0] },
        { status: 409 }
      );
    }

    const { data: book, error } = await getSupabaseAdmin()
      .from('books')
      .insert(bookData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, book });
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
  }
}

// ============================================
// PATCH: Update Buch
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bookId,
      userId,
      action, // 'update', 'complete', 'progress'
      updates,
      // Für 'complete'
      rating,
      reviewText,
      keyTakeaways,
      wouldRecommendTo,
      // Für 'progress'
      currentPage,
    } = body;

    if (!bookId || !userId) {
      return NextResponse.json({ error: 'bookId and userId required' }, { status: 400 });
    }

    let updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    switch (action) {
      case 'complete':
        updateData = {
          ...updateData,
          status: 'completed',
          completed_at: new Date().toISOString().split('T')[0],
          rating,
          review_text: reviewText,
          key_takeaways: keyTakeaways,
          would_recommend_to: wouldRecommendTo,
        };
        break;

      case 'progress':
        updateData = {
          ...updateData,
          current_page: currentPage,
        };
        break;

      case 'update':
        const allowedFields = [
          'title', 'status', 'current_page', 'rating',
          'review_text', 'key_takeaways', 'would_recommend_to',
        ];
        for (const field of allowedFields) {
          if (updates?.[field] !== undefined) {
            updateData[field] = updates[field];
          }
        }
        break;

      default:
        // Direkte Updates ohne Action
        if (updates) {
          const allowedFields = ['status', 'current_page'];
          for (const field of allowedFields) {
            if (updates[field] !== undefined) {
              updateData[field] = updates[field];
            }
          }
        }
    }

    const { data: book, error } = await getSupabaseAdmin()
      .from('books')
      .update(updateData)
      .eq('id', bookId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, book });
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}

// ============================================
// DELETE: Lösche Buch
// ============================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const userId = searchParams.get('userId');

    if (!bookId || !userId) {
      return NextResponse.json({ error: 'bookId and userId required' }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from('books')
      .delete()
      .eq('id', bookId)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}

// ============================================
// Google Books API Helpers
// ============================================

async function searchGoogleBooks(query: string): Promise<Record<string, any> | null> {
  try {
    const response = await fetch(
      `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=1&langRestrict=de`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const book = data.items?.[0];
    
    if (!book) return null;
    
    return parseGoogleBooksData(book);
  } catch (error) {
    console.error('Google Books search error:', error);
    return null;
  }
}

async function fetchGoogleBooksById(googleBooksId: string): Promise<Record<string, any> | null> {
  try {
    const response = await fetch(`${GOOGLE_BOOKS_API}/${googleBooksId}`);
    
    if (!response.ok) return null;
    
    const book = await response.json();
    return parseGoogleBooksData(book);
  } catch (error) {
    console.error('Google Books fetch error:', error);
    return null;
  }
}

function parseGoogleBooksData(book: any): Record<string, any> {
  const volumeInfo = book.volumeInfo || {};
  
  return {
    google_books_id: book.id,
    title: volumeInfo.title || 'Unbekannter Titel',
    subtitle: volumeInfo.subtitle,
    authors: volumeInfo.authors || [],
    publisher: volumeInfo.publisher,
    published_date: volumeInfo.publishedDate,
    description: volumeInfo.description,
    page_count: volumeInfo.pageCount,
    categories: volumeInfo.categories || [],
    language: volumeInfo.language || 'de',
    isbn_10: volumeInfo.industryIdentifiers?.find((i: any) => i.type === 'ISBN_10')?.identifier,
    isbn_13: volumeInfo.industryIdentifiers?.find((i: any) => i.type === 'ISBN_13')?.identifier,
    cover_url: volumeInfo.imageLinks?.large || volumeInfo.imageLinks?.medium,
    cover_thumbnail: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail,
  };
}

