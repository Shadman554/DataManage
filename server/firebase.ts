import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Function to format private key properly
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) {
    console.error('No private key provided');
    return undefined;
  }
  
  let formattedKey = key;
  
  // Handle multiple escape patterns
  formattedKey = formattedKey
    .replace(/\\\\n/g, '\n')  // Double escaped
    .replace(/\\n/g, '\n')    // Single escaped
    .trim();
  
  // Debug the key format
  console.log('Private key format check:');
  console.log('- Key length:', formattedKey.length);
  console.log('- Starts with BEGIN:', formattedKey.includes('-----BEGIN PRIVATE KEY-----'));
  console.log('- Ends with END:', formattedKey.includes('-----END PRIVATE KEY-----'));
  console.log('- Contains newlines:', formattedKey.includes('\n'));
  
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.error('Private key missing BEGIN marker');
    console.error('Key preview:', formattedKey.substring(0, 100) + '...');
  }
  
  return formattedKey;
}

const serviceAccount = {
  type: "service_account",
  project_id: "vet-dict-93f36",
  private_key_id: "4a311b56c4a9151ffd189b59926ddf203bb3b732",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDIWaGL5znby5Fi\nfILW8ssTHBITHqC2nb3paRQByIFAPyv1CUai8qsG4pQ6oWsq8uLZ5+V98Jn2QcYd\n4X2nQs5ZbMg+2IDFC0QPsfVfXQXVV9w4oxr2noySrS2lnwj/SGU1Qr1cKD2oA0w6\nugRTDbap4dlIf+Hn8Btt7LgElWMA5o7S8Rbqtp73UGNzCa9zqQv64FZSC6vuFLSb\nYPguazklXTjjcXRMZ9xmV39A7JL6FB95/6T/vrDYFCkdLm7Y/ah8TDiBnZSG0AIJ\n2avRIySyBDqK1okO54sTZ4QbO6tozWqPqoB7oIoPj2Z7Hbzo+RqT5GgO4r3tY1sX\nF79UY02TAgMBAAECggEAF/xTENK/5IZ8g1PwvhcXJNSJfWx/RR2hbN49nPEKOEzX\n0GAp6rwuqYZaxKIqmFu3uOrAWNGDPS4mr9EdH/cpiR8y4gM9d1mf7lkZzS7v0djQ\n7p7oTXoxziWZf2iIxTc/lp7E2NGggArVB3rZpa/QnIoDX2CgBQqD3icm6LWRwruh\nEsVEhvyUvXaHF1tktVJfk3MLcx7R3deIkZeIe2VQGTdG64+VOHPrFHHHZCCogovg\nPV8DmVmysGg3X0ZSuNCHWJkn6P0YQRq0awjoHu/e5cePLQgULrgwdelZE3vCUO23\nHI1USpndRaE+ASGFFtGVUurD4yPUtCHJ7X93566LQQKBgQD3H+kCxOIBwBr53MzW\nhLaUZNiLvsClHCLdZtVFLiw4dhabORaBwSFbSRAOaO38mfXjfk9TpS9MZtkRsXJM\nb61dnrbNRJJVAY+ucvfZtmXylGO5GjT3aXwMU22FAa5BPAay1SFsBwY5f/H3lQq3\nNScWgY5XzpfAaKKd0FzvJNh3wwKBgQDPi6vDnQR0sKyeDn0wF6G3SCjYy7saxFNi\nnvmnSjAkCUjUhMBUfg527C2rgxg2WCTuF4Mg/K3uUz+qp8fQvSCFCYzJ2u5dRVWM\n5I8aeokPvLTmTobGN3N7rfja2wJ9qgB31YmCWWLJK8GY2KWlTtjc94NTNQNHY8hO\noAUYIDFF8QKBgQDjvi+yEpmqPU1fCaJo7AOLPGjoWJIXV5e17KgNSmEMY5+vy2u3\nhrHj+7BlZ0Qz7/tQfT5D+s5dHcdca+jHEoB17+fNwi0NVBQDFAbgSB0p8qD4nHNF\ns5vTjCs5UXQywEv4ETzs3ohZA1WN8nfeoYh1UE5LE6R8eLGsuLJ83br0mwKBgGUI\nKepEommno7Ahf4GMz3VoVDINIx0Jm0nz97YfIEY6mtCRewrmfmYX3LeUTpIN4JRi\nr7u8JXNR5TlPCa8skgsRNg8BW23eFaJLlPof0l7tzuYaLfOKBNadPvpTCOhhfG7Z\nbWId3z/s5AZi2GgbdOhEORKlSN5UzaqwrSosabARAoGAGG6R7tuZkuXH9U8/x6FS\n35wQTftQd+RPBXwZwuB/XxwKNR95O0OPQaNPwVDOfwKSO2NwnU1jTrPpSNXzOsrr\nVUJe9QCAUN2IbBDV4Mplo3sT2kJ35sp0kDip81G/HIaFP3By/2ElVA2r2lVYnmw1\nj4BmbsxGqg3i7OkCEO/enXk=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-mlk3o@vet-dict-93f36.iam.gserviceaccount.com",
  client_id: "103721849592387146774",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-mlk3o%40vet-dict-93f36.iam.gserviceaccount.com",
};

// Validate required fields
if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
  console.error('Missing Firebase configuration:', {
    project_id: !!serviceAccount.project_id,
    private_key: !!serviceAccount.private_key,
    client_email: !!serviceAccount.client_email
  });
  throw new Error('Missing required Firebase configuration. Please check your environment variables.');
}

// Initialize Firebase Admin SDK
let app;
if (getApps().length === 0) {
  try {
    console.log('Initializing Firebase Admin SDK...');
    app = initializeApp({
      credential: cert(serviceAccount as any),
      storageBucket: "vet-dict-93f36.firebasestorage.app",
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    throw error;
  }
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
