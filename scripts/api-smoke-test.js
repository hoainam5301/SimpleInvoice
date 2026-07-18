/**
 * Smoke test against the real sandbox APIs described in the assessment doc.
 * Reads credentials from .env (never hard-coded). Usage:
 *   node scripts/api-smoke-test.js <username> <password>
 */
const fs = require('fs');
const path = require('path');

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error('Usage: node scripts/api-smoke-test.js <username> <password>');
  process.exit(1);
}

async function main() {
  const form = new URLSearchParams({
    client_id: env.CLIENT_ID,
    client_secret: env.CLIENT_SECRET,
    grant_type: 'password',
    scope: 'openid',
    username,
    password,
  });

  const tokenRes = await fetch(env.AUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const tokenJson = await tokenRes.json();
  console.log('== /oauth2/token status:', tokenRes.status);
  console.log(JSON.stringify({ ...tokenJson, access_token: (tokenJson.access_token || '').slice(0, 24) + '...', id_token: undefined }, null, 2));
  if (!tokenJson.access_token) return;

  const meRes = await fetch(env.MEMBERSHIP_ME_URL, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const meJson = await meRes.json();
  console.log('\n== /users/me status:', meRes.status);
  console.log(JSON.stringify(meJson, null, 2).slice(0, 2500));

  const orgToken = meJson?.data?.memberships?.[0]?.token || meJson?.memberships?.[0]?.token;
  console.log('\norg_token found:', orgToken ? orgToken.slice(0, 24) + '...' : 'NOT FOUND — inspect shape above');
  if (!orgToken) return;

  const listRes = await fetch(
    `${env.API_BASE_URL}/invoice-service/1.0.0/invoices?sortBy=CREATED_DATE&ordering=DESCENDING&pageNum=1&pageSize=3`,
    { headers: { Authorization: `Bearer ${tokenJson.access_token}`, 'org-token': orgToken } },
  );
  const listJson = await listRes.json();
  console.log('\n== GET /invoices status:', listRes.status);
  console.log(JSON.stringify(listJson, null, 2).slice(0, 4000));
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
