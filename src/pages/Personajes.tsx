import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Header from '../components/Header';
import { supabase } from '../lib/supabase/supabase';
import { 
  getCharacters, 
  createCharacter, 
  updateCharacter, 
  deleteCharacter, 
  type Character 
} from '../lib/character_service';
import './Personajes.css';
import toast from 'react-hot-toast';

const Personajes: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    book: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkUser();
    loadCharacters();
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showModal]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const data = await getCharacters();
      setCharacters(data);
    } catch (error) {
      toast.error('Error al cargar personajes');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const charData: Character = {
        name: formData.name,
        book: formData.book,
        description: formData.description,
        usuario_id: user.id
      };

      if (isEditing && editingId) {
        await updateCharacter(editingId, charData, imageFile || undefined);
        toast.success('¡Personaje actualizado!');
      } else {
        await createCharacter(charData, imageFile || undefined);
        toast.success('¡Personaje creado!');
      }

      resetForm();
      loadCharacters();
    } catch (error) {
      toast.error('Error al guardar el personaje');
     } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const handleEdit = (char: Character) => {
    setIsEditing(true);
    setEditingId(char.id || null);
    setFormData({
      name: char.name,
      book: char.book,
      description: char.description
    });
    setImagePreview(char.image_url || null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que quieres borrar este personaje?')) return;
    
    try {
      await deleteCharacter(id);
      toast.success('Personaje borrado');
      loadCharacters();
    } catch (error) {
      toast.error('Error al borrar');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', book: '', description: '' });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(false);
  };

  return (
    <div className="personajes-page page-transition">
      <Header />
      
      <main className="personajes-main">
        <section className="personajes-hero">
          <h1 className="personajes-title">GALERÍA DE HÉROES</h1>
          <p className="personajes-subtitle">
            «He conocido a reyes que no tenían corona y a mendigos que portaban la sabiduría del universo. Cada historia tiene un rostro, y cada rostro una leyenda. Ayúdame a documentar a los habitantes de estos mundos».
          </p>
          {user && (
            <button 
              className="hc-btn-primary" 
              style={{ marginTop: '30px' }}
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '8px' }}>add</span>
              NUEVO PERSONAJE
            </button>
          )}
        </section>

        {showModal && createPortal(
          <div className="hc-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="character-form-container" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
              <h2 className="form-title">{isEditing ? 'EDITAR LEYENDA' : 'REGISTRAR NUEVO PERSONAJE'}</h2>
              <form onSubmit={handleSubmit} className="bento-form-grid">
                <div className="bento-item image-item">
                  <label>Retrato</label>
                  <div className="image-upload-preview" onClick={() => fileInputRef.current?.click()}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" />
                    ) : (
                      <div className="upload-placeholder">
                        <span className="material-symbols-outlined">add_a_photo</span>
                        <span>Subir</span>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    style={{ display: 'none' }} 
                    accept="image/*"
                  />
                </div>

                <div className="bento-column-right">
                  <div className="bento-item name-item">
                    <label>Nombre</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="Ej: Kaladin"
                    />
                  </div>

                  <div className="bento-item book-item">
                    <label>Libro / Saga</label>
                    <input 
                      type="text" 
                      value={formData.book}
                      onChange={(e) => setFormData({...formData, book: e.target.value})}
                      required
                      placeholder="Ej: Archivo de las Tormentas"
                    />
                  </div>
                </div>

                <div className="bento-item desc-item">
                  <label>Descripción o Frase</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="«La vida antes que la muerte...»"
                  />
                </div>

                <div className="bento-item actions-item">
                  <div className="form-actions-flex">
                    <button type="submit" className="hc-btn-primary submit-btn">
                      {isEditing ? 'GUARDAR' : 'REGISTRAR'}
                    </button>
                    <button type="button" onClick={resetForm} className="hc-btn-outline">
                      CANCELAR
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {!user && (
          <div className="auth-notice">
            <p>«Incluso los mejores cronistas necesitan una identidad para que sus escritos perduren.».</p>
            <a href="/login" className="hc-btn-primary">INICIAR SESIÓN</a>
          </div>
        )}

        <div className="characters-grid">
          {loading ? (
            <p style={{ textAlign: 'center', gridColumn: '1/-1' }}>Cargando leyendas...</p>
          ) : characters.length > 0 ? (
            characters.map((char) => (
              <div className="character-card" key={char.id}>
                <div className="card-image-container">
                  <img src={char.image_url || 'https://via.placeholder.com/300x450?text=Sin+Imagen'} alt={char.name} />
                  <div className="card-overlay">
                    <h3 className="card-name">{char.name}</h3>
                    <span className="card-book">{char.book}</span>
                  </div>
                  {user && user.id === char.usuario_id && (
                    <div className="card-actions">
                      <button className="action-btn" onClick={() => handleEdit(char)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>edit</span>
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(char.id!)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>delete</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="card-content">
                  <p className="card-description">{char.description}</p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', gridColumn: '1/-1', opacity: 0.5 }}>No hay personajes registrados aún. Sé el primero en añadir uno.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Personajes;
