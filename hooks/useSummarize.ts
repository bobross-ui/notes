import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

interface SummarizeResponse {
  summary?: string;
  error?: string;
}

/**
 * Calculate a simple hash for content to use as cache key
 */
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

/**
 * Standalone function to get a summary that doesn't require React hooks
 * This can be used in server actions or other non-hook contexts
 */
export async function fetchSummary(content: string): Promise<SummarizeResponse> {
  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to generate summary' };
    }

    return { summary: data.summary };
  } catch (error) {
    console.error('Error calling summarize API:', error);
    return { error: 'Failed to connect to summarization service' };
  }
}

/**
 * Custom hook to fetch and cache a summary for specific content
 */
export function useSummary(content: string) {
  const contentKey = hashContent(content);
  const queryClient = useQueryClient();
  
  // Query hook to retrieve cached summaries
  const summaryQuery = useQuery({
    queryKey: ['summary', contentKey],
    queryFn: async (): Promise<SummarizeResponse> => {
      // This will never execute if we use enabled: false below
      // It's just a placeholder for the query structure
      return { summary: '' };
    },
    // Disable automatic fetching - we'll populate the cache via mutation
    enabled: false,
  });

  // Mutation hook that will store its result in the query cache
  const summarizeMutation = useMutation<SummarizeResponse, Error, void>({
    mutationFn: async (): Promise<SummarizeResponse> => {
      return fetchSummary(content);
    },
    onSuccess: (data) => {
      // Store the result in the React Query cache using the content hash as key
      queryClient.setQueryData(['summary', contentKey], data);
    },
  });

  // Function to trigger summarization only if not already cached
  const getSummary = async () => {
    // Check if we already have this summary in cache
    const existingData = queryClient.getQueryData<SummarizeResponse>(['summary', contentKey]);
    
    if (existingData?.summary) {
      // Data already exists in cache, return it without calling the API again
      return existingData;
    }
    
    // No cached data, call the API
    return summarizeMutation.mutateAsync();
  };

  return {
    data: summaryQuery.data,
    getSummary,
    isLoading: summarizeMutation.isPending,
    isError: summarizeMutation.isError || (summarizeMutation.data?.error !== undefined),
    error: summarizeMutation.error?.message || summarizeMutation.data?.error,
  };
} 