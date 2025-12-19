const requireEmailVerification = (req, res, next) => {
  // Backward compatibility: Check both JWT verified field and user data
  const isVerified = req.user.verified || req.user.emailVerified || false;
  
  if (!isVerified) {
    return res.status(403).json({
      error: 'Email verification required',
      message: 'Please verify your email address to access this feature. Check your inbox for the verification link.',
      requiresVerification: true
    });
  }
  next();
};

module.exports = requireEmailVerification;