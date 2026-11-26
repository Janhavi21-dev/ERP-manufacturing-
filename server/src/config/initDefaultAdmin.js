import { Company } from '../modules/company/company.model.js';
import { Role } from '../modules/roles/role.model.js';
import { User } from '../modules/users/user.model.js';
import { UnitOfMeasure } from '../modules/units/unit.model.js';
import { ROLES, ROLE_PERMISSIONS } from './constants.js';

export const ensureDefaultAdminExists = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return; // Already initialized
    }

    console.log('⚡ Empty database detected. Initializing standard Super Admin & roles...');

    // 1. Company
    const defaultCompanyName = process.env.DEFAULT_COMPANY_NAME || 'Manufacturing ERP';
    let company = await Company.findOne({ code: 'APEX' });
    if (!company) {
      company = await Company.create({
        name: defaultCompanyName,
        code: 'APEX',
        legalName: defaultCompanyName,
        email: 'admin@apex.com',
        currency: 'INR',
        timezone: 'UTC',
        fiscalYearStartMonth: 1,
        isActive: true,
      });
    }

    // 2. Roles
    const roleDocs = {};
    for (const [roleKey, roleName] of Object.entries(ROLES)) {
      let role = await Role.findOne({ company: company._id, name: roleName });
      if (!role) {
        const perms = ROLE_PERMISSIONS[roleName] || [];
        role = await Role.create({
          company: company._id,
          name: roleName,
          description: `Standard system role for ${roleName}`,
          permissions: perms,
          isSystem: true,
        });
      }
      roleDocs[roleName] = role;
    }

    // 3. Super Admin User
    const adminRole = roleDocs[ROLES.SUPER_ADMIN] || (await Role.findOne({ name: ROLES.SUPER_ADMIN }));
    await User.create({
      companyId: company._id,
      name: 'Arthur Admin',
      email: 'admin@apex.com',
      password: 'Password123!',
      role: adminRole._id,
      roleName: ROLES.SUPER_ADMIN,
      isActive: true,
    });

    // 4. Standard ISO Units of Measure
    const standardUoms = [
      { name: 'Pieces', code: 'PCS', symbol: 'pcs' },
      { name: 'Kilograms', code: 'KG', symbol: 'kg' },
      { name: 'Meters', code: 'MTR', symbol: 'm' },
      { name: 'Liters', code: 'LTR', symbol: 'L' },
      { name: 'Box', code: 'BOX', symbol: 'box' },
    ];
    for (const uom of standardUoms) {
      const exists = await UnitOfMeasure.findOne({ companyId: company._id, code: uom.code });
      if (!exists) {
        await UnitOfMeasure.create({
          companyId: company._id,
          name: uom.name,
          code: uom.code,
          symbol: uom.symbol,
          isActive: true,
        });
      }
    }

    console.log('✅ Clean Super Admin account initialized:');
    console.log('   Email:    admin@apex.com');
    console.log('   Password: Password123!');
  } catch (error) {
    console.error('❌ Error initializing default admin:', error.message);
  }
};
