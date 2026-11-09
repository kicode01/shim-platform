import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';
  const pathname = url.pathname;

  // Skip static assets, API routes, and Auth pages so they work globally
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/validate') ||
    pathname.startsWith('/attend') ||
    pathname.startsWith('/kiosk') ||
    pathname.startsWith('/scanner')
  ) {
    return NextResponse.next();
  }

  const isStudio = hostname.includes('shim-studio');
  const isWallet = hostname.includes('shim-wallet');

  // Organizer Workspace (shim-studio)
  if (isStudio) {
    // Redirect access to portal from studio domain to the participant wallet
    if (pathname.startsWith('/portal')) {
      const rest = pathname.replace(/^\/portal/, '') || '';
      return NextResponse.redirect(new URL(`https://shim-wallet.vercel.app${rest}`, req.url));
    }

    // Redirect root to /dashboard so client routers and active tabs match
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    // Map subpaths to /dashboard seamlessly
    if (!pathname.startsWith('/dashboard')) {
      url.pathname = `/dashboard${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Participant Wallet (shim-wallet)
  if (isWallet) {
    // Redirect access to dashboard from wallet domain to the organizer studio
    if (pathname.startsWith('/dashboard')) {
      const rest = pathname.replace(/^\/dashboard/, '') || '';
      return NextResponse.redirect(new URL(`https://shim-studio.vercel.app${rest}`, req.url));
    }

    // Redirect root to /portal so client routers and active tabs match
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/portal', req.url));
    }

    // Map subpaths to /portal seamlessly
    if (!pathname.startsWith('/portal')) {
      url.pathname = `/portal${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Main Domain (HQ) - Allow dashboard and portal to resolve normally


  return NextResponse.next();
}
