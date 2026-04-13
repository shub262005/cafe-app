import { useState, useEffect } from 'react'
import axios from 'axios'
import './Admin.css'

export default function AdminUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    // Modal state for user history
    const [selectedUser, setSelectedUser] = useState(null)
    const [userHistory, setUserHistory] = useState([])
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users')
            setUsers(res.data)
            setError(null)
        } catch (err) {
            setError(err.response?.data?.message || err.message)
        } finally {
            setLoading(false)
        }
    }

    const openHistoryModal = async (user) => {
        setSelectedUser(user)
        setIsModalOpen(true)
        setLoadingHistory(true)
        try {
            const res = await axios.get(`/api/users/${user._id}/order-history`)
            setUserHistory(res.data)
        } catch (err) {
            alert('Error fetching user history: ' + (err.response?.data?.message || err.message))
        } finally {
            setLoadingHistory(false)
        }
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedUser(null)
        setUserHistory([])
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>
    if (error) return <div className="card"><p style={{color: 'red'}}>Error: {error}</p></div>

    return (
        <div className="admin-page animate-fadeIn">
            <div className="admin-page-header">
                <h2>User Management</h2>
            </div>

            <div className="admin-table-container glass-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Tier</th>
                            <th>Total Spent (₹)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td><div className="text-small" style={{fontFamily: 'monospace'}}>{user._id}</div></td>
                                <td>
                                    <strong>{user.name}</strong>
                                    {user.isAdmin && <span className="status-badge info" style={{marginLeft: '0.5rem'}}>Admin</span>}
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`status-badge ${user.tier === 'Platinum' ? 'danger' : user.tier === 'Gold' ? 'warning' : 'info'}`}>
                                        {user.tier}
                                    </span>
                                </td>
                                <td>₹{user.totalSpent}</td>
                                <td>
                                    <button className="btn btn-secondary" style={{padding: '0.25rem 0.75rem', fontSize: '0.875rem'}} onClick={() => openHistoryModal(user)}>
                                        View History
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* History Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-scaleIn" style={{maxWidth: '800px'}}>
                        <h3>Order History for {selectedUser?.name}</h3>
                        
                        {loadingHistory ? (
                            <div className="loading-container" style={{minHeight: '100px'}}><div className="spinner"></div></div>
                        ) : (
                            <div className="admin-table-container" style={{marginTop: 'var(--spacing-md)'}}>
                                {userHistory.length > 0 ? (
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Items</th>
                                                <th>Total (₹)</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userHistory.map(order => (
                                                <tr key={order._id}>
                                                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                                                    <td>
                                                        <ul style={{margin: 0, paddingLeft: '1rem', fontSize: '0.875rem'}}>
                                                            {order.items.map((item, idx) => (
                                                                <li key={idx}>{item.quantity}x {item.name}</li>
                                                            ))}
                                                        </ul>
                                                    </td>
                                                    <td>₹{order.finalTotal}</td>
                                                    <td>
                                                        <span className="status-badge info">{order.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{textAlign: 'center', padding: '2rem'}}>This user hasn't placed any orders yet.</p>
                                )}
                            </div>
                        )}
                        
                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={closeModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
