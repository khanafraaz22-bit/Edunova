require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$connect()
  .then(() => { console.log('DB OK'); return p.$disconnect(); })
  .catch(e => { console.log('ERR:', e.message); process.exit(1); });
