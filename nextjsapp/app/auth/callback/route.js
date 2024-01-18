import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request){
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({cookies: () => cookieStore})
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code){
        await supabase.auth.exchangeCodeForSession(code);
    }

    return NextResponse.redirect(requestUrl.origin);
}