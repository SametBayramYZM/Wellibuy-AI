/**
 * 📁 Secure File Upload Service
 * 
 * File validation, antivirus scanning, and secure storage
 */

import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request } from 'express';

/**
 * Allowed file types
 */
const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  all: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

/**
 * File size limits (in bytes)
 */
const SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  default: 5 * 1024 * 1024, // 5MB
};

/**
 * Dangerous file extensions
 */
const DANGEROUS_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.pif',
  '.scr',
  '.vbs',
  '.js',
  '.jar',
  '.sh',
  '.app',
  '.deb',
  '.rpm',
];

/**
 * Generate secure filename
 */
const generateSecureFilename = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase();
  const basename = path.basename(originalName, ext);
  const sanitized = basename.replace(/[^a-zA-Z0-9-_]/g, '_');
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  
  return `${sanitized}_${timestamp}_${random}${ext}`;
};

/**
 * Validate file type
 */
const validateFileType = (file: Express.Multer.File, allowedTypes: string[]): boolean => {
  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    return false;
  }

  // Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return false;
  }

  return true;
};

/**
 * Validate file size
 */
const validateFileSize = (file: Express.Multer.File, maxSize: number): boolean => {
  return file.size <= maxSize;
};

/**
 * Simple magic number validation
 */
const validateMagicNumber = (filePath: string, mimeType: string): boolean => {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    const hex = buffer.toString('hex');

    // Magic number signatures
    const signatures: Record<string, string[]> = {
      'image/jpeg': ['ffd8ff'],
      'image/png': ['89504e47'],
      'image/gif': ['474946383761', '474946383961'],
      'application/pdf': ['25504446'],
    };

    const expectedSignatures = signatures[mimeType];
    if (!expectedSignatures) return true; // No signature check for this type

    return expectedSignatures.some((sig) => hex.startsWith(sig));
  } catch (err) {
    console.error('Magic number validation error:', err);
    return false;
  }
};

/**
 * Scan file for malware (simple check, integrate ClamAV for production)
 */
const scanForMalware = async (filePath: string): Promise<boolean> => {
  try {
    // Simple checks
    const stats = fs.statSync(filePath);
    
    // Check if file is suspiciously large
    if (stats.size > 100 * 1024 * 1024) {
      return false; // File too large (>100MB)
    }

    // Check for suspicious content patterns
    const content = fs.readFileSync(filePath, 'utf-8').toLowerCase();
    const suspiciousPatterns = [
      '<script',
      'eval(',
      'exec(',
      'system(',
      'shell_exec',
      'passthru',
      'base64_decode',
    ];

    for (const pattern of suspiciousPatterns) {
      if (content.includes(pattern)) {
        return false;
      }
    }

    // TODO: Integrate ClamAV for real antivirus scanning
    // const NodeClam = require('clamscan');
    // const clamscan = await new NodeClam().init();
    // const { isInfected } = await clamscan.scanFile(filePath);
    // return !isInfected;

    return true;
  } catch (err) {
    // If file is binary, errors are expected
    return true;
  }
};

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const secureFilename = generateSecureFilename(file.originalname);
    cb(null, secureFilename);
  },
});

/**
 * File filter
 */
const fileFilter = (allowedTypes: string[], maxSize: number) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Validate file type
    if (!validateFileType(file, allowedTypes)) {
      return cb(new Error('Invalid file type'));
    }

    cb(null, true);
  };
};

/**
 * Create secure upload middleware
 */
export const createUploadMiddleware = (
  fileType: 'images' | 'documents' | 'all' = 'all',
  maxSize?: number
) => {
  const allowedTypes = ALLOWED_MIME_TYPES[fileType];
  const sizeLimit = maxSize || SIZE_LIMITS.default;

  return multer({
    storage,
    fileFilter: fileFilter(allowedTypes, sizeLimit),
    limits: {
      fileSize: sizeLimit,
      files: 1, // Single file upload
    },
  });
};

/**
 * Post-upload validation
 */
export const validateUploadedFile = async (
  file: Express.Multer.File
): Promise<{ valid: boolean; error?: string }> => {
  try {
    // Validate magic number
    if (!validateMagicNumber(file.path, file.mimetype)) {
      fs.unlinkSync(file.path); // Delete invalid file
      return {
        valid: false,
        error: 'File content does not match declared type',
      };
    }

    // Scan for malware
    const isSafe = await scanForMalware(file.path);
    if (!isSafe) {
      fs.unlinkSync(file.path); // Delete infected file
      return {
        valid: false,
        error: 'File failed security scan',
      };
    }

    return { valid: true };
  } catch (err: any) {
    console.error('File validation error:', err);
    return {
      valid: false,
      error: err.message || 'File validation failed',
    };
  }
};

/**
 * Delete file securely
 */
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Delete file error:', err);
    return false;
  }
};
