import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase/supabase'
import type { User } from '@supabase/supabase-js'
import { narrarTexto } from '../lib/services/elevenlabs'
import './home.css'
import heroBg from '../assets/hero-bg.png'
import cosmicRealm from '../assets/cosmic-realm.png'
import glowingCodex from '../assets/glowing-codex.png'
import footerBg from '../assets/footer-bg.png'

import Header from '../components/Header'
import { FOOTER_LINKS } from '../lib/constants'

const FEATURES = [
    { icon: 'history_edu', title: 'Leyendas antiguas', desc: 'Cuentos susurrados a lo largo de milenios, preservados en el tejido mismo de la realidad.' },
    { icon: 'menu_book', title: 'Historias atemporales', desc: 'Historias que trascienden mundos, portadoras de verdades veladas en metáforas.' },
    { icon: 'public', title: 'Nuevos Mundos', desc: 'Explora paisajes alienígenas y reinos olvidados nacidos de Investidura.' },
    { icon: 'auto_awesome', title: 'Saber Cósmico', desc: 'Descubre la magia profunda y las conexiones ocultas que unen al universo.' },
    { icon: 'visibility', title: "Perspectiva del Testigo", desc: 'Observa la historia desarrollarse a través de los ojos del que siempre estuvo allí.' },
    { icon: 'music_note', title: 'Tradiciones Orales', desc: 'Experimenta el ritmo de mitos transmitidos a través del canto y el aliento.' },
]

export default function Home() {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        // Get current session for local page logic (like the OÍR button)
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)

    async function handlePlayAudio() {
        if (isGeneratingAudio) return
        setIsGeneratingAudio(true)
        try {
            await narrarTexto("Descubre las historias de un Salta Mundos. Desentraña los secretos del universo, un cuento a la vez.")
        } catch (error) {
            console.error(error)
        } finally {
            setIsGeneratingAudio(false)
        }
    }

    return (
        <div className="hc-page page-transition">
            <Header />

            <main className="hc-main">
                {/* ── Hero Section ── */}
                <section className="hc-hero">
                    <div
                        className="hc-hero-bg"
                        style={{ backgroundImage: `url(${heroBg})` }}
                    />
                    <div className="hc-hero-gradient" />

                    <div className="hc-hero-content">
                        <span className="hc-hero-label">Mas alla de lo conocido</span>
                        <h1>EXPLORA MULTIPLES UNIVERSOS</h1>
                        <p className="hc-hero-desc">
                            Descubre las historias de un Salta Mundos. Desentraña los secretos del universo, un cuento a la vez.
                        </p>
                        <div className="hc-hero-buttons">
                            {user ? (
                                <>
                                    <button 
                                        className="hc-btn-primary"
                                        onClick={handlePlayAudio}
                                        disabled={isGeneratingAudio}
                                    >
                                        {isGeneratingAudio ? 'CARGANDO...' : 'OÍR'}
                                    </button>
                                    <Link to="/libros" className="hc-btn-outline">LEER</Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="hc-btn-primary">INICIAR SESIÓN</Link>
                                    <Link to="/registro" className="hc-btn-outline">REGISTRARSE</Link>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Feature Grid ── */}
                <section className="hc-features">
                    <div className="hc-features-grid">
                        {FEATURES.map((f) => (
                            <div className="hc-feature-card" key={f.title}>
                                <div className="hc-feature-icon">
                                    <span className="material-symbols-outlined">{f.icon}</span>
                                </div>
                                <h3 className="hc-feature-title">{f.title}</h3>
                                <p className="hc-feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Section 1: See the Worlds ── */}
                <section className="hc-section hc-mt-md">
                    <div className="hc-section-img-wrapper">
                        <div className="hc-section-img-overlay" />
                        <img
                            className="hc-section-img"
                            src={cosmicRealm}
                            alt="Cosmic Realm"
                        />
                    </div>
                    <div className="hc-section-text">
                        <h2>LOS MUNDOS SE MUESTRAN ANTE TI</h2>
                        <p>
                            Embárcate en un viaje visual y auditivo a través de llanuras destrozadas,
                            ciudades envueltas en niebla y selvas coloridas. El archivo espera
                            a aquellos dispuestos a escuchar el silencio entre las estrellas.
                        </p>
                        <Link to="/mundos" className="hc-btn-outline">EXPLORAR AHORA</Link>
                    </div>
                </section>

                {/* ── Section 2: Access the Archive ── */}
                <section className="hc-section hc-mt-sm reverse-mobile">
                    <div className="hc-section-text">
                        <h2>ACCEDE AL ARCHIVO EN CUALQUIER LUGAR</h2>
                        <p>
                            Sumérgete en el conocimiento acumulado de un inmortal errante. Nuestro compendio digital organiza fragmentos de saber, canciones y registros históricos para tu búsqueda académica.
                        </p>
                        <Link to="/libros" className="hc-btn-primary">DESCUBRIR</Link>
                    </div>
                    <div className="hc-section-img-wrapper short">
                        <div className="hc-section-img-gradient" />
                        <img
                            className="hc-section-img lighten"
                            src={glowingCodex}
                            alt="Glowing Codex"
                        />
                    </div>
                </section>
            </main>

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
                        {FOOTER_LINKS.map((link) => (
                            <Link key={link.name} to={link.path}>
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </footer>
        </div>
    )
}
