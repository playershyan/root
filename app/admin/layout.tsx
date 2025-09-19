import { Metadata } from 'next'
import AdminProvider from './components/AdminProvider'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Admin dashboard for managing the platform',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 lg:ml-64">
            <div className="p-4 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminProvider>
  )
}