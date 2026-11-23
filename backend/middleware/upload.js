const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ALLOWED = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED[ext]) {
    return cb(new Error('Image must be a JPG, PNG or WEBP file.'));
  }
  cb(null, true);
}

/** Builds a multer instance that saves images into uploads/<subdir>/ (folder is created if missing). */
function createUpload(subdir, prefix) {
  const dir = path.join(__dirname, '..', 'uploads', subdir);
  fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  });

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  });
}

// Default export stays the services uploader so existing routes keep working.
const upload = createUpload('services', 'svc');
upload.createUpload = createUpload;

module.exports = upload;
