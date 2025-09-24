import { useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useDataContext } from '../../contexts/DataContext';
import { supabase } from '../../lib/supabase';

interface RecordPaymentModalProps {
  onClose: () => void;
}

export default function RecordPaymentModal({ onClose }: RecordPaymentModalProps) {
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuthContext();
  const { students, refreshAllData } = useDataContext();

  const handleSubmit = async () => {
    if (!studentId || !amount || !description || !user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('payments')
        .insert([
          {
            school_id: user.school_id,
            student_id: studentId,
            amount: parseFloat(amount),
            description,
            paid_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;

      // Send payment confirmation
      await fetch('/api/send-payment-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          amount: parseFloat(amount),
          description,
        }),
      });

      if (refreshAllData) {
        await refreshAllData(); // Check if refreshData exists
      } else {
        console.warn('refreshData is not defined in DataContext');
      }
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Record Payment</h2>

      <div className="mb-4">
        <label htmlFor="student" className="block text-sm font-medium text-gray-700">
          Student
        </label>
        <select
          id="student"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        >
          <option value="">Select a student</option>
          {students ? (
            students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.grade})
              </option>
            ))
          ) : (
            <option value="">No students available</option>
          )}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          type="number"
          id="amount"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <input
          type="text"
          id="description"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          onClick={onClose}
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={isProcessing || !studentId || !amount || !description}
        >
          {isProcessing ? 'Processing...' : 'Record Payment'}
        </button>
      </div>
    </div>
  );
}