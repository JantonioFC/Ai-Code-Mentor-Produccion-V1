const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testDeviceFlow() {
    try {
        console.log('1. Iniciando flujo de dispositivo...');
        const codeRes = await axios.post(`${BASE_URL}/api/auth/device/code`);
        const { device_code, user_code, verification_uri_complete, interval } = codeRes.data;

        console.log('---------------------------------------------------');
        console.log(`✅ Código de usuario: ${user_code}`);
        console.log(`👉 Abre esta URL: ${BASE_URL}${verification_uri_complete}`);
        console.log('---------------------------------------------------');
        console.log('Esperando autorización...');

        const pollInterval = (interval || 5) * 1000;

        const pollForToken = async () => {
            try {
                const tokenRes = await axios.post(`${BASE_URL}/api/auth/device/token`, {
                    device_code
                });
                return tokenRes.data;
            } catch (error) {
                if (error.response && error.response.data) {
                    return error.response.data; // { error: 'authorization_pending' } etc
                }
                throw error;
            }
        };

        // Polling loop
        while (true) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            process.stdout.write('.');

            const result = await pollForToken();

            if (result.access_token) {
                console.log('\n\n✅ ¡AUTORIZADO!');
                console.log('Access Token:', result.access_token);
                console.log('Expires In:', result.expires_in);

                // Verify the PAT
                // Note: verification logic usually happens on the client using the PAT, 
                // but we can trust the token generation for now.
                break;
            }

            if (result.error === 'authorization_pending') {
                continue;
            }

            if (result.error) {
                console.log(`\n❌ Error: ${result.error}`);
                break;
            }
        }

    } catch (error) {
        console.error('\n❌ Error fatal:', error.message);
        if (error.response) console.error(error.response.data);
    }
}

testDeviceFlow();
