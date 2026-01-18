import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const dirs = ['invoices', 'dc', 'po', 'testing-reports', 'disposal-docs', 'maintenance-reports'];

dirs.forEach(dir => {
  const dirPath = path.join(uploadDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'invoices';
    
    if (file.fieldname === 'dc_file') folder = 'dc';
    else if (file.fieldname === 'po_file') folder = 'po';
    else if (file.fieldname === 'testing_report_file') folder = 'testing-reports';
    else if (file.fieldname === 'approval_document' || file.fieldname === 'disposal_certificate') folder = 'disposal-docs';
    else if (file.fieldname === 'maintenance_report_file') folder = 'maintenance-reports';
    
    cb(null, path.join(uploadDir, folder));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and Office documents are allowed'));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Multiple file upload fields
export const assetFileUpload = upload.fields([
  { name: 'invoice_file', maxCount: 1 },
  { name: 'dc_file', maxCount: 1 },
  { name: 'po_file', maxCount: 1 },
  { name: 'testing_report_file', maxCount: 1 }
]);

export const disposalFileUpload = upload.fields([
  { name: 'approval_document', maxCount: 1 },
  { name: 'disposal_certificate', maxCount: 1 }
]);

export const maintenanceFileUpload = upload.fields([
  { name: 'maintenance_report_file', maxCount: 1 }
]);

// Helper to get file paths from request
export const getFilePaths = (req) => {
  const files = {};
  if (req.files) {
    Object.keys(req.files).forEach(fieldname => {
      files[fieldname] = req.files[fieldname][0].path;
    });
  }
  return files;
};

// Helper to delete file
export const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
