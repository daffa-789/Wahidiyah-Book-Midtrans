

import multer from 'multer';
import { CAROUSEL_IMAGE_MAX_BYTES } from '../lib/constants.js';


export const uploadBookFiles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 2 }
}).fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'content', maxCount: 1 }
]);


export const uploadCarouselImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CAROUSEL_IMAGE_MAX_BYTES, files: 1 }
}).single('image');
