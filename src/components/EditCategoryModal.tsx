import React, { useState, useEffect } from 'react'
import { useEvents } from '../contexts/EventContext'
import { X } from 'lucide-react'

interface EditCategoryModalProps {
  category: any
  onClose: () => void
  onUpdate: () => void
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ category, onClose, onUpdate }) => {
  const { updateCategory } = useEvents()
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6'
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        color: category.color
      })
    }
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateCategory(category.id, {
        name: formData.name,
        color: formData.color
      })
      onUpdate()
    } catch (error) {
      console.error('Error updating category:', error)
      alert(`Error updating category: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!category) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Edit Category</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
              />
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#3b82f6"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Update Category
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditCategoryModal
