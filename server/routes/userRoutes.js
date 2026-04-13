import express from 'express'
import User from '../models/User.js'
import Order from '../models/Order.js'
import { getNextTierInfo } from '../utils/loyaltyHelper.js'

const router = express.Router()

/* ─────────────────────────────────────────────────────────────
   POST /api/users
   Create / register a new user. Returns 409 if email exists.
──────────────────────────────────────────────────────────────── */
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, address, profilePicture } = req.body

        /* Check for duplicate email */
        const existing = await User.findOne({ email: email?.toLowerCase() })
        if (existing) {
            return res.status(409).json({ message: 'Email already registered', user: existing })
        }

        const user = new User({ name, email, phone, address, profilePicture })
        const saved = await user.save()
        res.status(201).json(saved)
    } catch (error) {
        res.status(400).json({ message: 'Error creating user', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────
   GET /api/users
   Fetch all users for the admin dashboard.
──────────────────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-pointsHistory -password').sort({ createdAt: -1 })
        res.json(users)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────
   GET /api/users/:id
   Fetch full user profile including tier progress info.
──────────────────────────────────────────────────────────────── */
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-pointsHistory')
        if (!user) return res.status(404).json({ message: 'User not found' })

        /* Attach next-tier progress for the frontend loyalty card */
        const tierInfo = getNextTierInfo(user.totalPointsEarned)
        res.json({ ...user.toObject(), tierInfo })
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────
   PUT /api/users/:id
   Update editable profile fields (name, phone, address, profilePicture).
──────────────────────────────────────────────────────────────── */
router.put('/:id', async (req, res) => {
    try {
        const { name, phone, address, profilePicture } = req.body
        const update = {}
        if (name !== undefined)           update.name           = name
        if (phone !== undefined)          update.phone          = phone
        if (address !== undefined)        update.address        = address
        if (profilePicture !== undefined) update.profilePicture = profilePicture

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true, runValidators: true }
        ).select('-pointsHistory')

        if (!updated) return res.status(404).json({ message: 'User not found' })
        res.json(updated)
    } catch (error) {
        res.status(400).json({ message: 'Error updating user', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────
   GET /api/users/:id/order-history
   Returns all orders linked to this user, newest first.
──────────────────────────────────────────────────────────────── */
router.get('/:id/order-history', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.id }).sort({ orderDate: -1 })
        res.json(orders)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order history', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────
   GET /api/users/:id/points-history
   Returns the chronological log of loyalty point transactions.
──────────────────────────────────────────────────────────────── */
router.get('/:id/points-history', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('pointsHistory loyaltyPoints tier totalPointsEarned')
        if (!user) return res.status(404).json({ message: 'User not found' })

        /* Sort descending (newest first) and return */
        const history = [...user.pointsHistory].sort((a, b) => new Date(b.date) - new Date(a.date))
        res.json({ history, currentBalance: user.loyaltyPoints, tier: user.tier, totalPointsEarned: user.totalPointsEarned })
    } catch (error) {
        res.status(500).json({ message: 'Error fetching points history', error: error.message })
    }
})

export default router
