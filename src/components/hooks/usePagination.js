import { useState, useEffect } from 'react';

export const usePagination = (fetchFunction, pageSize = 10) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchFunction(page, pageSize);
        setData(response.data);
        // Assuming backend returns totalPages in response
        setTotalPages(response.data.totalPages || 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [page, pageSize]);

  return {
    data,
    loading,
    error,
    page,
    setPage,
    totalPages,
  };
};