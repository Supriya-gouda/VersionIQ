import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE_URL = 'http://localhost:4000';
let token = '';

async function register() {
  try {
    await axios.post(`${API_BASE_URL}/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!'
    });
    console.log('Registration successful or user already exists');
  } catch (error) {
    if (error.response?.status !== 409) {
      console.log('Registration info:', error.response?.status);
    }
  }
}

async function login() {
  const res = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: 'test@example.com',
    password: 'Password123!'
  });
  token = res.data.token;
  console.log('Login successful');
}

async function upload(fileId = null, content = 'v1') {
  const form = new FormData();
  const filePath = 'test.txt';
  fs.writeFileSync(filePath, content);
  form.append('file', fs.createReadStream(filePath), filePath);
  if (fileId) {
    form.append('fileId', fileId);
  }

  const res = await axios.post(`${API_BASE_URL}/files/upload`, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}

async function run() {
  try {
    await register();
    await login();
    
    console.log('--- Step 1: First Upload ---');
    const res1 = await upload(null, 'Version 1 Content');
    console.log('v1 created:', res1.version.versionNumber, 'File ID:', res1.file._id);
    
    console.log('--- Step 2: Second Upload (Versioning) ---');
    const res2 = await upload(res1.file._id, 'Version 2 Content - Modified');
    console.log('v2 created:', res2.version.versionNumber);
    
    console.log('--- Step 3: Third Upload (Versioning) ---');
    const res3 = await upload(res1.file._id, 'Version 3 Content - Further changes');
    console.log('v3 created:', res3.version.versionNumber);

    console.log('--- Step 4: Verify Metadata ---');
    const fileInfo = await axios.get(`${API_BASE_URL}/files/${res1.file._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Current Version in DB:', fileInfo.data.file.currentVersionNumber);
    
    if (fileInfo.data.file.currentVersionNumber === 3) {
      console.log('✅ Versioning workflow verified successfully!');
    } else {
      console.error('❌ Versioning mismatch!');
    }

  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data || error.message);
  }
}

run();
