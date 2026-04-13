import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    /* ── Customer info ───────────────────────────────────────── */
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    customerEmail: {
        type: String,
        required: [true, 'Customer email is required'],
        trim: true,
        lowercase: true
    },
    customerPhone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true
    },
    deliveryAddress: {
        type: String,
        required: [true, 'Delivery address is required'],
        trim: true
    },

    /* ── User link (optional — guest orders have no userId) ──── */
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    /* ── Order items ─────────────────────────────────────────── */
    items: [{
        // menuItem is optional — static items use string IDs, not real ObjectIds
        menuItemId: { type: String, default: '' },   // store as plain string (safe for any ID)
        name:     { type: String, required: true },
        quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
        price:    { type: Number, required: true, min: [0, 'Price cannot be negative'] }
    }],

    /* ── Financial breakdown ─────────────────────────────────── */
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    originalTotal:       { type: Number, default: 0 },  // cart subtotal before discounts
    tierDiscount:        { type: Number, default: 0 },  // percentage applied
    tierDiscountAmount:  { type: Number, default: 0 },  // ₹ saved by tier
    pointsRedeemed:      { type: Number, default: 0 },  // loyalty points spent
    pointsDiscountAmount:{ type: Number, default: 0 },  // ₹ value of redeemed points
    finalTotal:          { type: Number, default: 0 },  // amount actually charged
    pointsEarned:        { type: Number, default: 0 },  // points awarded this order
    razorpayPaymentId:   { type: String, default: null },

    /* ── Status ──────────────────────────────────────────────── */
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
        default: 'pending'
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

const Order = mongoose.model('Order', orderSchema)

export default Order
