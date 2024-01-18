import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cache } from 'react';

export async function GET(request){
    const createRouteSupabaseClient = cache(() => {
        const cookieStore = cookies()
        return createRouteHandlerClient({ cookies: () => cookieStore })
      })

    const supabase = createRouteSupabaseClient()
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code){
        console.log("Found code")
        await supabase.auth.exchangeCodeForSession(code);
    }
    else{
        console.log("No code found")
        console.log("requestUrl", requestUrl)
    }

    return NextResponse.redirect(requestUrl.origin);
}