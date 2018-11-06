module.exports = {
  ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  URL: process.env.BASE_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://jimfire:weed5632@ds249503.mlab.com:49503/restify_example',
  JWT_SECRET: process.env.JWT_SECRET || 'secret1',
  ROLE_USER: 1,
  ROLE_ADMIN: 2,
  ORDER_STATUS_SUCCESS: 1,
  ORDER_STATUS_INPROCESS: 2,
  ORDER_STATUS_REJECTED: 0,
  ORDER_STATUS_NEW: 3,
};
