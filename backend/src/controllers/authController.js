import { User } from '../models/User.js';
import { invalidateAllSessions } from '../utils/sessionHelpers.js';
import { logAudit } from '../utils/auditLogger.js';
import { safeError } from '../utils/logSanitizer.js';

// Register a new user
export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered',
        message: 'An account with this email already exists'
      });
    }

    // Create new user
    const user = await User.create(email, password, name);

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        safeError('Session regeneration error:', err);
        return res.status(500).json({
          error: 'Registration failed',
          message: 'An error occurred during session creation'
        });
      }

      // Create session
      req.session.userId = user.id;
      req.session.userEmail = user.email;

      // Return user data (without password)
      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at
        }
      });
    });
  } catch (error) {
    safeError('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);

    // Always perform password comparison to prevent timing attacks
    // Use a dummy hash if user doesn't exist to maintain constant timing
    const passwordHash = user ? user.password_hash : '$2b$10$abcdefghijklmnopqrstuv.WXYZ0123456789ABCDEFG';
    const isValid = await User.verifyPassword(password, passwordHash);

    if (!user || !isValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        safeError('Session regeneration error:', err);
        return res.status(500).json({
          error: 'Login failed',
          message: 'An error occurred during session creation'
        });
      }

      // Create session
      req.session.userId = user.id;
      req.session.userEmail = user.email;

      // Return user data (without password)
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    });
  } catch (error) {
    safeError('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        safeError('Logout error:', err);
        return res.status(500).json({
          error: 'Logout failed',
          message: 'An error occurred during logout'
        });
      }

      res.clearCookie(process.env.SESSION_COOKIE_NAME || 'connect.sid'); // Clear session cookie
      res.json({
        message: 'Logout successful'
      });
    });
  } catch (error) {
    safeError('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'You must be logged in'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      // User was deleted
      req.session.destroy();
      return res.status(404).json({
        error: 'User not found',
        message: 'Your account no longer exists'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    safeError('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: 'An error occurred while fetching user data'
    });
  }
};

// Update user profile (email)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { email, currentPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'You must be logged in'
      });
    }

    // Get user with password hash to verify current password
    const user = await User.findByEmail(req.session.userEmail);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Your account no longer exists'
      });
    }

    // Verify current password
    const isValidPassword = await User.verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      // Log failed email update attempt
      await logAudit({
        userId: userId,
        userEmail: user.email,
        action: 'email_update_failed',
        ipAddress: req.ip,
        success: false,
        errorMessage: 'Current password is incorrect'
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Current password is incorrect'
      });
    }

    // Update email
    let updatedUser;
    try {
      updatedUser = await User.updateEmail(userId, email);
    } catch (error) {
      if (error.code === 'DUPLICATE_EMAIL') {
        // Log failed email update attempt
        await logAudit({
          userId: userId,
          userEmail: user.email,
          action: 'email_update_failed',
          ipAddress: req.ip,
          success: false,
          errorMessage: 'This email is already registered'
        });

        return res.status(400).json({
          error: 'Email already exists',
          message: 'This email is already registered'
        });
      }
      throw error;
    }

    // Invalidate all other sessions
    await invalidateAllSessions(userId);

    // Regenerate current session to keep user logged in
    req.session.regenerate((err) => {
      if (err) {
        safeError('Session regeneration error:', err);
        return res.status(500).json({
          error: 'Update failed',
          message: 'An error occurred during session update'
        });
      }

      // Restore session data with updated email
      req.session.userId = updatedUser.id;
      req.session.userEmail = updatedUser.email;

      req.session.save(async (saveErr) => {
        if (saveErr) {
          safeError('Session save error:', saveErr);
          return res.status(500).json({
            error: 'Update failed',
            message: 'An error occurred during session update'
          });
        }

        // Log successful email update
        await logAudit({
          userId: updatedUser.id,
          userEmail: updatedUser.email,
          action: 'email_update',
          ipAddress: req.ip,
          success: true
        });

        res.json({
          message: 'Email updated successfully',
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name
          }
        });
      });
    });
  } catch (error) {
    safeError('Update profile error:', error);
    res.status(500).json({
      error: 'Update failed',
      message: 'An error occurred while updating your profile'
    });
  }
};

// Update user password
export const updatePassword = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'You must be logged in'
      });
    }

    // Get user for audit logging
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Your account no longer exists'
      });
    }

    // Update password (includes current password verification and strength validation)
    try {
      await User.updatePassword(userId, currentPassword, newPassword);
    } catch (error) {
      if (error.code === 'INVALID_PASSWORD') {
        // Log failed password update attempt
        await logAudit({
          userId: userId,
          userEmail: user.email,
          action: 'password_update_failed',
          ipAddress: req.ip,
          success: false,
          errorMessage: 'Current password is incorrect'
        });

        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Current password is incorrect'
        });
      }
      // Password strength validation errors
      if (error.message.includes('Password requirements')) {
        // Log failed password update attempt
        await logAudit({
          userId: userId,
          userEmail: user.email,
          action: 'password_update_failed',
          ipAddress: req.ip,
          success: false,
          errorMessage: error.message
        });

        return res.status(400).json({
          error: 'Validation failed',
          message: error.message
        });
      }
      throw error;
    }

    // Invalidate all other sessions
    await invalidateAllSessions(userId);

    // Regenerate current session to keep user logged in
    req.session.regenerate((err) => {
      if (err) {
        safeError('Session regeneration error:', err);
        return res.status(500).json({
          error: 'Update failed',
          message: 'An error occurred during session update'
        });
      }

      // Restore session data with verified user email
      req.session.userId = userId;
      req.session.userEmail = user.email;

      req.session.save(async (saveErr) => {
        if (saveErr) {
          safeError('Session save error:', saveErr);
          return res.status(500).json({
            error: 'Update failed',
            message: 'An error occurred during session update'
          });
        }

        // Log successful password update
        await logAudit({
          userId: userId,
          userEmail: user.email,
          action: 'password_update',
          ipAddress: req.ip,
          success: true
        });

        res.json({
          message: 'Password updated successfully'
        });
      });
    });
  } catch (error) {
    safeError('Update password error:', error);
    res.status(500).json({
      error: 'Update failed',
      message: 'An error occurred while updating your password'
    });
  }
};
