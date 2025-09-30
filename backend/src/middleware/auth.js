// Authentication middleware
// Protects routes by checking if user is logged in

export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
  }
  next();
};

// Optional auth - adds user info if logged in, but doesn't require it
export const optionalAuth = (req, res, next) => {
  // If user is logged in, add their info to req
  // If not, just continue
  next();
};

// Check if user is already logged in (for login/register pages)
export const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.status(400).json({
      error: 'Already authenticated',
      message: 'You are already logged in'
    });
  }
  next();
};
