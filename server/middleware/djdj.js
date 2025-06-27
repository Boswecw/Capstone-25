import cors from 'cors';

const allowedOrigins = process.env.CORS_ORIGIN_DEVELOPMENT
  ? process.env.CORS_ORIGIN_DEVELOPMENT.split(',').map(origin => origin.trim())
  : [];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

export default cors(corsOptions);