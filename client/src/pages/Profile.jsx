import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FaSignOutAlt } from 'react-icons/fa'
import { useUser } from '../context/UserContext'
import './Profile.css'

/* ── Tier configuration ──────────────────────────────────────── */
const TIER_CONFIG = {
    Bronze:   { color: '#CD7F32', glow: 'rgba(205,127,50,0.3)',  icon: '🥉', next: 'Silver',   nextPts: 500  },
    Silver:   { color: '#C0C0C0', glow: 'rgba(192,192,192,0.3)', icon: '🥈', next: 'Gold',     nextPts: 1500 },
    Gold:     { color: '#FFD700', glow: 'rgba(255,215,0,0.3)',   icon: '🥇', next: 'Platinum', nextPts: 4000 },
    Platinum: { color: '#E5E4E2', glow: 'rgba(140,60,255,0.35)', icon: '💎', next: null,       nextPts: null }
}

/** Animate a number counting up from 0 to target */
function AnimatedCounter({ target, duration = 1200 }) {
    const [display, setDisplay] = useState(0)
    useEffect(() => {
        let start = 0
        const step = Math.ceil(target / (duration / 16))
        const timer = setInterval(() => {
            start += step
            if (start >= target) { setDisplay(target); clearInterval(timer) }
            else setDisplay(start)
        }, 16)
        return () => clearInterval(timer)
    }, [target, duration])
    return <span>{display.toLocaleString()}</span>
}

/** Format status badge styling */
const statusColors = {
    pending: '#f59e0b', confirmed: '#3b82f6', preparing: '#8b5cf6',
    ready: '#10b981', delivered: '#22c55e', cancelled: '#ef4444'
}

