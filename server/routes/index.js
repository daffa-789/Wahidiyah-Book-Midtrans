

import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { booksRouter } from './books.routes.js';
import { usersRouter } from './users.routes.js';
import { transactionsRouter } from './transactions.routes.js';
import { paymentsRouter } from './payments.routes.js';
import { subscriptionsRouter } from './subscriptions.routes.js';
import { eventsRouter } from './events.routes.js';
import { carouselRouter } from './carousel.routes.js';
import { adminRouter } from './admin.routes.js';


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
  { path: '/api', router: adminRouter }         
];


export const mountRoutes = (app) => {
  for (const { path, router } of ROUTERS) {
    app.use(path, router);
  }
};
