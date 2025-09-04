import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
    'text/plain', // CSV files are often detected as text/plain
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  // Check if it's a CSV file by extension or MIME type
  const isCSV = file.originalname.toLowerCase().endsWith('.csv') || 
                file.mimetype === 'text/csv' || 
                file.mimetype === 'application/csv';
  
  const isExcel = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.mimetype === 'application/vnd.ms-excel' ||
                  file.originalname.toLowerCase().endsWith('.xlsx') ||
                  file.originalname.toLowerCase().endsWith('.xls');
  
  const isImage = file.mimetype.startsWith('image/');
  
  if (isCSV || isExcel || isImage) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel files, CSV files, and images are allowed.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});