# Cafe Management System

A modern, full-stack cafe management application built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- 🏠 **Home Page**: Beautiful landing page with hero section and features
- 📋 **Menu**: Browse menu items with search and category filtering
- 🛒 **Orders**: Place orders with cart management and checkout
- 📞 **Contact**: Contact form and business information
- 🎨 **Premium UI**: Dark mode with glassmorphism and smooth animations
- 📱 **Responsive**: Fully responsive design for all devices

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Axios
- React Icons
- Vanilla CSS with custom design system

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- CORS
- dotenv

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   cd "e:\Ty b68\projects\cafe"
   ```

2. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../server
   npm install
   ```

4. **Configure environment variables**
   
   Edit `server/.env` and update MongoDB URI if needed:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/cafe-management
   NODE_ENV=development
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on http://localhost:5000

3. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```
   Frontend will run on http://localhost:5173

## API Endpoints

### Menu Routes
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get menu item by ID
- `POST /api/menu` - Create new menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Order Routes
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Delete order

## Project Structure

```
cafe/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── index.css      # Global styles and design system
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                # Backend Express application
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── server.js         # Server entry point
│   ├── .env              # Environment variables
│   └── package.json
│
└── README.md
```

## Design Features

- **Dark Theme**: Premium dark color scheme with vibrant accents
- **Glassmorphism**: Modern glass-effect cards and components
- **Animations**: Smooth transitions and micro-interactions
- **Typography**: Google Fonts (Inter + Playfair Display)
- **Responsive**: Mobile-first design approach

## Author

Built with ❤️ using the MERN stack
