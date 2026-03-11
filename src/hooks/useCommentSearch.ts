import { useState, useEffect, useRef, useCallback } from 'react';

export interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

interface UseCommentSearchResult {
  query: string;
  setQuery: (q: string) => void;
  results: Comment[];
  isLoading: boolean;
  error: string | null;
}

const DEBOUNCE_MS = 250;
const API_URL = 'https://jsonplaceholder.typicode.com/comments';

export function useCommentSearch(): UseCommentSearchResult {
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch all comments once
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    fetch(API_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Comment[]>;
      })
      .then((data) => {
        setAllComments(data);
        setFetchError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setFetchError('Failed to load comments. Please try again later.');
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  // Debounced client-side search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      searchIdRef.current++;
      return;
    }

    if (fetchError) {
      setError(fetchError);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const currentSearchId = ++searchIdRef.current;

    debounceRef.current = setTimeout(() => {
      // Guard against stale searches
      if (currentSearchId !== searchIdRef.current) return;

      try {
        const filtered = allComments.filter((c) =>
          c.body.toLowerCase().includes(trimmed)
        );
        // Only apply if this is still the latest search
        if (currentSearchId === searchIdRef.current) {
          setResults(filtered);
          setIsLoading(false);
        }
      } catch {
        if (currentSearchId === searchIdRef.current) {
          setError('Something went wrong while searching.');
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, allComments, fetchError]);

  const stableSetQuery = useCallback((q: string) => {
    setQuery(q);
  }, []);

  return { query, setQuery: stableSetQuery, results, isLoading, error };
}
