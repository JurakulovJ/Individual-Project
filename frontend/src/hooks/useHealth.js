import { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';

export function useHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkHealth();
      setHealth(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return { health, loading, error, refetch: fetchHealth };
}
