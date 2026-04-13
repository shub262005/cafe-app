import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

/**
 * Points history entry — logs every loyalty transaction for audit trail
 */
const pointsHistorySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    pointsEarned: { type: Number, required: true }, // negative = redeemed
    reason: { type: String, required: true },        // e.g. "Base points", "Weekend bonus", "Redeemed"
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null }
}, { _id: true })

/**
 * Main User schema — stores profile + loyalty data
 */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    address: {
        type: String,
        trim: true,
        default: ''
    },
    profilePicture: {
        type: String,   // URL to avatar image
        default: ''
    },
    password: {
        type: String,
        default: null   // null = legacy user without password
    },
    isAdmin: {
        type: Boolean,
        default: false
    },

    /* ── Loyalty fields ─────────────────────────────────────── */
    loyaltyPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    tier: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
        default: 'Bronze'
    },
    totalSpent: {
        type: Number,
        default: 0    // cumulative amount paid across all orders
    },
    orderCount: {
        type: Number,
        default: 0
    },
    totalPointsEarned: {
        type: Number,
        default: 0   // lifetime points earned (used for tier calculation)
    },
    pointsHistory: [pointsHistorySchema]

}, { timestamps: true })

/* ── Hash password before saving if it was modified ─────────── */
userSchema.pre('save', async function (next) {
    if (this.isModified('password') && this.password) {
        this.password = await bcrypt.hash(this.password, 12)
    }
    next()
})

/* ── Instance method: compare raw vs hashed password ─────────── */
userSchema.methods.comparePassword = async function (candidate) {
    if (!this.password) return false
    return bcrypt.compare(candidate, this.password)
}

/* ── Helper: derive tier from lifetime points earned ───────── */
userSchema.statics.getTierForPoints = function (totalLifetimePoints) {
    if (totalLifetimePoints >= 4000) return 'Platinum'
    if (totalLifetimePoints >= 1500) return 'Gold'
    if (totalLifetimePoints >= 500)  return 'Silver'
    return 'Bronze'
}

/* ── Helper: get next tier threshold ───────────────────────── */
userSchema.statics.getNextTierInfo = function (totalLifetimePoints) {
    if (totalLifetimePoints >= 4000) return { nextTier: null, pointsNeeded: 0 }
    if (totalLifetimePoints >= 1500) return { nextTier: 'Platinum', pointsNeeded: 4000 - totalLifetimePoints }
    if (totalLifetimePoints >= 500)  return { nextTier: 'Gold',     pointsNeeded: 1500 - totalLifetimePoints }
    return { nextTier: 'Silver', pointsNeeded: 500 - totalLifetimePoints }
}

const User = mongoose.model('User', userSchema)

export default User
