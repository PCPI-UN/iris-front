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
      console.log('🛡️ RoleGuard - User:', user)
      console.log('🛡️ RoleGuard - Required roles:', roles)
      console.log('🛡️ RoleGuard - User platform roles:', user?.platformRoles)
      
      const hasPermission = user && roles.some(role => user.platformRoles.some(userRole => userRole.name === role))
      console.log('🛡️ RoleGuard - Has permission:', hasPermission)
      
      // Si no tiene permiso, redirigir a /app siempre
      if (!hasPermission) {
        const redirectPath = redirectTo || '/app'
        console.log('❌ RoleGuard - Sin permiso, redirigiendo a:', redirectPath)
        router.replace(redirectPath)
      } else {
        console.log('✅ RoleGuard - Permiso concedido')
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
