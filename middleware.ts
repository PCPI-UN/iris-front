import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/public',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((publicPath) => 
    pathname === publicPath || pathname.startsWith(`${publicPath}/`)
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Verificar si existe el token de acceso
  const accessToken = req.cookies.get('access_token')?.value

  if (!accessToken) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/app/:path*',
  ],
}