function Profile() {
    const { user, userId, refreshUser, updateUserLocally, logoutUser } = useUser()
    const navigate = useNavigate()

    /* ── Tab state ── */
    const [activeTab, setActiveTab] = useState('profile')

    /* ── Profile edit state ── */
    const [form, setForm] = useState({ name: '', phone: '', address: '' })
    const [saving, setSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState(null)

    /* ── Order history state ── */
    const [orders, setOrders] = useState([])
    const [ordersLoading, setOrdersLoading] = useState(false)

    /* ── Points history state ── */
    const [pointsHistory, setPointsHistory] = useState([])
    const [phLoading, setPhLoading] = useState(false)

    /* ── Populate form when user loads ── */
    useEffect(() => {
        if (user) {
            setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '' })
        }
    }, [user])

    /* ── Fetch data when tabs change ── */
    useEffect(() => {
        if (activeTab === 'orders' && userId && orders.length === 0) fetchOrders()
        if (activeTab === 'points' && userId && pointsHistory.length === 0) fetchPointsHistory()
    }, [activeTab, userId])

    const fetchOrders = async () => {
        setOrdersLoading(true)
        try {
            const { data } = await axios.get(`/api/users/${userId}/order-history`)
            setOrders(data)
        } catch { setOrders([]) }
        finally { setOrdersLoading(false) }
    }

    const fetchPointsHistory = async () => {
        setPhLoading(true)
        try {
            const { data } = await axios.get(`/api/users/${userId}/points-history`)
            setPointsHistory(data.history || [])
        } catch { setPointsHistory([]) }
        finally { setPhLoading(false) }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        setSaveMsg(null)
        try {
            const { data } = await axios.put(`/api/users/${userId}`, form)
            updateUserLocally(data)
            setSaveMsg({ type: 'success', text: '✓ Profile updated successfully!' })
        } catch {
            setSaveMsg({ type: 'error', text: '✗ Failed to save. Please try again.' })
        } finally {
            setSaving(false)
            setTimeout(() => setSaveMsg(null), 3000)
        }
    }

    /* ── Tier info ── */
    const tier     = user?.tier || 'Bronze'
    const tierCfg  = TIER_CONFIG[tier]
    const pts      = user?.loyaltyPoints || 0
    const lifePts  = user?.totalPointsEarned || 0
    const progress = user?.tierInfo?.progress ?? 0
    const ptsNeeded= user?.tierInfo?.pointsNeeded ?? 0
    const nextTier = user?.tierInfo?.nextTier ?? null

    /* ── Initials avatar ── */
    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?'

    /* ── Member since ── */
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
        : ''

    /* ── Logout ── */
    const handleLogout = () => {
        logoutUser()
        navigate('/')
    }

    if (!userId || !user) {
        return (
            <div className="profile-page">
                <div className="profile-no-user">
                    <div className="no-user-icon">👤</div>
                    <h2>No Profile Found</h2>
                    <p>Place your first order to create a profile and start earning loyalty points!</p>
                    <a href="/orders" className="btn btn-primary">Order Now</a>
                </div>
            </div>
        )
    }

    return (
        <div className="profile-page">
            {/* ── Page Header ── */}
            <div className="profile-hero">
                <div className="container">
                    <div className="profile-hero-content animate-fadeIn">
                        {/* Avatar */}
                        <div className="profile-avatar" style={{ '--tier-glow': tierCfg.glow, '--tier-color': tierCfg.color }}>
                            {user.profilePicture
                                ? <img src={user.profilePicture} alt={user.name} />
                                : <span className="avatar-initials">{initials}</span>
                            }
                            <span className="avatar-tier-badge" title={tier}>{tierCfg.icon}</span>
                        </div>
                        <div className="profile-hero-info">
                            <h1 className="profile-name">{user.name}</h1>
                            <p className="profile-email">{user.email}</p>
                            <p className="profile-member-since">Member since {memberSince}</p>
                            <div className="profile-stats">
                                <div className="stat-chip"><span className="stat-val">{user.orderCount || 0}</span> Orders</div>
                                <div className="stat-chip"><span className="stat-val">₹{(user.totalSpent || 0).toFixed(0)}</span> Spent</div>
                                <div className="stat-chip"><span className="stat-val">{pts}</span> Points</div>
                            </div>
                        </div>
                        {/* Logout */}
                        <button className="profile-logout-btn" onClick={handleLogout} title="Log out">
                            <FaSignOutAlt />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="container profile-body">
                {/* ── Tabs ── */}
                <div className="profile-tabs">
                    {['profile', 'loyalty', 'orders', 'points'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`profile-tab ${activeTab === tab ? 'profile-tab-active' : ''}`}>
                            {{ profile:'👤 Profile', loyalty:'🏆 Loyalty', orders:'📦 Orders', points:'📊 Points History' }[tab]}
                        </button>
                    ))}
                </div>

                {/* ════════════════════ TAB: PROFILE ════════════════════ */}
                {activeTab === 'profile' && (
                    <div className="profile-section animate-fadeIn">
                        <div className="glass-card profile-form-card">
                            <h2 className="section-label">Edit Profile</h2>
                            <form onSubmit={handleSave} className="profile-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <input className="form-input" value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            placeholder="Your name" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email <span className="readonly-badge">Read-only</span></label>
                                        <input className="form-input readonly-input" value={user.email} readOnly />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input className="form-input" value={form.phone}
                                            onChange={e => setForm({ ...form, phone: e.target.value })}
                                            placeholder="Phone number" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Delivery Address</label>
                                    <textarea className="form-textarea" value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                        placeholder="Your delivery address" rows={3} />
                                </div>

                                {saveMsg && (
                                    <div className={`save-message ${saveMsg.type}`}>{saveMsg.text}</div>
                                )}

                                <button type="submit" className="btn btn-primary save-btn" disabled={saving}>
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ════════════════════ TAB: LOYALTY ════════════════════ */}
                {activeTab === 'loyalty' && (
                    <div className="profile-section animate-fadeIn">
                        {/* Loyalty card */}
                        <div className="loyalty-card" style={{ '--tier-color': tierCfg.color, '--tier-glow': tierCfg.glow }}>
                            <div className="loyalty-card-bg" />
                            <div className="loyalty-top">
                                <div>
                                    <p className="loyalty-label">Current Tier</p>
                                    <h2 className="loyalty-tier">{tierCfg.icon} {tier}</h2>
                                </div>
                                <div className="loyalty-points-block">
                                    <p className="loyalty-label">Points Balance</p>
                                    <h2 className="loyalty-pts"><AnimatedCounter target={pts} /></h2>
                                </div>
                            </div>

                            {nextTier ? (
                                <div className="loyalty-progress-section">
                                    <div className="progress-labels">
                                        <span>{tier}</span>
                                        <span className="progress-hint">{ptsNeeded} pts to {nextTier} {TIER_CONFIG[nextTier]?.icon}</span>
                                        <span>{nextTier}</span>
                                    </div>
                                    <div className="progress-bar-track">
                                        <div className="progress-bar-fill"
                                            style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${tierCfg.color}, ${TIER_CONFIG[nextTier]?.color ?? tierCfg.color})` }} />
                                    </div>
                                </div>
                            ) : (
                                <p className="loyalty-max">🎉 You've reached the highest tier — Platinum!</p>
                            )}

                            <div className="loyalty-meta">
                                <span>Lifetime points earned: <strong>{lifePts.toLocaleString()}</strong></span>
                                <span>Total orders: <strong>{user.orderCount || 0}</strong></span>
                            </div>
                        </div>

                        {/* Tier benefits grid */}
                        <div className="tier-benefits">
                            <h3 className="section-label">Tier Benefits</h3>
                            <div className="tier-grid">
                                {Object.entries(TIER_CONFIG).map(([t, cfg]) => (
                                    <div key={t} className={`tier-card ${tier === t ? 'tier-card-active' : ''}`}
                                        style={{ '--tc': cfg.color, '--tg': cfg.glow }}>
                                        <div className="tier-icon">{cfg.icon}</div>
                                        <div className="tier-name">{t}</div>
                                        <div className="tier-discount">
                                            {t === 'Bronze' ? 'No discount' : `${['Bronze','Silver','Gold','Platinum'].indexOf(t) * 5}% off every order`}
                                        </div>
                                        <div className="tier-pts-range">
                                            {t === 'Bronze' ? '0–499 pts' : t === 'Silver' ? '500–1499 pts' : t === 'Gold' ? '1500–3999 pts' : '4000+ pts'}
                                        </div>
                                        {tier === t && <div className="tier-current-badge">Current</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════ TAB: ORDERS ════════════════════ */}
                {activeTab === 'orders' && (
                    <div className="profile-section animate-fadeIn">
                        <div className="glass-card">
                            <h2 className="section-label">Order History</h2>
                            {ordersLoading ? (
                                <div className="loading-container"><div className="spinner" /></div>
                            ) : orders.length === 0 ? (
                                <div className="empty-state">
                                    <span className="empty-icon">📦</span>
                                    <p>No orders yet. Start ordering to see your history!</p>
                                </div>
                            ) : (
                                <div className="order-history-list">
                                    {orders.map(order => (
                                        <div key={order._id} className="order-history-card">
                                            <div className="oh-header">
                                                <div>
                                                    <p className="oh-id">#{order._id.slice(-6).toUpperCase()}</p>
                                                    <p className="oh-date">{new Date(order.orderDate).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}</p>
                                                </div>
                                                <div className="oh-right">
                                                    <span className="status-badge" style={{ background: statusColors[order.status] + '22', color: statusColors[order.status], border: `1px solid ${statusColors[order.status]}55` }}>
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </span>
                                                    {order.pointsEarned > 0 && (
                                                        <span className="pts-badge">+{order.pointsEarned} pts</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="oh-items">
                                                {order.items.map((it, i) => (
                                                    <span key={i} className="oh-item">{it.name} ×{it.quantity}</span>
                                                ))}
                                            </div>
                                            <div className="oh-footer">
                                                {order.tierDiscount > 0 && (
                                                    <span className="oh-discount">🏷️ {order.tierDiscount}% tier discount applied</span>
                                                )}
                                                <span className="oh-total">₹{(order.finalTotal || order.totalAmount || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ════════════════════ TAB: POINTS HISTORY ════════════ */}
                {activeTab === 'points' && (
                    <div className="profile-section animate-fadeIn">
                        <div className="glass-card">
                            <h2 className="section-label">Points History</h2>
                            {phLoading ? (
                                <div className="loading-container"><div className="spinner" /></div>
                            ) : pointsHistory.length === 0 ? (
                                <div className="empty-state">
                                    <span className="empty-icon">📊</span>
                                    <p>No points transactions yet.</p>
                                </div>
                            ) : (
                                <div className="points-history-table">
                                    <div className="ph-header-row">
                                        <span>Date</span><span>Reason</span><span>Points</span>
                                    </div>
                                    {pointsHistory.map((entry, i) => (
                                        <div key={i} className={`ph-row ${entry.pointsEarned < 0 ? 'ph-row-negative' : 'ph-row-positive'}`}>
                                            <span className="ph-date">{new Date(entry.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                                            <span className="ph-reason">{entry.reason}</span>
                                            <span className="ph-pts">{entry.pointsEarned > 0 ? '+' : ''}{entry.pointsEarned}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Profile
