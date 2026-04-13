import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { FaUtensils, FaClipboardList, FaUsers, FaSignOutAlt, FaShieldAlt } from 'react-icons/fa'
import { useUser } from '../../context/UserContext'
import './AdminLayout.css'

function AdminLayout() {
    const { user, logoutUser } = useUser()
    const navigate = useNavigate()

    const handleLogout = () => {
        logoutUser()
        navigate('/login')
    }

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : 'A'

    return (
        <div className="admin-layout">
            <div className="admin-sidebar glass">

                {/* Admin Profile Card */}
                <div className="admin-profile-card">
                    <div className="admin-avatar">{initials}</div>
                    <div className="admin-profile-info">
                        <p className="admin-profile-name">{user?.name || 'Admin'}</p>
                        <p className="admin-profile-email">{user?.email}</p>
                        <span className="admin-badge"><FaShieldAlt style={{ fontSize: '0.65rem' }} /> Admin</span>
                    </div>
                </div>

                <h3 className="admin-sidebar-title">Dashboard</h3>

                <nav className="admin-nav">
                    <NavLink to="/admin/menu" className={({isActive}) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
                        <FaUtensils /> Menu Management
                    </NavLink>
                    <NavLink to="/admin/orders" className={({isActive}) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
                        <FaClipboardList /> Order Management
                    </NavLink>
                    <NavLink to="/admin/users" className={({isActive}) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
                        <FaUsers /> User Management
                    </NavLink>
                </nav>

                {/* Logout at bottom */}
                <div className="admin-sidebar-footer">
                    <button className="admin-logout-btn" onClick={handleLogout}>
                        <FaSignOutAlt /> Sign Out
                    </button>
                </div>
            </div>

            <div className="admin-content">
                <Outlet />
            </div>
        </div>
    )
}

export default AdminLayout
