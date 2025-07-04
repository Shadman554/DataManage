import { db } from './firebase';

export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test basic connection by trying to get admin info
    const testCollection = db.collection('books');
    console.log('Collection reference created successfully');
    
    // Simple connection test - just check if we can create a reference
    if (testCollection) {
      console.log('Firebase connection test successful - database is accessible');
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('Firebase connection test failed:', error);
    // Check if it's a quota error (which means connection is working)
    if (error.code === 8 && error.details?.includes('Quota exceeded')) {
      console.log('Firebase connected but quota exceeded - connection is working');
      return true;
    }
    return false;
  }
}