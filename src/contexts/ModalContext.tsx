import { createContext, useContext, useState, ReactNode } from 'react'

// Define specific modal types
export type ModalType =
  | 'compose-message'
  | 'bulk-sms'
  | 'mark-attendance'
  | 'record-payment'
  | 'add-user'
  | 'confirmation'
  | null

// Generic modal props type
export type ModalProps = Record<string, unknown>

interface ModalState {
  modalType: ModalType
  modalProps: ModalProps
}

interface ModalContextValue {
  isOpen: boolean
  modalState: ModalState
  openModal: (modalType: ModalType, modalProps?: ModalProps) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined)

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [modalState, setModalState] = useState<ModalState>({
    modalType: null,
    modalProps: {},
  })

  const openModal = (modalType: ModalType, modalProps: ModalProps = {}) => {
    setModalState({ modalType, modalProps })
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setModalState({ modalType: null, modalProps: {} })
  }

  return (
    <ModalContext.Provider value={{ isOpen, modalState, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  )
}

export const useModalContext = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider')
  }
  return context
}
