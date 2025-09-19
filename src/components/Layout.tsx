import { ReactNode } from 'react'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'
import ModalManager from './ModalManager'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <LeftSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <RightSidebar />
      <ModalManager />
    </div>
  )
}