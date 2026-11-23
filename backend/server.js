require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const { attachUser } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const serviceRoutes = require('./routes/services');
const inquiryRoutes = require('./routes/inquiries');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const universityRoutes = require('./routes/universities');
const currencyRoutes = require('./routes/currency');
const scholarshipRoutes = require('./routes/scholarships');
const tourPackageRoutes = require('./routes/tourPackages');
const faqRoutes = require('./routes/faqs');
const newsletterRoutes = require('./routes/newsletter');
const settingsRoutes = require('./routes/settings');

const app = express();

// Behind a hosting proxy (Render, Railway, Vercel...) set TRUST_PROXY=1 so the real visitor IP is used for rate limiting.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

// Serve uploaded service images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/tour-packages', tourPackageRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Multer / generic error handler (keeps error responses in JSON, not HTML stack traces)
app.use((err, req, res, next) => {
  if (err) {
    console.error(err);
    return res.status(400).json({ message: err.message || 'Something went wrong.' });
  }
  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`LN PAK API running on http://localhost:${PORT}`);
});
