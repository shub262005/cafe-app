import express from 'express'
import Order from '../models/Order.js'
import User from '../models/User.js'
import { calculateAndAwardPoints, calculateDiscount } from '../utils/loyaltyHelper.js'

const router = express.Router()

/* ─────────────────────────────────────────────────────────────────────────
   POST /api/orders/calculate-discount
   Preview discount totals before placing the order (no writes to DB).
   Body: { userId, orderTotal, pointsToRedeem? }
──────────────────────────────────────────────────────────────────────────── */
router.post('/calculate-discount', async (req, res) => {
    try {
        const { userId, orderTotal, pointsToRedeem = 0 } = req.body

        if (!userId) return res.status(400).json({ message: 'userId is required' })
        if (!orderTotal || orderTotal <= 0) return res.status(400).json({ message: 'orderTotal must be positive' })

        const user = await User.findById(userId)
        if (!user) return res.status(404).json({ message: 'User not found' })

        const breakdown = calculateDiscount(user, Number(orderTotal), Number(pointsToRedeem))
        res.json({ ...breakdown, currentPoints: user.loyaltyPoints, tier: user.tier })
    } catch (error) {
        res.status(500).json({ message: 'Error calculating discount', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────────────────
   GET /api/orders
   Return all orders, newest first.
──────────────────────────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ orderDate: -1 })
        res.json(orders)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────────────────
   GET /api/orders/:id
──────────────────────────────────────────────────────────────────────────── */
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
        if (!order) return res.status(404).json({ message: 'Order not found' })
        res.json(order)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────────────────
   POST /api/orders
   Create a new order.
   Supports loyalty features when userId is provided:
     - Auto-creates user if name+email supplied and user not found
     - Applies tier discount and optional points redemption
     - Awards new loyalty points based on finalTotal
   Body extras: userId?, pointsToRedeem?
──────────────────────────────────────────────────────────────────────────── */
router.post('/', async (req, res) => {
    try {
        const {
            customerName, customerEmail, customerPhone, deliveryAddress,
            items, totalAmount, status,
            userId, pointsToRedeem = 0, razorpayPaymentId
        } = req.body

        /* ── 1. Resolve user (may be null for pure guest orders) ── */
        let user = null

        if (userId) {
            user = await User.findById(userId)
        }

        /* If no user found but email supplied → auto-create profile */
        if (!user && customerEmail && customerName) {
            const existing = await User.findOne({ email: customerEmail.toLowerCase() })
            if (existing) {
                user = existing
            } else {
                user = new User({ name: customerName, email: customerEmail, phone: customerPhone, address: deliveryAddress })
                await user.save()
            }
        }

        /* ── 2. Calculate discounts ─────────────────────────────── */
        let discountData = {
            originalTotal: totalAmount,
            tierDiscountPct: 0,
            tierDiscountAmt: 0,
            pointsToRedeem: 0,
            pointsDiscountAmt: 0,
            finalTotal: totalAmount
        }

        if (user) {
            discountData = calculateDiscount(user, Number(totalAmount), Number(pointsToRedeem))
        }

        /* ── 3. Deduct redeemed points from user balance ────────── */
        if (user && discountData.pointsToRedeem > 0) {
            user.loyaltyPoints = Math.max(0, user.loyaltyPoints - discountData.pointsToRedeem)

            /* Log the redemption in pointsHistory */
            user.pointsHistory.push({
                date: new Date(),
                pointsEarned: -discountData.pointsToRedeem,
                reason: `Points redeemed at checkout`,
                orderId: null  // we'll update after order is saved
            })
            await user.save()
        }

        /* ── 4. Build and save the order ────────────────────────── */
        // Remap items: frontend sends { menuItem, name, quantity, price }
        // but our schema uses menuItemId (String) to avoid ObjectId cast errors
        const sanitizedItems = (items || []).map(it => ({
            menuItemId: String(it.menuItem || it.menuItemId || ''),
            name:       it.name,
            quantity:   it.quantity,
            price:      it.price
        }))

        const order = new Order({
            customerName, customerEmail, customerPhone, deliveryAddress,
            items:                sanitizedItems,
            totalAmount:          discountData.finalTotal,  // store final charged amount
            originalTotal:        discountData.originalTotal,
            tierDiscount:         discountData.tierDiscountPct,
            tierDiscountAmount:   discountData.tierDiscountAmt,
            pointsRedeemed:       discountData.pointsToRedeem,
            pointsDiscountAmount: discountData.pointsDiscountAmt,
            finalTotal:           discountData.finalTotal,
            userId:               user ? user._id : null,
            razorpayPaymentId:    razorpayPaymentId || null,
            status: status || 'pending'
        })

        const savedOrder = await order.save()

        /* Update the redemption history entry with the real orderId */
        if (user && discountData.pointsToRedeem > 0) {
            const lastEntry = user.pointsHistory[user.pointsHistory.length - 1]
            if (lastEntry) lastEntry.orderId = savedOrder._id
            user.markModified('pointsHistory')
            await user.save()
        }

        /* ── 5. Award new loyalty points based on finalTotal ────── */
        let pointsResult = { totalPointsEarned: 0, breakdown: [], newBalance: user?.loyaltyPoints ?? 0, newTier: user?.tier ?? 'Bronze' }
        if (user) {
            pointsResult = await calculateAndAwardPoints(user._id, discountData.finalTotal, savedOrder._id)
        }

        /* Stamp earned points on the order doc for receipt display */
        savedOrder.pointsEarned = pointsResult.totalPointsEarned
        await savedOrder.save()

        res.status(201).json({
            order: savedOrder,
            loyalty: {
                pointsEarned: pointsResult.totalPointsEarned,
                breakdown:    pointsResult.breakdown,
                newBalance:   pointsResult.newBalance,
                newTier:      pointsResult.newTier,
                discountsApplied: {
                    tierDiscount:     discountData.tierDiscountPct,
                    tierDiscountAmt:  discountData.tierDiscountAmt,
                    pointsRedeemed:   discountData.pointsToRedeem,
                    pointsDiscountAmt:discountData.pointsDiscountAmt,
                    finalTotal:       discountData.finalTotal
                },
                userId: user?._id ?? null
            }
        })
    } catch (error) {
        res.status(400).json({ message: 'Error creating order', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────────────────
   PATCH /api/orders/:id/status
──────────────────────────────────────────────────────────────────────────── */
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        )
        if (!updatedOrder) return res.status(404).json({ message: 'Order not found' })
        res.json(updatedOrder)
    } catch (error) {
        res.status(400).json({ message: 'Error updating order status', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────────────────
   DELETE /api/orders/:id
──────────────────────────────────────────────────────────────────────────── */
router.delete('/:id', async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id)
        if (!deletedOrder) return res.status(404).json({ message: 'Order not found' })
        res.json({ message: 'Order deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting order', error: error.message })
    }
})

export default router
