// src/lib/index.ts

// ----------------- Supabase -----------------
export { supabase } from './supabase'

// ----------------- Africa's Talking -----------------
export { sendSMS, sendWhatsApp, getAfricasTalkingClient, default as africastalking } from './africastalking'

// ----------------- Utilities -----------------
import * as utils from './utils'
export { utils }
