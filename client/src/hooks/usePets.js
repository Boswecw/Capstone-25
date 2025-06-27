// client/src/hooks/usePets.js - Production Ready Version
import { useState, useEffect, useCallback, useRef } from 'react';

// ===== CONFIGURATION =====

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Request timeout in milliseconds (10 seconds)
const REQUEST_TIMEOUT = 10000;

// ===== HELPER FUNCTIONS =====

/**
 * Creates an AbortController with timeout
 * @param {number} timeout - Timeout in milliseconds
 * @returns {AbortController}
 */
const createTimeoutController = (timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Clear timeout if request completes
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId);
  });
  
  return controller;
};

/**
 * Makes authenticated API requests
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>}
 */
const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const controller = createTimeoutController();
  
  const config = {
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If error response isn't JSON, use default message
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Handle different API response formats
    if (data.success !== undefined) {
      return data.success ? data : { error: data.message || 'Operation failed' };
    }
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

// ===== MAIN HOOK =====

/**
 * Custom hook for managing pets data and operations
 * @param {Object} options - Hook configuration options
 * @returns {Object} - Pet data and operations
 */
export const usePets = (options = {}) => {
  const {
    initialFilters = {},
    enableCache = true,
    autoFetch = true,
    onError = null,
    onSuccess = null
  } = options;

  // ===== STATE =====
  
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // Cache and refs
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);
  const lastFetchRef = useRef(null);

  // ===== UTILITY FUNCTIONS =====

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handles errors consistently
   * @param {Error} error - Error object
   * @param {string} operation - Operation that failed
   */
  const handleError = useCallback((error, operation = 'operation') => {
    const errorMessage = error.message || `Failed to ${operation}`;
    setError(errorMessage);
    console.error(`usePets ${operation} error:`, error);
    
    if (onError) {
      onError(error, operation);
    }
  }, [onError]);

  /**
   * Handles successful operations
   * @param {*} data - Success data
   * @param {string} operation - Operation that succeeded
   */
  const handleSuccess = useCallback((data, operation = 'operation') => {
    if (onSuccess) {
      onSuccess(data, operation);
    }
  }, [onSuccess]);

  /**
   * Generates cache key for requests
   * @param {Object} filters - Filters object
   * @param {number} page - Page number
   * @returns {string}
   */
  const getCacheKey = useCallback((filters = {}, page = 1) => {
    return JSON.stringify({ filters, page, timestamp: Math.floor(Date.now() / CACHE_DURATION) });
  }, []);

  /**
   * Updates pagination state
   * @param {Object} paginationData - Pagination data from API
   */
  const updatePagination = useCallback((paginationData) => {
    setPagination(prev => ({
      ...prev,
      ...paginationData,
      hasNext: paginationData.page < paginationData.totalPages,
      hasPrev: paginationData.page > 1
    }));
  }, []);

  // ===== CORE API FUNCTIONS =====

  /**
   * Fetches pets with filters and pagination
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {boolean} useCache - Whether to use cache
   * @returns {Promise<Array>}
   */
  const fetchPets = useCallback(async (filters = {}, page = 1, useCache = enableCache) => {
    const cacheKey = getCacheKey(filters, page);
    
    // Check cache first
    if (useCache && cacheRef.current.has(cacheKey)) {
      const cachedData = cacheRef.current.get(cacheKey);
      setPets(cachedData.pets);
      updatePagination(cachedData.pagination);
      return cachedData.pets;
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      setLoading(true);
      setError(null);
      
      const controller = createTimeoutController();
      abortControllerRef.current = controller;

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await makeAuthenticatedRequest(
        `/pets?${queryParams}`,
        { signal: controller.signal }
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const petsData = response.data?.pets || response.pets || response.data || response;
      const paginationData = response.data?.pagination || response.pagination || {
        page,
        limit: pagination.limit,
        total: Array.isArray(petsData) ? petsData.length : 0,
        totalPages: 1
      };

      // Ensure pets is always an array
      const petsArray = Array.isArray(petsData) ? petsData : [];
      
      setPets(petsArray);
      updatePagination(paginationData);

      // Cache the results
      if (useCache) {
        cacheRef.current.set(cacheKey, {
          pets: petsArray,
          pagination: paginationData,
          timestamp: Date.now()
        });
      }

      lastFetchRef.current = { filters, page };
      handleSuccess(petsArray, 'fetch pets');
      
      return petsArray;
    } catch (error) {
      if (error.name !== 'AbortError') {
        handleError(error, 'fetch pets');
      }
      return [];
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [enableCache, getCacheKey, updatePagination, pagination.limit, handleError, handleSuccess]);

  /**
   * Fetches featured pets
   * @returns {Promise<Array>}
   */
  const fetchFeaturedPets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest('/pets/featured');
      
      if (response.error) {
        throw new Error(response.error);
      }

      const featuredPets = response.data || response;
      const petsArray = Array.isArray(featuredPets) ? featuredPets : [];
      
      handleSuccess(petsArray, 'fetch featured pets');
      return petsArray;
    } catch (error) {
      handleError(error, 'fetch featured pets');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Fetches pets by type
   * @param {string} type - Pet type
   * @returns {Promise<Array>}
   */
  const fetchPetsByType = useCallback(async (type) => {
    if (!type) {
      handleError(new Error('Pet type is required'), 'fetch pets by type');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/pets/type/${encodeURIComponent(type)}`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      const typePets = response.data || response;
      const petsArray = Array.isArray(typePets) ? typePets : [];
      
      setPets(petsArray);
      handleSuccess(petsArray, `fetch ${type} pets`);
      return petsArray;
    } catch (error) {
      handleError(error, `fetch ${type} pets`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Gets a single pet by ID
   * @param {string} id - Pet ID
   * @returns {Promise<Object|null>}
   */
  const getPetById = useCallback(async (id) => {
    if (!id) {
      handleError(new Error('Pet ID is required'), 'get pet');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/pets/${encodeURIComponent(id)}`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      const pet = response.data || response;
      handleSuccess(pet, 'get pet');
      return pet;
    } catch (error) {
      handleError(error, 'get pet');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  // ===== CRUD OPERATIONS =====

  /**
   * Adds a new pet
   * @param {Object} petData - Pet data
   * @returns {Promise<Object|null>}
   */
  const addPet = useCallback(async (petData) => {
    if (!petData) {
      handleError(new Error('Pet data is required'), 'add pet');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest('/pets', {
        method: 'POST',
        body: JSON.stringify(petData)
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const newPet = response.data || response;
      
      // Add to current pets list if it's a local add
      setPets(prev => [newPet, ...prev]);
      
      // Clear cache to force refresh
      cacheRef.current.clear();
      
      handleSuccess(newPet, 'add pet');
      return newPet;
    } catch (error) {
      handleError(error, 'add pet');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Updates an existing pet
   * @param {string} id - Pet ID
   * @param {Object} petData - Updated pet data
   * @returns {Promise<Object|null>}
   */
  const updatePet = useCallback(async (id, petData) => {
    if (!id || !petData) {
      handleError(new Error('Pet ID and data are required'), 'update pet');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/pets/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(petData)
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const updatedPet = response.data || response;
      
      // Update in current pets list
      setPets(prev => prev.map(pet => 
        pet._id === id ? { ...pet, ...updatedPet } : pet
      ));
      
      // Clear cache to force refresh
      cacheRef.current.clear();
      
      handleSuccess(updatedPet, 'update pet');
      return updatedPet;
    } catch (error) {
      handleError(error, 'update pet');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Deletes a pet
   * @param {string} id - Pet ID
   * @returns {Promise<boolean>}
   */
  const deletePet = useCallback(async (id) => {
    if (!id) {
      handleError(new Error('Pet ID is required'), 'delete pet');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/pets/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Remove from current pets list
      setPets(prev => prev.filter(pet => pet._id !== id));
      
      // Clear cache to force refresh
      cacheRef.current.clear();
      
      handleSuccess(true, 'delete pet');
      return true;
    } catch (error) {
      handleError(error, 'delete pet');
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  // ===== INTERACTIVE OPERATIONS =====

  /**
   * Votes on a pet (upvote/downvote)
   * @param {string} id - Pet ID
   * @param {string} voteType - 'up' or 'down'
   * @returns {Promise<Object|null>}
   */
  const votePet = useCallback(async (id, voteType) => {
    if (!id || !['up', 'down'].includes(voteType)) {
      handleError(new Error('Valid pet ID and vote type (up/down) are required'), 'vote pet');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/pets/${encodeURIComponent(id)}/vote`, {
        method: 'POST',
        body: JSON.stringify({ voteType })
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const updatedPet = response.data || response;
      
      // Update pet in current list
      setPets(prev => prev.map(pet => 
        pet._id === id ? { ...pet, votes: updatedPet.votes } : pet
      ));
      
      handleSuccess(updatedPet, `${voteType}vote pet`);
      return updatedPet;
    } catch (error) {
      handleError(error, `${voteType}vote pet`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  /**
   * Rates a pet
   * @param {string} id - Pet ID
   * @param {number} rating - Rating (1-5)
   * @param {string} comment - Optional comment
   * @returns {Promise<Object|null>}
   */
  const ratePet = useCallback(async (id, rating, comment = '') => {
    if (!id || !rating || rating < 1 || rating > 5) {
      handleError(new Error('Valid pet ID and rating (1-5) are required'), 'rate pet');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/pets/${encodeURIComponent(id)}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const updatedPet = response.data || response;
      
      // Update pet in current list
      setPets(prev => prev.map(pet => 
        pet._id === id ? { ...pet, ratings: updatedPet.ratings } : pet
      ));
      
      handleSuccess(updatedPet, 'rate pet');
      return updatedPet;
    } catch (error) {
      handleError(error, 'rate pet');
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, handleSuccess]);

  // ===== CLIENT-SIDE UTILITIES =====

  /**
   * Filters pets by type on client side
   * @param {string} type - Pet type
   * @returns {Array}
   */
  const filterPetsByType = useCallback((type) => {
    if (!type) return pets;
    return pets.filter(pet => 
      pet.type?.toLowerCase() === type.toLowerCase()
    );
  }, [pets]);

  /**
   * Filters pets by availability status
   * @param {boolean} available - Availability status
   * @returns {Array}
   */
  const filterPetsByStatus = useCallback((available) => {
    return pets.filter(pet => pet.available === available);
  }, [pets]);

  /**
   * Searches pets by name or description
   * @param {string} query - Search query
   * @returns {Array}
   */
  const searchPets = useCallback((query) => {
    if (!query) return pets;
    
    const searchTerm = query.toLowerCase();
    return pets.filter(pet => 
      pet.name?.toLowerCase().includes(searchTerm) ||
      pet.description?.toLowerCase().includes(searchTerm) ||
      pet.breed?.toLowerCase().includes(searchTerm)
    );
  }, [pets]);

  /**
   * Gets pet statistics
   * @returns {Object}
   */
  const getPetStats = useCallback(() => {
    const total = pets.length;
    const available = pets.filter(pet => pet.available).length;
    const adopted = total - available;
    
    const byType = pets.reduce((acc, pet) => {
      const type = pet.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const averagePrice = total > 0 
      ? pets.reduce((sum, pet) => sum + (pet.price || 0), 0) / total
      : 0;

    return {
      total,
      available,
      adopted,
      byType,
      averagePrice: Math.round(averagePrice * 100) / 100
    };
  }, [pets]);

  /**
   * Refreshes current data
   * @returns {Promise<Array>}
   */
  const refresh = useCallback(() => {
    cacheRef.current.clear();
    if (lastFetchRef.current) {
      return fetchPets(lastFetchRef.current.filters, lastFetchRef.current.page, false);
    }
    return fetchPets({}, 1, false);
  }, [fetchPets]);

  // ===== EFFECTS =====

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchPets(initialFilters, 1);
    }
  }, [autoFetch, initialFilters, fetchPets]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ===== RETURN API =====

  return {
    // Data
    pets,
    loading,
    error,
    pagination,

    // Core API operations
    fetchPets,
    fetchFeaturedPets,
    fetchPetsByType,
    getPetById,

    // CRUD operations
    addPet,
    updatePet,
    deletePet,

    // Interactive operations
    votePet,
    ratePet,

    // Client-side utilities
    filterPetsByType,
    filterPetsByStatus,
    searchPets,
    getPetStats,

    // Utility functions
    refresh,
    clearError,
    
    // Pagination helpers
    hasNextPage: pagination.hasNext,
    hasPrevPage: pagination.hasPrev,
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    totalItems: pagination.total
  };
};

export default usePets;