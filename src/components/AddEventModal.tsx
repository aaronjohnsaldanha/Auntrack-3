import React, { useState } from 'react'
import { useEvents } from '../contexts/EventContext'
import { X } from 'lucide-react'

interface AddEventModalProps {
  onClose: () => void
  onAdd: () => void
}

const AddEventModal: React.FC<AddEventModalProps> = ({ onClose, onAdd }) => {
  const { categories, addEvent } = useEvents()
  const [formData, setFormData] = useState({
    title: '',
    category: categories[0]?.name || '',
    startDate: '',
    startHour: '9',
    startMinute: '00',
    startPeriod: 'AM',
    endDate: '',
    endHour: '10',
    endMinute: '00',
    endPeriod: 'AM',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const category = categories.find(cat => cat.name === formData.category)
    if (!category) return

    // Convert 12-hour format to 24-hour format
    const convertTo24Hour = (hour: string, minute: string, period: string) => {
      let hour24 = parseInt(hour)
      if (period === 'PM' && hour24 !== 12) hour24 += 12
      if (period === 'AM' && hour24 === 12) hour24 = 0
      return `${hour24.toString().padStart(2, '0')}:${minute}`
    }

    const startTime24 = convertTo24Hour(formData.startHour, formData.startMinute, formData.startPeriod)
    const endTime24 = convertTo24Hour(formData.endHour, formData.endMinute, formData.endPeriod)

    // Combine date and time
    const startDateTime = new Date(`${formData.startDate}T${startTime24}`)
    const endDateTime = new Date(`${formData.endDate}T${endTime24}`)

    if (startDateTime > endDateTime) {
      alert('Start date/time cannot be after end date/time')
      return
    }

    addEvent({
      title: formData.title,
      category_id: category.id,
      category_name: category.name,
      start_date: startDateTime.toISOString(),
      end_date: endDateTime.toISOString(),
      color: category.color,
      description: formData.description
    })

    onAdd()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add New Event</h2>
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
              Event Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  name="startHour"
                  value={formData.startHour}
                  onChange={handleChange}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const hour = i + 1
                    return (
                      <option key={hour} value={hour.toString()}>
                        {hour}
                      </option>
                    )
                  })}
                </select>
                <select
                  name="startMinute"
                  value={formData.startMinute}
                  onChange={handleChange}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="00">00</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                </select>
                <select
                  name="startPeriod"
                  value={formData.startPeriod}
                  onChange={handleChange}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  name="endHour"
                  value={formData.endHour}
                  onChange={handleChange}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const hour = i + 1
                    return (
                      <option key={hour} value={hour.toString()}>
                        {hour}
                      </option>
                    )
                  })}
                </select>
                <select
                  name="endMinute"
                  value={formData.endMinute}
                  onChange={handleChange}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="00">00</option>
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                </select>
                <select
                  name="endPeriod"
                  value={formData.endPeriod}
                  onChange={handleChange}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event description"
            />
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
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEventModal
