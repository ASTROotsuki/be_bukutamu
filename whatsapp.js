const { Client } = require('whatsapp-web.js');
const client = new Client();
const qrcode = require('qrcode-terminal');

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();
 