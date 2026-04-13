import mongoose from 'mongoose'

const menuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Menu item name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Coffee', 'Tea', 'Snacks', 'Pastries', 'Sandwiches', 'Desserts', 'Other']
    },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'
    },
    available: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

const Menu = mongoose.model('Menu', menuSchema)

export default Menu
