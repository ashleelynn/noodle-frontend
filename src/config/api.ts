/**
 * API Configuration
 * Centralized backend endpoint configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8004';

export const API_ENDPOINTS = {
  // Auth
  login: `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`,
  logout: `${API_BASE_URL}/api/auth/logout`,

  // Drawings
  savDrawing: `${API_BASE_URL}/api/drawings`,
  getDrawings: `${API_BASE_URL}/api/drawings`,
  deleteDrawing: (id: string) => `${API_BASE_URL}/api/drawings/${id}`,

  // AI
  generateStory: `${API_BASE_URL}/api/ai/story`,
  analyzDrawing: `${API_BASE_URL}/api/ai/analyze`,

  // User
  getProfile: `${API_BASE_URL}/api/users/profile`,
  updateProfile: `${API_BASE_URL}/api/users/profile`,
};

export const API_BASE = API_BASE_URL;

export default API_ENDPOINTS;
