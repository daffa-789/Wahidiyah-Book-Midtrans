

// Environment loader (vapid ready)
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(here, '..', '.env'), override: true });
dotenv.config({ path: path.resolve(here, '.env'), override: true });
dotenv.config({ override: true });
