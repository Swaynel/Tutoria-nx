// components/ModalManager.tsx
import { Fragment, ReactElement } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useModalContext, ConfirmationModalProps } from '../contexts/ModalContext'
import ComposeMessageModal from './modals/ComposeMessageModal'
import MarkAttendanceModal from './modals/MarkAttendanceModal'
import RecordPaymentModal from './modals/RecordPaymentModal'
import AddUserModal from './modals/AddUserModal'
import ConfirmationModal from './modals/ConfirmationModal'

export default function ModalManager(): ReactElement {
  const { isOpen, modalType, modalProps, closeModal } = useModalContext()
  
  const renderModalContent = (): ReactElement | null => {
    switch (modalType) {
      case 'compose-message':
        return <ComposeMessageModal onClose={closeModal} />
        
      case 'mark-attendance':
        return <MarkAttendanceModal onClose={closeModal} />
        
      case 'record-payment':
        return <RecordPaymentModal onClose={closeModal} />
        
      case 'add-user':
        return <AddUserModal onClose={closeModal} />
        
      case 'confirmation': {
        const confirmationProps = modalProps as ConfirmationModalProps
        return (
          <ConfirmationModal 
            onClose={closeModal} 
            title={confirmationProps.title} 
            message={confirmationProps.message} 
            onConfirm={confirmationProps.onConfirm} 
          />
        )
      }
        
      default:
        return null
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {renderModalContent()}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
