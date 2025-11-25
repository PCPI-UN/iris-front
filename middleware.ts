import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/register',
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

  console.log('Middleware - Access Token:', accessToken)

  if (!accessToken) {
    console.log('Middleware - No Access Token, redirecting to login')
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // El usuario está autenticado, permitir acceso
  // La autorización de roles se maneja en los componentes con RoleGuard
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/app/:path*',
  ],
}
