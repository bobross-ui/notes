import React from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  error: string | Error | unknown;
  className?: string;
}

export function ErrorMessage({ 
  title = 'Error', 
  error, 
  className 
}: ErrorMessageProps) {
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : 'An unknown error occurred';

  return (
    <Alert variant="destructive" className={cn(className)}>
      <XCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
} 