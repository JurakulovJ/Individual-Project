import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const extractConstraints = async (prompt, conversationId = null) => {
  const response = await api.post('/plan/extract-constraints', {
    prompt,
    conversation_id: conversationId,
  });
  return response.data;
};

export const generateItinerary = async (constraints) => {
  const response = await api.post('/itinerary/generate', constraints);
  return response.data;
};

export const quickGenerateItinerary = async (prompt) => {
  const response = await api.post('/plan/quick-generate', { prompt });
  return response.data;
};

export const fetchDestinations = async () => {
  const response = await api.get('/plan/destinations');
  return response.data;
};

export default api;
