import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase/supabase'
import type { User } from '@supabase/supabase-js'
import toast, { Toaster } from 'react-hot-toast'
import './momentos.css'
import Header from '../components/Header'

/* ── Types ── */
interface PostImage {
  id: number
  imagen_url: string
  descripcion_alt: string | null
  orden: number
}

interface Comment {
  id: number
  post_id: number
  usuario_id: string
  contenido: string
  created_at: string
  usuario?: { username: string; avatar_url: string | null }
}

interface Post {
  id: number
  autor_id: string
  titulo: string
  contenido: string
  color_fondo: string | null
  imagen_fondo_url: string | null
  estado: string
  created_at: string
  usuario?: { username: string; avatar_url: string | null }
  post_imagenes?: PostImage[]
  comentarios?: Comment[]
}

/* ── Helpers ── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

/* ── Skeleton Loader ── */
function PostSkeleton() {
  return (
    <div className="momento-skeleton">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem' }}>
        <div className="momento-skeleton-bar" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="momento-skeleton-bar" style={{ width: '40%', height: 14, marginBottom: 6 }} />
          <div className="momento-skeleton-bar" style={{ width: '25%', height: 10 }} />
        </div>
      </div>
      <div className="momento-skeleton-bar" style={{ width: '100%', height: 220 }} />
      <div style={{ padding: '1rem 1.25rem' }}>
        <div className="momento-skeleton-bar" style={{ width: '70%', height: 18, marginBottom: 10 }} />
        <div className="momento-skeleton-bar" style={{ width: '100%', height: 12, marginBottom: 6 }} />
        <div className="momento-skeleton-bar" style={{ width: '85%', height: 12 }} />
      </div>
    </div>
  )
}

