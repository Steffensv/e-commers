/**
 * Central error handler middleware
 * Formats all errors according to the API specification
 */
const errorHandler = (err, req, res, next) => {
  // Determine the source of the error (route and function)
  const route = req.originalUrl || 'Unknown Route';
  const method = req.method || 'Unknown Method';
  
  // Determine status code (use err.statusCode if provided, otherwise default to 500)
  const statusCode = err.statusCode || 500;
  
  // Log detailed error for debugging
  console.error(`[ERROR] ${method} ${route}: ${err.message}`);
  console.error(`Function: ${err.functionName || 'Unknown'}`);
  console.error(`Stack: ${err.stack}`);
  
  // For API routes, return standardized JSON error response
  if (route.startsWith('/api') || req.headers.accept === 'application/json') {
    // Create standard response object
    const responseObj = {
      status: 'error',
      statuscode: statusCode,
      data: {
        Result: err.message || 'An unexpected error occurred'
      }
    };
    
    // Add source information only in development
    if (process.env.NODE_ENV !== 'production') {
      responseObj.data.source = {
        route,
        function: err.functionName || 'Unknown Function'
      };
    }
    
    return res.status(statusCode).json(responseObj);
  }
  
  // For non-API routes, render an error page or redirect
  if (statusCode === 401 || statusCode === 403) {
    // For auth errors, redirect to login
    return res.redirect('/login?error=Authentication required');
  } else {
    // For other errors, try to render error page
    res.status(statusCode);
    try {
      res.render('error', {
        message: err.message || 'An unexpected error occurred',
        error: process.env.NODE_ENV !== 'production' ? err : {},
        route,
        function: err.functionName || 'Unknown Function',
        user: req.session?.user || null,
        status: statusCode
      });
    } catch (renderError) {
      // If rendering fails, fall back to basic HTML error
      res.send(`
        <html>
          <head><title>Error ${statusCode}</title></head>
          <body>
            <h1>Error ${statusCode}</h1>
            <p>${err.message || 'An unexpected error occurred'}</p>
            <a href="/">Return to home page</a>
          </body>
        </html>
      `);
    }
  }
};

/**
 * Custom error class with additional properties for better error handling
 */
class AppError extends Error {
  constructor(message, statusCode, functionName) {
    super(message);
    this.statusCode = statusCode;
    this.functionName = functionName;
    this.isOperational = true; // Flag to distinguish operational errors from programmer errors
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async function wrapper to catch errors and pass them to the error handler
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      // If error doesn't have function name, add it
      if (!err.functionName) {
        err.functionName = fn.name;
      }
      next(err);
    });
  };
};

module.exports = {
  errorHandler,
  AppError,
  catchAsync
};