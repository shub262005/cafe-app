import { Link } from 'react-router-dom'
import { FaCoffee, FaUtensils, FaShoppingCart, FaStar } from 'react-icons/fa'
import './Home.css'

function Home() {
    const features = [
        {
            icon: <FaCoffee />,
            title: 'Premium Coffee',
            description: 'Expertly crafted beverages using the finest beans from around the world'
        },
        {
            icon: <FaUtensils />,
            title: 'Delicious Food',
            description: 'Fresh pastries, sandwiches, and meals prepared daily by our chefs'
        },
        {
            icon: <FaShoppingCart />,
            title: 'Easy Ordering',
            description: 'Quick and convenient online ordering with real-time tracking'
        },
        {
            icon: <FaStar />,
            title: 'Quality Service',
            description: 'Exceptional customer experience with every visit and order'
        }
    ]

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="container hero-container">
                    <div className="hero-content animate-slideInLeft">
                        <h1 className="hero-title">
                            Experience the Art of
                            <span className="hero-highlight"> Coffee</span>
                        </h1>
                        <p className="hero-description">
                            Discover our handcrafted beverages and artisanal treats, made with passion and served with care.
                            Your perfect café experience awaits.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/menu" className="btn btn-primary btn-large">
                                Explore Menu
                            </Link>
                            <Link to="/orders" className="btn btn-secondary btn-large">
                                Order Now
                            </Link>
                        </div>
                    </div>
                    <div className="hero-image animate-slideInRight">
                        <div className="hero-image-wrapper">
                            <img
                                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop"
                                alt="Fresh coffee and pastries"
                                className="hero-cafe-image animate-float"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features section">
                <div className="container">
                    <h2 className="section-title">Why Choose Us</h2>
                    <div className="grid grid-4">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card glass-card animate-fadeIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="feature-icon">{feature.icon}</div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta section">
                <div className="container">
                    <div className="cta-card glass">
                        <h2 className="cta-title">Ready to Order?</h2>
                        <p className="cta-description">
                            Browse our full menu and place your order today. Fresh, delicious, and delivered with care.
                        </p>
                        <Link to="/menu" className="btn btn-primary btn-large">
                            View Full Menu
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home
