import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useModalContext } from '../contexts/ModalContext'
import ComposeMessageModal from './modals/ComposeMessageModal'
import MarkAttendanceModal from './modals/MarkAttendanceModal'
import RecordPaymentModal from './modals/RecordPaymentModal'
import AddUserModal from './modals/AddUserModal'
import ConfirmationModal from './modals/ConfirmationModal'
import SendBulkSMSModal from './modals/SendBulkSMSModal'

export default function ModalManager() {
  const { isOpen, modalState, closeModal } = useModalContext()
  const { modalType, modalProps } = modalState

  const renderModalContent = () => {
    switch (modalType) {
      case 'compose-message':
        return <ComposeMessageModal onClose={closeModal} {...modalProps} />
      case 'bulk-sms':
        return <SendBulkSMSModal onClose={closeModal} {...modalProps} />
      case 'mark-attendance':
        return <MarkAttendanceModal onClose={closeModal} {...modalProps} />
      case 'record-payment':
        return <RecordPaymentModal onClose={closeModal} {...modalProps} />
      case 'add-user':
        return <AddUserModal onClose={closeModal} {...modalProps} />
      case 'confirmation':
        return (
          <ConfirmationModal
            title={''} message={''} onConfirm={function (): void {
              throw new Error('Function not implemented.')
            } } onClose={closeModal}
            {...modalProps}          />
        )
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
