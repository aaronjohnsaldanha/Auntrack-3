import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEvents } from '../contexts/EventContext'
import { format, isSameDay, addDays, differenceInDays } from 'date-fns'
import { User, Plus, LogOut, Download, ChevronLeft, ChevronRight, Settings, X, Edit } from 'lucide-react'
import * as XLSX from 'xlsx'
import AddEventModal from './AddEventModal'
import AddCategoryModal from './AddCategoryModal'
import EditEventModal from './EditEventModal'
import EditCategoryModal from './EditCategoryModal'

// BRAND NEW: Simple Event Card Component
const EventCard: React.FC<{
  event: any
  isStartOfEvent: boolean
  width: string
  onEdit: (event: any) => void
  onDelete: (eventId: number) => void
  canEdit: boolean
}> = ({ event, isStartOfEvent, width, onEdit, onDelete, canEdit }) => {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(event))
        e.dataTransfer.effectAllowed = 'move'
      }}
      title={`${event.title} (${format(new Date(event.start_date), 'MMM d, yyyy')} - ${format(new Date(event.end_date), 'MMM d, yyyy')})`}
      className="event-card absolute top-2 left-2 bottom-2 rounded bg-opacity-90 transition-all duration-200 select-none cursor-grab active:cursor-grabbing hover:scale-105"
      style={{
        backgroundColor: event.color,
        width,
      }}
    >
      <div className="flex flex-col justify-between h-full p-2">
        <div className="flex-1">
          {isStartOfEvent && (
            <>
              <div className="text-white font-medium text-sm truncate">
                {event.title}
              </div>
              <div className="text-white/80 text-xs mt-1">
                {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
              </div>
            </>
          )}
        </div>
        
        {/* Edit and Delete buttons */}
        {canEdit && (
          <div className="flex space-x-1 justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(event)
              }}
              className="event-edit-btn bg-white/20 hover:bg-white/30 rounded p-1 transition-colors"
              title="Edit event"
            >
              <Edit className="w-3 h-3 text-white" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm('Are you sure you want to delete this event?')) {
                  onDelete(event.id)
                }
              }}
              className="event-delete-btn bg-red-500/20 hover:bg-red-500/30 rounded p-1 transition-colors"
              title="Delete event"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const Calendar: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth()
  const { categories, currentWeek, currentMonth, currentYear, setCurrentMonth, setCurrentYear, deleteCategory, updateEvent, deleteEvent, events } = useEvents()
  const navigate = useNavigate()
  
  // Check user permissions
  const canAdd = user?.can_add || user?.role === 'super_admin' || user?.role === 'admin'
  const canEdit = user?.can_edit || user?.role === 'super_admin' || user?.role === 'admin'
  const canManageCategories = user?.role === 'super_admin' || user?.role === 'admin'
  
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showEditEventModal, setShowEditEventModal] = useState(false)
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, isLoading, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event)
    setShowEditEventModal(true)
  }

  const handleEditCategory = (category: any) => {
    setSelectedCategory(category)
    setShowEditCategoryModal(true)
  }

  const handleDeleteCategory = (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category? All events in this category will also be deleted.')) {
      deleteCategory(categoryId)
    }
  }

  const handleEventMove = (eventId: number, newStartDate: Date, newEndDate: Date) => {
    console.log('Moving event:', eventId, 'to:', newStartDate, newEndDate)
    updateEvent(eventId, {
      start_date: newStartDate.toISOString(),
      end_date: newEndDate.toISOString()
    })
  }

  // BRAND NEW: HTML5 Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dateIndex: number) => {
    e.preventDefault()
    
    try {
      const eventData = e.dataTransfer.getData('text/plain')
      const draggedEvent = JSON.parse(eventData)
      
      const targetDate = currentWeek[dateIndex]
      if (targetDate) {
        // Get the original start and end times
        const originalStartDate = new Date(draggedEvent.start_date)
        const originalEndDate = new Date(draggedEvent.end_date)
        
        // Calculate the time components (hours, minutes, seconds, milliseconds)
        const startHours = originalStartDate.getHours()
        const startMinutes = originalStartDate.getMinutes()
        const startSeconds = originalStartDate.getSeconds()
        const startMilliseconds = originalStartDate.getMilliseconds()
        
        const endHours = originalEndDate.getHours()
        const endMinutes = originalEndDate.getMinutes()
        const endSeconds = originalEndDate.getSeconds()
        const endMilliseconds = originalEndDate.getMilliseconds()
        
        // Create new dates with the target date but preserving the original times
        const newStartDate = new Date(targetDate)
        newStartDate.setHours(startHours, startMinutes, startSeconds, startMilliseconds)
        
        const newEndDate = new Date(targetDate)
        newEndDate.setHours(endHours, endMinutes, endSeconds, endMilliseconds)
        
        // If the event spans multiple days, add the appropriate number of days to the end date
        const eventDuration = differenceInDays(originalEndDate, originalStartDate)
        if (eventDuration > 0) {
          newEndDate.setDate(newEndDate.getDate() + eventDuration)
        }
        
        console.log('Moving event to:', newStartDate, newEndDate)
        console.log('Original times preserved:', {
          start: `${startHours}:${startMinutes}`,
          end: `${endHours}:${endMinutes}`
        })
        handleEventMove(draggedEvent.id, newStartDate, newEndDate)
      }
    } catch (error) {
      console.error('Error parsing drag data:', error)
    }
  }

  const handleExportToExcel = () => {
    // Prepare data for Excel
    const excelData = events.map(event => ({
      'Event Title': event.title,
      'Category': event.category_name,
      'Start Date': new Date(event.start_date).toLocaleDateString(),
      'End Date': new Date(event.end_date).toLocaleDateString(),
      'Description': event.description || '',
      'Color': event.color
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Event Title
      { wch: 15 }, // Category
      { wch: 12 }, // Start Date
      { wch: 12 }, // End Date
      { wch: 30 }, // Description
      { wch: 10 }  // Color
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calendar Events');

    // Generate filename with current date
    const fileName = `calendar_events_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Write and download file
    XLSX.writeFile(workbook, fileName);
  }

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentMonth(currentMonth === 0 ? 11 : currentMonth - 1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                  className="bg-white border border-gray-300 rounded px-3 py-1 text-sm font-medium"
                >
                  <option value={0}>January</option>
                  <option value={1}>February</option>
                  <option value={2}>March</option>
                  <option value={3}>April</option>
                  <option value={4}>May</option>
                  <option value={5}>June</option>
                  <option value={6}>July</option>
                  <option value={7}>August</option>
                  <option value={8}>September</option>
                  <option value={9}>October</option>
                  <option value={10}>November</option>
                  <option value={11}>December</option>
                </select>
                
                <button
                  onClick={() => setCurrentMonth(currentMonth === 11 ? 0 : currentMonth + 1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentYear(currentYear - 1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                  className="bg-white border border-gray-300 rounded px-3 py-1 text-sm font-medium"
                >
                  {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => setCurrentYear(currentYear + 1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
                         <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-2 text-sm text-gray-600">
                 <span>Welcome, {user?.name}</span>
                 <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                   <User className="w-4 h-4 text-blue-600" />
                 </div>
               </div>
               <button
                 onClick={() => navigate('/admin')}
                 className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                 title="Admin Settings"
               >
                 <Settings className="w-4 h-4" />
                 <span>Settings</span>
               </button>
               <button
                 onClick={handleExportToExcel}
                 className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors"
                 title="Export events to Excel"
               >
                 <Download className="w-4 h-4" />
                 <span>Export to Excel</span>
               </button>
               
               <button
                 onClick={handleLogout}
                 className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
               >
                 <LogOut className="w-4 h-4" />
                 <span>Logout</span>
               </button>
             </div>
          </div>
        </div>
      </header>

      {/* Calendar Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar Container */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div 
            className="calendar-container"
            style={{ '--days-in-month': currentWeek.length } as React.CSSProperties}
          >
            {/* Static Category Column */}
            <div className="category-column">
                             {/* Category Header */}
               <div className="category-header bg-gray-50 p-4 border-r border-gray-200">
                 {canManageCategories ? (
                   <button
                     onClick={() => setShowAddCategoryModal(true)}
                     className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                   >
                     <Plus className="w-4 h-4" />
                     <span>Add Category</span>
                   </button>
                 ) : (
                   <div className="w-full bg-gray-200 text-gray-500 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2">
                     <span>Categories</span>
                   </div>
                 )}
               </div>
              
              {/* Category Names */}
              {categories.map((category) => (
                <div key={category.id} className="category-row p-4 bg-gray-50 border-r border-gray-200 border-b border-gray-200 last:border-b-0 flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded mr-3"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="font-medium text-gray-900">{category.name}</span>
                  </div>
                                     {canManageCategories && (
                     <div className="flex items-center space-x-2">
                       <button
                         onClick={() => handleEditCategory(category)}
                         className="text-gray-400 hover:text-gray-600 transition-colors"
                         title="Edit category"
                       >
                         <Settings className="w-4 h-4" />
                       </button>
                       <button
                         onClick={() => handleDeleteCategory(category.id)}
                         className="text-red-400 hover:text-red-600 transition-colors"
                         title="Delete category"
                       >
                         <X className="w-4 h-4" />
                       </button>
                     </div>
                   )}
                </div>
              ))}
            </div>
            
            {/* Scrollable Calendar Grid */}
            <div className="flex-1 overflow-x-auto">
              {/* Calendar Header */}
              <div className="calendar-header">
                {currentWeek.map((date, index) => (
                  <div key={index} className="bg-gray-50 p-4 text-center border-r border-gray-200 last:border-r-0 flex flex-col justify-center">
                    <div className="text-sm font-medium text-gray-900">
                      {format(date, 'd MMM')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(date, 'EEE')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Calendar Grid - One row per category */}
              <div className="calendar-grid-container">
                {categories.map((category) => (
                  <div key={category.id} className="calendar-grid-row">
                    {currentWeek.map((date, dateIndex) => (
                      <div 
                        key={dateIndex} 
                        className="calendar-cell p-2 border-r border-gray-200 last:border-r-0 relative"
                        data-date-index={dateIndex}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, dateIndex)}
                      >
                        {/* Events for this category and date */}
                        {events
                          .filter(event => event.category_name === category.name)
                          .map((event) => {
                            const eventStart = new Date(event.start_date)
                            const eventEnd = new Date(event.end_date)
                            
                            // Normalize dates to start of day for comparison
                            const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
                            const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
                            const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                            
                            // Check if this event should be shown on this date
                            const isEventOnThisDate = eventStartDate <= checkDate && eventEndDate >= checkDate
                            
                            if (!isEventOnThisDate) return null
                            
                            // Calculate if this is the start of a multi-day event
                            const isStartOfEvent = isSameDay(eventStartDate, checkDate)
                            const isEndOfEvent = isSameDay(eventEndDate, checkDate)
                            
                            // Calculate width for multi-day events
                            let width = 'calc(100% - 1rem)'
                            
                                                         if (isStartOfEvent && !isEndOfEvent) {
                               // Start of multi-day event - calculate how many days it spans
                               const daysToEnd = Math.min(
                                 currentWeek.length - dateIndex,
                                 differenceInDays(eventEndDate, checkDate) + 1
                               )
                               width = `calc(${daysToEnd * 100}% - 1rem)`
                             } else if (!isStartOfEvent && !isEndOfEvent) {
                               // Middle of multi-day event - don't render here
                               return null
                             }
                            
                            return (
                              <EventCard
                                key={event.id}
                                event={event}
                                isStartOfEvent={isStartOfEvent}
                                width={width}
                                onEdit={handleEditEvent}
                                onDelete={deleteEvent}
                                canEdit={canEdit}
                              />
                            )
                          })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add Event Button */}
        {canAdd && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowAddEventModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Event</span>
            </button>
          </div>
        )}


      </div>

      {/* Modals */}
      {showAddEventModal && (
        <AddEventModal
          onClose={() => setShowAddEventModal(false)}
          onAdd={() => setShowAddEventModal(false)}
        />
      )}

      {showAddCategoryModal && (
        <AddCategoryModal
          onClose={() => setShowAddCategoryModal(false)}
          onAdd={() => setShowAddCategoryModal(false)}
        />
      )}

      {showEditEventModal && selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          onClose={() => {
            setShowEditEventModal(false)
            setSelectedEvent(null)
          }}
          onUpdate={() => {
            setShowEditEventModal(false)
            setSelectedEvent(null)
          }}
        />
      )}

      {showEditCategoryModal && selectedCategory && (
        <EditCategoryModal
          category={selectedCategory}
          onClose={() => {
            setShowEditCategoryModal(false)
            setSelectedCategory(null)
          }}
          onUpdate={() => {
            setShowEditCategoryModal(false)
            setSelectedCategory(null)
          }}
        />
      )}
    </div>
  )
}

export default Calendar
