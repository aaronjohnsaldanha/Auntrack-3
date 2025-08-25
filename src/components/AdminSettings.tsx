import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEvents } from '../contexts/EventContext'
import { User, LogOut, Database, Settings, Shield, BarChart3, Users } from 'lucide-react'
import UserManagement from './UserManagement'

const AdminSettings: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth()
  const { events, categories } = useEvents()
  const navigate = useNavigate()
  const [showUserManagement, setShowUserManagement] = useState(false)

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  }

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleBackToCalendar = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToCalendar}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Calendar
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Admin Settings</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Welcome, {user?.name}</span>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Database Stats Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Database Statistics</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">💾 Database Storage</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Your calendar data is saved in SQLite database</div>
                  <div>Data persists permanently and survives server restarts</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{events.length}</div>
                  <div className="text-xs text-blue-700">Events</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{categories.length}</div>
                  <div className="text-xs text-green-700">Categories</div>
                </div>
              </div>
            </div>
          </div>

          {/* System Info Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="w-6 h-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">System Information</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Backend Server</span>
                <span className="text-sm font-medium text-green-600">Running</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Authentication</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">User Role</span>
                <span className="text-sm font-medium text-blue-600">{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Security Status</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">JWT Authentication</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Password Hashing</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">CORS Protection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">SQL Injection Protection</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleBackToCalendar}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                View Calendar
              </button>
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => setShowUserManagement(true)}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Users</span>
                </button>
              )}
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-6 h-6 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">User Profile</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Name</span>
                <div className="text-sm font-medium text-gray-900">{user?.name}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Username</span>
                <div className="text-sm font-medium text-gray-900">{user?.username}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email</span>
                <div className="text-sm font-medium text-gray-900">{user?.email}</div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Role</span>
                <div className="text-sm font-medium text-indigo-600">{user?.role}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* User Management Modal */}
      {showUserManagement && (
        <UserManagement onClose={() => setShowUserManagement(false)} />
      )}
    </div>
  )
}

export default AdminSettings
