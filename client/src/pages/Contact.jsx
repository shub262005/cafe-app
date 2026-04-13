import { useState } from 'react'
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa'
import './Contact.css'

function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })
    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        console.log('Contact form submitted:', formData)
        setSubmitted(true)
        setFormData({ name: '', email: '', subject: '', message: '' })
        setTimeout(() => setSubmitted(false), 5000)
    }

    const contactInfo = [
        {
            icon: <FaMapMarkerAlt />,
            title: 'Address',
            content: '123 Coffee Street, Café District, City 12345'
        },
        {
            icon: <FaPhone />,
            title: 'Phone',
            content: '+1 (555) 123-4567'
        },
        {
            icon: <FaEnvelope />,
            title: 'Email',
            content: 'hello@cafedelight.com'
        },
        {
            icon: <FaClock />,
            title: 'Hours',
            content: 'Mon-Fri: 7AM-9PM, Sat-Sun: 8AM-10PM'
        }
    ]

    return (
        <div className="contact-page">
            <div className="contact-header">
                <div className="container">
                    <h1 className="contact-title animate-fadeIn">Get In Touch</h1>
                    <p className="contact-subtitle animate-fadeIn">We'd love to hear from you</p>
                </div>
            </div>

            <div className="contact-content section">
                <div className="container">
                    <div className="contact-layout">
                        {/* Contact Information */}
                        <div className="contact-info">
                            <h2 className="info-title">Contact Information</h2>
                            <p className="info-description">
                                Have a question or feedback? Reach out to us through any of the following channels.
                            </p>

                            <div className="info-cards">
                                {contactInfo.map((info, index) => (
                                    <div key={index} className="info-card glass-card animate-scaleIn" style={{ animationDelay: `${index * 0.1}s` }}>
                                        <div className="info-icon">{info.icon}</div>
                                        <div className="info-content">
                                            <h3 className="info-card-title">{info.title}</h3>
                                            <p className="info-card-text">{info.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="social-links">
                                <h3 className="social-title">Follow Us</h3>
                                <div className="social-icons">
                                    <a href="#" className="social-icon" aria-label="Facebook">
                                        <FaFacebook />
                                    </a>
                                    <a href="#" className="social-icon" aria-label="Twitter">
                                        <FaTwitter />
                                    </a>
                                    <a href="#" className="social-icon" aria-label="Instagram">
                                        <FaInstagram />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="contact-form-container">
                            <div className="contact-form-wrapper glass">
                                <h2 className="form-title">Send Us a Message</h2>

                                {submitted && (
                                    <div className="form-success">
                                        ✓ Thank you! Your message has been sent successfully.
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="contact-form">
                                    <div className="form-group">
                                        <label className="form-label">Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Subject *</label>
                                        <input
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Message *</label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            className="form-textarea"
                                            rows="6"
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-large submit-btn">
                                        Send Message
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Contact
