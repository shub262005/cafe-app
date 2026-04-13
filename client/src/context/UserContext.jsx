import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const UserContext = createContext(null)

export function UserProvider({ children }) {
    const [user, setUser]       = useState(null)   // full user profile from DB
    const [userId, setUserId]   = useState(null)   // MongoDB _id
    const [token, setToken]     = useState(null)   // JWT auth token
    const [loading, setLoading] = useState(true)

    /* ── On mount: restore session from localStorage ─────────── */
    useEffect(() => {
        const storedId    = localStorage.getItem('cafeUserId')
        const storedToken = localStorage.getItem('cafeToken')
        if (storedId && storedToken) {
            setToken(storedToken)
            fetchUser(storedId, storedToken)
        } else if (storedId) {
            // Legacy: had id but no token — still try to fetch profile
            fetchUser(storedId, null)
        } else {
            setLoading(false)
        }
    }, [])

    /** Fetch user profile from backend */
    const fetchUser = async (id, authToken) => {
        try {
            const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {}
            const { data } = await axios.get(`/api/users/${id}`, { headers })
            setUser(data)
            setUserId(data._id)
        } catch {
            /* User not found (DB reset, expired) — clear stale storage */
            localStorage.removeItem('cafeUserId')
            localStorage.removeItem('cafeToken')
            setToken(null)
        } finally {
            setLoading(false)
        }
    }

    /** Persist session data after auth */
    const persistSession = (userData, authToken) => {
        localStorage.setItem('cafeUserId', userData._id)
        if (authToken) localStorage.setItem('cafeToken', authToken)
        setUser(userData)
        setUserId(userData._id)
        setToken(authToken || null)
    }

    /**
     * loginUser — authenticate with email + password via /api/auth/login.
     */
    const loginUser = async ({ email, password }) => {
        const { data } = await axios.post('/api/auth/login', { email, password })
        persistSession(data.user, data.token)
        return data.user
    }

    /**
     * registerUser — create account (with password) via /api/auth/register.
     * Falls back to legacy /api/users if no password provided (e.g. from order flow).
     */
    const registerUser = async ({ name, email, phone = '', address = '', password, otp }) => {
        if (password) {
            // Full auth registration
            try {
                const { data } = await axios.post('/api/auth/register', { name, email, phone, address, password, otp })
                persistSession(data.user, data.token)
                return data.user
            } catch (err) {
                throw err
            }
        } else {
            // Legacy guest registration (no password)
            try {
                const { data } = await axios.post('/api/users', { name, email, phone, address })
                persistSession(data, null)
                return data
            } catch (err) {
                if (err.response?.status === 409 && err.response.data?.user) {
                    const existing = err.response.data.user
                    persistSession(existing, null)
                    return existing
                }
                throw err
            }
        }
    }

    /** Refresh the cached user profile (called after order placement) */
    const refreshUser = () => userId && fetchUser(userId, token)

    /** Update profile fields locally after a successful PUT */
    const updateUserLocally = (updates) => setUser(prev => prev ? { ...prev, ...updates } : prev)

    /** Log out — clear all session data */
    const logoutUser = () => {
        localStorage.removeItem('cafeUserId')
        localStorage.removeItem('cafeToken')
        setUser(null)
        setUserId(null)
        setToken(null)
    }

    return (
        <UserContext.Provider value={{ user, userId, token, loading, loginUser, registerUser, refreshUser, updateUserLocally, fetchUser, logoutUser }}>
            {children}
        </UserContext.Provider>
    )
}

/** Hook for consuming user context */
export const useUser = () => useContext(UserContext)
