import express from 'express'
import Razorpay from 'razorpay'
import crypto from 'crypto'

const router = express.Router()

/* Razorpay instance — reads keys from .env */
const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

/* ─────────────────────────────────────────────────────────────────────────
   POST /api/payment/create-order
   Creates a Razorpay order for the given amount (in paise).
   Body: { amount: number (in rupees), currency?: string, receipt?: string }
   Returns: { orderId, amount, currency, keyId }
──────────────────────────────────────────────────────────────────────────── */
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt = 'receipt_' + Date.now() } = req.body

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Valid amount is required' })
        }

        const options = {
            amount:   Math.round(amount * 100), // convert ₹ → paise
            currency,
            receipt,
        }

        const order = await razorpay.orders.create(options)

        res.json({
            orderId:  order.id,
            amount:   order.amount,
            currency: order.currency,
            keyId:    process.env.RAZORPAY_KEY_ID,
        })
    } catch (error) {
        console.error('Razorpay create-order error:', error)
        res.status(500).json({ message: 'Error creating payment order', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────────────────
   POST /api/payment/verify
   Verifies Razorpay payment signature (HMAC-SHA256) to confirm authenticity.
   Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   Returns: { success: true } or 400
──────────────────────────────────────────────────────────────────────────── */
router.post('/verify', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing payment verification fields' })
        }

        const body      = razorpay_order_id + '|' + razorpay_payment_id
        const expected  = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex')

        if (expected !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment signature is invalid' })
        }

        res.json({ success: true, paymentId: razorpay_payment_id })
    } catch (error) {
        console.error('Razorpay verify error:', error)
        res.status(500).json({ message: 'Error verifying payment', error: error.message })
    }
})

export default router
