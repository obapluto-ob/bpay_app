const requireEmailVerification = (req, res, next) => {
  // Temporarily disabled for production - email system being configured
  // TODO: Re-enable once email environment variables are set in Render
  next();
  
  // Original code (re-enable after email setup):
  // const isVerified = req.user.verified || req.user.emailVerified || false;
  // if (!isVerified) {
  //   return res.status(403).json({
  //     error: 'Email verification required',
  //     message: 'Please verify your email address to access this feature.',
  //     requiresVerification: true
  //   });
  // }
  // next();
};

module.exports = requireEmailVerification;