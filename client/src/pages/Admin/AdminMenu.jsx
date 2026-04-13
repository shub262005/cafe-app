import { useState, useEffect } from 'react'
import axios from 'axios'
import './Admin.css'

export default function AdminMenu() {
    const [menuItems, setMenuItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [editingItem, setEditingItem] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', category: 'Coffee', image: '', available: true
    })

    const categories = ['Coffee', 'Tea', 'Snacks', 'Pastries', 'Sandwiches', 'Desserts', 'Other']

    useEffect(() => {
        fetchMenuItems()
    }, [])

    const fetchMenuItems = async () => {
        try {
            const res = await axios.get('/api/menu')
            setMenuItems(res.data)
            setError(null)
        } catch (err) {
            setError(err.response?.data?.message || err.message)
        } finally {
            setLoading(false)
        }
    }

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item)
            setFormData({
                name: item.name,
                description: item.description,
                price: item.price,
                category: item.category,
                image: item.image,
                available: item.available
            })
        } else {
            setEditingItem(null)
            setFormData({ name: '', description: '', price: '', category: 'Coffee', image: '', available: true })
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setEditingItem(null)
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingItem) {
                await axios.put(`/api/menu/${editingItem._id}`, formData)
            } else {
                await axios.post('/api/menu', formData)
            }
            closeModal()
            fetchMenuItems()
        } catch (err) {
            alert('Error saving menu item: ' + (err.response?.data?.message || err.message))
        }
    }

    const confirmDelete = async () => {
        if (!itemToDelete) return
        try {
            await axios.delete(`/api/menu/${itemToDelete}`)
            fetchMenuItems()
        } catch (err) {
            alert('Error deleting menu item: ' + (err.response?.data?.message || err.message))
        } finally {
            setItemToDelete(null)
        }
    }

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>
    if (error) return <div className="card"><p style={{color: 'red'}}>Error: {error}</p></div>

    return (
        <div className="admin-page animate-fadeIn">
            <div className="admin-page-header">
                <h2>Menu Management</h2>
                <button className="btn btn-primary" onClick={() => openModal()}>+ Add Item</button>
            </div>

            <div className="admin-table-container glass-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price (₹)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menuItems.map(item => (
                            <tr key={item._id}>
                                <td>
                                    <img src={item.image} alt={item.name} className="admin-img-thumb" />
                                </td>
                                <td>
                                    <strong>{item.name}</strong>
                                    <div className="text-small">{item.description.substring(0, 40)}...</div>
                                </td>
                                <td>{item.category}</td>
                                <td>₹{item.price}</td>
                                <td>
                                    <span className={`status-badge ${item.available ? 'success' : 'danger'}`}>
                                        {item.available ? 'Available' : 'Unavailable'}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn-icon btn-edit" onClick={() => openModal(item)}>✏️</button>
                                    <button className="btn-icon btn-delete" onClick={() => setItemToDelete(item._id)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                        {menuItems.length === 0 && (
                            <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No menu items found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-scaleIn">
                        <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input type="text" name="name" className="form-input" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea name="description" className="form-textarea" value={formData.description} onChange={handleInputChange} required rows="3" />
                            </div>
                            <div className="grid-2">
                                <div className="form-group">
                                    <label className="form-label">Price (₹)</label>
                                    <input type="number" name="price" className="form-input" value={formData.price} onChange={handleInputChange} required min="0" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select name="category" className="form-select" value={formData.category} onChange={handleInputChange}>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Image URL</label>
                                <input type="url" name="image" className="form-input" value={formData.image} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" name="available" checked={formData.available} onChange={handleInputChange} />
                                    <span>Available for order</span>
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingItem ? 'Save Changes' : 'Add Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {itemToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-scaleIn" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--color-accent)' }}>Confirm Deletion</h3>
                        <p style={{ margin: '1rem 0' }}>Are you sure you want to permanently delete this menu item?</p>
                        <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
                            <button className="btn btn-secondary" onClick={() => setItemToDelete(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }} onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
