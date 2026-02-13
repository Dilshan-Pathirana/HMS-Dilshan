
async function main() {
    const baseUrl = 'http://localhost:8000/api/v1';

    // Login
    console.log('Logging in...');
    try {
        const loginRes = await fetch(`${baseUrl}/auth/login/access-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ username: 'admin@hospital.com', password: 'Test@123' })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log('Token acquired.');

        // Get Doctors
        console.log('Fetching doctors...');
        const doctorsRes = await fetch(`${baseUrl}/doctors`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!doctorsRes.ok) {
            console.error('Doctors fetch failed:', await doctorsRes.text());
            return;
        }

        const doctorsData = await doctorsRes.json();
        let doctorId;
        if (Array.isArray(doctorsData)) {
            doctorId = doctorsData[0]?.id;
        } else if (doctorsData.data && Array.isArray(doctorsData.data)) {
            doctorId = doctorsData.data[0]?.id;
        } else if (doctorsData.doctors && Array.isArray(doctorsData.doctors)) {
            doctorId = doctorsData.doctors[0]?.id;
        }

        if (!doctorId) {
            console.error('No doctor found. Response was:', JSON.stringify(doctorsData).substring(0, 200));
            return;
        }

        console.log(`Using doctor ID: ${doctorId}`);

        // Call Schedule Cancel Requests
        const url = `${baseUrl}/schedules/cancel/requests?doctor_id=${doctorId}`;
        console.log(`Calling ${url}...`);
        const cancelRes = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`Status: ${cancelRes.status}`);
        const text = await cancelRes.text();
        console.log('Raw Body:', text);

        // Test with invalid UUID
        const invalidUrl = `${baseUrl}/schedules/cancel/requests?doctor_id=invalid-uuid`;
        console.log(`Calling ${invalidUrl}...`);
        const invalidRes = await fetch(invalidUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Invalid UUID Status: ${invalidRes.status}`);
        console.log('Invalid UUID Raw Body:', await invalidRes.text());

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
