import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Don't check auth on callback route to avoid interfering with PKCE flow
  if (request.nextUrl.pathname === '/auth/callback') {
    return supabaseResponse;
  }

  // Refresh session if expired
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      // Ignore "Session Missing" error (normal for unauthenticated users)
      if (error.message.includes('Auth session missing')) {
        return supabaseResponse;
      }

      // If error (like 'Refresh Token Not Found'), clear cookies to force re-login
      // This prevents the infinite loop / crash
      // request.cookies.delete('sb-...'); // Server action can't delete directly on request object usually in middleware flow like this easily without response
      // But simply completing response without setting new cookies might work, OR we explicitly delete in response

      console.log("Middleware Auth Error, clearing session:", error.message);
      const response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });

      // Clear all supabase cookies
      request.cookies.getAll().forEach(cookie => {
        if (cookie.name.startsWith('sb-')) {
          response.cookies.delete(cookie.name);
        }
      });

      return response;
    }
  } catch (e) {
    // Catch unexpected errors
    console.error("Middleware Crash:", e);
  }

  return supabaseResponse;
}