/* ── Post Card ── */
function PostCard({ post, user, onCommentAdded, onDeletePost, onEditPost }: { post: Post; user: User | null; onCommentAdded: (postId: number, comment: Comment) => void; onDeletePost: (postId: number) => void; onEditPost: (post: Post) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)

  const authorName = post.usuario?.username ?? 'Anónimo'
  const avatar = authorName[0].toUpperCase()
  const mainImage = post.post_imagenes?.[0]?.imagen_url ?? post.imagen_fondo_url
  const comments = post.comentarios ?? []
  const needsReadMore = (post.contenido?.length ?? 0) > 200
  const isAuthor = user?.id === post.autor_id

  async function handleSendComment(e: FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    setSending(true)
    try {
      const { data, error } = await supabase
        .from('comentarios')
        .insert({
          post_id: post.id,
          usuario_id: user.id,
          contenido: newComment.trim(),
        })
        .select('id, post_id, usuario_id, contenido, created_at')
        .single()

      if (error) throw error

      const comment: Comment = {
        ...data,
        usuario: {
          username: user.user_metadata?.username ?? user.email ?? 'Tú',
          avatar_url: null,
        },
      }
      onCommentAdded(post.id, comment)
      setNewComment('')
      setShowComments(true)
    } catch (err) {
      console.error('Error posting comment:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <article className="momento-card">
      {/* Header */}
      <div className="momento-header">
        <div className="momento-header-info">
          <div className="momento-avatar">{avatar}</div>
          <div className="momento-meta">
            <div className="momento-author">{authorName}</div>
            <div className="momento-time">{timeAgo(post.created_at)}</div>
          </div>
        </div>
        {isAuthor && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className="momento-btn-delete"
              onClick={() => onEditPost(post)}
              title="Editar publicación"
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button
              className="momento-btn-delete"
              onClick={() => {
                if (window.confirm('¿Estás seguro de que deseas eliminar este momento?')) {
                  onDeletePost(post.id)
                }
              }}
              title="Eliminar publicación"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Image */}
      {mainImage && (
        <div className="momento-image-wrap">
          <img
            className="momento-image"
            src={mainImage}
            alt={post.post_imagenes?.[0]?.descripcion_alt ?? post.titulo}
            loading="lazy"
          />
          <div className="momento-image-gradient" />
        </div>
      )}

      {/* Body */}
      <div className="momento-body">
        <h2 className="momento-title">{post.titulo}</h2>
        <p className={`momento-text${expanded ? ' expanded' : ''}`}>{post.contenido}</p>
        {needsReadMore && (
          <button className="momento-read-more" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Ver menos' : 'Leer más…'}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="momento-actions">
        <button className="momento-action-btn" onClick={() => setShowComments(!showComments)}>
          <span className="material-symbols-outlined">chat_bubble_outline</span>
          {comments.length > 0 ? comments.length : ''} Comentar
        </button>
        <button className="momento-action-btn">
          <span className="material-symbols-outlined">bookmark_border</span>
          Guardar
        </button>
        <button className="momento-action-btn">
          <span className="material-symbols-outlined">share</span>
          Compartir
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="momento-comments">
          {comments.length > 0 ? (
            comments.map((c) => (
              <div className="momento-comment" key={c.id}>
                <div className="momento-comment-avatar">
                  {(c.usuario?.username ?? 'A')[0].toUpperCase()}
                </div>
                <div className="momento-comment-body">
                  <div className="momento-comment-author">{c.usuario?.username ?? 'Anónimo'}</div>
                  <p className="momento-comment-text">{c.contenido}</p>
                  <div className="momento-comment-time">{timeAgo(c.created_at)}</div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '0.82rem', color: 'rgba(189,201,200,0.5)', padding: '0.5rem 0' }}>
              Aún no hay comentarios. ¡Sé el primero!
            </p>
          )}

          {/* New comment input */}
          {user ? (
            <form className="momento-comment-input-wrap" onSubmit={handleSendComment}>
              <div className="momento-comment-avatar">
                {(user.user_metadata?.username?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
              </div>
              <input
                className="momento-comment-input"
                type="text"
                placeholder="Escribe un comentario…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                className="momento-comment-send"
                type="submit"
                disabled={!newComment.trim() || sending}
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          ) : (
            <div className="momento-auth-prompt">
              <Link to="/login">Inicia sesión</Link> para comentar
            </div>
          )}
        </div>
      )}
    </article>
  )
}

/* ── New Post Modal ── */
function NewPostModal({ user, onClose, onCreated, initialPost }: { user: User; onClose: () => void; onCreated: (post: Post, isEdit: boolean) => void; initialPost?: Post }) {
  const [titulo, setTitulo] = useState(initialPost?.titulo ?? '')
  const [contenido, setContenido] = useState(initialPost?.contenido ?? '')
  const [imagenUrl, setImagenUrl] = useState(initialPost?.post_imagenes?.[0]?.imagen_url ?? initialPost?.imagen_fondo_url ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || !contenido.trim()) return

    setSaving(true)
    setError('')

    try {
      if (initialPost) {
        // Edit mode
        const { data: postData, error: postErr } = await supabase
          .from('posts')
          .update({
            titulo: titulo.trim(),
            contenido: contenido.trim(),
            imagen_fondo_url: imagenUrl.trim() || null,
          })
          .eq('id', initialPost.id)
          .select('*')
          .single()

        if (postErr) throw postErr

        // Delete old images and add the new one
        await supabase.from('post_imagenes').delete().eq('post_id', initialPost.id)
        
        if (imagenUrl.trim()) {
          await supabase.from('post_imagenes').insert({
            post_id: initialPost.id,
            imagen_url: imagenUrl.trim(),
            descripcion_alt: titulo.trim(),
            orden: 0,
          })
        }

        const updatedPost: Post = {
          ...initialPost,
          ...postData,
          post_imagenes: imagenUrl.trim()
            ? [{ id: 0, imagen_url: imagenUrl.trim(), descripcion_alt: titulo.trim(), orden: 0 }]
            : [],
        }

        onCreated(updatedPost, true)
        onClose()
      } else {
        // Create mode
        const { data: postData, error: postErr } = await supabase
          .from('posts')
          .insert({
            autor_id: user.id,
            titulo: titulo.trim(),
            contenido: contenido.trim(),
            estado: 'publicado',
            imagen_fondo_url: imagenUrl.trim() || null,
          })
          .select('*')
          .single()

        if (postErr) throw postErr

        // If image URL provided, insert into post_imagenes
        if (imagenUrl.trim()) {
          await supabase.from('post_imagenes').insert({
            post_id: postData.id,
            imagen_url: imagenUrl.trim(),
            descripcion_alt: titulo.trim(),
            orden: 0,
          })
        }

        const newPost: Post = {
          ...postData,
          usuario: {
            username: user.user_metadata?.username ?? user.email ?? 'Tú',
            avatar_url: null,
          },
          post_imagenes: imagenUrl.trim()
            ? [{ id: 0, imagen_url: imagenUrl.trim(), descripcion_alt: titulo.trim(), orden: 0 }]
            : [],
          comentarios: [],
        }

        onCreated(newPost, false)
        onClose()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="momento-modal-overlay" onClick={onClose}>
      <div className="momento-modal" onClick={(e) => e.stopPropagation()}>
        <div className="momento-modal-header">
          <span className="momento-modal-title">{initialPost ? 'Editar Momento' : 'Compartir un Momento'}</span>
          <button className="momento-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="momento-modal-body">
            {error && <div className="momento-error">{error}</div>}
            <div>
              <label htmlFor="new-post-title">Título del momento</label>
              <input
                id="new-post-title"
                type="text"
                placeholder="Ej: El momento que cambió todo en..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="new-post-content">Tu momento favorito</label>
              <textarea
                id="new-post-content"
                placeholder="Describe ese momento del libro que te marcó..."
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="new-post-image">URL de imagen (opcional)</label>
              <input
                id="new-post-image"
                type="url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={imagenUrl}
                onChange={(e) => setImagenUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="momento-modal-footer">
            <button type="button" className="momento-modal-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="momento-modal-submit" disabled={saving || !titulo.trim() || !contenido.trim()}>
              {saving ? (initialPost ? 'Guardando…' : 'Publicando…') : (initialPost ? 'Guardar Cambios' : 'Publicar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function Momentos() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Fetch posts
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      setError('')
      try {
        // 1. Fetch all published posts with their images
        const { data: postsData, error: postsErr } = await supabase
          .from('posts')
          .select('*, post_imagenes(id, imagen_url, descripcion_alt, orden)')
          .eq('estado', 'publicado')
          .order('created_at', { ascending: false })

        if (postsErr) throw postsErr
        if (!postsData || postsData.length === 0) {
          setPosts([])
          return
        }

        // 2. Fetch all usuarios needed
        const authorIds = [...new Set(postsData.map((p: { autor_id: string }) => p.autor_id))]
        const { data: usersData } = await supabase
          .from('usuarios')
          .select('id, username, avatar_url')
          .in('id', authorIds)

        const usersMap = new Map<string, { username: string; avatar_url: string | null }>()
        if (usersData) {
          for (const u of usersData) {
            usersMap.set(u.id, { username: u.username, avatar_url: u.avatar_url })
          }
        }

        // 3. Fetch all comments for these posts
        const postIds = postsData.map((p: { id: number }) => p.id)
        const { data: commentsData } = await supabase
          .from('comentarios')
          .select('id, post_id, usuario_id, contenido, created_at')
          .in('post_id', postIds)
          .order('created_at', { ascending: true })

        // Get comment author ids
        const commentAuthorIds = [...new Set((commentsData ?? []).map((c: { usuario_id: string }) => c.usuario_id))]
        const missingIds = commentAuthorIds.filter(id => !usersMap.has(id))
        if (missingIds.length > 0) {
          const { data: moreUsers } = await supabase
            .from('usuarios')
            .select('id, username, avatar_url')
            .in('id', missingIds)
          if (moreUsers) {
            for (const u of moreUsers) {
              usersMap.set(u.id, { username: u.username, avatar_url: u.avatar_url })
            }
          }
        }

        // 4. Build enriched posts
        const enriched: Post[] = postsData.map((p: Post) => ({
          ...p,
          usuario: usersMap.get(p.autor_id) ?? undefined,
          comentarios: (commentsData ?? [])
            .filter((c: Comment) => c.post_id === p.id)
            .map((c: Comment) => ({
              ...c,
              usuario: usersMap.get(c.usuario_id) ?? undefined,
            })),
        }))

        setPosts(enriched)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar los momentos'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])


  function handleCommentAdded(postId: number, comment: Comment) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comentarios: [...(p.comentarios ?? []), comment] }
          : p
      )
    )
  }

  function handlePostCreated(post: Post, isEdit: boolean) {
    if (isEdit) {
      setPosts((prev) => prev.map((p) => p.id === post.id ? post : p))
      toast.success('Momento actualizado correctamente', {
        style: {
          background: 'var(--hc-surface-container-high, #282a2b)',
          color: 'var(--hc-on-surface, #e2e2e2)',
          border: '1px solid rgba(118, 214, 213, 0.2)',
          fontFamily: 'Manrope, sans-serif'
        },
        iconTheme: {
          primary: 'var(--hc-primary, #76d6d5)',
          secondary: '#121414',
        },
      })
    } else {
      setPosts((prev) => [post, ...prev])
      toast.success('Momento publicado', {
        style: {
          background: 'var(--hc-surface-container-high, #282a2b)',
          color: 'var(--hc-on-surface, #e2e2e2)',
          border: '1px solid rgba(118, 214, 213, 0.2)',
          fontFamily: 'Manrope, sans-serif'
        },
        iconTheme: {
          primary: 'var(--hc-primary, #76d6d5)',
          secondary: '#121414',
        },
      })
    }
  }

  async function handleDeletePost(postId: number) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      setPosts((prev) => prev.filter((p) => p.id !== postId))
      toast.success('Momento eliminado correctamente', {
        style: {
          background: 'var(--hc-surface-container-high, #282a2b)',
          color: 'var(--hc-on-surface, #e2e2e2)',
          border: '1px solid rgba(118, 214, 213, 0.2)',
          fontFamily: 'Manrope, sans-serif'
        },
        iconTheme: {
          primary: 'var(--hc-primary, #76d6d5)',
          secondary: '#121414',
        },
      })
    } catch (err: unknown) {
      console.error('Error deleting post:', err)
      const message = err instanceof Error ? err.message : 'No se pudo eliminar el momento'
      toast.error(message, {
        style: {
          background: 'var(--hc-surface-container-high, #282a2b)',
          color: 'var(--hc-on-surface, #e2e2e2)',
          border: '1px solid rgba(220, 38, 38, 0.2)',
          fontFamily: 'Manrope, sans-serif'
        }
      })
    }
  }

  return (
    <div className="momentos-page">
      <Toaster position="bottom-center" />
      <Header>
        {user && (
          <button className="momentos-btn-new" onClick={() => { setEditingPost(null); setShowNewPost(true); }}>
            <span className="material-symbols-outlined">edit_square</span>
            Nuevo
          </button>
        )}
      </Header>

      {/* Feed */}
      <div className="momentos-feed">
        {error && <div className="momento-error">{error}</div>}

        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="momento-empty">
            <span className="material-symbols-outlined">auto_stories</span>
            <h3>Aún no hay momentos</h3>
            <p>Sé el primero en compartir tu momento literario favorito.</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <div key={post.id} style={{ animationDelay: `${i * 0.08}s` }}>
              <PostCard
                post={post}
                user={user}
                onCommentAdded={handleCommentAdded}
                onDeletePost={handleDeletePost}
                onEditPost={(p) => { setEditingPost(p); setShowNewPost(true); }}
              />
            </div>
          ))
        )}
      </div>

      {/* New Post Modal */}
      {showNewPost && user && (
        <NewPostModal
          user={user}
          initialPost={editingPost ?? undefined}
          onClose={() => { setShowNewPost(false); setEditingPost(null); }}
          onCreated={handlePostCreated}
        />
      )}
    </div>
  )
}
