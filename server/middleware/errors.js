

import multer from 'multer';
import { internalErrorDetail } from '../lib/http.js';

export const apiNotFound = (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint API tidak ditemukan.' });
};

export const errorHandler = (error, req, res, next) => {
  
  
  
  
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Ukuran data yang dikirim terlalu besar.'
    });
  }

  if (error instanceof multer.MulterError) {
    
    
    
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Ukuran file maksimal 25 MB.'
      : 'Berkas unggahan tidak valid.';
    return res.status(413).json({ success: false, message });
  }

  if (error) {
    const detail = internalErrorDetail(error);
    return res.status(500).json({
      success: false,
      message: 'Server tidak dapat memproses permintaan.',
      ...(detail ? { error: detail } : {})
    });
  }

  return next();
};
