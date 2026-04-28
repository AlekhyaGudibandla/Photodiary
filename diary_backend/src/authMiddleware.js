const jwt = require('jsonwebtoken');
const prisma = require('./prisma');
const logger = require('./lib/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch (error) {
    logger.error('Auth Middleware Error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * RBAC: Restrict access to specific roles
 * @param {Array} roles - Allowed roles
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

/**
 * AI Rate Limiter Middleware
 * Free users: 5 analyses per day
 */
const aiRateLimiter = async (req, res, next) => {
  if (req.userRole === 'PREMIUM') return next();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const analysisCount = await prisma.entry.count({
    where: {
      userId: req.userId,
      aiEnabled: true,
      createdAt: { gte: startOfDay }
    }
  });

  if (analysisCount >= 10) {
    return res.status(429).json({
      error: 'Daily limit reached',
      message: 'Free users are limited to 10 AI analyses per day. Upgrade to Premium for unlimited access.'
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  authorize,
  aiRateLimiter
};