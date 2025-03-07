const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const app = express();

// Import all route modules
const initRoutes = require('./routes/init');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const brandsRoutes = require('./routes/brands');
const membershipsRoutes = require('./routes/memberships');
const productsRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const resetRoutes = require('./routes/reset');
const searchRoutes = require('./routes/search');

const models = require('./models');
console.log('Available models:', Object.keys(models));

// For each model, check if it has the expected methods
// for (const [name, model] of Object.entries(models)) {
//   console.log(`Model ${name} methods:`, 
//     typeof model.findOne === 'function' ? 'has findOne' : 'NO findOne',
//     typeof model.create === 'function' ? 'has create' : 'NO create'
//   );
// }




// CORS Configuration
app.use(cors({
  origin: "http://localhost:3000", // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // Allow cookies to be sent with requests from the frontend
}));

// Ignore favicon requests
app.use((req, res, next) => {
  if (req.url === '/favicon.ico') {
    res.status(204).end();
  } else {
    next();
  }
});

// Security middleware
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://code.jquery.com", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    imgSrc: ["'self'", "data:", "http://localhost:3000", "http://localhost:3000/favicon.ico", "http://images.restapi.co.za"],
    connectSrc: ["'self'", "http://localhost:3000", "http://localhost:3001", "http://backend.restapi.co.za/items/products"],
    fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
    objectSrc: ["'none'"],
    scriptSrcAttr: ["'self'", "'unsafe-inline'"],
    upgradeInsecureRequests: [],
  },
}));

// Body parsing middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Share session data with templates
app.use((req, res, next) => {
  res.locals.accessToken = req.session.accessToken || null;
  res.locals.user = req.session.user || null;
  res.locals.isLoggedIn = req.session.isLoggedIn || false;
  res.locals.isAdmin = req.session.isAdmin || false;
  res.locals.currentPath = req.path;
  next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API route prefix
const apiRouter = express.Router();
app.use('/api', apiRouter);

// API endpoints with clear organization
apiRouter.use('/init', initRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productsRoutes);
apiRouter.use('/categories', categoriesRoutes);
apiRouter.use('/brands', brandsRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/memberships', membershipsRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/reset', resetRoutes);
apiRouter.use('/search', searchRoutes);


// Backend home page route
app.get('/', (req, res) => {
  console.log('Handling request for backend home page');
  res.render('index', { 
    title: 'Backend API Server',
    token: req.session.token || '',
    apiEndpoints: [
      '/api/products', '/api/categories', '/api/brands', 
      '/api/orders', '/api/users', '/api/memberships', '/api/cart'
    ]
  });
});

// RESET SCRIPT - only in development
if (process.env.NODE_ENV === 'development' && process.env.RESET_DB === 'true') {
  console.log('Development mode - resetting database...');
  require('./middleware/migration');
} else {
  // First disable foreign key checks before sync
  sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
    .then(() => {
      return sequelize.sync({
        alter: true,
        logging: false  // Enable logging to see the SQL queries
      });
    })
    .then(() => {
      // Re-enable foreign key checks after sync
      return sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    })
    .then(() => {
      console.log('Database synced without losing data');
      console.log('Server ready for requests');
    })
    .catch((error) => {
      console.error('Error syncing database:', error);
    });
}


// Error handling middleware

app.use(errorHandler);

// Add a 404 handler for routes that don't exist
app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  err.functionName = 'RouteNotFound';
  next(err);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    status: 'error',
    statuscode: 500,
    data: { 
      Result: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  });
});

//Global error handler, for uncaught exceptions and unhandled rejections. Do not remove.
app.use(errorHandler);

module.exports = app;