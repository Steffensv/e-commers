require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// ----- IMPORT ROUTES ----- //

// Authentication routes
const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');

// API routes
const categoryRoutes = require('./routes/categories');
const brandRoutes = require('./routes/brands');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const membershipRoutes = require('./routes/memberships');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');
const searchRoutes = require('./routes/search');

// Dashboard routes


// Debug routes
const debugRoutes = require('./routes/debug');

// ----- MIDDLEWARE ----- //

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
    connectSrc: ["'self'", "http://localhost:3000", "http://localhost:3001", "http://backend.restapi.co.za"],
    fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
    objectSrc: ["'none'"],
    scriptSrcAttr: ["'self'", "'unsafe-inline'"],
    upgradeInsecureRequests: [],
  },
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Request parsing
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Share session data with all views
app.use((req, res, next) => {
  const token = req.session.accessToken || req.session.token;

  // Basic user state
  res.locals.isLoggedIn = Boolean(req.session.isLoggedIn);
  res.locals.isAdmin = Boolean(req.session.isAdmin);
  res.locals.user = req.session.user || null;
  res.locals.token = token;
  
  // Current request path 
  res.locals.currentPath = req.path;
  
  // User data
  res.locals.cart = req.session.cart;
  res.locals.membership = req.session.membership;
  
  // Cached data
  res.locals.products = req.session.products;
  res.locals.categories = req.session.categories;
  res.locals.brands = req.session.brands;
  res.locals.orders = req.session.orders;
  res.locals.users = req.session.users;
  res.locals.memberships = req.session.memberships;
  
  next();
});

// ----- ROUTE REGISTRATION ----- //

// Auth routes - handle login/registration
app.use('/login', loginRouter);
app.use('/register', registerRouter);

// Page routes - render frontend pages
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);

app.use('/dashboard', (req, res, next) => {
  // Check if user exists and redirect accordingly
  if (!req.session.user) {
    return res.redirect('/login');
  }
  
  // Redirect based on user role
  if (req.session.user.isAdmin) {
    return res.redirect('views/admin/dashboard');
  } else {
    return res.redirect('views/user/dashboard');
  }
});

// API routes - for AJAX calls from frontend
const apiRouter = express.Router();
app.use('/api', apiRouter);

apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/brands', brandRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/memberships', membershipRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/search', searchRoutes);

// Debug route
app.use('/debug', debugRoutes);



// ----- MAIN PAGE ROUTES ----- //

// Home route (index)
app.get('/', (req, res) => {
  console.log('Rendering homepage');
  res.render('index', { 
    token: req.session.token || '',
    error: req.query.error || null 
  });
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/?error=Logout failed');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// ----- ERROR HANDLING ----- //

// Error handling middleware
app.use(function(err, req, res, next) {
  console.error('Server error:', err);
  
  // Set local variables, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.locals.status = err.status || 500;
  
  // Render the error page
  res.status(err.status || 500);
  
  // Use render with additional parameters to handle user state
  res.render('error', { 
    user: req.session.user || null,
    error: err.message 
  });
});

// Export the app instance
module.exports = app;