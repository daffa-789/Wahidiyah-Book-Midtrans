import { Router } from 'express';
import { supabaseServer } from '../db.js';
import { requireAuth } from '../auth.js';
import { wrap } from '../lib/http.js';

export const subscriptionsRouter = Router();

subscriptionsRouter.get('/subscriptions/my', requireAuth, wrap(async (req, res) => {
  const { data, error } = await supabaseServer
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  res.json({ success: true, subscriptions: data || [] });
}));
