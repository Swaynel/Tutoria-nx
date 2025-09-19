// contexts/ModalContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react'

// Define specific modal types for better type safety
export type ModalType =
  | 'compose-message'
  | 'mark-attendance'
  | 'record-payment'
  | 'add-user'
  | 'confirmation'
  | null

// Define props per modal type
export interface ConfirmationModalProps {
  title: string
  message: string
  onConfirm: () => void
}

type ModalPropsMap = {
  'compose-message': { recipientId: string }
  'mark-attendance': { studentId: string; date: string }
  'record-payment': { studentId: string; amount: number }
  'add-user': { role: string }
  'confirmation': ConfirmationModalProps
}

// A base type that extracts the props for a given modal type
export type BaseModalProps<T extends ModalType = ModalType> =
  T extends keyof ModalPropsMap ? ModalPropsMap[T] : Record<string, never>

// Context type
export interface ModalContextType {
  isOpen: boolean
  modalType: ModalType
  modalProps: BaseModalProps
  openModal: <T extends Exclude<ModalType, null>>(
    type: T,
    props: BaseModalProps<T>
  ) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

interface ModalProviderProps {
  children: ReactNode
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [modalProps, setModalProps] = useState<BaseModalProps>({})

  const openModal = <T extends Exclude<ModalType, null>>(
    type: T,
    props: BaseModalProps<T>
  ): void => {
    setModalType(type)
    setModalProps(props)
    setIsOpen(true)
  }

  const closeModal = (): void => {
    setIsOpen(false)
    setModalType(null)
    setModalProps({})
  }

  const value: ModalContextType = {
    isOpen,
    modalType,
    modalProps,
    openModal,
    closeModal,
  }

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModalContext(): ModalContextType {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider')
  }
  return context
}
