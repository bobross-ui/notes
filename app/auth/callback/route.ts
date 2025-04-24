import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Import the helper

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/'; // Default redirect to root

  if (code) {
    // No need to call cookies() directly, the helper handles it
    const supabase = await createSupabaseServerClient(); // Use the helper function
    // Note: Await is needed because the helper is async
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Successful code exchange, redirect to the original intended path or root
      return NextResponse.redirect(`${origin}${next}`);
    }
    // Log error if code exchange fails
    console.error('Error exchanging OAuth code:', error.message);
  }

  // If no code or an error occurred, redirect to an error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
} 