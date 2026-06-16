import ngrok from '@ngrok/ngrok';
import { config } from 'dotenv';

config();

const authtoken = process.env.NGROK_AUTHTOKEN;
if (!authtoken) {
  console.error('[TUNNEL] NGROK_AUTHTOKEN manquant dans .env');
  console.error('[TUNNEL] Créer un compte sur https://ngrok.com et copier le token');
  process.exit(1);
}

const listener = await ngrok.forward({
  addr: 3001,
  authtoken,
});

const url = listener.url();
console.log('\n========================================');
console.log(`[TUNNEL] URL publique : ${url}`);
console.log(`[TUNNEL] Webhook URL  : ${url}/api/webhooks/gitlab`);
console.log('========================================\n');

// Garder le processus actif
process.on('SIGINT', async () => {
  await ngrok.disconnect();
  process.exit(0);
});

await new Promise(() => {});
