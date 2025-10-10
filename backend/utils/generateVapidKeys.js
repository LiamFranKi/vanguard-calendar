import webpush from 'web-push';

// Generar claves VAPID para Web Push
const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n🔑 Claves VAPID generadas:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\n📝 Copia estas claves a tu archivo .env\n');


