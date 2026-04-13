import { useState, useEffect } from 'react'
import axios from 'axios'
import './Admin.css'

export default function AdminOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filterStatus, setFilterStatus] = useState('all')

    const statuses = ['pending', 'confirmed', 'cancelled']
    const filterTabs = ['all', 'pending', 'confirmed', 'cancelled']

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const res = await axios.get('/api/orders')
            setOrders(res.data)
            setError(null)
        } catch (err) {
            setError(err.response?.data?.message || err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await axios.patch(`/api/orders/${orderId}/status`, { status: newStatus })
            // Update local state to reflect change without full refetch
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o))
        } catch (err) {
            alert('Error updating status: ' + (err.response?.data?.message || err.message))
        }
    }

    const getStatusBadgeClass = (status) => {
        switch(status) {
            case 'confirmed': return 'success'
            case 'cancelled': return 'danger'
            case 'pending': return 'warning'
            default: return 'info'
        }
    }

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.status === filterStatus)

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>
    if (error) return <div className="card"><p style={{color: 'red'}}>Error: {error}</p></div>

    return (
        <div className="admin-page animate-fadeIn">
            <div className="admin-page-header">
                <h2>Order Management</h2>
                <span className="orders-count">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Filter Tabs */}
            <div className="order-filter-tabs">
                {filterTabs.map(tab => (
                    <button
                        key={tab}
                        className={`filter-tab ${filterStatus === tab ? 'active' : ''} filter-tab-${tab}`}
                        onClick={() => setFilterStatus(tab)}
                    >
                        {tab === 'all' ? 'All Orders' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        <span className="filter-tab-count">
                            {tab === 'all' ? orders.length : orders.filter(o => o.status === tab).length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="admin-table-container glass-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total (₹)</th>
                            <th>Payment</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map(order => (
                            <tr key={order._id}>
                                <td>
                                    <div className="text-small" style={{fontFamily: 'monospace'}}>{order._id}</div>
                                </td>
                                <td>{new Date(order.orderDate).toLocaleString()}</td>
                                <td>
                                    <strong>{order.customerName}</strong>
                                    <div className="text-small">{order.customerEmail}</div>
                                </td>
                                <td>
                                    <ul style={{listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem'}}>
                                        {order.items.map((item, idx) => (
                                            <li key={idx}>{item.quantity}x {item.name}</li>
                                        ))}
                                    </ul>
                                </td>
                                <td>₹{order.finalTotal}</td>
                                <td>
                                    {order.razorpayPaymentId ? (
                                        <div className="text-small" style={{color: '#f97316', fontWeight: 'bold', fontSize: '0.75rem'}}>
                                            Paid: {order.razorpayPaymentId}
                                        </div>
                                    ) : (
                                        <div className="text-small" style={{color: 'gray', fontSize: '0.75rem'}}>COD / Pending</div>
                                    )}
                                </td>
                                <td>
                                    <select 
                                        className={`form-select status-badge ${getStatusBadgeClass(order.status)}`}
                                        style={{width: 'auto', padding: '0.25rem 1.5rem 0.25rem 0.5rem', appearance: 'auto'}}
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                    >
                                        {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>
                                {filterStatus === 'all' ? 'No orders found.' : `No ${filterStatus} orders.`}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
