import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEvents } from '../contexts/EventContext'
import { format, isSameDay, differenceInDays } from 'date-fns'
import { User, Plus, LogOut, Download, ChevronLeft, ChevronRight, Settings, X, Edit, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import AddEventModal from './AddEventModal'
import AddCategoryModal from './AddCategoryModal'
import EditEventModal from './EditEventModal'
import EditCategoryModal from './EditCategoryModal'

// BRAND NEW: Simple Event Card Component
const EventCard: React.FC<{
  event: any
  width: string
  onEdit: (event: any) => void
  onDelete: (eventId: number) => void
  canEdit: boolean
}> = ({ event, width, onEdit, onDelete, canEdit }) => {
  // Check if this is a multi-day event
  const isMultiDay = width !== 'calc(100% - 1rem)'
  
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(event))
        e.dataTransfer.effectAllowed = 'move'
      }}
      title={`${event.title} (${format(new Date(event.start_date), 'MMM d, yyyy')} - ${format(new Date(event.end_date), 'MMM d, yyyy')})`}
      className={`event-card top-2 left-2 bottom-2 transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
        isMultiDay ? 'multi-day-hover multi-day-event' : 'rounded hover:scale-105'
      }`}
      style={{
        backgroundColor: event.color,
        width,
        opacity: 0.75,
        zIndex: isMultiDay ? 15 : 20,
        pointerEvents: 'auto',
        position: 'absolute',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        // Keep rounded corners for all events
        borderRadius: '4px',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      <div className="flex flex-col justify-between h-full p-2">
        <div className="flex-1">
          <div className="text-white font-medium text-sm truncate">
            {event.title}
          </div>
          <div className="text-white/80 text-xs mt-1">
            {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
          </div>
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
              style={{ pointerEvents: 'auto' }}
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
              style={{ pointerEvents: 'auto' }}
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
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showListView, setShowListView] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, isLoading, navigate])

  // Close profile menu and export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showProfileMenu && !target.closest('.profile-dropdown')) {
        setShowProfileMenu(false)
      }
      if (showExportMenu && !target.closest('.export-dropdown')) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu, showExportMenu])

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

  const handleDeleteCategory = async (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category? All events in this category will also be deleted.')) {
      try {
        await deleteCategory(categoryId)
      } catch (error) {
        console.error('Error deleting category:', error)
        alert(`Error deleting category: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleEventMove = async (eventId: number, newStartDate: Date, newEndDate: Date) => {
    console.log('Moving event:', eventId, 'to:', newStartDate, newEndDate)
    try {
      await updateEvent(eventId, {
        start_date: newStartDate.toISOString(),
        end_date: newEndDate.toISOString()
      })
    } catch (error) {
      console.error('Error moving event:', error)
      alert(`Error moving event: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await deleteEvent(eventId)
    } catch (error) {
      console.error('Error deleting event:', error)
      alert(`Error deleting event: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // BRAND NEW: HTML5 Drag and Drop Handlers
        const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      
      // Add visual feedback for drop zone using a pseudo-element approach
      const target = e.currentTarget as HTMLElement
      if (!target.querySelector('.drop-zone-indicator')) {
        const indicator = document.createElement('div')
        indicator.className = 'drop-zone-indicator'
        indicator.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(59, 130, 246, 0.1);
          border: 2px dashed #3b82f6;
          border-radius: 4px;
          pointer-events: none;
          z-index: 1;
        `
        target.style.position = 'relative'
        target.appendChild(indicator)
      }
    }

    const handleDragLeave = (e: React.DragEvent) => {
      // Remove visual feedback when leaving drop zone
      const target = e.currentTarget as HTMLElement
      const indicator = target.querySelector('.drop-zone-indicator')
      if (indicator) {
        indicator.remove()
      }
    }

           const handleDrop = (e: React.DragEvent, dateIndex: number) => {
      e.preventDefault()
      
      // Remove visual feedback
      const target = e.currentTarget as HTMLElement
      const indicator = target.querySelector('.drop-zone-indicator')
      if (indicator) {
        indicator.remove()
      }
      
      try {
        const eventData = e.dataTransfer.getData('text/plain')
        const draggedEvent = JSON.parse(eventData)
        
        const targetDate = currentWeek[dateIndex]
        if (targetDate) {
          // Get the original start and end times
          const originalStartDate = new Date(draggedEvent.start_date)
          const originalEndDate = new Date(draggedEvent.end_date)
          
          // Calculate the time components
          const startHours = originalStartDate.getHours()
          const startMinutes = originalStartDate.getMinutes()
          const endHours = originalEndDate.getHours()
          const endMinutes = originalEndDate.getMinutes()
          
          // Create new dates with the target date but preserving the original times
          const newStartDate = new Date(targetDate)
          newStartDate.setHours(startHours, startMinutes, 0, 0)
          
          const newEndDate = new Date(targetDate)
          newEndDate.setHours(endHours, endMinutes, 0, 0)
          
          // If the event spans multiple days, add the appropriate number of days to the end date
          const eventDuration = differenceInDays(originalEndDate, originalStartDate)
          if (eventDuration > 0) {
            newEndDate.setDate(newEndDate.getDate() + eventDuration)
          }
          
          handleEventMove(draggedEvent.id, newStartDate, newEndDate)
        }
      } catch (error) {
        console.error('Error parsing drag data:', error)
      }
    }

  const handleExportToExcel = () => {
    try {
      console.log('Exporting events:', events)
      
      // Prepare data for Excel
      const excelData = events.map(event => ({
        'Event Title': event.title,
        'Category': event.category_name,
        'Start Date': new Date(event.start_date).toLocaleDateString(),
        'End Date': new Date(event.end_date).toLocaleDateString(),
        'Description': event.description || '',
        'Color': event.color
      }));

      console.log('Excel data prepared:', excelData)

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
      
      console.log('Excel file exported successfully:', fileName)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert(`Error exporting to Excel: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleExportToPDF = async () => {
    try {
      // Create a custom PDF container with all events from all months
      const pdfContainer = document.createElement('div')
      pdfContainer.style.position = 'absolute'
      pdfContainer.style.left = '-9999px'
      pdfContainer.style.top = '0'
      pdfContainer.style.width = '800px'
      pdfContainer.style.backgroundColor = 'white'
      pdfContainer.style.padding = '20px'
      pdfContainer.style.fontSize = '14px'
      pdfContainer.style.lineHeight = '1.4'
      
      // Group events by month and year
      const eventsByMonth = events.reduce((acc, event) => {
        const eventDate = new Date(event.start_date)
        const monthYear = `${eventDate.getFullYear()}-${eventDate.getMonth()}`
        if (!acc[monthYear]) {
          acc[monthYear] = []
        }
        acc[monthYear].push(event)
        return acc
      }, {} as Record<string, any[]>)
      
      // Sort months chronologically
      const sortedMonths = Object.keys(eventsByMonth).sort()
      
      // Create PDF content
      let pdfContent = ''
      
      if (events.length === 0) {
        pdfContent = `
          <div style="text-align: center; padding: 40px; color: #666;">
            <h1 style="font-size: 24px; margin-bottom: 12px;">Calendar Events</h1>
            <p style="font-size: 16px;">No events found</p>
          </div>
        `
      } else {
        // Get the year from the first event
        const firstEventDate = new Date(events[0].start_date)
        const year = firstEventDate.getFullYear()
        
        // Add year header once at the top
        pdfContent += `
          <div style="margin-bottom: 30px;">
            <h1 style="font-size: 32px; font-weight: bold; color: #333; margin-bottom: 20px;">${year}</h1>
        `
        
        // Add events grouped by month
        sortedMonths.forEach(monthYear => {
          const [monthYearValue, month] = monthYear.split('-')
          const monthName = new Date(parseInt(monthYearValue), parseInt(month), 1).toLocaleDateString('en-US', { month: 'long' })
          const monthEvents = eventsByMonth[monthYear].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
          
          pdfContent += `
            <div style="margin-bottom: 30px;">
              <h2 style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 12px;">${monthName}</h2>
              <div style="width: 100%; height: 1px; background-color: #3b82f6; margin-bottom: 20px;"></div>
          `
          
          monthEvents.forEach(event => {
            const startDate = new Date(event.start_date)
            const endDate = new Date(event.end_date)
            const isSameDayEvent = startDate.toDateString() === endDate.toDateString()
            
            pdfContent += `
              <div style="
                background-color: ${event.color}; 
                color: white; 
                padding: 12px 16px; 
                margin-bottom: 8px; 
                border-radius: 8px;
                display: flex;
                align-items: center;
                min-height: 50px;
              ">
                <div style="flex: 1; display: flex; align-items: center; gap: 20px;">
                  <div style="flex: 1; text-align: left;">
                    <span style="font-size: 14px; font-weight: 600;">${event.title}</span>
                  </div>
                  <div style="width: 120px; text-align: left;">
                    <span style="font-size: 12px;">
                      ${isSameDayEvent 
                        ? format(startDate, 'MMM d')
                        : `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
                      }
                    </span>
                  </div>
                  <div style="width: 140px; text-align: left;">
                    <span style="font-size: 12px;">
                      ${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}
                    </span>
                  </div>
                  <div style="width: 100px; text-align: left;">
                    <span style="font-size: 12px;">${event.category_name}</span>
                  </div>
                </div>
              </div>
            `
          })
          
          pdfContent += '</div>'
        })
      }
      
      pdfContainer.innerHTML = pdfContent
      document.body.appendChild(pdfContainer)

      // Generate PDF
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: pdfContainer.scrollHeight
      })

      // Remove the container
      document.body.removeChild(pdfContainer)

      // Create PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 180
      const pageHeight = 270
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 15

      // Add first page
      pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 15
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Generate filename with current date
      const fileName = `calendar_events_${new Date().toISOString().split('T')[0]}.pdf`

      // Save PDF
      pdf.save(fileName)
      
      console.log('PDF file exported successfully:', fileName)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      alert(`Error exporting to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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
    <div className="min-h-screen bg-white">
             {/* Header */}
       <header className="bg-white shadow-sm border-b border-gray-200">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-center h-20">
                         {/* Logo */}
             <div className="flex items-center">
               <img 
                 src="/src/Assets/Logo.png" 
                 alt="Auntrack Calendar Logo" 
                 className="h-24 w-auto mr-4"
               />
             </div>
            
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
                {/* Export Dropdown */}
                <div className="relative export-dropdown">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Export options"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Export Dropdown Menu */}
                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleExportToExcel()
                            setShowExportMenu(false)
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Download className="w-4 h-4 text-green-600" />
                          <span>Export to Excel</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            handleExportToPDF()
                            setShowExportMenu(false)
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Download className="w-4 h-4 text-red-600" />
                          <span>Export to PDF</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
               
               {/* User Greeting */}
               <div className="text-sm text-gray-600">
                 Hi, <span className="font-medium text-gray-900">{user?.name}</span>
               </div>
               
               {/* Profile Dropdown */}
               <div className="relative profile-dropdown">
                                   <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    title="Profile Menu"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                  </button>
                 
                 {/* Dropdown Menu */}
                 {showProfileMenu && (
                   <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                     <div className="py-1">
                       <button
                         onClick={() => {
                           navigate('/admin')
                           setShowProfileMenu(false)
                         }}
                         className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                       >
                         <Settings className="w-4 h-4" />
                         <span>Settings</span>
                       </button>
                       
                       <button
                         onClick={() => {
                           handleLogout()
                           setShowProfileMenu(false)
                         }}
                         className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                       >
                         <LogOut className="w-4 h-4" />
                         <span>Logout</span>
                       </button>
                     </div>
                   </div>
                 )}
               </div>
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
                    {currentWeek.map((date, dateIndex) => {
                      // Check if this cell is part of a multi-day event
                      const multiDayEvent = events
                        .filter(event => event.category_name === category.name)
                        .find(event => {
                          const eventStart = new Date(event.start_date)
                          const eventEnd = new Date(event.end_date)
                          const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
                          const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
                          const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                          
                          const isEventOnThisDate = eventStartDate <= checkDate && eventEndDate >= checkDate
                          const isStartOfEvent = isSameDay(eventStartDate, checkDate)
                          const isEndOfEvent = isSameDay(eventEndDate, checkDate)
                          
                          return isEventOnThisDate && !isStartOfEvent && !isEndOfEvent
                        })
                      
                      const isMultiDayStart = events
                        .filter(event => event.category_name === category.name)
                        .some(event => {
                          const eventStart = new Date(event.start_date)
                          const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())
                          const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                          return isSameDay(eventStartDate, checkDate)
                        })
                      
                      const isMultiDayEnd = events
                        .filter(event => event.category_name === category.name)
                        .some(event => {
                          const eventEnd = new Date(event.end_date)
                          const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
                          const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                          return isSameDay(eventEndDate, checkDate)
                        })
                      
                      let cellClasses = "calendar-cell p-2 border-r border-gray-200 last:border-r-0 relative"
                      
                      if (multiDayEvent) {
                        cellClasses += " multi-day-middle"
                      } else if (isMultiDayStart) {
                        cellClasses += " multi-day-start"
                      } else if (isMultiDayEnd) {
                        cellClasses += " multi-day-end"
                      }
                      
                      return (
                        <div 
                          key={dateIndex} 
                          className={cellClasses}
                          data-date-index={dateIndex}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, dateIndex)}
                          style={{ 
                            pointerEvents: 'auto',
                            position: 'relative',
                            zIndex: 5,
                            backgroundColor: 'transparent'
                          }}
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
                              
                              // Calculate if this is the start or end of a multi-day event
                              const isStartOfEvent = isSameDay(eventStartDate, checkDate)
                              const isEndOfEvent = isSameDay(eventEndDate, checkDate)
                              
                              // Only render the event card on the start day to avoid duplication
                              if (!isStartOfEvent) {
                                  return null
                              }
                             
                             // Calculate width for multi-day events
                             let width = 'calc(100% - 1rem)'
                             
                             if (!isEndOfEvent) {
                                 // Multi-day event - calculate how many days it spans
                                 const daysToEnd = Math.min(
                                     currentWeek.length - dateIndex,
                                     differenceInDays(eventEndDate, checkDate) + 1
                                 )
                                 // Ensure minimum width and proper calculation
                                 if (daysToEnd > 1) {
                                     width = `calc(${daysToEnd * 100}% - 1rem)`
                                 }
                             }
                             
                                                           return (
                                  <EventCard
                                      key={`${event.id}-${dateIndex}`}
                                      event={event}
                                      width={width}
                                      onEdit={handleEditEvent}
                                      onDelete={handleDeleteEvent}
                                      canEdit={canEdit}
                                  />
                              )
                           })}
                      </div>
                    )})}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          {canAdd && (
            <button
              onClick={() => setShowAddEventModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Event</span>
            </button>
          )}
          
          <button
            onClick={() => setShowListView(!showListView)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              showListView 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>List View</span>
          </button>
        </div>

        {/* List View */}
        {showListView && (
          <div className="mt-8 max-w-4xl mx-auto" data-list-view-container>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{currentYear}</h1>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {format(new Date(currentYear, currentMonth, 1), 'MMMM')}
              </h2>
              <div className="w-full h-px bg-blue-300 mt-2"></div>
            </div>
            
            {/* Events List */}
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No events found</p>
                </div>
              ) : (
                events
                  .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                  .map((event) => {
                    const startDate = new Date(event.start_date)
                    const endDate = new Date(event.end_date)
                    const isSameDayEvent = startDate.toDateString() === endDate.toDateString()
                    
                    return (
                      <div 
                        key={event.id} 
                        className="rounded-lg p-3 text-white font-medium relative"
                        style={{ backgroundColor: event.color }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Event Name - Left aligned */}
                          <div className="text-left w-1/3 min-w-0">
                            <span className="text-base font-semibold truncate block">{event.title}</span>
                          </div>
                          
                          {/* Date Range - Centered */}
                          <div className="text-center w-1/6 min-w-0">
                            <span className="text-sm">
                              {isSameDayEvent 
                                ? format(startDate, 'MMM d')
                                : `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
                              }
                            </span>
                          </div>
                          
                          {/* Time - Centered */}
                          <div className="text-center w-1/6 min-w-0">
                            <span className="text-sm">
                              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                            </span>
                          </div>
                          
                          {/* Category - Right aligned */}
                          <div className="text-right w-1/6 min-w-0">
                            <span className="text-sm truncate block">{event.category_name}</span>
                          </div>
                          
                          {/* Edit/Delete buttons - Right aligned */}
                          {canEdit && (
                            <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                              <button
                                onClick={() => handleEditEvent(event)}
                                className="bg-white/20 hover:bg-white/30 rounded p-1 transition-colors"
                                title="Edit event"
                              >
                                <Edit className="w-3 h-3 text-white" />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className="bg-red-500/20 hover:bg-red-500/30 rounded p-1 transition-colors"
                                title="Delete event"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
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
