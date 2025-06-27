// client/src/hooks/useApiCall.js - Complete Enhanced Version
import { useState, useCallback, useRef, useEffect } from "react";
import { handleApiError } from "../utils/apiErrorHandler";

export const useApiCall = (options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [lastExecutedAt, setLastExecutedAt] = useState(null);

  // Track abort controller for cancellation
  const abortControllerRef = useRef(null);

  // Default options
  const {
    onSuccess,
    onError,
    onFinally,
    retries = 0,
    retryDelay = 1000,
    timeout = 30000,
    enableCaching = false,
    cacheKey = null,
  } = options;

  // Simple cache implementation
  const cacheRef = useRef(new Map());

  const execute = useCallback(
    async (
      apiCall,
      errorMessage = "An error occurred",
      executeOptions = {},
    ) => {
      // Check cache first if enabled
      if (enableCaching && cacheKey && cacheRef.current.has(cacheKey)) {
        const cachedData = cacheRef.current.get(cacheKey);
        setData(cachedData);
        return cachedData;
      }

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);
        setLastExecutedAt(new Date());

        // Retry logic - restructured to avoid closure issues
        const executeWithRetry = async (currentAttempt) => {
          try {
            // Add timeout wrapper
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Request timeout")), timeout),
            );

            const apiPromise = apiCall(abortControllerRef.current.signal);
            const result = await Promise.race([apiPromise, timeoutPromise]);

            // Handle different response formats
            let processedResult;
            if (result?.data) {
              processedResult = result.data;
            } else if (result?.success && result?.data !== undefined) {
              processedResult = result.data;
            } else {
              processedResult = result;
            }

            setData(processedResult);

            // Cache result if enabled
            if (enableCaching && cacheKey) {
              cacheRef.current.set(cacheKey, processedResult);
            }

            // Call success callback
            if (onSuccess) {
              onSuccess(processedResult);
            }

            return processedResult;
          } catch (err) {
            // Don't retry on abort or authentication errors
            if (err.name === "AbortError" || err.response?.status === 401) {
              throw err;
            }

            // If we have retries left, try again
            if (currentAttempt < retries) {
              const nextAttempt = currentAttempt + 1;
              console.log(
                `Retrying API call (attempt ${nextAttempt}/${retries + 1})...`,
              );

              // Wait before retrying with exponential backoff
              await new Promise((resolve) =>
                setTimeout(resolve, retryDelay * nextAttempt),
              );

              // Recursive retry
              return executeWithRetry(nextAttempt);
            }

            // No more retries, throw the error
            throw err;
          }
        };

        // Start execution
        return await executeWithRetry(0);
      } catch (err) {
        // Don't set error state if request was aborted
        if (err.name !== "AbortError") {
          const errorMsg = handleApiError(err, errorMessage);
          setError(errorMsg);

          if (onError) {
            onError(err, errorMsg);
          }
        }

        throw err;
      } finally {
        setLoading(false);
        abortControllerRef.current = null;

        if (onFinally) {
          onFinally();
        }
      }
    },
    [
      retries,
      retryDelay,
      timeout,
      enableCaching,
      cacheKey,
      onSuccess,
      onError,
      onFinally,
    ],
  );

  // Cancel current request
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear data
  const clearData = useCallback(() => {
    setData(null);
  }, []);

  // Clear cache
  const clearCache = useCallback(
    (key = cacheKey) => {
      if (key) {
        cacheRef.current.delete(key);
      } else {
        cacheRef.current.clear();
      }
    },
    [cacheKey],
  );

  // Reset all states
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
    setLastExecutedAt(null);
    cancel();
  }, [cancel]);

  return {
    execute,
    loading,
    error,
    data,
    lastExecutedAt,
    cancel,
    clearError,
    clearData,
    clearCache,
    reset,
    // Computed properties
    isIdle: !loading && !error && !data,
    isSuccess: !loading && !error && data !== null,
    isError: !loading && error !== null,
  };
};

// Specialized hook for mutations (POST, PUT, DELETE)
export const useMutation = (mutationFn, options = {}) => {
  const { onSuccess, onError, onMutate, ...apiCallOptions } = options;

  const { execute, ...rest } = useApiCall(apiCallOptions);

  const mutate = useCallback(
    async (variables, mutateOptions = {}) => {
      try {
        // Call onMutate before starting
        if (onMutate) {
          await onMutate(variables);
        }

        const result = await execute(
          (signal) => mutationFn(variables, signal),
          mutateOptions.errorMessage || "Mutation failed",
        );

        return result;
      } catch (error) {
        throw error;
      }
    },
    [execute, mutationFn, onMutate],
  );

  return {
    mutate,
    ...rest,
  };
};

// Specialized hook for queries with automatic execution
export const useQuery = (queryKey, queryFn, options = {}) => {
  const {
    enabled = true,
    refetchOnMount = true,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    ...apiCallOptions
  } = options;

  const { execute, data, lastExecutedAt, ...rest } = useApiCall({
    enableCaching: true,
    cacheKey: queryKey,
    ...apiCallOptions,
  });

  // Check if data is stale
  const isStale = useCallback(() => {
    if (!lastExecutedAt || !data) return true;
    return Date.now() - new Date(lastExecutedAt).getTime() > staleTime;
  }, [lastExecutedAt, data, staleTime]);

  // Auto-execute query
  const executeQuery = useCallback(() => {
    if (enabled && (refetchOnMount || isStale())) {
      return execute(
        (signal) => queryFn(signal),
        `Failed to fetch ${queryKey}`,
      );
    }
  }, [enabled, execute, queryFn, queryKey, refetchOnMount, isStale]);

  // Execute on mount if enabled
  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  return {
    refetch: executeQuery,
    isStale: isStale(),
    data,
    lastExecutedAt,
    ...rest,
  };
};

// Utility function for creating API calls with your service
export const createApiCall = (apiService) => {
  return (endpoint, options = {}) =>
    (signal) => {
      return apiService({
        url: endpoint,
        signal,
        ...options,
      });
    };
};

// Enhanced error handler utility
export const enhancedHandleApiError = (
  error,
  customMessage = "An error occurred",
) => {
  // Handle abort errors
  if (error.name === "AbortError") {
    return "Request was cancelled";
  }

  // Handle timeout errors
  if (error.message === "Request timeout") {
    return "Request timed out. Please try again.";
  }

  // Handle network errors
  if (!error.response && error.message === "Network Error") {
    return "Network error. Please check your connection.";
  }

  // Handle different response status codes
  if (error.response) {
    switch (error.response.status) {
      case 400:
        return error.response.data?.message || "Bad request";
      case 401:
        return "Authentication required. Please log in.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return error.response.data?.message || "Conflict occurred";
      case 422:
        return error.response.data?.message || "Validation failed";
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return error.response.data?.message || customMessage;
    }
  }

  return error.message || customMessage;
};

// Example usage with your existing API service
export const useApiWithService = (apiService) => {
  return useApiCall({
    onError: (error, errorMsg) => {
      console.error("API Error:", error);
      // You could also dispatch to a global error state here
    },
  });
};

export default useApiCall;
