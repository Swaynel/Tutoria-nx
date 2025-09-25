// src/contexts/DataContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  AppUser,
  Payment,
  Student,
  AttendanceRecord,
  Message,
  UserRole,
  Notification,
} from '../types';

// ----------------- DataContext Types -----------------
export interface DataContextType {
  userProfile: AppUser | null;
  school_id: string | null;
  payments: Payment[];
  students: Student[];
  attendance: AttendanceRecord[];
  messages: Message[];
  notifications: Notification[];
  loading: boolean;
  profileLoading: boolean;
  error: string | null;
  profileError: string | null;
  addPayment: (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'school_id'>, school_id?: string) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addStudent: (student: Omit<Student, 'id' | 'created_at' | 'school_id' | 'updated_at'>, school_id?: string) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

// ----------------- Provider Component -----------------
export function DataProvider({ children }: DataProviderProps) {
  const { user } = useAuthContext();

  // Profile state
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // School-related data
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const school_id = userProfile?.school_id || null;

  // --- Profile Management ---
  const fetchProfile = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          school:school_id (name)
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('No profile found, creating one...');
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: user.full_name || user.email?.split('@')[0],
            role: 'teacher' as UserRole,
          });
          if (insertError) throw insertError;
          await fetchProfile();
          return;
        }
        throw profileError;
      }

      if (profileData) {
        setUserProfile(profileData as AppUser);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching profile:', err);
        setProfileError(err.message);
      } else {
        console.error('Error fetching profile:', err);
        setProfileError('An unknown error occurred while fetching your profile.');
      }
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  // --- Fetch all school data ---
  const fetchAllSchoolData = useCallback(async (): Promise<void> => {
    if (!school_id || !user?.id) {
      setStudents([]);
      setPayments([]);
      setAttendance([]);
      setMessages([]);
      setNotifications([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [studentsData, paymentsData, attendanceData, messagesData, notificationsData] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', school_id),
        supabase.from('payments').select('*').eq('school_id', school_id),
        supabase.from('attendance').select('*').eq('school_id', school_id),
        supabase.from('messages').select(`
          *,
          sender:sender_id (full_name)
        `).eq('recipient_id', user.id),
        supabase.from('notifications').select('*').eq('user_id', user.id),
      ]);

      if (studentsData.error) throw studentsData.error;
      if (paymentsData.error) throw paymentsData.error;
      if (attendanceData.error) throw attendanceData.error;
      if (messagesData.error) throw messagesData.error;
      if (notificationsData.error) throw notificationsData.error;

      setStudents(studentsData.data as Student[] || []);
      setPayments(paymentsData.data as Payment[] || []);
      setAttendance(attendanceData.data as AttendanceRecord[] || []);
      setMessages(messagesData.data as Message[] || []);
      setNotifications(notificationsData.data as Notification[] || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Failed to fetch school data:', err);
        setError(err.message);
      } else {
        console.error('Failed to fetch school data:', err);
        setError('An unknown error occurred while fetching data.');
      }
    } finally {
      setLoading(false);
    }
  }, [school_id, user?.id]);

  // --- Individual CRUD operations ---
  const addPayment = useCallback(async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'school_id'>, school_id?: string) => {
    const targetSchool = school_id || userProfile?.school_id || null;
    if (!targetSchool) {
      throw new Error('Cannot add payment: No school ID available. Please select or assign a school to your profile.');
    }
    const { data, error } = await supabase
      .from('payments')
      .insert({ ...payment, school_id: targetSchool })
      .select()
      .single();
    if (error) throw error;
    if (data) setPayments(prev => [...prev, data as Payment]);
  }, [userProfile?.school_id]);

  const updatePayment = useCallback(async (id: string, payment: Partial<Payment>) => {
    const { error } = await supabase
      .from('payments')
      .update({ ...payment, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }, []);

  const deletePayment = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, []);

  const addStudent = useCallback(async (student: Omit<Student, 'id' | 'created_at' | 'school_id' | 'updated_at'>, school_id?: string) => {
    const targetSchool = school_id || userProfile?.school_id || null;
    if (!targetSchool) {
      throw new Error('Cannot add student: No school ID available. Please select or assign a school to your profile before adding students.');
    }
    const { error } = await supabase
      .from('students')
      .insert({ 
        ...student,
        school_id: targetSchool,
      })
      .select()
      .single();
    if (error) throw error;
    // The real-time subscription will handle updating the state
  }, [userProfile?.school_id]);

  const updateStudent = useCallback(async (id: string, student: Partial<Student>) => {
    const { error } = await supabase
      .from('students')
      .update({ ...student, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, []);

  // --- Effects ---
  useEffect(() => {
    if (user) fetchProfile();
    else {
      setUserProfile(null);
      setStudents([]);
      setPayments([]);
      setAttendance([]);
      setMessages([]);
      setNotifications([]);
    }
  }, [user, fetchProfile]);
useEffect(() => {
  if (userProfile && user?.id) fetchAllSchoolData();
}, [userProfile, user?.id, fetchAllSchoolData]);
  // --- Real-time subscriptions ---
  useEffect(() => {
    if (!school_id || !user?.id) return;

    const setupSubscription = <T extends { id: string }>(
      table: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
    ) => {
      return supabase
        .channel(`public:${table}:${school_id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table, filter: `school_id=eq.${school_id}` },
          payload => setter(prev => [...prev, payload.new as T]),
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table, filter: `school_id=eq.${school_id}` },
          payload => setter(prev => prev.map(item => (item.id === payload.new.id ? payload.new as T : item))),
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table, filter: `school_id=eq.${school_id}` },
          payload => setter(prev => prev.filter(item => item.id !== payload.old.id)),
        )
        .subscribe();
    };

    const setupUserSubscription = <T extends { id: string }>(
      table: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
      userId: string
    ) => {
      return supabase
        .channel(`public:${table}:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table, filter: `user_id=eq.${userId}` },
          payload => setter(prev => [...prev, payload.new as T]),
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table, filter: `user_id=eq.${userId}` },
          payload => setter(prev => prev.map(item => (item.id === payload.new.id ? payload.new as T : item))),
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table, filter: `user_id=eq.${userId}` },
          payload => setter(prev => prev.filter(item => item.id !== payload.old.id)),
        )
        .subscribe();
    };

    const subscriptions: RealtimeChannel[] = [
      setupSubscription<Student>('students', setStudents),
      setupSubscription<Payment>('payments', setPayments),
      setupSubscription<AttendanceRecord>('attendance', setAttendance),
      setupSubscription<Message>('messages', setMessages),
      setupUserSubscription<Notification>('notifications', setNotifications, user.id),
    ];

    return () => {
      subscriptions.forEach((sub: RealtimeChannel) => supabase.removeChannel(sub));
    };
  }, [school_id, user?.id]);

  // --- Context Value ---
  const value: DataContextType = {
    userProfile,
    school_id,
    payments,
    students,
    attendance,
    messages,
    notifications,
    loading,
    profileLoading,
    error,
    profileError,
    addPayment,
    updatePayment,
    deletePayment,
    addStudent,
    updateStudent,
    deleteStudent,
    refreshAllData: fetchAllSchoolData,
    refreshProfile: fetchProfile,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// ----------------- Hook -----------------
export function useDataContext(): DataContextType {
  const context = useContext(DataContext);
  if (!context) throw new Error('useDataContext must be used within a DataProvider');
  return context;
}