
import axios from 'axios';

async function main() {
    const baseUrl = 'http://localhost:8000/api/v1';

    // Login
    console.log('Logging in...');
    try {
        const loginRes = await axios.post(`${baseUrl}/auth/login/access-token`,
            new URLSearchParams({ username: 'admin@hospital.com', password: 'Test@123' }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const token = loginRes.data.access_token;
        console.log('Token acquired.');

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Get Doctors
        console.log('Fetching doctors...');
        const doctorsRes = await axios.get(`${baseUrl}/doctors`, config);

        const doctorsData = doctorsRes.data;
        let doctorId;
        if (Array.isArray(doctorsData)) {
            doctorId = doctorsData[0]?.id;
        } else if (doctorsData.data && Array.isArray(doctorsData.data)) {
            doctorId = doctorsData.data[0]?.id;
        } else if (doctorsData.doctors && Array.isArray(doctorsData.doctors)) {
            doctorId = doctorsData.doctors[0]?.id;
        }

        if (!doctorId) {
            console.error('No doctor found.');
            return;
        }

        console.log(`Using doctor ID: ${doctorId}`);

        // 1. GET modifications
        console.log('1. GET /schedules/modifications...');
        const listRes = await axios.get(`${baseUrl}/schedules/modifications?doctor_id=${doctorId}`, config);
        console.log(`GET Status: ${listRes.status}`);
        console.log(`Initial count: ${listRes.data.length}`);

        // 2. POST create modification
        console.log('2. POST /schedules/modifications...');
        const payload = {
            doctor_id: doctorId,
            request_type: 'block_date',
            start_date: new Date().toISOString().split('T')[0],
            reason: 'Verification Test Axios',
            // schedule_id is optional now
        };

        const createRes = await axios.post(`${baseUrl}/schedules/modifications`, payload, config);
        console.log(`POST Status: ${createRes.status}`);
        const createdMod = createRes.data;
        console.log('Created ID:', createdMod.id);

        // 3. GET verify it exists
        console.log('3. GET verify...');
        const verifyRes = await axios.get(`${baseUrl}/schedules/modifications?doctor_id=${doctorId}`, config);
        const found = verifyRes.data.find(m => m.id === createdMod.id);
        if (found) {
            console.log('Success: Modification found in list.');
        } else {
            console.error('Failure: Modification NOT found in list.');
        }

        // 4. DELETE to clean up
        console.log('4. DELETE...');
        const deleteRes = await axios.delete(`${baseUrl}/schedules/modifications/${createdMod.id}`, config);
        console.log(`DELETE Status: ${deleteRes.status}`);

    } catch (error) {
        console.error('VERIFICATION FAILED');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

main();
