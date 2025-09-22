import { ReactNode } from 'react'
import CombinedSidebar from './CombinedSidebar'
import ModalManager from './ModalManager'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <CombinedSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <ModalManager />
    </div>
  )
}