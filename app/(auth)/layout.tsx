import React from 'react';
import Navbar from '@/components/layout/Navbar';

// This layout wraps all auth pages
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar showAuthButtons={false} />
      
      <main className="flex-1 flex items-center justify-center">
        {children}
      </main>
    </div>
  );
} 