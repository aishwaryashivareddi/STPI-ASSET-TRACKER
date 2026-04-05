const required = [
  'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT',
  'JWT_SECRET', 'JWT_EXPIRE',
  'BCRYPT_ROUNDS', 'RATE_LIMIT_WINDOW', 'RATE_LIMIT_MAX'
];

export const validateEnv = () => {
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`\n❌ Missing required environment variables:\n   ${missing.join(', ')}\n\n   Copy .env.example to .env and fill in the values.\n`);
    process.exit(1);
  }
};
