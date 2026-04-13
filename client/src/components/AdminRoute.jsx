import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export default function AdminRoute() {
    const { user, loading } = useUser()
    const location = useLocation()

    if (loading) {
        return (
            <div className="loading-container" style={{ minHeight: '60vh' }}>
                <div className="spinner"></div>
            </div>
        )
    }

    if (!user) {
        // Not logged in -> redirect to login, preserving the intended URL
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (!user.isAdmin) {
        // Logged in but not admin -> show unauthorized message
        return (
            <div className="container section text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card animate-scaleIn" style={{ maxWidth: '500px', width: '100%', padding: '3rem' }}>
                    <h2 style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}>Access Denied</h2>
                    <p style={{ marginBottom: '2rem' }}>You do not have administrative privileges to view this page.</p>
                    <a href="/" className="btn btn-primary">Return to Home</a>
                </div>
            </div>
        )
    }

    // Is logged in & is Admin -> render children
    return <Outlet />
}
