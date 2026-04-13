import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import menuRoutes from './routes/menuRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import userRoutes from './routes/userRoutes.js'
import authRoutes from './routes/authRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/payment', paymentRoutes)

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Cafe Management API Server' })
})

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('✓ MongoDB connected successfully')
        await initAdmin()
    } catch (error) {
        console.error('✗ MongoDB connection error:', error.message)
        process.exit(1)
    }
}

import User from './models/User.js'

const initAdmin = async () => {
    const admins = [
        {
            name: 'Omkar Potdar',
            email: process.env.ADMIN1_EMAIL || 'ompotdar7498@gmail.com',
            password: process.env.ADMIN1_PASS || 'adminpass1'
        },
        {
            name: 'Shubham Jain',
            email: process.env.ADMIN2_EMAIL || 'shubhamjain26tt@gmail.com',
            password: process.env.ADMIN2_PASS || 'adminpass2'
        }
    ]

    for (const admin of admins) {
        const exists = await User.findOne({ email: admin.email })
        if (!exists) {
            const newAdmin = new User({ ...admin, isAdmin: true })
            await newAdmin.save()
            console.log(`✓ Admin created: ${admin.email}`)
        } else if (!exists.isAdmin) {
            // If user already exists but isn't marked as admin, promote them
            exists.isAdmin = true
            await exists.save()
            console.log(`✓ Promoted to admin: ${admin.email}`)
        } else {
            console.log(`✓ Admin already exists: ${admin.email}`)
        }
    }
}

// Start server
const startServer = async () => {
    await connectDB()
    app.listen(PORT, () => {
        console.log(`✓ Server running on port ${PORT}`)
        console.log(`✓ Environment: ${process.env.NODE_ENV}`)
    })
}

startServer()

export default app
