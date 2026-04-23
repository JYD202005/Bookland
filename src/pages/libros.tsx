import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  type Book, 
  searchGoogleBooks, 
  getLocalBooks, 
  saveBookToLocal,
  getAvailableEpubs,
  findMatchingEpub,
  getEpubDownloadUrl 
} from '../lib/book_service.ts';
import footerBg from '../assets/footer-bg.png';
import './libros.css';

import Header from '../components/Header';
import { NAV_LINKS } from '../lib/constants';

export default function Libros() {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [localBooks, setLocalBooks] = useState<Book[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [availableEpubs, setAvailableEpubs] = useState<string[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    fetchLocalBooks();
    fetchEpubsAndFeatured();
  }, []);

  const fetchEpubsAndFeatured = async () => {
    const epubs = await getAvailableEpubs();
    setAvailableEpubs(epubs);
    await fetchFeaturedBooks(epubs);
  };

  useEffect(() => {
    if (featuredBooks.length === 0 || isPaused) return;
    
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % featuredBooks.length);
    }, 8000); // 8 segundos es más estándar y dinámico

    return () => clearInterval(timer);
  }, [featuredBooks, isPaused]);

  const fetchFeaturedBooks = async (epubsList?: string[]) => {
    const currentEpubs = epubsList || availableEpubs;
    setFeaturedLoading(true);
    try {
      // Definimos las categorías que queremos mostrar
      const categories = [
        { name: 'Clásicos', query: 'subject:classics' },
        { name: 'Fantasía', query: 'subject:fantasy' },
        { name: 'Ficción', query: 'subject:fiction' }
      ];

      // Ejecutamos las búsquedas en paralelo con restricciones de idioma
      const results = await Promise.all(
        categories.map(cat => 
          searchGoogleBooks(cat.query, { 
            langRestrict: 'es', 
            orderBy: 'relevance', 
            maxResults: 10 
          })
        )
      );
      
      // Aplanamos los resultados y eliminamos duplicados, vinculando EPUB si existe
      const allBooks = results.flat().filter((b, index, self) => 
        b.cover_url && 
        self.findIndex(t => t.title === b.title) === index
      ).map(book => {
        const matchingPath = findMatchingEpub(book.title, currentEpubs);
        return matchingPath ? { ...book, epub_path: matchingPath } : book;
      });
      
      // Mezclamos para que el carrusel sea variado
      const curated = allBooks.sort(() => Math.random() - 0.5).slice(0, 15);
      setFeaturedBooks(curated);
    } catch (error) {
      console.error("Error fetching featured books", error);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const fetchLocalBooks = async () => {
    const data = await getLocalBooks();
    setLocalBooks(data);
  };

  const handleBookClick = (i: number, book: Book) => {
    if (i === carouselIndex) {
      setSelectedBook(book);
    } else {
      setCarouselIndex(i);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 40; // Sensibilidad un poco más alta
    const isRightSwipe = distance < -40;

    if (isLeftSwipe) {
      setCarouselIndex((prev) => (prev + 1) % featuredBooks.length);
    } else if (isRightSwipe) {
      setCarouselIndex((prev) => (prev - 1 + featuredBooks.length) % featuredBooks.length);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await searchGoogleBooks(searchQuery);
      const enriched = results.map(book => {
        const matchingPath = findMatchingEpub(book.title, availableEpubs);
        return matchingPath ? { ...book, epub_path: matchingPath } : book;
      });
      setBooks(enriched);
    } catch (error) {
      console.error("Error searching books", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBook = async (book: Book) => {
    const success = await saveBookToLocal(book);
    if (success) {
      alert('Libro guardado en la colección local.');
      fetchLocalBooks();
    }
  };

  return (
    <div className="libros-page">
      <Header />

      <main className="libros-main">
        <section className="libros-hero">
          <div className="libros-hero-content">
            <h1>EL ARCHIVO DEL SALTAMUNDOS</h1>
            <p className="hc-hero-desc" style={{textAlign: 'center'}}>
              Busca en las páginas de tus cuentos favoritos. Los mundos lejanos dejan allí su magia escondida para que tú la encuentres.            
            </p>
            <form className="libros-search-form" onSubmit={handleSearch}>
              <div className="search-input-wrapper">
                <span className="material-symbols-outlined search-icon">search</span>
                <input 
                  type="text" 
                  placeholder="Busca clásicos, fantasía o tu próxima leyenda..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" disabled={loading}>
                  {loading ? 'BUSCANDO...' : 'BUSCAR'}
                </button>
              </div>
            </form>

            <div className="libros-hero-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <a href="/apk/lithium.apk" className="hc-btn-outline" download style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>android</span>
                DESCARGAR LECTOR (LITHIUM APK)
              </a>
              <button 
                onClick={() => setShowManual(true)}
                className="hc-btn-outline" 
                style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.3)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>warning</span>
                MANUAL PROHIBIDO
              </button>
            </div>
          </div>

          <div className="carousel-section">
            {featuredLoading ? (
              <div className="carousel-loader">CARGANDO EL ARCHIVO...</div>
            ) : featuredBooks.length > 0 && (
              <div 
                className="libros-carousel-container"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="carousel-perspective">
                  <div 
                    className="carousel-track" 
                    style={{ transform: `translateX(-${carouselIndex * 200}px)` }}
                  >
                    {featuredBooks.map((book, i) => (
                      <div 
                        key={i} 
                        className={`carousel-slide ${i === carouselIndex ? 'active' : ''} ${i < carouselIndex ? 'prev' : ''} ${i > carouselIndex ? 'next' : ''}`}
                        onClick={() => handleBookClick(i, book)}
                      >
                        <div className="floating-book-card">
                          <div className="floating-cover">
                            <img src={book.cover_url} alt={book.title} />
                            <div className="cover-shadow"></div>
                          </div>
                          <div className="floating-info">
                            <h3>{book.title}</h3>
                            <p>{book.author}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="carousel-dots">
                  {featuredBooks.map((_, i) => (
                    <button 
                      key={i} 
                      className={`dot ${i === carouselIndex ? 'active' : ''}`}
                      onClick={() => setCarouselIndex(i)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="libros-results">
          {books.length > 0 && (
            <div className="results-container">
              <h2 className="section-title">Resultados de Búsqueda</h2>
              <div className="books-grid">
                {books.map((book, i) => (
                  <div className="book-card" key={book.google_books_id || i} onClick={() => setSelectedBook(book)}>
                    <div className="book-cover-wrapper">
                      <img src={book.cover_url || 'https://via.placeholder.com/128x192?text=No+Cover'} alt={book.title} />
                      <div className="book-overlay">
                        <button className="view-details-btn">VER DETALLES</button>
                      </div>
                    </div>
                    <div className="book-info">
                      <h3>{book.title}</h3>
                      <p className="book-author">{book.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="results-container">
            <h2 className="section-title">Colección Destacada</h2>
            <div className="books-grid">
              {localBooks.length > 0 ? (
                localBooks.map((book) => (
                  <div className="book-card" key={book.id} onClick={() => setSelectedBook(book)}>
                    <div className="book-cover-wrapper">
                      <img src={book.cover_url} alt={book.title} />
                      <div className="book-overlay">
                        <button className="view-details-btn">VER DETALLES</button>
                      </div>
                    </div>
                    <div className="book-info">
                      <h3>{book.title}</h3>
                      <p className="book-author">{book.author}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-books">No hay libros en la colección local aún. ¡Busca uno y guárdalo!</p>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── Book Detail Modal ── */}
      {selectedBook && (
        <div className="book-modal-overlay" onClick={() => setSelectedBook(null)}>
          <div className="book-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedBook(null)}>
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="modal-body">
              <div className="modal-cover">
                <img src={selectedBook.cover_url} alt={selectedBook.title} />
              </div>
              <div className="modal-info">
                <span className="modal-label">Detalles del Libro</span>
                <h2>{selectedBook.title}</h2>
                <p className="modal-author">por <span>{selectedBook.author}</span></p>
                
                <div className="modal-metadata">
                  {selectedBook.pages && <span><strong>Páginas:</strong> {selectedBook.pages}</span>}
                  {selectedBook.isbn && <span><strong>ISBN:</strong> {selectedBook.isbn}</span>}
                  {selectedBook.published_date && <span><strong>Publicado:</strong> {selectedBook.published_date}</span>}
                </div>

                <div className="modal-synopsis">
                  <h3>Sinopsis</h3>
                  <div dangerouslySetInnerHTML={{ __html: selectedBook.synopsis }} />
                </div>

                <div className="modal-actions">
                  {selectedBook.epub_path ? (
                    <a 
                      href={getEpubDownloadUrl(selectedBook.epub_path)} 
                      className="hc-btn-primary download-btn" 
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      DESCARGAR EPUB
                    </a>
                  ) : selectedBook.epub_url ? (
                    <a href={selectedBook.epub_url} className="hc-btn-primary download-btn" download>
                      DESCARGAR EPUB
                    </a>
                  ) : (
                    <button className="hc-btn-primary download-btn disabled" disabled>
                      EPUB NO DISPONIBLE
                    </button>
                  )}
                  {!selectedBook.id && (
                    <button className="hc-btn-outline save-btn" onClick={() => handleSaveBook(selectedBook)}>
                      GUARDAR EN COLECCIÓN
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual Prohibido Modal ── */}
      {showManual && (
        <div className="book-modal-overlay" onClick={() => setShowManual(false)}>
          <div className="book-modal manual-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="close-modal" onClick={() => setShowManual(false)}>×</button>
            <div className="modal-content">
              <h2 style={{ color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined">report_problem</span>
                MANUAL DE "NO" PIRATERÍA
              </h2>
              <p style={{ fontStyle: 'italic', opacity: 0.8, marginBottom: '20px' }}>
                "La piratería es mala, amigos. Muy mala. Por eso, BAJO NINGUNA CIRCUNSTANCIA sigas estos pasos para conseguir libros gratis..."
              </p>
              
              <div className="manual-steps" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="step">
                  <strong style={{ color: '#a288e3' }}>1. NO entres aquí:</strong>
                  <p>Ignora completamente este enlace: <a href="https://ww3.lectulandia.co/" target="_blank" rel="noopener noreferrer" style={{ color: '#76d6d5' }}>Lectulandia</a>. Es un lugar lleno de libros que no deberías descargar.</p>
                </div>
                <div className="step">
                  <strong style={{ color: '#a288e3' }}>2. NO busques tu libro:</strong>
                  <p>Si por error entras, no uses la barra de búsqueda para encontrar esa joya oculta o libro que te falta.</p>
                </div>
                <div className="step">
                  <strong style={{ color: '#a288e3' }}>3. EVITA los botones azules:</strong>
                  <p>Primero verás uno que dice "EPUB". No lo toques. Si se abre publicidad, ciérrala (unas 2 o 3 veces) hasta que aparezca el botón definitivo que dice <strong style={{ color: '#76d6d5' }}>"Download now"</strong>. Ni se te ocurra darle clic y esperar pacientemente a que la descarga inicie sola.</p>
                </div>
                <div className="step">
                  <strong style={{ color: '#a288e3' }}>4. USA el lector:</strong>
                  <p>Una vez que "no" lo descargues, no uses el <strong>Lithium APK</strong> que te dejé arriba para leerlo cómodamente en tu celular.</p>
                </div>
              </div>

              <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(255,77,77,0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong>Advertencia:</strong> Este manual es meramente informativo sobre lo que NO debes hacer. Guiño, guiño.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="hc-footer">
        <div
          className="hc-footer-inner"
          style={{ backgroundImage: `url(${footerBg})` }}
        >
          <div className="hc-footer-overlay" />
          <div className="hc-footer-brand">
            <div className="hc-footer-logo">Crónicas de un Saltamundos</div>
            <p className="hc-footer-copy">
              © Crónicas de un Saltamundos. TODOS LOS DERECHOS RESERVADOS.
            </p>
          </div>
          <nav className="hc-footer-nav">
            {NAV_LINKS.map((link) => (
              <Link key={link.name} to={link.path}>{link.name}</Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
