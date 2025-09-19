interface ConfirmationModalProps {
  title: string
  message: string
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmationModal({ title, message, onConfirm, onClose }: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          onClick={handleConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  )
}