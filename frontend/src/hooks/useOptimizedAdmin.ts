import { useCallback, useMemo, useRef, useState, useEffect } from 'react';

// Debounce hook for search and API calls (inline version)
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Optimized pagination hook
export const usePagination = (initialPageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const resetPagination = useCallback(() => {
    setCurrentPage(0);
  }, []);

  const updatePagination = useCallback((response: any) => {
    if (response) {
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
    }
  }, []);

  return {
    currentPage,
    pageSize,
    totalElements,
    totalPages,
    setCurrentPage,
    setPageSize,
    resetPagination,
    updatePagination
  };
};

// Optimized filter hook with debouncing
export const useFilters = <T extends object>(initialFilters: T, onFilterChange?: (filters: T) => void) => {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<T>(initialFilters);
  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    setAppliedFilters(debouncedFilters);
    onFilterChange?.(debouncedFilters);
  }, [debouncedFilters, onFilterChange]);

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    appliedFilters,
    updateFilter,
    resetFilters,
    setFilters
  };
};

// Optimized data loading hook
export const useDataLoader = <T>(
  loadFunction: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const loadData = useCallback(async (showLoading = true) => {
    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();

    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const result = await loadFunction();
      setData(result);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Terjadi kesalahan');
        console.error('Data loading error:', err);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    loadData();
    
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [loadData]);

  const refresh = useCallback(() => loadData(true), [loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    loadData
  };
};

// Optimized sorting hook
export const useSorting = (initialSort: { field: string; direction: 'asc' | 'desc' }) => {
  const [sort, setSort] = useState(initialSort);

  const updateSort = useCallback((field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const sortedData = useCallback(<T extends Record<string, any>>(data: T[]): T[] => {
    if (!data || data.length === 0) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];
      
      if (aVal === bVal) return 0;
      
      const result = aVal < bVal ? -1 : 1;
      return sort.direction === 'asc' ? result : -result;
    });
  }, [sort]);

  return {
    sort,
    updateSort,
    sortedData
  };
};

// Optimized admin page hook that combines all common patterns
export const useAdminPage = <T extends object, D = any>(
  initialFilters: T,
  loadFunction: (filters: T) => Promise<{ content: D[]; totalElements: number; totalPages: number }>,
  pageSize = 10
) => {
  const pagination = usePagination(pageSize);
  const [data, setData] = useState<D[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const response = await loadFunction({
        ...initialFilters,
        page: pagination.currentPage,
        size: pagination.pageSize
      } as T);

      setData(response.content || []);
      pagination.updatePagination(response);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
      console.error('Admin page error:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [loadFunction, pagination.currentPage, pagination.pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    ...pagination,
    refresh: () => loadData(true)
  };
};
