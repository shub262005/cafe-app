import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaCoffee, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUser, FaPhone, FaMapMarkerAlt, FaKey, FaShieldAlt } from 'react-icons/fa'
import { useUser } from '../context/UserContext'
import axios from 'axios'

// 'login' | 'signup' | 'admin'
const MODES = { LOGIN: 'login', SIGNUP: 'signup', ADMIN: 'admin' }

const resetForm = { name: '', email: '', phone: '', address: '', password: '', otp: '' }

export default function Login() {
    const { loginUser, registerUser } = useUser()
    const navigate = useNavigate()
    const location = useLocation()

    const [mode, setMode] = useState(MODES.LOGIN)
    const [form, setForm] = useState(resetForm)
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [otpSent, setOtpSent] = useState(false)   // signup OTP
    const [adminStep, setAdminStep] = useState(1)   // 1 = credentials, 2 = OTP

    const from = location.state?.from?.pathname || '/'

    const switchMode = (m) => {
        setMode(m)
        setForm(resetForm)
        setError('')
        setOtpSent(false)
        setAdminStep(1)
        setShowPw(false)
    }

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

    /* ── Signup: send OTP to new email ───────────────────── */
    const handleSendSignupOtp = async () => {
        if (!validateEmail(form.email)) { setError('Enter a valid email'); return }
        setLoading(true); setError('')
        try {
            await axios.post(`/api/auth/send-otp`, { email: form.email })
            setOtpSent(true)
            alert('OTP sent to your email!')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP')
        } finally { setLoading(false) }
    }

    /* ── Admin Step 1: verify credentials → send OTP ─────── */
    const handleAdminSendOtp = async () => {
        if (!validateEmail(form.email)) { setError('Enter a valid email'); return }
        if (!form.password) { setError('Password is required'); return }
        setLoading(true); setError('')
        try {
            await axios.post(
                `/api/auth/admin-send-otp`,
                { email: form.email, password: form.password }
            )
            setAdminStep(2)
            alert('OTP sent to admin email!')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send admin OTP')
        } finally { setLoading(false) }
    }

    /* ── Form submit ──────────────────────────────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            let user
            if (mode === MODES.LOGIN) {
                user = await loginUser({ email: form.email, password: form.password })

            } else if (mode === MODES.SIGNUP) {
                if (!validateEmail(form.email)) { setError('Enter a valid email'); setLoading(false); return }
                if (!otpSent) { setError('Please send and verify the OTP first'); setLoading(false); return }
                user = await registerUser({ name: form.name, email: form.email, phone: form.phone, address: form.address, password: form.password, otp: form.otp })

            } else {
                // Admin Step 2: verify OTP
                if (adminStep !== 2) { setError('Please complete Step 1 first'); setLoading(false); return }
                const { data } = await axios.post(`/api/auth/admin-login`, { email: form.email, otp: form.otp })
                // persist via UserContext helper — borrow loginUser approach
                const { persistSession } = {} // we'll call the exposed method below
                // Manually persist since we have the response
                localStorage.setItem('cafeUserId', data.user._id)
                localStorage.setItem('cafeToken', data.token)
                // Force a reload to re-init UserContext cleanly
                window.location.href = '/'
                return
            }

            navigate(from, { replace: true })
        } catch (err) {
            setError(err.response?.data?.message || (
                mode === MODES.LOGIN ? 'Login failed. Check your credentials.' :
                    mode === MODES.SIGNUP ? 'Registration failed. Try again.' :
                        'Admin login failed.'
            ))
        } finally {
            setLoading(false)
        }
    }

    /* ── UI helpers ───────────────────────────────────────── */
    const tabStyle = (m) => ({
        flex: 1, padding: '0.6rem 0.5rem', border: 'none', borderRadius: '8px',
        cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', transition: 'all 0.2s',
        background: mode === m ? 'var(--color-primary)' : 'transparent',
        color: mode === m ? 'white' : 'var(--color-text-muted)',
    })

    const iconStyle = { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }

    return (
        <div className="section container" style={{ maxWidth: '500px', marginTop: '4rem', marginBottom: '4rem' }}>
            <div className="glass-card animate-scaleIn" style={{ padding: 'var(--spacing-xl)' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    {mode === MODES.ADMIN
                        ? <FaShieldAlt style={{ fontSize: '3rem', color: 'var(--color-primary)', marginBottom: '1rem' }} />
                        : <FaCoffee style={{ fontSize: '3rem', color: 'var(--color-primary)', marginBottom: '1rem' }} />
                    }
                    <h2 style={{ color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                        {mode === MODES.LOGIN && 'Welcome Back'}
                        {mode === MODES.SIGNUP && 'Create Account'}
                        {mode === MODES.ADMIN && 'Admin Portal'}
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        {mode === MODES.LOGIN && 'Sign in to your account'}
                        {mode === MODES.SIGNUP && 'Join us for delicious coffee and more'}
                        {mode === MODES.ADMIN && (adminStep === 1 ? 'Step 1: Verify your credentials' : 'Step 2: Enter your OTP')}
                    </p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--color-surface)', borderRadius: '10px', padding: '0.3rem', marginBottom: '1.5rem' }}>
                    <button style={tabStyle(MODES.LOGIN)} onClick={() => switchMode(MODES.LOGIN)}>Sign In</button>
                    <button style={tabStyle(MODES.SIGNUP)} onClick={() => switchMode(MODES.SIGNUP)}>Sign Up</button>
                    <button style={{ ...tabStyle(MODES.ADMIN), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }} onClick={() => switchMode(MODES.ADMIN)}>
                        <FaShieldAlt style={{ fontSize: '0.75rem' }} /> Admin
                    </button>
                </div>

                {/* Admin step indicator */}
                {mode === MODES.ADMIN && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        {[1, 2].map(n => (
                            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem', fontWeight: '700', flexShrink: 0,
                                    background: adminStep >= n ? 'var(--color-primary)' : 'var(--color-surface)',
                                    color: adminStep >= n ? 'white' : 'var(--color-text-muted)',
                                    border: `2px solid ${adminStep >= n ? 'var(--color-primary)' : 'var(--color-border, #ccc)'}`,
                                }}>{n}</div>
                                <span style={{ fontSize: '0.8rem', color: adminStep >= n ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: adminStep >= n ? '600' : '400' }}>
                                    {n === 1 ? 'Credentials' : 'Verify OTP'}
                                </span>
                                {n < 2 && <div style={{ flex: 1, height: '2px', background: adminStep > n ? 'var(--color-primary)' : 'var(--color-surface)', borderRadius: '2px' }} />}
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* ── SIGNUP EXTRA FIELDS ─────────────────────────────── */}
                    {mode === MODES.SIGNUP && (
                        <>
                            <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
                                <span style={iconStyle}><FaUser /></span>
                                <input type="text" className="form-input" style={{ paddingLeft: '2.5rem' }}
                                    placeholder="Full Name" value={form.name} onChange={set('name')} required />
                            </div>
                            <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
                                <span style={iconStyle}><FaPhone /></span>
                                <input type="tel" className="form-input" style={{ paddingLeft: '2.5rem' }}
                                    placeholder="Phone Number (optional)" value={form.phone} onChange={set('phone')} />
                            </div>
                            <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
                                <span style={iconStyle}><FaMapMarkerAlt /></span>
                                <input type="text" className="form-input" style={{ paddingLeft: '2.5rem' }}
                                    placeholder="Delivery Address (optional)" value={form.address} onChange={set('address')} />
                            </div>
                        </>
                    )}

                    {/* ── EMAIL FIELD ─────────────────────────────────────── */}
                    {(mode !== MODES.ADMIN || adminStep === 1) && (
                        <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
                            <span style={iconStyle}><FaEnvelope /></span>
                            <input
                                type="email" className="form-input"
                                style={{ paddingLeft: '2.5rem', paddingRight: mode === MODES.SIGNUP && !otpSent ? '6.5rem' : '1rem' }}
                                placeholder="Email address"
                                value={form.email}
                                onChange={set('email')}
                                disabled={mode === MODES.SIGNUP && otpSent}
                                required
                            />
                            {mode === MODES.SIGNUP && !otpSent && (
                                <button type="button" onClick={handleSendSignupOtp} disabled={loading || !form.email}
                                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', padding: '0.25rem 0.5rem', fontSize: '0.78rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    Send OTP
                                </button>
                            )}
                            {mode === MODES.SIGNUP && otpSent && (
                                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'green', fontSize: '0.8rem' }}>Sent ✓</span>
                            )}
                        </div>
                    )}

                    {/* ── PASSWORD FIELD ──────────────────────────────────── */}
                    {(mode !== MODES.ADMIN || adminStep === 1) && (
                        <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
                            <span style={iconStyle}><FaLock /></span>
                            <input
                                type={showPw ? 'text' : 'password'} className="form-input"
                                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                                placeholder="Password" value={form.password} onChange={set('password')}
                                required minLength="6"
                            />
                            <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
                                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                {showPw ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    )}

                    {/* ── SIGNUP OTP FIELD ────────────────────────────────── */}
                    {mode === MODES.SIGNUP && otpSent && (
                        <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
                            <span style={iconStyle}><FaKey /></span>
                            <input type="text" className="form-input" style={{ paddingLeft: '2.5rem' }}
                                placeholder="Enter 6-digit OTP" value={form.otp} onChange={set('otp')} required maxLength={6} />
                        </div>
                    )}

                    {/* ── ADMIN STEP 2: OTP ────────────────────────────────── */}
                    {mode === MODES.ADMIN && adminStep === 2 && (
                        <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
                            <span style={iconStyle}><FaKey /></span>
                            <input type="text" className="form-input" style={{ paddingLeft: '2.5rem' }}
                                placeholder="Enter 6-digit OTP from your email" value={form.otp} onChange={set('otp')} required maxLength={6} autoFocus />
                        </div>
                    )}

                    {error && <p style={{ color: 'red', fontSize: '0.875rem', textAlign: 'center', margin: 0 }}>{error}</p>}

                    {/* ── ACTION BUTTONS ──────────────────────────────────── */}
                    {mode === MODES.ADMIN && adminStep === 1 ? (
                        <button type="button" className="btn btn-primary"
                            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
                            onClick={handleAdminSendOtp} disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify & Send OTP →'}
                        </button>
                    ) : (
                        <button type="submit" className="btn btn-primary"
                            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
                            disabled={loading}>
                            {loading ? 'Authenticating...' : (
                                mode === MODES.LOGIN ? 'Sign In' :
                                    mode === MODES.SIGNUP ? 'Verify & Sign Up' :
                                        '🔐 Confirm Admin Login'
                            )}
                        </button>
                    )}

                    {mode === MODES.ADMIN && adminStep === 2 && (
                        <button type="button"
                            onClick={() => { setAdminStep(1); setForm(f => ({ ...f, otp: '' })); setError('') }}
                            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'center' }}>
                            ← Back to credentials
                        </button>
                    )}
                </form>

                {/* Bottom toggle for Login ↔ Signup */}
                {mode !== MODES.ADMIN && (
                    <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                        {mode === MODES.LOGIN ? (
                            <p style={{ margin: 0 }}>Don&apos;t have an account? <button type="button" onClick={() => switchMode(MODES.SIGNUP)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}>Sign up</button></p>
                        ) : (
                            <p style={{ margin: 0 }}>Already have an account? <button type="button" onClick={() => switchMode(MODES.LOGIN)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}>Sign in</button></p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
