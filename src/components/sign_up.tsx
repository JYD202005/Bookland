import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/supabase';
import './auth.css';

export default function SignUp() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPwd) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                    },
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            if (data.user) {
                // Insert into custom usuarios table
                const { error: insertError } = await supabase
                    .from('usuarios')
                    .insert({
                        username,
                        email,
                        password_hash: '***', // Auth handles real password, this is a placeholder
                        avatar_url: null,
                        rol: 'lector',
                    });

                if (insertError) {
                    console.error('Error creating user profile:', insertError);
                }

                setSuccess('¡Cuenta creada! Revisa tu correo para confirmar tu registro.');
                setTimeout(() => navigate('/login'), 3000);
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

                <h1 className="auth-title">Únete al archivo</h1>
                <p className="auth-subtitle">Crea tu cuenta para explorar el Cosmere</p>

                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-input-group">
                        <label htmlFor="signup-username">Nombre de usuario</label>
                        <input
                            id="signup-username"
                            type="text"
                            placeholder="saltamundos42"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className="auth-input-group">
                        <label htmlFor="signup-email">Correo electrónico</label>
                        <input
                            id="signup-email"
                            type="email"
                            placeholder="tu@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="auth-input-group">
                        <label htmlFor="signup-password">Contraseña</label>
                        <div className="auth-password-wrapper">
                            <input
                                id="signup-password"
                                type={showPwd ? 'text' : 'password'}
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                autoComplete="new-password"
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

                    <div className="auth-input-group">
                        <label htmlFor="signup-confirm">Confirmar contraseña</label>
                        <input
                            id="signup-confirm"
                            type={showPwd ? 'text' : 'password'}
                            placeholder="Repite tu contraseña"
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-btn-primary"
                        disabled={loading}
                    >
                        {loading && <span className="auth-spinner" />}
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </button>
                </form>

                <div className="auth-footer">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login">Inicia sesión</Link>
                </div>
            </div>
        </div>
    );
}
