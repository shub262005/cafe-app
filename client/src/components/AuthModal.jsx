import { useState } from 'react'
import { FaTimes, FaEye, FaEyeSlash, FaCoffee, FaUser, FaEnvelope, FaLock, FaPhone } from 'react-icons/fa'
import './AuthModal.css'

/**
 * AuthModal — shown when an unauthenticated user clicks Add+ on a menu item.
 * Supports both Login and Sign Up tabs with MongoDB-backed authentication.
 *
 * Props:
 *   onSuccess(user)  — called after successful auth with the user object
 *   onClose()        — called when the modal is dismissed
 *   loginUser        — from UserContext
 *   registerUser     — from UserContext
 */
export default function AuthModal({ onSuccess, onClose, loginUser, registerUser }) {
    const [tab, setTab] = useState('login') // 'login' | 'signup'

    // Login form state
    const [loginForm, setLoginForm] = useState({ email: '', password: '' })
    const [loginShowPw, setLoginShowPw] = useState(false)
    const [loginLoading, setLoginLoading] = useState(false)
    const [loginError, setLoginError] = useState('')

    // Sign-up form state
    const [signupForm, setSignupForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
    const [signupShowPw, setSignupShowPw] = useState(false)
    const [signupLoading, setSignupLoading] = useState(false)
    const [signupError, setSignupError] = useState('')

    /* ── Login ── */
    const handleLogin = async (e) => {
        e.preventDefault()
        setLoginError('')
        setLoginLoading(true)
        try {
            const user = await loginUser({ email: loginForm.email, password: loginForm.password })
            onSuccess(user)
        } catch (err) {
            setLoginError(err.response?.data?.message || 'Login failed. Please try again.')
        } finally {
            setLoginLoading(false)
        }
    }

    /* ── Sign Up ── */
    const handleSignup = async (e) => {
        e.preventDefault()
        setSignupError('')

        if (!signupForm.name.trim()) { setSignupError('Name is required'); return }
        if (!signupForm.email.trim()) { setSignupError('Email is required'); return }
        if (signupForm.password.length < 6) { setSignupError('Password must be at least 6 characters'); return }
        if (signupForm.password !== signupForm.confirm) { setSignupError('Passwords do not match'); return }

        setSignupLoading(true)
        try {
            const user = await registerUser({
                name: signupForm.name,
                email: signupForm.email,
                phone: signupForm.phone,
                password: signupForm.password
            })
            onSuccess(user)
        } catch (err) {
            setSignupError(err.response?.data?.message || 'Registration failed. Please try again.')
        } finally {
            setSignupLoading(false)
        }
    }

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="auth-card animate-scaleIn" onClick={e => e.stopPropagation()}>

                {/* Close */}
                <button className="auth-close" onClick={onClose} aria-label="Close"><FaTimes /></button>

                {/* Header */}
                <div className="auth-header">
                    <div className="auth-logo"><FaCoffee /></div>
                    <h2 className="auth-title">
                        {tab === 'login' ? 'Welcome Back!' : 'Create Account'}
                    </h2>
                    <p className="auth-subtitle">
                        {tab === 'login'
                            ? 'Sign in to earn loyalty points on your order'
                            : 'Join us and start earning rewards today'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                        onClick={() => { setTab('login'); setLoginError(''); setSignupError('') }}
                    >
                        Login
                    </button>
                    <button
                        className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
                        onClick={() => { setTab('signup'); setLoginError(''); setSignupError('') }}
                    >
                        Sign Up
                    </button>
                </div>

                {/* ── Login Form ── */}
                {tab === 'login' && (
                    <form onSubmit={handleLogin} className="auth-form">
                        <div className="auth-field">
                            <span className="auth-field-icon"><FaEnvelope /></span>
                            <input
                                className="auth-input"
                                type="email"
                                placeholder="Email address"
                                value={loginForm.email}
                                onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="auth-field">
                            <span className="auth-field-icon"><FaLock /></span>
                            <input
                                className="auth-input"
                                type={loginShowPw ? 'text' : 'password'}
                                placeholder="Password"
                                value={loginForm.password}
                                onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                                required
                            />
                            <button
                                type="button"
                                className="auth-toggle-pw"
                                onClick={() => setLoginShowPw(p => !p)}
                                tabIndex={-1}
                            >
                                {loginShowPw ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        {loginError && <p className="auth-error">{loginError}</p>}

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loginLoading}
                        >
                            {loginLoading ? 'Signing in…' : 'Sign In'}
                        </button>

                        <p className="auth-switch-hint">
                            Don't have an account?{' '}
                            <button type="button" className="auth-switch-link" onClick={() => setTab('signup')}>
                                Sign up free
                            </button>
                        </p>
                    </form>
                )}

                {/* ── Sign-Up Form ── */}
                {tab === 'signup' && (
                    <form onSubmit={handleSignup} className="auth-form">
                        <div className="auth-field">
                            <span className="auth-field-icon"><FaUser /></span>
                            <input
                                className="auth-input"
                                type="text"
                                placeholder="Full name"
                                value={signupForm.name}
                                onChange={e => setSignupForm(p => ({ ...p, name: e.target.value }))}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="auth-field">
                            <span className="auth-field-icon"><FaEnvelope /></span>
                            <input
                                className="auth-input"
                                type="email"
                                placeholder="Email address"
                                value={signupForm.email}
                                onChange={e => setSignupForm(p => ({ ...p, email: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <span className="auth-field-icon"><FaPhone /></span>
                            <input
                                className="auth-input"
                                type="tel"
                                placeholder="Phone number (optional)"
                                value={signupForm.phone}
                                onChange={e => setSignupForm(p => ({ ...p, phone: e.target.value }))}
                            />
                        </div>

                        <div className="auth-field">
                            <span className="auth-field-icon"><FaLock /></span>
                            <input
                                className="auth-input"
                                type={signupShowPw ? 'text' : 'password'}
                                placeholder="Password (min 6 chars)"
                                value={signupForm.password}
                                onChange={e => setSignupForm(p => ({ ...p, password: e.target.value }))}
                                required
                            />
                            <button
                                type="button"
                                className="auth-toggle-pw"
                                onClick={() => setSignupShowPw(p => !p)}
                                tabIndex={-1}
                            >
                                {signupShowPw ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        <div className="auth-field">
                            <span className="auth-field-icon"><FaLock /></span>
                            <input
                                className="auth-input"
                                type={signupShowPw ? 'text' : 'password'}
                                placeholder="Confirm password"
                                value={signupForm.confirm}
                                onChange={e => setSignupForm(p => ({ ...p, confirm: e.target.value }))}
                                required
                            />
                        </div>

                        {signupError && <p className="auth-error">{signupError}</p>}

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={signupLoading}
                        >
                            {signupLoading ? 'Creating account…' : '🚀 Create Account & Add to Cart'}
                        </button>

                        <p className="auth-switch-hint">
                            Already have an account?{' '}
                            <button type="button" className="auth-switch-link" onClick={() => setTab('login')}>
                                Sign in
                            </button>
                        </p>
                    </form>
                )}

                <p className="auth-loyalty-note">
                    🎉 Sign up to earn loyalty points and unlock exclusive discounts!
                </p>
            </div>
        </div>
    )
}
