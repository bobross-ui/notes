'use client';

import React from 'react';
import Link from 'next/link';
import { ModeToggle } from '@/components/ui/mode-toggle';
import LogoutButton from '@/components/auth/LogoutButton';
import { StickyNote } from 'lucide-react';
import MobileNav from './MobileNav';

interface NavbarProps {
  showAuthButtons?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ showAuthButtons = true }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center">
          <div className="md:hidden mr-2">
            <MobileNav />
          </div>
          
          <Link href="/" className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            <span className="text-lg font-semibold">notes.</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <ModeToggle />
          {showAuthButtons && <LogoutButton className="hidden md:inline-flex" />}
        </div>
      </nav>
    </header>
  );
};

export default Navbar; 