'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';

export default function ReactQueryProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // This ensures that data is not shared between different users and requests
  // while still only creating the QueryClient once per component lifecycle
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 