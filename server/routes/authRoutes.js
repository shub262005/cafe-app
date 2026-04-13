import express from 'express'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import User from '../models/User.js'
import { getNextTierInfo } from '../utils/loyaltyHelper.js'
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router()

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const otpCache = new Map();       // signup OTPs
const adminOtpCache = new Map();  // admin login OTPs
const JWT_SECRET = process.env.JWT_SECRET || 'cafe_mgmt_jwt_secret_2024'
const JWT_EXPIRES_IN = '30d'

/** Strip password from the user object before sending */
const safeUser = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user }
    delete obj.password
    return obj
}

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/register
   Create a new user with a password. Returns user + JWT token.
──────────────────────────────────────────────────────────────── */
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, address, password, otp } = req.body

        if (!name?.trim() || !email?.trim() || !password || !otp) {
            return res.status(400).json({ message: 'Name, email, password, and OTP are required' })
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' })
        }

        const cached = otpCache.get(email.toLowerCase());
        if (!cached || cached.otp !== otp || cached.expiresAt < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' })
        }

        const existing = await User.findOne({ email: email.toLowerCase() })
        if (existing) {
            return res.status(409).json({ message: 'Email already registered. Please log in.' })
        }

        const user = new User({ name, email, phone, address, password })
        const saved = await user.save()

        otpCache.delete(email.toLowerCase()) // clear cache

        const tierInfo = getNextTierInfo(saved.totalPointsEarned)
        const token = jwt.sign({ userId: saved._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

        res.status(201).json({ user: { ...safeUser(saved), tierInfo }, token })
    } catch (error) {
        res.status(400).json({ message: 'Error registering user', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/send-otp
   Sends a 6-digit OTP to the user's email.
──────────────────────────────────────────────────────────────── */
router.post('/send-otp', async (req, res) => {
    try {
        console.log("STEP 1: Request received (send-otp)")
        const { email } = req.body
        console.log("STEP 2: Email =", email)
        if (!email) return res.status(400).json({ message: 'Email required' })

        const existing = await User.findOne({ email: email.toLowerCase() })
        if (existing) {
            return res.status(409).json({ message: 'Email already registered. Please log in.' })
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        otpCache.set(email.toLowerCase(), { otp, expiresAt: Date.now() + 10 * 60 * 1000 })

        console.log("STEP 3: Sending mail...")
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your Café Delight Signup OTP",
            text: `Your OTP for signup is: ${otp}\n\nThis OTP is valid for 10 minutes.`
        })
        console.log("STEP 4: Mail sent")

        res.json({ message: 'OTP sent successfully' })
    } catch (error) {
        console.error("Failed to send OTP:", error)
        res.status(500).json({ message: 'Failed to send OTP', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/login
   Authenticate with email + password. Returns user + JWT token.
──────────────────────────────────────────────────────────────── */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email?.trim() || !password) {
            return res.status(400).json({ message: 'Email and password are required' })
        }

        const user = await User.findOne({ email: email.toLowerCase() })
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        // Legacy users (no password) — prompt them to set one via register
        if (!user.password) {
            return res.status(401).json({
                message: 'This account was created without a password. Please sign up again to set one.',
                legacy: true
            })
        }

        const valid = await user.comparePassword(password)
        if (!valid) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        const tierInfo = getNextTierInfo(user.totalPointsEarned)
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

        res.json({ user: { ...safeUser(user), tierInfo }, token })
    } catch (error) {
        res.status(500).json({ message: 'Login error', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/admin-send-otp
   Step 1 of admin login: verify credentials, then email OTP.
──────────────────────────────────────────────────────────────── */
router.post('/admin-send-otp', async (req, res) => {
    try {
        console.log("STEP 1: Request received (admin-send-otp)")
        const { email, password } = req.body
        console.log("STEP 2: Email =", email)
        if (!email?.trim() || !password) {
            return res.status(400).json({ message: 'Email and password are required' })
        }

        const user = await User.findOne({ email: email.toLowerCase() })
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin account not found.' })
        }
        if (!user.password) {
            return res.status(401).json({ message: 'Admin account has no password set.' })
        }

        const valid = await user.comparePassword(password)
        if (!valid) {
            return res.status(401).json({ message: 'Invalid email or password' })
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        adminOtpCache.set(email.toLowerCase(), { otp, expiresAt: Date.now() + 10 * 60 * 1000 })

        console.log("STEP 3: Sending mail...")
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: '🔐 Admin Login OTP — Café Delight',
            text: `Your admin login OTP is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.`
        })
        console.log("STEP 4: Mail sent")

        res.json({ message: 'OTP sent to admin email' })
    } catch (error) {
        console.error("Failed to send admin OTP:", error)
        res.status(500).json({ message: 'Failed to send admin OTP', error: error.message })
    }
})

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/admin-login
   Step 2 of admin login: verify OTP and issue JWT.
──────────────────────────────────────────────────────────────── */
router.post('/admin-login', async (req, res) => {
    try {
        const { email, otp } = req.body
        if (!email?.trim() || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' })
        }

        const cached = adminOtpCache.get(email.toLowerCase())
        if (!cached || cached.otp !== otp || cached.expiresAt < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' })
        }

        const user = await User.findOne({ email: email.toLowerCase() })
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Access denied.' })
        }

        adminOtpCache.delete(email.toLowerCase())

        const tierInfo = getNextTierInfo(user.totalPointsEarned)
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

        res.json({ user: { ...safeUser(user), tierInfo }, token })
    } catch (error) {
        res.status(500).json({ message: 'Admin login error', error: error.message })
    }
})

export default router
