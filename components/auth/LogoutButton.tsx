'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Instantiate client inside the component or a hook
  // To avoid calling Browser client creation on the server side
  const supabase = createSupabaseBrowserClient();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error logging out:', error.message);
        alert(`Error logging out: ${error.message}`); // Simple feedback
      } else {
        // Redirect to login page after successful logout
        router.push('/login');
         // Refresh the page to clear any potentially cached user state in layouts
        router.refresh();
      }
    } catch (err) {
        console.error('Unexpected error during logout:', err);
        alert('An unexpected error occurred during logout.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      disabled={loading} 
      variant="outline"
      size="sm"
      className={className}
    >
      {loading ? 'Logging out...' : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </>
      )}
    </Button>
  );
} 