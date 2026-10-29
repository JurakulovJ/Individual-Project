import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// 1. Health Check
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// 2. AI Travel Planning & Itineraries (/api/v1/plan/* & /api/v1/itinerary/*)
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

// 3. Hotels Search, Filtering & Location Lookup (/api/v1/hotels/*)
export const searchHotelLocations = async (query = '', locale = 'ru') => {
  const response = await api.get('/hotels/locations', {
    params: { query, locale },
  });
  return response.data;
};

export const searchHotels = async (params = {}) => {
  const queryParams = {};
  if (params.destination) queryParams.destination = params.destination;
  if (params.checkIn) queryParams.check_in = params.checkIn;
  if (params.checkOut) queryParams.check_out = params.checkOut;
  if (params.guests) queryParams.guests = params.guests;
  if (params.rooms) queryParams.rooms = params.rooms;
  if (params.citizenship) queryParams.citizenship = params.citizenship;
  if (params.stars && params.stars.length > 0) {
    queryParams.stars = params.stars.join(',');
  }
  if (params.meals && params.meals.length > 0) {
    queryParams.meal_plans = params.meals.join(',');
  }
  if (params.freeCancellation === true) {
    queryParams.free_cancellation = true;
  }
  if (params.hotelName) queryParams.hotel_name = params.hotelName;
  if (params.sortBy) queryParams.sort_by = params.sortBy;
  if (params.bbox) queryParams.bbox = params.bbox;

  const response = await api.get('/hotels/search', { params: queryParams });
  return response.data;
};

// 4. Flights Autocomplete & Search (/api/v1/flights/*)
export const autocompleteFlightPlaces = async (term = '', locale = 'ru') => {
  const response = await api.get('/flights/autocomplete', {
    params: { term, locale },
  });
  return response.data;
};

export const searchFlights = async (params = {}) => {
  const queryParams = {
    trip_type: params.tripType || 'round_trip',
    origin: params.origin || undefined,
    destination: params.destination || undefined,
    departure_date: params.departureDate || undefined,
    return_date: params.returnDate || undefined,
    passengers: params.passengers || 1,
    cabin_class: params.cabinClass || 'economy',
    airline: params.airline || undefined,
    stops: params.stops || 'all',
    no_airport_change: Boolean(params.noAirportChange),
    baggage_included: Boolean(params.baggageIncluded),
    outbound_dep_max: params.outboundDepMax ?? 1435,
    outbound_arr_max: params.outboundArrMax ?? 1435,
    return_dep_max: params.returnDepMax ?? 1435,
    return_arr_max: params.returnArrMax ?? 1435,
    sort_by: params.sortBy || 'cheapest',
  };
  const response = await api.get('/flights/search', { params: queryParams });
  return response.data;
};

// 5. Transfers Search (/api/v1/transfers/search)
export const searchTransfers = async (params = {}) => {
  const queryParams = {
    trip_type: params.tripType || 'one_way',
    pickup_location: params.pickupLocation || undefined,
    dropoff_location: params.dropoffLocation || undefined,
    date: params.date || undefined,
    pickup_time: params.pickupTime || '12:00',
    passengers: params.passengers || 2,
  };
  const response = await api.get('/transfers/search', { params: queryParams });
  return response.data;
};

// 6. B2B Financial Dashboard & Orders (/api/v1/dashboard/summary & /api/v1/orders)
export const getDashboardSummary = async () => {
  const response = await api.get('/dashboard/summary');
  return response.data;
};

export const getOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const createOrder = async (orderPayload) => {
  const response = await api.post('/orders', orderPayload);
  return response.data;
};

export default api;
