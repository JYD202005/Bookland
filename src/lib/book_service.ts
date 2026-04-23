import { supabase } from "@/lib/supabase/supabase";

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

export const saveBookToLocal = async (book: Book): Promise<boolean> => {
  const { error } = await supabase
    .from('books')
    .upsert(book, { onConflict: 'google_books_id' });

  if (error) {
    console.error('Error saving book:', error);
    return false;
  }

  return true;
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
        files.push(itemPath);
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
    return fileName.includes(cleanTitle) || cleanTitle.includes(fileName.replace('.epub', ''));
  });
};

export const getEpubDownloadUrl = (path: string): string => {
  const { data } = supabase.storage.from('epubs').getPublicUrl(path);
  return data.publicUrl;
};
