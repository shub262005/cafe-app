# Database Seeding Guide

## Overview

The `seedDatabase.js` script populates your MongoDB database with sample menu items and orders for testing and development.

## What Gets Created

### Menu Items (24 total)
- **Coffee** (7 items): Espresso, Cappuccino, Latte, Americano, Mocha, Caramel Macchiato, Cold Brew
- **Tea** (4 items): Green Tea, Earl Grey, Chamomile, Chai Latte
- **Pastries** (4 items): Croissant, Chocolate Muffin, Blueberry Scone, Cinnamon Roll
- **Sandwiches** (4 items): Turkey Club, Veggie Panini, BLT, Chicken Pesto
- **Desserts** (5 items): Chocolate Cake, Cheesecake, Tiramisu, Apple Pie, Brownie

### Sample Orders (15 total)
- Random customer information (10 different customers)
- 1-4 items per order
- Random quantities (1-3 per item)
- Various order statuses (pending, confirmed, preparing, ready, delivered)
- Order dates spread across the last 30 days

## How to Run

### Using Command Prompt

```cmd
cd "e:\Ty b68\projects\cafe\server"
npm run seed
```

### Expected Output

```
✓ Connected to MongoDB
✓ Cleared existing data
✓ Inserted 24 menu items
✓ Inserted 15 orders

🎉 Database seeded successfully!

Summary:
- Menu Items: 24
- Orders: 15

Categories:
- Coffee: 7
- Tea: 4
- Pastries: 4
- Sandwiches: 4
- Desserts: 5
```

## Important Notes

> [!WARNING]
> **This script will DELETE all existing menu items and orders before inserting new data!**

- Make sure MongoDB is running before executing the script
- The script uses the MongoDB URI from your `.env` file
- All menu items include real Unsplash images
- Orders contain realistic customer data and addresses

## Customization

To modify the seed data, edit `seedDatabase.js`:

- **Add more menu items**: Add objects to the `menuItems` array
- **Change order count**: Modify the number in `generateOrders(insertedMenuItems, 15)` (default: 15)
- **Add customers**: Add more customer objects to the `customers` array
- **Adjust price ranges**: Modify the `price` values in menu items

## Troubleshooting

**Error: Cannot connect to MongoDB**
- Ensure MongoDB is running: `mongod`
- Check your `.env` file has correct `MONGODB_URI`

**Error: Module not found**
- Run `npm install` in the server directory first

**Script hangs**
- Press `Ctrl+C` and check MongoDB connection
- Verify `.env` configuration
