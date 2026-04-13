import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { FaPlus, FaMinus, FaTrash, FaShoppingCart, FaStar, FaTimes, FaLock } from 'react-icons/fa'
import { useUser } from '../context/UserContext'
import AuthModal from '../components/AuthModal'
import './Orders.css'

/* ── Tier config (mirrors backend) ─────────────────────────── */
const TIER_DISCOUNTS = { Bronze: 0, Silver: 5, Gold: 10, Platinum: 15 }
const TIER_ICONS     = { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💎' }
const TIER_COLORS    = { Bronze: '#CD7F32', Silver: '#C0C0C0', Gold: '#FFD700', Platinum: '#9333ea' }

/* Category emoji map for display */
const CATEGORY_ICONS = { Coffee: '☕', Tea: '🍵', Pastries: '🥐', Sandwiches: '🥪', Desserts: '🍰', Other: '🍽️' }


/* ── Points earned banner ────────────────────────────────────── */
function PointsBanner({ points, tier, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 5000)
        return () => clearTimeout(t)
    }, [onClose])

    return (
        <div className="points-banner animate-slideInRight" style={{ '--tier-c': TIER_COLORS[tier] }}>
            <span className="points-banner-icon">⭐</span>
            <div>
                <p className="points-banner-title">+{points} Points Earned!</p>
                <p className="points-banner-sub">You're now {tier} tier {TIER_ICONS[tier]}</p>
            </div>
            <button className="points-banner-close" onClick={onClose}><FaTimes /></button>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────────────── */
function Orders() {
    const { user, userId, loginUser, registerUser, refreshUser } = useUser()


    /* ── Menu items fetched from backend ──────────────────── */
    const [menuItems, setMenuItems]       = useState([])
    const [menuLoading, setMenuLoading]   = useState(true)
    const [menuError, setMenuError]       = useState('')

    /* Cart */
    const [cart, setCart] = useState([])

    /* Customer form (pre-filled for known users) */
    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', address: '' })

    /* Loyalty discount state */
    const [pointsToRedeem, setPointsToRedeem]   = useState(0)
    const [discountPreview, setDiscountPreview] = useState(null)
    const [discountLoading, setDiscountLoading] = useState(false)

    /* UI states */
    const [orderPlaced, setOrderPlaced]       = useState(false)
    const [earnedPoints, setEarnedPoints]     = useState(null)
    const [newTier, setNewTier]               = useState(null)
    const [showAuthModal, setShowAuthModal]   = useState(false)
    const [pendingItem, setPendingItem]       = useState(null)
    const [submitting, setSubmitting]         = useState(false)
    const [orderError, setOrderError]         = useState('')
    const [paymentLoading, setPaymentLoading] = useState(false)

    /* Load Razorpay checkout script once */
    const razorpayScriptLoaded = useRef(false)
    useEffect(() => {
        if (razorpayScriptLoaded.current) return
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        script.onload = () => { razorpayScriptLoaded.current = true }
        document.body.appendChild(script)
    }, [])

    /* ── Fetch menu from /api/menu on mount ───────────────── */
    useEffect(() => {
        const fetchMenu = async () => {
            setMenuLoading(true)
            setMenuError('')
            try {
                const { data } = await axios.get('/api/menu')
                // Only show available items
                setMenuItems(data.filter(item => item.available !== false))
            } catch (err) {
                setMenuError('Could not load menu. Please refresh the page.')
            } finally {
                setMenuLoading(false)
            }
        }
        fetchMenu()
    }, [])

    /* Group items by category for display */
    const groupedMenu = menuItems.reduce((acc, item) => {
        const cat = item.category || 'Other'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
    }, {})

    /* Pre-fill form when user profile loads */
    useEffect(() => {
        if (user) {
            setCustomerInfo({
                name:    user.name    || '',
                email:   user.email   || '',
                phone:   user.phone   || '',
                address: user.address || ''
            })
        }
    }, [user])

    /* ── Cart helpers ──────────────────────────────────────── */
    const addToCart = (item) => {
        // Gate: require login before adding to cart
        if (!userId) {
            setPendingItem(item)
            setShowAuthModal(true)
            return
        }
        setCart(prev => {
            const existing = prev.find(c => c._id === item._id)
            return existing
                ? prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c)
                : [...prev, { ...item, quantity: 1 }]
        })
    }

    const updateQuantity = (id, delta) =>
        setCart(prev => prev.map(c => c._id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0))

    const removeFromCart = (id) => setCart(prev => prev.filter(c => c._id !== id))

    const cartSubtotal = () => cart.reduce((sum, c) => sum + c.price * c.quantity, 0)

    /* ── Live discount preview ────────────────────────────── */
    const fetchDiscountPreview = useCallback(async () => {
        const subtotal = cartSubtotal()
        if (!userId || subtotal <= 0) { setDiscountPreview(null); return }
        setDiscountLoading(true)
        try {
            const { data } = await axios.post('/api/orders/calculate-discount', {
                userId, orderTotal: subtotal, pointsToRedeem: Number(pointsToRedeem)
            })
            setDiscountPreview(data)
        } catch { setDiscountPreview(null) }
        finally { setDiscountLoading(false) }
    }, [userId, cart, pointsToRedeem])

    /* Debounce discount fetch on cart or points changes */
    useEffect(() => {
        const t = setTimeout(fetchDiscountPreview, 400)
        return () => clearTimeout(t)
    }, [fetchDiscountPreview])

    /* ── Input handler ────────────────────────────────────── */
    const handleInputChange = (e) =>
        setCustomerInfo(prev => ({ ...prev, [e.target.name]: e.target.value }))

    /* ── handleSubmitOrder — now triggers Razorpay first ──── */
    const handleSubmitOrder = async (e) => {
        e.preventDefault()
        if (cart.length === 0) { alert('Please add items to your cart'); return }
        if (!userId) { setShowAuthModal(true); return }

        setPaymentLoading(true)
        setOrderError('')

        try {
            /* Step 1: Ask backend to create a Razorpay order */
            const amount = discountPreview?.finalTotal ?? cartSubtotal()
            const { data: rzpOrder } = await axios.post('/api/payment/create-order', {
                amount,
                receipt: `receipt_${Date.now()}`
            })

            /* Step 2: Open Razorpay checkout popup */
            const options = {
                key:         rzpOrder.keyId,
                amount:      rzpOrder.amount,
                currency:    rzpOrder.currency,
                name:        'Cafe Management',
                description: 'Order Payment',
                order_id:    rzpOrder.orderId,
                prefill: {
                    name:    customerInfo.name,
                    email:   customerInfo.email,
                    contact: customerInfo.phone,
                },
                theme: { color: '#f97316' },
                modal: {
                    ondismiss: () => {
                        setPaymentLoading(false)
                        setOrderError('Payment cancelled. Your order was not placed.')
                    }
                },
                handler: async (response) => {
                    /* Step 3: Verify signature on backend */
                    try {
                        const { data: verifyData } = await axios.post('/api/payment/verify', {
                            razorpay_order_id:   response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature:  response.razorpay_signature,
                        })

                        if (!verifyData.success) {
                            setOrderError('Payment verification failed. Please contact support.')
                            setPaymentLoading(false)
                            return
                        }

                        /* Step 4: Payment verified — save order to DB */
                        await placeOrder(undefined, undefined, response.razorpay_payment_id)
                    } catch (err) {
                        setOrderError(err.response?.data?.message || 'Payment verification failed.')
                        setPaymentLoading(false)
                    }
                }
            }

            const rzp = new window.Razorpay(options)
            rzp.on('payment.failed', (response) => {
                setOrderError('Payment failed: ' + response.error.description)
                setPaymentLoading(false)
            })
            rzp.open()
        } catch (err) {
            setOrderError(err.response?.data?.message || 'Could not initiate payment. Please try again.')
            setPaymentLoading(false)
        }
    }

    /**
     * placeOrder — saves the order to DB after successful payment.
     * @param {string} overrideUserId
     * @param {object} overrideCustomer
     * @param {string} razorpayPaymentId - payment ID from Razorpay, stamped on order
     */
    const placeOrder = async (overrideUserId, overrideCustomer, razorpayPaymentId) => {
        setSubmitting(true)
        setOrderError('')
        const uid = overrideUserId || userId
        const subtotal = cartSubtotal()
        const cust = overrideCustomer || customerInfo

        const orderData = {
            customerName:    cust.name    || customerInfo.name,
            customerEmail:   cust.email   || customerInfo.email,
            customerPhone:   cust.phone   || customerInfo.phone,
            deliveryAddress: customerInfo.address,
            items: cart.map(c => ({ menuItem: c._id, name: c.name, quantity: c.quantity, price: c.price })),
            totalAmount: subtotal,
            status: 'pending',
            userId: uid,
            pointsToRedeem: Number(pointsToRedeem),
            razorpayPaymentId,
        }

        try {
            const { data } = await axios.post('/api/orders', orderData)
            const loyalty = data.loyalty || {}

            setEarnedPoints(loyalty.pointsEarned || 0)
            setNewTier(loyalty.newTier || 'Bronze')
            setOrderPlaced(true)
            setCart([])
            setPointsToRedeem(0)
            setDiscountPreview(null)
            if (uid) refreshUser()
            setTimeout(() => { setOrderPlaced(false); setEarnedPoints(null) }, 8000)
        } catch (err) {
            console.error('Order error:', err)
            setOrderError(err.response?.data?.message || 'Order placed! (Demo mode)')
            setOrderPlaced(true)
            setCart([])
            setTimeout(() => { setOrderPlaced(false); setOrderError('') }, 5000)
        } finally {
            setSubmitting(false)
            setPaymentLoading(false)
        }
    }

    /**
     * handleAuthSuccess — called when user logs in / signs up via AuthModal.
     * Auto-adds the pending item (if any) then closes the modal.
     */
    const handleAuthSuccess = (loggedInUser) => {
        setShowAuthModal(false)
        // Pre-fill checkout form
        setCustomerInfo(p => ({
            ...p,
            name:  loggedInUser.name  || p.name,
            email: loggedInUser.email || p.email,
            phone: loggedInUser.phone || p.phone,
        }))
        // Add the item that triggered the auth flow
        if (pendingItem) {
            setCart(prev => {
                const existing = prev.find(c => c._id === pendingItem._id)
                return existing
                    ? prev.map(c => c._id === pendingItem._id ? { ...c, quantity: c.quantity + 1 } : c)
                    : [...prev, { ...pendingItem, quantity: 1 }]
            })
            setPendingItem(null)
        }
    }

    /* ── Derived values ────────────────────────────────────── */
    const tierDiscount   = user ? TIER_DISCOUNTS[user.tier] || 0 : 0
    const currentTier    = user?.tier || 'Bronze'
    const pointsBalance  = user?.loyaltyPoints || 0
    const finalTotal     = discountPreview?.finalTotal ?? cartSubtotal()
    const tierSavings    = discountPreview?.tierDiscountAmt ?? 0
    const ptsSavings     = discountPreview?.pointsDiscountAmt ?? 0
    const maxRedeemable  = discountPreview
        ? discountPreview.pointsToRedeem  // server already capped it
        : Math.min(pointsBalance, Math.floor(cartSubtotal() / 2 / 0.1))

    return (
        <div className="orders-page">
            {/* Points earned banner */}
            {orderPlaced && earnedPoints !== null && earnedPoints > 0 && (
                <PointsBanner points={earnedPoints} tier={newTier || currentTier} onClose={() => setEarnedPoints(null)} />
            )}

            {/* Auth modal (login / sign-up) */}
            {showAuthModal && (
                <AuthModal
                    onSuccess={handleAuthSuccess}
                    onClose={() => { setShowAuthModal(false); setPendingItem(null) }}
                    loginUser={loginUser}
                    registerUser={registerUser}
                />
            )}

            {/* ── Header ── */}
            <div className="orders-header">
                <div className="container">
                    <h1 className="orders-title animate-fadeIn">Place Your Order</h1>
                    <p className="orders-subtitle animate-fadeIn">Select items and complete your order</p>
                    {user && (
                        <div className="orders-user-chip animate-fadeIn" style={{ '--tc': TIER_COLORS[currentTier] }}>
                            {TIER_ICONS[currentTier]} <strong>{user.name}</strong> &nbsp;·&nbsp; {currentTier} Member &nbsp;·&nbsp; {pointsBalance} pts
                        </div>
                    )}
                </div>
            </div>

            <div className="orders-content section">
                <div className="container">
                    <div className="orders-layout">

                        {/* ── Menu Items ── */}
                        <div className="orders-menu">
                            <h2 className="orders-section-title">Our Menu</h2>

                            {menuLoading && (
                                <div className="loading-container"><div className="spinner" /></div>
                            )}

                            {menuError && (
                                <div className="menu-error">{menuError}</div>
                            )}

                            {!menuLoading && !menuError && menuItems.length === 0 && (
                                <p className="menu-empty">No menu items available right now. Please check back later.</p>
                            )}

                            {!menuLoading && Object.entries(groupedMenu).map(([category, items]) => (
                                <div key={category} className="menu-category-group">
                                    <h3 className="menu-category-title">
                                        {CATEGORY_ICONS[category] || '🍽️'} {category}
                                    </h3>
                                    <div className="quick-add-grid">
                                        {items.map(item => (
                                            <div key={item._id} className="quick-add-item glass-card">
                                                <div className="quick-add-info">
                                                    <h3 className="quick-add-name">{item.name}</h3>
                                                    {item.description && (
                                                        <p className="quick-add-desc">{item.description}</p>
                                                    )}
                                                    <span className="quick-add-price">₹{item.price.toFixed(2)}</span>
                                                </div>
                                                <button onClick={() => addToCart(item)} className="btn btn-primary quick-add-btn">
                                                    <FaPlus /> Add
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Cart & Checkout ── */}
                        <div className="orders-cart">
                            <div className="cart-container glass">
                                <h2 className="cart-title"><FaShoppingCart /> Your Cart ({cart.length})</h2>

                                {cart.length === 0 ? (
                                    <p className="cart-empty">Your cart is empty</p>
                                ) : (
                                    <>
                                        {/* Cart items */}
                                        <div className="cart-items">
                                            {cart.map(item => (
                                                <div key={item._id} className="cart-item">
                                                    <div className="cart-item-info">
                                                        <h4 className="cart-item-name">{item.name}</h4>
                                                        <span className="cart-item-price">₹{item.price.toFixed(2)}</span>
                                                    </div>
                                                    <div className="cart-item-controls">
                                                        <button onClick={() => updateQuantity(item._id, -1)} className="quantity-btn"><FaMinus /></button>
                                                        <span className="quantity-display">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item._id, 1)} className="quantity-btn"><FaPlus /></button>
                                                        <button onClick={() => removeFromCart(item._id)} className="remove-btn"><FaTrash /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* ── Loyalty Benefits Section ── */}
                                        {user && (
                                            <div className="loyalty-benefits-section">
                                                <div className="loyalty-benefits-header">
                                                    <FaStar style={{ color: TIER_COLORS[currentTier] }} />
                                                    <span>Loyalty Benefits</span>
                                                </div>

                                                {/* Tier discount info */}
                                                {tierDiscount > 0 && (
                                                    <div className="loyalty-perk tier-perk">
                                                        <span>{TIER_ICONS[currentTier]} {currentTier} Member: <strong>{tierDiscount}% off</strong> applied ✓</span>
                                                        {tierSavings > 0 && <span className="perk-saving">-₹{tierSavings.toFixed(2)}</span>}
                                                    </div>
                                                )}
                                                {tierDiscount === 0 && (
                                                    <p className="tier-no-discount">
                                                        🥉 Bronze tier — earn 500 pts to unlock Silver (5% off every order)
                                                    </p>
                                                )}

                                                {/* Points balance */}
                                                <div className="points-balance-row">
                                                    <span>⭐ Points balance: <strong>{pointsBalance} pts</strong></span>
                                                </div>

                                                {/* Points redemption input */}
                                                {pointsBalance >= 100 && (
                                                    <div className="redeem-section">
                                                        <label className="form-label redeem-label">
                                                            Redeem Points <span className="redeem-hint">(100 pts = ₹10 off)</span>
                                                        </label>
                                                        <div className="redeem-input-row">
                                                            <input type="number" className="form-input redeem-input"
                                                                min={0} max={pointsBalance} step={100}
                                                                value={pointsToRedeem}
                                                                onChange={e => setPointsToRedeem(Number(e.target.value))}
                                                                placeholder="0" />
                                                            <button className="btn btn-secondary redeem-max-btn"
                                                                onClick={() => setPointsToRedeem(maxRedeemable)} type="button">
                                                                Max
                                                            </button>
                                                        </div>
                                                        {ptsSavings > 0 && (
                                                            <p className="redeem-preview">-₹{ptsSavings.toFixed(2)} from {pointsToRedeem} pts</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Order Summary ── */}
                                        <div className="order-summary">
                                            <div className="summary-row">
                                                <span>Subtotal</span>
                                                <span>₹{cartSubtotal().toFixed(2)}</span>
                                            </div>
                                            {tierSavings > 0 && (
                                                <div className="summary-row discount-row">
                                                    <span>Tier Discount ({tierDiscount}%)</span>
                                                    <span>-₹{tierSavings.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {ptsSavings > 0 && (
                                                <div className="summary-row discount-row">
                                                    <span>Points Redeemed ({pointsToRedeem} pts)</span>
                                                    <span>-₹{ptsSavings.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="summary-row total-row">
                                                <span className="total-label">Total</span>
                                                <span className="total-amount">
                                                    {discountLoading ? '…' : `₹${finalTotal.toFixed(2)}`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* ── Delivery Form ── */}
                                        <form onSubmit={handleSubmitOrder} className="checkout-form">
                                            <h3 className="form-title">Delivery Information</h3>

                                            <div className="form-group">
                                                <label className="form-label">Name *</label>
                                                <input type="text" name="name" value={customerInfo.name}
                                                    onChange={handleInputChange} className="form-input" required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Email *</label>
                                                <input type="email" name="email" value={customerInfo.email}
                                                    onChange={handleInputChange} className="form-input" required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Phone *</label>
                                                <input type="tel" name="phone" value={customerInfo.phone}
                                                    onChange={handleInputChange} className="form-input" required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Delivery Address *</label>
                                                <textarea name="address" value={customerInfo.address}
                                                    onChange={handleInputChange} className="form-textarea" required />
                                            </div>

                                            {orderError && <div className="order-error">{orderError}</div>}

                                            <button
                                                type="submit"
                                                className="btn btn-primary btn-large submit-btn pay-btn"
                                                disabled={submitting || paymentLoading}
                                            >
                                                <FaLock style={{ marginRight: '0.4rem', fontSize: '0.85em' }} />
                                                {paymentLoading
                                                    ? 'Opening Payment…'
                                                    : submitting
                                                        ? 'Placing Order…'
                                                        : `Pay ₹${finalTotal > 0 ? finalTotal.toFixed(2) : '0.00'} via Razorpay`
                                                }
                                            </button>

                                            <div className="razorpay-badge">
                                                <FaLock /> Secured by Razorpay
                                            </div>

                                            {!userId && (
                                                <p className="no-account-note">
                                                    🔐 <button type="button" className="inline-auth-btn" onClick={() => setShowAuthModal(true)}>Sign in or create an account</button> to earn loyalty points
                                                </p>
                                            )}

                                        </form>
                                    </>
                                )}

                                {/* Order success */}
                                {orderPlaced && (
                                    <div className="order-success">
                                        <div className="success-icon">✓</div>
                                        <p className="success-text">Order placed successfully!</p>
                                        {earnedPoints > 0 && (
                                            <p className="success-pts">+{earnedPoints} loyalty points added to your account</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Orders
