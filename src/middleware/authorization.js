const userAccessOnly = (req, res, next) => {
    if (req.user && req.user.user_type === 'user') {
      return next();
    } else {
      return res.status(403).json({ message: 'Access denied: Users only' });
    }
};

const adminAccessOnly = (req, res, next) => {
    if (req.user && req.user.user_type === 'admin') {
      return next();
    } else {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }
};

module.exports = {
    userAccessOnly,
    adminAccessOnly
};