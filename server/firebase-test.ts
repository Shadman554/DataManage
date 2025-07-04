import { db } from './firebase';

export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test basic connection
    const testCollection = db.collection('test');
    console.log('Collection reference created successfully');
    
    // Try to perform a simple operation
    const snapshot = await testCollection.limit(1).get();
    console.log('Firebase connection test successful - can query database');
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
}