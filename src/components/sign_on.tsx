import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/supabase';
import './auth.css';

export default function SignOn() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            if (data.user) {
                navigate('/');
            }
        } catch {
            setError('Ocurrió un error inesperado. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <Link to="/" className="auth-back">
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_back</span>
                Inicio
            </Link>

            <div className="auth-card">
                <div className="auth-logo">
                    <span className="auth-logo-text">Crónicas de un Saltamundos</span>
                </div>

                <h1 className="auth-title">Bienvenido de vuelta</h1>
                <p className="auth-subtitle">Ingresa tus credenciales para acceder al archivo</p>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-input-group">
                        <label htmlFor="signin-email">Correo electrónico</label>
                        <input
                            id="signin-email"
                            type="email"
                            placeholder="tu@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="auth-input-group">
                        <label htmlFor="signin-password">Contraseña</label>
                        <div className="auth-password-wrapper">
                            <input
                                id="signin-password"
                                type={showPwd ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                onClick={() => setShowPwd(!showPwd)}
                                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                                    {showPwd ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-btn-primary"
                        disabled={loading}
                    >
                        {loading && <span className="auth-spinner" />}
                        {loading ? 'Ingresando...' : 'Iniciar sesión'}
                    </button>
                </form>

                <div className="auth-footer">
                    ¿No tienes una cuenta?{' '}
                    <Link to="/registro">Regístrate aquí</Link>
                </div>
            </div>
        </div>
    );
}
