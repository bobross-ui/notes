import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create an outgoing response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update request and response cookies
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ // Re-create response to apply cookie changes
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
           // Update request and response cookies
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ // Re-create response to apply cookie changes
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  // Define protected and auth routes
  const protectedPaths = ['/', '/notes'];
  const authPaths = ['/login', '/signup'];
  const pathname = request.nextUrl.pathname;

  const isProtectedPath = protectedPaths.some(path =>
    pathname === path || (path !== '/' && pathname.startsWith(`${path}/`))
  );

  // Redirect unauthenticated users from protected routes to login
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth routes to root
  if (user && authPaths.includes(pathname)) {
     const url = request.nextUrl.clone();
     url.pathname = '/';
     return NextResponse.redirect(url);
  }

  // Return the response (potentially modified with new cookies)
  return response;
}

// Config to specify paths for middleware execution
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}; 