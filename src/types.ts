// src/types/index.ts
export type UserRole = 'superadmin' | 'school_admin' | 'teacher' | 'parent' | 'student';

export interface AppUser {
  id: string;
  full_name?: string;
  email?: string;
  role: UserRole;
  school_id?: string;
  phone?: string;
  avatar_url?: string;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  // Include the joined school data
  school?: {
    name?: string;
  } | null;
}

export interface Payment {
  id: string;
  school_id: string;
  student_id: string;
  amount: number;
  description: string;
  payment_method?: string;
  reference_id?: string;
  transaction_id?: string;
  status?: string;
  paid_at?: string;
  due_date?: string;
  academic_term?: string;
  fee_type?: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  name: string;
  student_id?: string;
  grade?: string;
  date_of_birth?: string;
  gender?: string;
  admission_date?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  medical_conditions?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  student_id: string;
  date: string;
  status: string;
  marked_by?: string;
  time_in?: string;
  time_out?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Updated Message type with all fields from your schema
export interface Message {
  id: string;
  school_id?: string;
  sender_id: string;
  recipient_id: string;
  subject?: string;
  content: string;
  message_type?: string;
  status?: string;
  priority?: string; // Added this field
  sent_at: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
  // Include the joined sender data
  sender?: {
    full_name?: string;
  } | null;
}

// Export the Notification type
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  related_type?: string;
  related_id?: string;
  action_url?: string;
  is_read: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}


export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
