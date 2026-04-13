import express from 'express'
import Menu from '../models/Menu.js'

const router = express.Router()

// Get all menu items
router.get('/', async (req, res) => {
    try {
        const menuItems = await Menu.find().sort({ category: 1, name: 1 })
        res.json(menuItems)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu items', error: error.message })
    }
})

// Get menu item by ID
router.get('/:id', async (req, res) => {
    try {
        const menuItem = await Menu.findById(req.params.id)
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' })
        }
        res.json(menuItem)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu item', error: error.message })
    }
})

// Create new menu item
router.post('/', async (req, res) => {
    try {
        const menuItem = new Menu(req.body)
        const savedItem = await menuItem.save()
        res.status(201).json(savedItem)
    } catch (error) {
        res.status(400).json({ message: 'Error creating menu item', error: error.message })
    }
})

// Update menu item
router.put('/:id', async (req, res) => {
    try {
        const updatedItem = await Menu.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        if (!updatedItem) {
            return res.status(404).json({ message: 'Menu item not found' })
        }
        res.json(updatedItem)
    } catch (error) {
        res.status(400).json({ message: 'Error updating menu item', error: error.message })
    }
})

// Delete menu item
router.delete('/:id', async (req, res) => {
    try {
        const deletedItem = await Menu.findByIdAndDelete(req.params.id)
        if (!deletedItem) {
            return res.status(404).json({ message: 'Menu item not found' })
        }
        res.json({ message: 'Menu item deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting menu item', error: error.message })
    }
})

export default router
