import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

// This layout wraps all pages inside the (dashboard) group
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar showAuthButtons={true} />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 px-4 md:px-6 py-6 overflow-y-auto">
          <div className="mx-auto max-w-4xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 