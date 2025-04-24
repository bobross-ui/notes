'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; // Import Supabase client

export default function SignUpPage() {
  const router = useRouter(); // Initialize router
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // For success/info messages
  const supabase = createSupabaseBrowserClient();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Optional: Add password confirmation check here if you add the field

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Optional: Email redirect URL after confirmation
        // emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      console.error('Sign up error:', error.message);
      setError(error.message);
    } else if (data.user && data.user.identities?.length === 0) {
        // This can happen in Supabase if signups are disabled, the user might exist but is not confirmed.
        setError("Sign up failed. The user might already exist or signups could be disabled.");
    } else if (data.session) {
      // User signed up and logged in immediately (e.g., if email confirmation is disabled)
      setMessage('Sign up successful! Redirecting...');
      router.push('/'); // Redirect to dashboard
      router.refresh();
    } else if (data.user) {
      // User signed up but needs email confirmation
      setMessage('Sign up successful! Please check your email to confirm your account.');
      // Optionally redirect to a page telling them to check email, or stay here.
      // router.push('/check-email');
    } else {
      // Unexpected case
       setError("An unexpected error occurred during sign up.");
    }
  };

  // Google Sign Up uses the same logic as Google Login
  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect to the server-side callback route
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    // No need to handle loading/error here as redirect happens
    if (error) {
       // Log error if redirect fails immediately (unlikely)
      console.error('Google sign up initiation error:', error.message);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Sign Up</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>} {/* Display success/info message */}
      <form onSubmit={handleSignUp}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            disabled={loading}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={6}
            disabled={loading}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', marginBottom: '10px', cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? 'Signing up...' : 'Sign Up with Email/Password'}
        </button>
      </form>
      <button onClick={handleGoogleSignUp} disabled={loading} style={{ width: '100%', padding: '10px', cursor: loading ? 'wait' : 'pointer', backgroundColor: '#eee' }}>
        {loading ? 'Redirecting...' : 'Sign up with Google'}
      </button>
      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
} 