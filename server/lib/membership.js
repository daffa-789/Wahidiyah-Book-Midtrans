

import crypto from 'crypto';
import { supabaseServer } from '../db.js';
import { effectiveIsPro, generateId } from '../auth.js';


export const ACTIVE_SUBSCRIPTION_STATUS = 'Aktif';

export const ENDED_SUBSCRIPTION_STATUS = 'Berakhir';


export const DEFAULT_PLAN_DAYS = 30;


export const planDaysFromPeriod = (period) => {
  if (typeof period === 'number' && Number.isFinite(period) && period > 0) {
    return Math.floor(period);
  }
  const text = String(period || '').toLowerCase();
  const explicit = text.match(/(\d+)\s*(hari|day)/);
  if (explicit) return Number(explicit[1]);
  if (/tahun|year|annual/.test(text)) return 365;
  const months = text.match(/(\d+)\s*(bulan|month)/);
  if (months) return Number(months[1]) * DEFAULT_PLAN_DAYS;
  if (/bulan|month/.test(text)) return DEFAULT_PLAN_DAYS;
  return DEFAULT_PLAN_DAYS;
};


export const expiresAtFromNow = (days = DEFAULT_PLAN_DAYS, from = new Date()) =>
  new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();


const generateRefNo = () => `0000${crypto.randomInt(10000000, 100000000)}`;


export const toRefCode = (refNo) => 'REF-' + String(refNo).slice(-8);


export async function insertTransaction({
  txId, userId, planName, amount, adminFee, totalPaid, method, status = 'success'
}) {
  const refNo = generateRefNo();
  await supabaseServer.from('transactions').insert({
    id: txId,
    ref_no: refNo,
    user_id: userId,
    plan_name: planName || 'Wahidiyah Pro',
    amount: Number(amount) || 0,
    admin_fee: Number(adminFee) || 0,
    total_paid: Number(totalPaid) || 0,
    payment_method: method,
    status,
    created_at: new Date().toISOString()
  });
  return refNo;
}


export async function activatePaidMembership({
  userId, planName, price, refCode, periodFallback = null
}) {
  const subId = generateId('sub');
  const period = periodFallback || 'Langganan Pro';
  const days = planDaysFromPeriod(periodFallback);
  const expiresAt = expiresAtFromNow(days);

  await supabaseServer.from('users').update({
    is_pro: true,
    subscription_expires_at: expiresAt
  }).eq('id', userId);

  await supabaseServer.from('subscriptions').insert({
    id: subId,
    user_id: userId,
    plan_name: 'Wahidiyah Pro',
    price: Number(price) || 0,
    status: ACTIVE_SUBSCRIPTION_STATUS,
    period,
    expires_at: expiresAt,
    ref_code: refCode,
    created_at: new Date().toISOString()
  });

  return { subscriptionId: subId, expiresAt, period, days };
}


export const activeSubscriptionConflict = (user) => {
  if (!effectiveIsPro(user)) return null;
  return {
    success: false,
    message: 'Langganan Pro Anda saat ini masih aktif. Anda sudah menikmati seluruh fitur Pro.'
  };
};
