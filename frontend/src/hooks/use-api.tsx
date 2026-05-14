import { useState, useCallback, useEffect } from "react";
import { ApiErrorResponse } from "./api-enhanced";

/**
 * useAsync Hook - Handle async operations with loading and error states
 */
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true,
  dependencies: unknown[] = []
) {
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus("pending");
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setData(response);
      setStatus("success");
      return response;
    } catch (err) {
      const error =
        err instanceof ApiErrorResponse
          ? (err as unknown as E)
          : (String(err) as unknown as E);
      setError(error);
      setStatus("error");
      throw err;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate, ...dependencies]);

  return {
    execute,
    status,
    data,
    error,
    isLoading: status === "pending",
    isError: status === "error",
    isSuccess: status === "success",
  };
}

/**
 * useRequest Hook - Simplified API request with error handling
 */
export function useRequest<T>(
  fn: (...args: any[]) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: any[]) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fn(...args);
        setData(result);
        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : err instanceof ApiErrorResponse
            ? err.message
            : "An error occurred";

        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fn]
  );

  return {
    execute,
    data,
    error,
    isLoading,
  };
}

/**
 * useForm Hook - Handle form state and submission
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>
) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const finalValue =
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value;

      setValues((prev) => ({
        ...prev,
        [name]: finalValue,
      }));

      if (errors[name as keyof T]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name as keyof T];
          return next;
        });
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        await onSubmit(values);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : err instanceof ApiErrorResponse
            ? err.message
            : "Submission failed";

        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setSubmitError(null);
  }, [initialValues]);

  const setFieldError = useCallback(
    (field: keyof T, message: string) => {
      setErrors((prev) => ({
        ...prev,
        [field]: message,
      }));
    },
    []
  );

  return {
    values,
    setValues,
    errors,
    setFieldError,
    handleChange,
    handleSubmit,
    reset,
    isSubmitting,
    submitError,
  };
}

/**
 * usePagination Hook - Handle pagination state
 */
export function usePagination(initialPage: number = 1, pageSize: number = 10) {
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / pageSize);

  const goToPage = useCallback((pageNumber: number) => {
    setPage(Math.max(1, Math.min(pageNumber, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  return {
    page,
    pageSize,
    total,
    setTotal,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * useLocalStorage Hook - Persist state to localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === "undefined") {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch {
        console.error(`Failed to save to localStorage: ${key}`);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * useDebounce Hook - Debounce a value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
