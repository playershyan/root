'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'moderator' | 'reviewer'
  permissions: string[]
}

interface AdminContextType {
  user: AdminUser | null
  isLoading: boolean
  isAdmin: boolean
  hasPermission: (permission: string) => boolean
  refreshAdminData: () => Promise<void>
}

const AdminContext = createContext<AdminContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  hasPermission: () => false,
  refreshAdminData: async () => {},
})

export const useAdmin = () => useContext(AdminContext)

export default function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, loading: authLoading } = useAuth()
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const checkAdminAccess = async () => {
    if (!authUser) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        setAdminUser({
          id: authUser.id,
          email: authUser.email || '',
          role: data.role,
          permissions: data.permissions,
        })
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Admin verification failed:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      checkAdminAccess()
    }
  }, [authUser, authLoading])

  const hasPermission = (permission: string) => {
    if (!adminUser) return false
    if (adminUser.role === 'admin') return true
    return adminUser.permissions.includes(permission)
  }

  const refreshAdminData = async () => {
    await checkAdminAccess()
  }

  return (
    <AdminContext.Provider
      value={{
        user: adminUser,
        isLoading: isLoading || authLoading,
        isAdmin: !!adminUser,
        hasPermission,
        refreshAdminData,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}