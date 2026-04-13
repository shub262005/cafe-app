import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaCoffee, FaBars, FaTimes } from 'react-icons/fa'
import { useUser } from '../context/UserContext'
import './Navbar.css'

function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logoutUser } = useUser()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [location])

    const handleLogout = () => {
        logoutUser()
        navigate('/')
    }

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/menu', label: 'Menu' },
        { path: '/orders', label: 'Orders' },
        { path: '/contact', label: 'Contact' }
    ]

    const isAdminPage = location.pathname.startsWith('/admin')

    if (user) {
        if (!user.isAdmin) {
            navLinks.push({ path: '/profile', label: '👤 Profile' })
        }
        if (user.isAdmin) {
            navLinks.push({ path: '/admin/menu', label: '⚙️ Admin' })
        }
    } else {
        navLinks.push({ path: '/login', label: '🔑 Login' })
    }

    return (
        <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
            <div className="container navbar-container">
                <Link to="/" className="navbar-logo">
                    <FaCoffee className="logo-icon" />
                    <span className="logo-text">Café Delight</span>
                </Link>

                <ul className={`navbar-menu ${isMobileMenuOpen ? 'navbar-menu-open' : ''}`}>
                    {navLinks.map((link) => (
                        <li key={link.label} className="navbar-item">
                            {link.action ? (
                                <button
                                    onClick={link.action}
                                    className="navbar-link"
                                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', outline: 'none' }}
                                >
                                    {link.label}
                                </button>
                            ) : (
                                <Link
                                    to={link.path}
                                    className={`navbar-link ${location.pathname === link.path ? 'navbar-link-active' : ''}`}
                                >
                                    {link.label}
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>

                <button
                    className="navbar-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>
        </nav>
    )
}

export default Navbar
