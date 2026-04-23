import { supabase } from "./supabase/supabase";

export interface Book {
  id?: string;
  title: string;
  author: string;
  synopsis: string;
  cover_url: string;
  epub_url?: string;
  epub_path?: string; // New: path in storage
  isbn?: string;
  pages?: number;
  published_date?: string;
  google_books_id?: string;
}

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

export const searchGoogleBooks = async (
  query: string, 
  options: { langRestrict?: string; printType?: string; orderBy?: string; maxResults?: number } = {}
): Promise<Book[]> => {
  const { langRestrict = 'es', printType = 'books', orderBy = 'relevance', maxResults = 20 } = options;
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=${langRestrict}&printType=${printType}&orderBy=${orderBy}&maxResults=${maxResults}${GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : ''}`;
    const response = await fetch(url);

    const data = await response.json();
    
    if (!data.items) return [];

    return data.items.map((item: any) => {
      const info = item.volumeInfo;
      return {
        google_books_id: item.id,
        title: info.title,
        author: info.authors ? info.authors.join(', ') : 'Unknown Author',
        synopsis: info.description || 'No description available.',
        cover_url: (info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '').replace('&zoom=1', '&zoom=3').replace('http://', 'https://'),
        isbn: info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier || '',
        pages: info.pageCount || 0,
        published_date: info.publishedDate || '',
      };
    });
  } catch (error) {
    console.error('Error searching Google Books:', error);
    return [];
  }
};

export const getLocalBooks = async (): Promise<Book[]> => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching local books:', error);
    return [];
  }

  return data || [];
};

export const saveBookToCloud = async (book: Book, userId: string): Promise<boolean> => {
  try {
    // 1. Asegurar que el libro existe en la tabla general de libros
    // Usamos upsert basado en google_books_id
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .upsert({
        title: book.title,
        author: book.author,
        synopsis: book.synopsis,
        cover_url: book.cover_url,
        epub_url: book.epub_url,
        epub_path: book.epub_path,
        isbn: book.isbn,
        pages: book.pages,
        published_date: book.published_date,
        google_books_id: book.google_books_id
      }, { onConflict: 'google_books_id' })
      .select()
      .single();

    if (bookError) throw bookError;

    // 2. Vincular el libro a la biblioteca personal del usuario
    const { error: linkError } = await supabase
      .from('biblioteca_personal')
      .upsert({
        usuario_id: userId,
        book_id: bookData.id
      }, { onConflict: 'usuario_id, book_id' });

    if (linkError) throw linkError;

    return true;
  } catch (error) {
    console.error('Error saving book to cloud:', error);
    return false;
  }
};

export const getUserCollection = async (userId: string): Promise<Book[]> => {
  try {
    const { data, error } = await supabase
      .from('biblioteca_personal')
      .select(`
        books (
          id, title, author, synopsis, cover_url, epub_url, epub_path, isbn, pages, published_date, google_books_id
        )
      `)
      .eq('usuario_id', userId);

    if (error) throw error;
    
    return data.map((item: any) => item.books);
  } catch (error) {
    console.error('Error fetching user collection:', error);
    return [];
  }
};

/**
 * Busca archivos EPUB en Supabase Storage para vincularlos
 */
export const getAvailableEpubs = async (path: string = ''): Promise<string[]> => {
  try {
    const { data, error } = await supabase.storage.from('epubs').list(path, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });

    if (error) throw error;
    
    let files: string[] = [];
    
    for (const item of data) {
      const itemPath = path ? `${path}/${item.name}` : item.name;
      
      // Si no tiene id, es una carpeta (en el listado de storage)
      // O si metadata es null
      if (!item.id || item.metadata === null) {
        const subFiles = await getAvailableEpubs(itemPath);
        files = [...files, ...subFiles];
      } else {
        // Ignorar archivos placeholder de Supabase
        if (item.name !== '.emptyFolderPlaceholder' && item.name !== 'emptyFolderPlaceholder') {
          files.push(itemPath);
        }
      }
    }
    
    return files;
  } catch (err) {
    console.error('Error fetching epubs:', err);
    return [];
  }
};

/**
 * Intenta emparejar un libro con un archivo EPUB disponible
 */
export const findMatchingEpub = (bookTitle: string, allEpubs: string[]): string | undefined => {
  const cleanTitle = bookTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  return allEpubs.find(epubPath => {
    // El path puede ser "Comere/parte 1/Elantris..."
    // Limpiamos el nombre del archivo (solo la parte final)
    const fileName = epubPath.split('/').pop()?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
    
    // Si el título del libro está contenido en el nombre del archivo o viceversa
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    
    // Búsqueda por palabras clave (ej: "Zelda" encuentra "The Legend of Zelda")
    const titleWords = cleanTitle.split(' ').filter(w => w.length > 3);
    const hasPartialMatch = titleWords.some(word => nameWithoutExt.includes(word));

    return fileName.includes(cleanTitle) || cleanTitle.includes(nameWithoutExt) || hasPartialMatch;
  });
};

export const getEpubDownloadUrl = (path: string): string => {
  const { data } = supabase.storage.from('epubs').getPublicUrl(path);
  return data.publicUrl;
};
