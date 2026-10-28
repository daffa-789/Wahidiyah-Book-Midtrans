import { healthRouter } from './health_routes.js';
import { authRouter } from './auth_routes.js';
import { booksRouter } from './books_routes.js';
import { usersRouter } from './users_routes.js';
import { transactionsRouter } from './transactions_routes.js';
import { paymentsRouter } from './payments_routes.js';
import { subscriptionsRouter } from './subscriptions_routes.js';
import { eventsRouter } from './events_routes.js';
import { carouselRouter } from './carousel_routes.js';
import { adminRouter } from './admin_routes.js';
import { notificationsRouter } from './notifications_routes.js';
import { cronRouter } from './cron_routes.js';

const ROUTERS = [
  { path: '/api', router: healthRouter },       
  { path: '/api/auth', router: authRouter },    
  { path: '/api', router: booksRouter },        
  { path: '/api', router: usersRouter },        
  { path: '/api', router: transactionsRouter }, 
  { path: '/api/payments', router: paymentsRouter },
  { path: '/api', router: subscriptionsRouter },
  { path: '/api', router: eventsRouter },       
  { path: '/api', router: carouselRouter },     
  { path: '/api', router: notificationsRouter },
  { path: '/api', router: cronRouter },
  { path: '/api', router: adminRouter }         
];

export const mountRoutes = (app) => {
  for (const { path, router } of ROUTERS) {
    app.use(path, router);
  }
};
