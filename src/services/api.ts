const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken') || localStorage.getItem('token');
};

// Helper function to make authenticated requests
const authenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!getAuthToken();
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    return authenticatedRequest('/categories');
  },

  create: async (category: { name: string; color: string }) => {
    return authenticatedRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  update: async (id: number, category: { name?: string; color?: string }) => {
    return authenticatedRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  },

  delete: async (id: number) => {
    return authenticatedRequest(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Events API
export const eventsAPI = {
  getAll: async () => {
    return authenticatedRequest('/events');
  },

  create: async (event: {
    title: string;
    category_id: number;
    start_date: string;
    end_date: string;
    color: string;
    description?: string;
  }) => {
    return authenticatedRequest('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  update: async (id: number, event: {
    title?: string;
    category_id?: number;
    start_date?: string;
    end_date?: string;
    color?: string;
    description?: string;
  }) => {
    // Only send the fields that are actually provided
    const updateData: any = {};
    if (event.title !== undefined) updateData.title = event.title;
    if (event.category_id !== undefined) updateData.category_id = event.category_id;
    if (event.start_date !== undefined) updateData.start_date = event.start_date;
    if (event.end_date !== undefined) updateData.end_date = event.end_date;
    if (event.color !== undefined) updateData.color = event.color;
    if (event.description !== undefined) updateData.description = event.description;
    
    return authenticatedRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  delete: async (id: number) => {
    return authenticatedRequest(`/events/${id}`, {
      method: 'DELETE',
    });
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    return authenticatedRequest('/users');
  },

  create: async (user: {
    username: string;
    email: string;
    password: string;
    name: string;
    role?: 'user' | 'admin' | 'super_admin';
    can_edit?: boolean;
    can_add?: boolean;
  }) => {
    return authenticatedRequest('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  update: async (id: number, user: {
    username?: string;
    email?: string;
    password?: string;
    name?: string;
    role?: 'user' | 'admin' | 'super_admin';
    can_edit?: boolean;
    can_add?: boolean;
  }) => {
    return authenticatedRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },

  delete: async (id: number) => {
    return authenticatedRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};
