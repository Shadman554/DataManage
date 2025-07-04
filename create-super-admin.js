import { AuthService } from './server/auth.js';

async function createSuperAdmin() {
  try {
    const superAdmin = await AuthService.createAdmin({
      username: 'superadmin',
      email: 'admin@vet-dict.com',
      password: 'SuperAdmin123!',
      role: 'super_admin',
      firstName: 'Super',
      lastName: 'Admin',
    });

    console.log('Super admin created successfully:', {
      id: superAdmin.id,
      username: superAdmin.username,
      email: superAdmin.email,
      role: superAdmin.role,
    });
  } catch (error) {
    console.error('Error creating super admin:', error);
  }
}

createSuperAdmin();
