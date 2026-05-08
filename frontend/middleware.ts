import { NextResponse } from 'next/server';

// الحماية الفعلية تتم عبر:
// 1) DashboardLayout (يفحص localStorage.accessToken ويوجّه لـ /login)
// 2) الـ API endpoints (تتطلب Bearer token)
// الـ refresh_token cookie مقيّد بـ Path=/api/v1/auth ولا يصل لطلبات Next.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
