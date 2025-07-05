import bcrypt from 'bcrypt';

/**
 * Simple fallback admin creation for when database is not available
 * This creates the super admin in the fallback storage system
 */

// This will be used by the fallback storage when no database is available
export const createFallbackAdmin = async () => {
  const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);
  
  return {
    id: 'admin_fallback_superadmin',
    username: 'superadmin',
    email: 'admin@vet-dict.com',
    password: hashedPassword,
    role: 'super_admin',
    firstName: 'Super',
    lastName: 'Admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null
  };
};

console.log('Admin user credentials:');
console.log('Username: superadmin');
console.log('Password: SuperAdmin123!');