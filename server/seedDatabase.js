import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Menu from './models/Menu.js'
import Order from './models/Order.js'

dotenv.config()

// Sample menu data
// Sample menu data - Indian Cafe Style
const menuItems = [
    // Coffee
    {
        name: 'Filter Coffee',
        description: 'Traditional South Indian filter coffee with frothy milk',
        price: 40,
        category: 'Coffee',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
        available: true
    },
    {
        name: 'Cold Coffee',
        description: 'Chilled coffee blended with milk and ice cream',
        price: 90,
        category: 'Coffee',
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400',
        available: true
    },
    {
        name: 'Cappuccino',
        description: 'Espresso coffee topped with milk foam',
        price: 120,
        category: 'Coffee',
        image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
        available: true
    },
    {
        name: 'Cafe Latte',
        description: 'Smooth espresso with steamed milk',
        price: 130,
        category: 'Coffee',
        image: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400',
        available: true
    },

    // Tea
    {
        name: 'Masala Chai',
        description: 'Indian spiced tea made with milk and aromatic spices',
        price: 20,
        category: 'Tea',
        image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',
        available: true
    },
    {
        name: 'Ginger Tea',
        description: 'Hot tea brewed with fresh ginger',
        price: 25,
        category: 'Tea',
        image: 'https://images.unsplash.com/photo-1597318130878-aa1caa81e0a0?w=400',
        available: true
    },
    {
        name: 'Green Tea',
        description: 'Healthy green tea rich in antioxidants',
        price: 30,
        category: 'Tea',
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
        available: true
    },

    // Snacks
    {
        name: 'Veg Sandwich',
        description: 'Grilled sandwich with fresh vegetables and cheese',
        price: 80,
        category: 'Snacks',
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400',
        available: true
    },
    {
        name: 'Cheese Toast',
        description: 'Crispy toasted bread topped with melted cheese',
        price: 70,
        category: 'Snacks',
        image: 'https://images.unsplash.com/photo-1604908177522-429e7f3b7c7e?w=400',
        available: true
    },
    {
        name: 'Veg Puff',
        description: 'Flaky pastry filled with spicy vegetable stuffing',
        price: 35,
        category: 'Snacks',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
        available: true
    },
    {
        name: 'Samosa',
        description: 'Crispy samosa stuffed with spicy potato filling',
        price: 20,
        category: 'Snacks',
        image: 'https://images.unsplash.com/photo-1601050690117-64b6d9f2f8f7?w=400',
        available: true
    },

    // Desserts
    {
        name: 'Chocolate Brownie',
        description: 'Soft chocolate brownie served warm',
        price: 90,
        category: 'Desserts',
        image: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=400',
        available: true
    },
    {
        name: 'Chocolate Pastry',
        description: 'Moist chocolate pastry with creamy frosting',
        price: 80,
        category: 'Desserts',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
        available: true
    },
    {
        name: 'Ice Cream Sundae',
        description: 'Vanilla ice cream topped with chocolate syrup and nuts',
        price: 100,
        category: 'Desserts',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
        available: true
    }
]
// Function to generate random orders
const generateOrders = (menuItemsIds, count = 15) => {
    const orders = []
    const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']
    const customers = [
        { name: 'Rahul Sharma', email: 'rahul@gmail.com', phone: '9876543210', address: 'Pune, Maharashtra' },
        { name: 'Priya Patil', email: 'priya@gmail.com', phone: '9876543211', address: 'Mumbai, Maharashtra' },
        { name: 'Amit Kulkarni', email: 'amit@gmail.com', phone: '9876543212', address: 'Nagpur, Maharashtra' },
        { name: 'Sneha Deshmukh', email: 'sneha@gmail.com', phone: '9876543213', address: 'Nashik, Maharashtra' },
    ]

    for (let i = 0; i < count; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)]
        const itemCount = Math.floor(Math.random() * 4) + 1 // 1-4 items per order
        const orderItems = []
        let totalAmount = 0

        for (let j = 0; j < itemCount; j++) {
            const randomMenuItem = menuItemsIds[Math.floor(Math.random() * menuItemsIds.length)]
            const quantity = Math.floor(Math.random() * 3) + 1 // 1-3 quantity

            orderItems.push({
                menuItem: randomMenuItem._id,
                name: randomMenuItem.name,
                quantity: quantity,
                price: randomMenuItem.price
            })

            totalAmount += randomMenuItem.price * quantity
        }

        // Random date within last 30 days
        const orderDate = new Date()
        orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30))

        orders.push({
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            deliveryAddress: customer.address,
            items: orderItems,
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            orderDate: orderDate
        })
    }

    return orders
}

// Main seeding function
const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI)
        console.log('✓ Connected to MongoDB')

        // Clear existing data
        await Menu.deleteMany({})
        await Order.deleteMany({})
        console.log('✓ Cleared existing data')

        // Insert menu items
        const insertedMenuItems = await Menu.insertMany(menuItems)
        console.log(`✓ Inserted ${insertedMenuItems.length} menu items`)

        // Generate and insert orders
        const orders = generateOrders(insertedMenuItems, 15)
        const insertedOrders = await Order.insertMany(orders)
        console.log(`✓ Inserted ${insertedOrders.length} orders`)

        console.log('\n🎉 Database seeded successfully!')
        console.log(`\nSummary:`)
        console.log(`- Menu Items: ${insertedMenuItems.length}`)
        console.log(`- Orders: ${insertedOrders.length}`)
        console.log(`\nCategories:`)
        console.log(`- Coffee: ${insertedMenuItems.filter(i => i.category === 'Coffee').length}`)
        console.log(`- Tea: ${insertedMenuItems.filter(i => i.category === 'Tea').length}`)
        console.log(`- Pastries: ${insertedMenuItems.filter(i => i.category === 'Pastries').length}`)
        console.log(`- Sandwiches: ${insertedMenuItems.filter(i => i.category === 'Sandwiches').length}`)
        console.log(`- Desserts: ${insertedMenuItems.filter(i => i.category === 'Desserts').length}`)

        process.exit(0)
    } catch (error) {
        console.error('✗ Error seeding database:', error)
        process.exit(1)
    }
}

// Run the seeder
seedDatabase()
