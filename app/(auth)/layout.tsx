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
      
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} AI-Powered Notes App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 