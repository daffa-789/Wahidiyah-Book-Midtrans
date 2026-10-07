
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiJson, authHeaders } from '@lib/api';


const POLL_INTERVAL_MS = 3000;

const DEFAULT_COUNTDOWN_SECONDS = 15 * 60;


const secondsUntil = (isoDate) => {
  const target = new Date(isoDate).getTime();
  if (!Number.isFinite(target)) return DEFAULT_COUNTDOWN_SECONDS;
  return Math.max(0, Math.round((target - Date.now()) / 1000));
};


export const useQrisPayment = ({
  selectedPlan,
  user,
  onPaymentSuccess,
  isQrisActive = true,
  phone = ''
}) => {
  const [qrTransaction, setQrTransaction] = useState(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrError, setQrError] = useState('');
  const [isQrisPaid, setIsQrisPaid] = useState(false);
  const [countdown, setCountdown] = useState(DEFAULT_COUNTDOWN_SECONDS);
  const [isExpired, setIsExpired] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const pollIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const isPaidRef = useRef(false);

  const generateTransaction = useCallback(async () => {
    setIsGeneratingQr(true);
    setQrError('');

    try {
      const data = await apiJson('/api/payments/qris/charge', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan?.id || 'monthly',
          phone
        })
      });

      if (data.alreadyPro) {
        setQrError(data.message || 'Langganan Pro Anda masih aktif.');
        setQrTransaction(null);
        return;
      }

      setQrTransaction({
        orderId: data.orderId,
        qrString: data.qrString || null,
        qrImageUrl: data.qrImageUrl || null,
        qrMidtransUrl: data.qrMidtransUrl || null,
        totalPaid: data.totalPaid,
        planName: data.planName,
        expiredAt: data.expiredAt
      });
      setCountdown(secondsUntil(data.expiredAt));
      setIsExpired(false);
    } catch (err) {
      setQrError(err?.message || 'Gagal membuat kode QR pembayaran.');
      setQrTransaction(null);
    } finally {
      setIsGeneratingQr(false);
    }
  }, [selectedPlan, phone]);

  useEffect(() => {
    if (isQrisActive && !isQrisPaid) {
      generateTransaction();
    }
  }, [isQrisActive, generateTransaction]);

  useEffect(() => {
    if (!qrTransaction || isQrisPaid) return undefined;

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [qrTransaction, isQrisPaid]);

  useEffect(() => {
    if (countdown === 0 && qrTransaction && !isQrisPaid) {
      setIsExpired(true);
    }
  }, [countdown, qrTransaction, isQrisPaid]);

  const triggerSuccess = useCallback(() => {
    if (isPaidRef.current) return;
    isPaidRef.current = true;
    setIsQrisPaid(true);

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (onPaymentSuccess) {
      setTimeout(() => {
        onPaymentSuccess();
      }, 1000);
    }
  }, [onPaymentSuccess]);

  
  
  
  useEffect(() => {
    if (!qrTransaction?.orderId || isQrisPaid || isExpired) return undefined;

    const checkStatus = async () => {
      try {
        const data = await apiJson(`/api/payments/qris/${qrTransaction.orderId}/status`, {
          headers: { ...authHeaders() },
          cache: 'no-cache'
        });
        if (data?.isPaid === true) {
          triggerSuccess();
        }
      } catch {
        
        
        
      }
    };

    pollIntervalRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [qrTransaction, isQrisPaid, isExpired, triggerSuccess]);

  /**
   * Menandai transaksi lunas lewat server (mode sandbox saja).
   * Server menolaknya di production, jadi aman dipanggil dari UI.
   */
  const simulatePaid = useCallback(async () => {
    if (!qrTransaction?.orderId) return;
    setIsSimulating(true);
    setQrError('');
    try {
      const data = await apiJson(`/api/payments/qris/${qrTransaction.orderId}/simulate-paid`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' }
      });
      if (data?.isPaid === true) {
        triggerSuccess();
      } else {
        setQrError(data?.message || 'Simulasi tidak berhasil.');
      }
    } catch (err) {
      setQrError(err?.message || 'Simulasi pembayaran gagal.');
    } finally {
      setIsSimulating(false);
    }
  }, [qrTransaction, triggerSuccess]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    qrTransaction,
    isGeneratingQr,
    qrError,
    isQrisPaid,
    isExpired,
    isSimulating,
    countdown,
    formattedCountdown,
    regenerateQr: generateTransaction,
    simulatePaid
  };
};
