import { NextResponse } from 'next/server';

const BYPASS_KEY     = process.env.MAINTENANCE_BYPASS_KEY || 'admin';
const BYPASS_COOKIE  = 'efb_bypass';

export function middleware(request) {
  const MAINTENANCE    = process.env.MAINTENANCE_MODE === 'true';
  const { pathname, searchParams } = request.nextUrl;

  // ── Step 1: Activate bypass via ?bypass=yourkey ──
  if (searchParams.get('bypass') === BYPASS_KEY) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('bypass');          // clean up URL
    const res = NextResponse.redirect(url);
    res.cookies.set(BYPASS_COOKIE, BYPASS_KEY, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7                  // 7 days
    });
    return res;
  }

  // ── Step 2: If maintenance is off, do nothing ──
  if (!MAINTENANCE) return NextResponse.next();

  // ── Step 3: Skip static assets & API routes ──
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.match(/\.(ico|png|jpg|svg|webp|css|js)$/)
  ) return NextResponse.next();

  // ── Step 4: Check for admin bypass cookie ──
  const bypassCookie = request.cookies.get(BYPASS_COOKIE)?.value;
  if (bypassCookie === BYPASS_KEY) return NextResponse.next();

  // ── Step 5: Everyone else → maintenance page ──
  if (pathname !== '/maintenance') {
    return NextResponse.rewrite(new URL('/maintenance.html', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
