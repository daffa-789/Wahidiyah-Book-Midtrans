import express from 'express';
import {
  authIdentifierRateLimiter,
  AUTH_IDENTIFIER_LIMITED_PATHS,
  authRateLimitedPaths,
  authRateLimiter,
  corsPolicy,
  jsonBody,
  responseCompression,
  securityHeaders,
  trustProxy
} from '../server/middleware/security.js';
import { apiNotFound, errorHandler } from '../server/middleware/errors.js';
import { requestContext } from '../server/middleware/requestLog.js';
import { mountRoutes } from '../server/routes/index.js';
import { initOtpStore } from '../server/otpStore.js';

// Pre-initialize OTP store in serverless environment
initOtpStore().catch(() => {});

const app = express();

app.use(requestContext);
app.use(securityHeaders);
app.use(corsPolicy);
app.use(responseCompression);
app.use(jsonBody);

trustProxy(app);
app.use(authRateLimitedPaths, authRateLimiter);
app.use(AUTH_IDENTIFIER_LIMITED_PATHS, authIdentifierRateLimiter);

// Mount all /api routers (health, auth, books, users, payments, subscriptions, events, carousel, admin)
mountRoutes(app);

app.use('/api', apiNotFound);
app.use(errorHandler);

export default app;
