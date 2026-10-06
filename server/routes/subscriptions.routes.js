

import { Router } from 'express';
import { supabaseServer } from '../db.js';
import { requireAuth } from '../auth.js';
import { fail } from '../lib/http.js';

export const subscriptionsRouter = Router();


subscriptionsRouter.get('/subscriptions/my', requireAuth, async (req, res) => {
  try {
    const { data } = await supabaseServer
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    res.json({ success: true, subscriptions: data || [] });
  } catch (error) {
    fail(res, error);
  }
});
