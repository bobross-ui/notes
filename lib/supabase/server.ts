import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Define the function to create the server client
// Make it async because cookies() is async
export const createSupabaseServerClient = async () => {
  // Get the cookie store from next/headers and await it
  const cookieStore = await cookies();

  // Create and return the Supabase client
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Provide the updated cookie handling configuration
      cookies: {
        getAll() {
          // Return all cookies from the store
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Use a try-catch block for potential errors in Server Components
          try {
            // Iterate and set each cookie using the provided details
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // The `setAll` method might be called from a Server Component.
            // This can often be ignored if middleware handles session refreshes.
            // Optionally log the error: console.error("Failed to set cookies in Server Component:", error);
          }
        },
        // Note: The 'remove' method is not typically needed here as Supabase handles
        // session invalidation via setting expiration on existing cookies.
        // If specific cookie removal logic is needed outside session management,
        // it might need to be handled differently.
      },
    }
  );
};

// Note: If you need to perform admin actions, you might create another function
// using the SERVICE_ROLE_KEY, but be extremely careful with its usage.
// Example (use with caution):
// import { createClient } from '@supabase/supabase-js';
// export const createSupabaseAdminClient = () => {
//   if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
//     throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
//   }
//   return createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY
//     // Admin client options might differ, e.g., no autoRefreshToken
//     // { auth: { autoRefreshToken: false, persistSession: false } }
//   );
// }; 