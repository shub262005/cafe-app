import User from '../models/User.js'

/* ── Constants ────────────────────────────────────────────────────────────── */

/** Points earned per ₹10 spent */
const POINTS_PER_UNIT = 1
/** Minimum order total to earn any points */
const MIN_ORDER_FOR_POINTS = 100

/** Bonus events */
const BONUS_FIRST_ORDER       = 50
const BONUS_5TH_ORDER         = 100
const BONUS_10TH_ORDER        = 200
const WEEKEND_MULTIPLIER      = 2   // 2× points on Sat/Sun

/** Tier thresholds (lifetime points earned) */
const TIER_THRESHOLDS = { Bronze: 0, Silver: 500, Gold: 1500, Platinum: 4000 }

/** Tier discount percentages */
export const TIER_DISCOUNTS = { Bronze: 0, Silver: 5, Gold: 10, Platinum: 15 }

/** Points redemption: 100 pts = ₹10 */
const REDEMPTION_RATE = 10 / 100   // ₹ per point

/* ── Helper: is the given date a weekend? ─────────────────────────────────── */
const isWeekend = (date = new Date()) => {
    const day = date.getDay()
    return day === 0 || day === 6 // Sunday=0, Saturday=6
}

/* ── Helper: derive tier label from total lifetime points ─────────────────── */
export const getTierForPoints = (totalLifetimePoints) => {
    if (totalLifetimePoints >= TIER_THRESHOLDS.Platinum) return 'Platinum'
    if (totalLifetimePoints >= TIER_THRESHOLDS.Gold)     return 'Gold'
    if (totalLifetimePoints >= TIER_THRESHOLDS.Silver)   return 'Silver'
    return 'Bronze'
}

/* ── Helper: next tier progress info ─────────────────────────────────────── */
export const getNextTierInfo = (totalLifetimePoints) => {
    if (totalLifetimePoints >= TIER_THRESHOLDS.Platinum) return { nextTier: null, pointsNeeded: 0, progress: 100 }
    if (totalLifetimePoints >= TIER_THRESHOLDS.Gold) {
        const needed = TIER_THRESHOLDS.Platinum - totalLifetimePoints
        const progress = ((totalLifetimePoints - TIER_THRESHOLDS.Gold) / (TIER_THRESHOLDS.Platinum - TIER_THRESHOLDS.Gold)) * 100
        return { nextTier: 'Platinum', pointsNeeded: needed, progress: Math.min(progress, 100) }
    }
    if (totalLifetimePoints >= TIER_THRESHOLDS.Silver) {
        const needed = TIER_THRESHOLDS.Gold - totalLifetimePoints
        const progress = ((totalLifetimePoints - TIER_THRESHOLDS.Silver) / (TIER_THRESHOLDS.Gold - TIER_THRESHOLDS.Silver)) * 100
        return { nextTier: 'Gold', pointsNeeded: needed, progress: Math.min(progress, 100) }
    }
    const needed = TIER_THRESHOLDS.Silver - totalLifetimePoints
    const progress = (totalLifetimePoints / TIER_THRESHOLDS.Silver) * 100
    return { nextTier: 'Silver', pointsNeeded: needed, progress: Math.min(progress, 100) }
}

/**
 * calculateAndAwardPoints
 * -----------------------
 * Called after an order is saved. Calculates how many loyalty points the user
 * earns for this transaction, persists them to MongoDB, and returns a breakdown.
 *
 * @param {string} userId       - User's MongoDB _id
 * @param {number} finalTotal   - The amount actually paid (after discounts)
 * @param {string} orderId      - The saved order's _id (for points-history log)
 * @returns {object}            - { totalPointsEarned, breakdown[], newBalance, newTier }
 */
