// src/pages/api/send-message.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from 'src/lib/supabase';
import { sendSMS, sendWhatsApp } from '../../lib/africastalking';
import type { SMSResult, WhatsAppResult } from '../../lib/africastalking';

// ---------------- Request & Response Types ----------------
interface SendMessageRequest {
  recipientId: string;
  recipientType: 'student' | 'parent' | 'teacher';
  message: string;
  viaSMS: boolean;
  viaWhatsApp: boolean;
}

interface SuccessResponse {
  success: true;
  sms: SMSResult[];
  whatsapp: WhatsAppResult[] | null;
}

interface ErrorResponse {
  success?: false;
  error: string;
  message?: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

interface MethodNotAllowedResponse {
  message: string;
}

// ---------------- Helper: Get recipient phone ----------------
async function getRecipientPhone(
  recipientId: string,
  recipientType: 'student' | 'parent' | 'teacher'
): Promise<string | null> {
  try {
    if (recipientType === 'parent') {
      const studentId = recipientId.startsWith('parent_') ? recipientId.replace('parent_', '') : recipientId;
      const { data: student, error } = await supabase
        .from('students')
        .select('parent_phone')
        .eq('id', studentId)
        .single();
      if (error) throw error;
      return student?.parent_phone || null;
    }

    if (recipientType === 'student') {
      const { data: student, error } = await supabase
        .from('students')
        .select('phone')
        .eq('id', recipientId)
        .single();
      if (error) throw error;
      return student?.phone || null;
    }

    if (recipientType === 'teacher') {
      const { data: teacher, error } = await supabase
        .from('users')
        .select('phone')
        .eq('id', recipientId)
        .single();
      if (error) throw error;
      return teacher?.phone || null;
    }

    return null;
  } catch (error) {
    console.error('Error fetching recipient phone:', error);
    return null;
  }
}

// ---------------- API Handler ----------------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | MethodNotAllowedResponse>
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { recipientId, recipientType, message, viaSMS, viaWhatsApp } =
      req.body as SendMessageRequest;

    if (!recipientId || !message || !recipientType) {
      return res
        .status(400)
        .json({ error: 'Missing required fields: recipientId, recipientType, and message are required' });
    }

    if (!viaSMS && !viaWhatsApp) {
      return res
        .status(400)
        .json({ error: 'At least one delivery method (SMS or WhatsApp) must be selected' });
    }

    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // ---------------- Get recipient phone ----------------
    const recipientPhone = await getRecipientPhone(recipientId, recipientType);

    if (!recipientPhone) {
      return res.status(404).json({ error: 'Recipient phone number not found' });
    }

    // ---------------- Initialize results ----------------
    let smsResults: SMSResult[] = [];
    let whatsappResults: WhatsAppResult[] | null = null;

    // ---------------- Send SMS ----------------
    if (viaSMS) {
      try {
        smsResults = await sendSMS([recipientPhone], message);
      } catch (err) {
        console.error('SMS sending failed:', err);
        smsResults = [{ recipient: recipientPhone, success: false, error: 'SMS sending failed' }];
      }
    }

    // ---------------- Send WhatsApp ----------------
    if (viaWhatsApp) {
      try {
        whatsappResults = await sendWhatsApp([recipientPhone], message);
      } catch (err) {
        console.error('WhatsApp sending failed:', err);
        whatsappResults = [{ recipient: recipientPhone, success: false, error: 'WhatsApp sending failed' }];
      }
    }

    // ---------------- Check Success ----------------
    const smsSuccess = smsResults.length > 0 && smsResults.some((r) => r.success);
    const whatsappSuccess =
      whatsappResults !== null && whatsappResults.some((r) => r.success);

    if (!smsSuccess && !whatsappSuccess) {
      return res
        .status(500)
        .json({ error: 'Failed to send message via any requested method' });
    }

    // ---------------- Return Success ----------------
    const response: SuccessResponse = {
      success: true,
      sms: smsResults,
      whatsapp: whatsappResults,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in send-message API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Failed to send message', message: errorMessage });
  }
}
