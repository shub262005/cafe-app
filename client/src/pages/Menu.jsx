import { useState, useEffect } from 'react'
import axios from 'axios'
import { FaSearch, FaFilter } from 'react-icons/fa'
import './Menu.css'

function Menu() {
    const [menuItems, setMenuItems] = useState([])
    const [loading, setLoading]     = useState(true)
    const [error, setError]         = useState('')
    const [searchTerm, setSearchTerm]             = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')

    useEffect(() => {
        fetchMenuItems()
    }, [])

    const fetchMenuItems = async () => {
        try {
            setLoading(true)
            setError('')
            const { data } = await axios.get('/api/menu')
            setMenuItems(data)
        } catch (err) {
            console.error('Error fetching menu:', err)
            setError('Failed to load menu. Please check your connection and try again.')
        } finally {
            setLoading(false)
        }
    }

    /* Derive category list dynamically from what's actually in the DB */
    const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category))).sort()]

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="menu-page">
            <div className="menu-header">
                <div className="container">
                    <h1 className="menu-title animate-fadeIn">Our Menu</h1>
                    <p className="menu-subtitle animate-fadeIn">Discover our delicious selection of beverages and treats</p>
                </div>
            </div>

            <div className="menu-content section">
                <div className="container">
                    {/* Filters */}
                    <div className="menu-filters">
                        <div className="search-box">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search menu items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <div className="category-filters">
                            <FaFilter className="filter-icon" />
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`category-btn ${selectedCategory === category ? 'category-btn-active' : ''}`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error state */}
                    {error && (
                        <div className="menu-fetch-error">
                            <p>⚠️ {error}</p>
                            <button className="btn btn-secondary" onClick={fetchMenuItems}>Retry</button>
                        </div>
                    )}

                    {/* Menu Items grid */}
                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                        </div>
                    ) : !error && (
                        <div className="menu-grid grid grid-3">
                            {filteredItems.map((item, index) => (
                                <div key={item._id} className="menu-item card animate-scaleIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <img src={item.image} alt={item.name} className="menu-item-image" />
                                    <div className="menu-item-content">
                                        <div className="menu-item-header">
                                            <h3 className="menu-item-name">{item.name}</h3>
                                            <span className="menu-item-price">₹{item.price.toFixed(2)}</span>
                                        </div>
                                        <p className="menu-item-description">{item.description}</p>
                                        <span className="menu-item-category">{item.category}</span>
                                        {!item.available && <span className="menu-item-unavailable">Out of Stock</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && !error && filteredItems.length === 0 && (
                        <div className="no-results">
                            <p>No items found matching your criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Menu
