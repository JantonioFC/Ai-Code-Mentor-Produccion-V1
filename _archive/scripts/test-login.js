/**
 * SCRIPT: TEST LOGIN API ENDPOINT
 * Purpose: Test the actual login endpoint to see what error we get
 */

const DEMO_EMAIL = 'demo@aicodementor.com';
const DEMO_PASSWORD = 'demo123';
const API_URL = 'http://localhost:3000/api/auth/login';

console.log('🧪 TEST: Probando endpoint de login...\n');
console.log(`📧 Email: ${DEMO_EMAIL}`);
console.log(`🔑 Password: ${DEMO_PASSWORD}`);
console.log(`🌐 Endpoint: ${API_URL}\n`);

fetch(API_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD
    })
})
    .then(response => {
        console.log(`📊 Status: ${response.status} ${response.statusText}\n`);
        return response.json();
    })
    .then(data => {
        console.log('📦 Response:');
        console.log(JSON.stringify(data, null, 2));
        console.log('\n');

        if (data.error) {
            console.log(`❌ ERROR: ${data.error}`);
            if (data.details) {
                console.log('📋 Details:', data.details);
            }
        } else if (data.session && data.session.access_token) {
            console.log('✅ ¡LOGIN EXITOSO!');
            console.log(`🎫 Token JWT recibido (longitud: ${data.session.access_token.length})`);
            console.log(`👤 Usuario: ${data.user.email}`);
        }
    })
    .catch(error => {
        console.error('❌ Error en la petición:', error.message);
    });