export const calculateAndAwardPoints = async (userId, finalTotal, orderId) => {
    const user = await User.findById(userId)
    if (!user) throw new Error('User not found')

    const breakdown = []   // array of { reason, points }
    let totalEarned = 0

    /* 1. Minimum order check */
    if (finalTotal < MIN_ORDER_FOR_POINTS) {
        return { totalPointsEarned: 0, breakdown: [{ reason: 'Order below ₹100 minimum', points: 0 }], newBalance: user.loyaltyPoints, newTier: user.tier }
    }

    /* 2. Base points: 1 pt per ₹10 */
    let basePoints = Math.floor(finalTotal / 10) * POINTS_PER_UNIT

    /* 3. Weekend multiplier (applied to base points) */
    const weekend = isWeekend()
    if (weekend) {
        basePoints *= WEEKEND_MULTIPLIER
        breakdown.push({ reason: 'Weekend 2× bonus', points: basePoints - Math.floor(finalTotal / 10) })
    }
    breakdown.push({ reason: `Base points (₹${finalTotal.toFixed(0)} spent)`, points: Math.floor(finalTotal / 10) * (weekend ? 1 : 1) })

    /* 4. Milestone bonuses (based on the NEW orderCount *after* this order) */
    const newOrderCount = user.orderCount + 1
    if (newOrderCount === 1) {
        breakdown.push({ reason: 'First order bonus!', points: BONUS_FIRST_ORDER })
        totalEarned += BONUS_FIRST_ORDER
    }
    if (newOrderCount === 5) {
        breakdown.push({ reason: '5th order milestone bonus!', points: BONUS_5TH_ORDER })
        totalEarned += BONUS_5TH_ORDER
    }
    if (newOrderCount === 10) {
        breakdown.push({ reason: '10th order milestone bonus!', points: BONUS_10TH_ORDER })
        totalEarned += BONUS_10TH_ORDER
    }

    totalEarned += basePoints

    /* 5. Persist to user document */
    const newLifetimePoints = user.totalPointsEarned + totalEarned
    const newTier = getTierForPoints(newLifetimePoints)

    /* Push one combined entry to pointsHistory */
    const historyReasonSummary = breakdown.map(b => b.reason).join('; ')
    user.pointsHistory.push({ date: new Date(), pointsEarned: totalEarned, reason: historyReasonSummary, orderId })

    user.loyaltyPoints    += totalEarned
    user.totalPointsEarned = newLifetimePoints
    user.tier              = newTier
    user.orderCount        = newOrderCount
    user.totalSpent       += finalTotal

    await user.save()

    return { totalPointsEarned: totalEarned, breakdown, newBalance: user.loyaltyPoints, newTier }
}

/**
 * calculateDiscount
 * -----------------
 * Pure calculation function (no DB write). Used by the /calculate-discount endpoint
 * so the frontend can show a live summary before the order is submitted.
 *
 * @param {object} user          - Mongoose user document
 * @param {number} orderTotal    - Raw cart subtotal before discounts
 * @param {number} pointsToRedeem - Points the user wants to spend (0 = none)
 * @returns {object}             - Discount breakdown and finalTotal
 */
export const calculateDiscount = (user, orderTotal, pointsToRedeem = 0) => {
    /* Tier discount */
    const tierDiscountPct = TIER_DISCOUNTS[user.tier] || 0
    const tierDiscountAmt = parseFloat(((orderTotal * tierDiscountPct) / 100).toFixed(2))
    let afterTierDiscount = orderTotal - tierDiscountAmt

    /* Points redemption */
    const maxRedeemable = Math.min(
        user.loyaltyPoints,                       // can't redeem more than balance
        Math.floor(afterTierDiscount / 2 / REDEMPTION_RATE)  // max 50% of order
    )
    const safePointsToRedeem = Math.max(0, Math.min(pointsToRedeem, maxRedeemable))
    const pointsDiscountAmt  = parseFloat((safePointsToRedeem * REDEMPTION_RATE).toFixed(2))
    const afterPointsDiscount = Math.max(0, afterTierDiscount - pointsDiscountAmt)

    /* Tax (if applicable — set to 0 for now, easily configurable) */
    const TAX_RATE = 0
    const taxAmount = parseFloat(((afterPointsDiscount * TAX_RATE) / 100).toFixed(2))
    const finalTotal = parseFloat((afterPointsDiscount + taxAmount).toFixed(2))

    return {
        originalTotal: parseFloat(orderTotal.toFixed(2)),
        tierDiscountPct,
        tierDiscountAmt,
        pointsToRedeem: safePointsToRedeem,
        pointsDiscountAmt,
        taxAmount,
        finalTotal
    }
}
