import React, { useState } from 'react'
import { useEvents } from '../contexts/EventContext'
import { Edit, X, GripVertical } from 'lucide-react'
import { isSameDay } from 'date-fns'

interface CategoryRowProps {
  category: any
  currentWeek: Date[]
  onEdit: (event: any) => void
  onEventMove?: (eventId: number, newStartDate: Date, newEndDate: Date) => void
}

const CategoryRow: React.FC<CategoryRowProps> = ({ category, currentWeek, onEdit, onEventMove }) => {
  const { events, deleteEvent } = useEvents()
  const [draggedEvent, setDraggedEvent] = useState<any>(null)

  // Get events for this category
  const categoryEvents = events.filter(event => event.category_name === category.name)

  const handleDragStart = (event: any, e: React.DragEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDraggedEvent(event)
    e.dataTransfer.setData('text/plain', event.id.toString())
    e.dataTransfer.effectAllowed = 'move'
    console.log('Drag started for event:', event.title)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault()
    setDraggedEvent(null)
    // Reset all drop zone backgrounds
    const dropZones = document.querySelectorAll('[data-drop-zone]')
    dropZones.forEach((zone) => {
      (zone as HTMLElement).classList.remove('drag-over')
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const target = e.currentTarget as HTMLElement
    target.classList.add('drag-over')
    console.log('Drag over:', e.currentTarget)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.classList.remove('drag-over')
  }

  const handleDrop = (e: React.DragEvent, dropDate: Date) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedEvent && onEventMove) {
      console.log('Dropping event:', draggedEvent.title, 'on date:', dropDate)
      const eventDuration = new Date(draggedEvent.end_date).getTime() - new Date(draggedEvent.start_date).getTime()
      const newStartDate = new Date(dropDate)
      const newEndDate = new Date(newStartDate.getTime() + eventDuration)
      
      onEventMove(draggedEvent.id, newStartDate, newEndDate)
    }
    setDraggedEvent(null)
  }

  const handleEdit = (event: any, e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(event)
  }

  const handleDelete = (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent(eventId)
    }
  }

                       return (
       <div className="calendar-grid calendar-row">
       
       {/* Date columns for drop zones */}
       {currentWeek.map((date, dateIndex) => (
                  <div 
            key={dateIndex} 
            className="drop-zone p-2 border-r border-gray-200 last:border-r-0"
            data-drop-zone="true"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, date)}
          >
          {/* Events for this date */}
          {categoryEvents.map((event) => {
            const eventStart = new Date(event.start_date)
            const eventEnd = new Date(event.end_date)
            
            // Check if this event should be shown on this date
            const isEventOnThisDate = isSameDay(date, eventStart) || 
              (eventStart < date && eventEnd >= date)
            
            if (!isEventOnThisDate) return null
            
            // Calculate if this is the start of a multi-day event
            const isStartOfEvent = isSameDay(date, eventStart)
            const isEndOfEvent = isSameDay(date, eventEnd)
            
            // Calculate width for multi-day events
            let width = '100%'
            let left = '0'
            
            if (isStartOfEvent && !isEndOfEvent) {
              // Start of multi-day event
              const daysToEnd = Math.min(
                currentWeek.length - dateIndex,
                Math.ceil((eventEnd.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
              )
              width = `${daysToEnd * 100}%`
            } else if (!isStartOfEvent && !isEndOfEvent) {
              // Middle of multi-day event - don't render here
              return null
            }
            
                         return (
               <div
                 key={event.id}
                 draggable={true}
                 onDragStart={(e) => handleDragStart(event, e)}
                 onDragEnd={handleDragEnd}
                 className="event-card cursor-move z-10 absolute inset-1 transition-all duration-200 select-none"
                 style={{
                   backgroundColor: event.color,
                   left,
                   width,
                   marginLeft: '4px',
                   marginRight: '4px',
                   touchAction: 'none',
                   userSelect: 'none',
                   WebkitUserSelect: 'none',
                   MozUserSelect: 'none',
                   msUserSelect: 'none'
                 }}
               >
                <div className="flex items-center justify-between h-full p-2">
                  <div className="flex items-center space-x-1">
                    <GripVertical className="w-3 h-3 text-white/70" />
                    <div className="text-white font-medium text-sm">
                      {isStartOfEvent ? event.title : ''}
                    </div>
                  </div>
                  
                  {isStartOfEvent && (
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => handleEdit(event, e)}
                        className="event-edit-btn"
                        title="Edit event"
                      >
                        <Edit className="w-3 h-3 text-white" />
                      </button>
                      
                      <button
                        onClick={(e) => handleDelete(event.id, e)}
                        className="event-delete-btn"
                        title="Delete event"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default CategoryRow
