"use client"

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/auth'
import { User } from '@/types/api'

export type RoleGuardProps = {
  roles: Array<User['platformRoles'][number]['name']>
  children: ReactNode
  fallback?: ReactNode
  redirectTo?: string
  loading?: ReactNode
}


export function RoleGuard({ 
  roles, 
  children, 
  fallback, 
  redirectTo, 
  loading 
}: RoleGuardProps) {
  const router = useRouter()
  const { data: user, isLoading } = useUser()

  useEffect(() => {
    if (!isLoading) {
      const hasPermission = user && roles.some(role => user.platformRoles.some(userRole => userRole.name === role))
      
      // Si no tiene permiso, redirigir a /app siempre
      if (!hasPermission) {
        const redirectPath = redirectTo || '/app'
        router.replace(redirectPath)
      }
    }
  }, [isLoading, user, roles, redirectTo, router])

  // Mostrar loading mientras se obtiene el usuario
  if (isLoading) {
    return (
      <>
        {loading || (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
            </div>
          </div>
        )}
      </>
    )
  }

  const hasPermission = user && roles.some(role => user.platformRoles.some(userRole => userRole.name === role))

  if (!hasPermission) {
    return (
      <>
        {loading || (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            </div>
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}
