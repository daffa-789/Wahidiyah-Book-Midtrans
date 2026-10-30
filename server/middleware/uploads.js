

import multer from 'multer';
import { CAROUSEL_IMAGE_MAX_BYTES } from '../lib/constants.js';


/* Hanya sampul yang masih lewat multipart. Naskah buku dikirim peramban
 * langsung ke Supabase Storage, jadi tidak ada lagi berkas besar di sini.
 */
export const uploadBookFiles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
}).fields([{ name: 'thumbnail', maxCount: 1 }]);


export const uploadCarouselImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CAROUSEL_IMAGE_MAX_BYTES, files: 1 }
}).single('image');
