'use client'

import { useAuth } from "@/contexts/AuthContext"
import { redirect } from "next/navigation"
import { useEffect } from "react"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && (!user || (user.role?.roleName !== 'ADMIN' && user.role?.roleName !== 'VERIFICATOR'))) {
      redirect('/')
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user || (user.role?.roleName !== 'ADMIN' && user.role?.roleName !== 'VERIFICATOR')) {
    return null
  }

  return <div className="admin-layout">{children}</div>
}
