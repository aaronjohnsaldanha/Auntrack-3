import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { addDays } from 'date-fns'
import { categoriesAPI, eventsAPI } from '../services/api'

export interface Event {
  id: number
  title: string
  category_name: string
  category_id: number
  start_date: string
  end_date: string
  color: string
  description?: string
}

export interface Category {
  id: number
  name: string
  color: string
}

interface EventContextType {
  events: Event[]
  categories: Category[]
  currentWeek: Date[]
  currentMonth: number
  currentYear: number
  setCurrentMonth: (month: number) => void
  setCurrentYear: (year: number) => void
  addEvent: (event: Omit<Event, 'id'>) => void
  updateEvent: (id: number, event: Partial<Event>) => void
  deleteEvent: (id: number) => void
  addCategory: (category: Omit<Category, 'id'>) => void
  updateCategory: (id: number, category: Partial<Category>) => void
  deleteCategory: (id: number) => void
  getEventsForDate: (date: Date) => Event[]
  getEventsForDateRange: (startDate: Date, endDate: Date) => Event[]
  refreshData: () => void
}

const EventContext = createContext<EventContextType | undefined>(undefined)

export const useEvents = () => {
  const context = useContext(EventContext)
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider')
  }
  return context
}

interface EventProviderProps {
  children: ReactNode
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentMonth, setCurrentMonth] = useState(7) // August (0-indexed)
  const [currentYear, setCurrentYear] = useState(2025)

  // Initialize current month
  const [currentWeek, setCurrentWeek] = useState<Date[]>(() => {
    const startDate = new Date(currentYear, currentMonth, 1)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const month: Date[] = []
    for (let i = 0; i < daysInMonth; i++) {
      month.push(addDays(startDate, i))
    }
    console.log('Generated dates for month:', month.map(d => d.toISOString().split('T')[0]))
    return month
  })

  // Load data from API
  const loadData = async () => {
    try {
      console.log('Loading data from API...')
      const [categoriesData, eventsData] = await Promise.all([
        categoriesAPI.getAll(),
        eventsAPI.getAll()
      ])
      console.log('Categories loaded:', categoriesData)
      console.log('Events loaded:', eventsData)
      setCategories(categoriesData)
      setEvents(eventsData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const refreshData = () => {
    loadData()
  }

  // Update calendar when month/year changes
  const updateCalendar = (month: number, year: number) => {
    const startDate = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthDates: Date[] = []
    for (let i = 0; i < daysInMonth; i++) {
      monthDates.push(addDays(startDate, i))
    }
    console.log('Updated calendar dates:', monthDates.map(d => d.toISOString().split('T')[0]))
    setCurrentWeek(monthDates)
  }

  const handleSetCurrentMonth = (month: number) => {
    setCurrentMonth(month)
    updateCalendar(month, currentYear)
  }

  const handleSetCurrentYear = (year: number) => {
    setCurrentYear(year)
    updateCalendar(currentMonth, year)
  }

  const addEvent = async (event: Omit<Event, 'id'>) => {
    try {
      console.log('Adding event:', event)
      const newEvent = await eventsAPI.create({
        title: event.title,
        category_id: event.category_id,
        start_date: event.start_date,
        end_date: event.end_date,
        color: event.color,
        description: event.description
      })
      console.log('Event created successfully:', newEvent)
      setEvents(prev => [...prev, newEvent])
    } catch (error) {
      console.error('Error adding event:', error)
    }
  }

  const updateEvent = async (id: number, eventData: Partial<Event>) => {
    try {
      console.log('Updating event:', id, eventData)
      
      // Only send the fields that are actually provided
      const updateData: any = {};
      if (eventData.title !== undefined) updateData.title = eventData.title;
      if (eventData.category_id !== undefined) updateData.category_id = eventData.category_id;
      if (eventData.start_date !== undefined) updateData.start_date = eventData.start_date;
      if (eventData.end_date !== undefined) updateData.end_date = eventData.end_date;
      if (eventData.color !== undefined) updateData.color = eventData.color;
      if (eventData.description !== undefined) updateData.description = eventData.description;
      
      const updatedEvent = await eventsAPI.update(id, updateData)
      console.log('Event updated successfully:', updatedEvent)
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
      ))
    } catch (error) {
      console.error('Error updating event:', error)
    }
  }

  const deleteEvent = async (id: number) => {
    try {
      await eventsAPI.delete(id)
      setEvents(prev => prev.filter(event => event.id !== id))
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const newCategory = await categoriesAPI.create(category)
      setCategories(prev => [...prev, newCategory])
    } catch (error) {
      console.error('Error adding category:', error)
    }
  }

  const updateCategory = async (id: number, categoryData: Partial<Category>) => {
    try {
      const updatedCategory = await categoriesAPI.update(id, categoryData)
      setCategories(prev => prev.map(category => 
        category.id === id ? updatedCategory : category
      ))
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const deleteCategory = async (id: number) => {
    try {
      await categoriesAPI.delete(id)
      setCategories(prev => prev.filter(category => category.id !== id))
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const getEventsForDate = (date: Date): Event[] => {
    return events.filter(event => {
      const eventStart = new Date(event.start_date)
      const eventEnd = new Date(event.end_date)
      const checkDate = new Date(date)
      
      return checkDate >= eventStart && checkDate <= eventEnd
    })
  }

  const getEventsForDateRange = (startDate: Date, endDate: Date): Event[] => {
    return events.filter(event => {
      const eventStart = new Date(event.start_date)
      const eventEnd = new Date(event.end_date)
      const rangeStart = new Date(startDate)
      const rangeEnd = new Date(endDate)
      
      return eventStart <= rangeEnd && eventEnd >= rangeStart
    })
  }

  const value: EventContextType = {
    events,
    categories,
    currentWeek,
    currentMonth,
    currentYear,
    setCurrentMonth: handleSetCurrentMonth,
    setCurrentYear: handleSetCurrentYear,
    addEvent,
    updateEvent,
    deleteEvent,
    addCategory,
    updateCategory,
    deleteCategory,
    getEventsForDate,
    getEventsForDateRange,
    refreshData
  }

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  )
}
