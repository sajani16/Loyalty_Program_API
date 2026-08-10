import Role from "../models/Role.js";

export async function createRole(roleObj) {
  const role = new Role(roleObj);
  return role.save();
}

export async function findRoleByName(name) {
  return Role.findOne({ name, isDeleted: false }).lean();
}

export async function findRoleById(id) {
  return Role.findOne({ _id: id, isDeleted: false }).lean();
}

export async function updateRole(id, update) {
  return Role.findOneAndUpdate({ _id: id, isDeleted: false }, update, {
    new: true,
  }).lean();
}

export async function listRoles(filter = {}) {
  return Role.find({ ...filter, isDeleted: false }).lean();
}

export async function deleteRole(id) {
  return Role.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).lean();
}

/**
 * Initialize default roles
 */
export async function initializeRoles() {
  const roles = [
    {
      name: "admin",
      description: "Administrator role",
      permissions: [
        "users:create",
        "users:read",
        "users:update",
        "users:delete",
        "businesses:create",
        "businesses:read",
        "businesses:update",
        "businesses:delete",
        "customers:read",
        "roles:manage",
      ],
    },
    {
      name: "superadmin",
      description: "Super Administrator role",
      permissions: [
        "users:create",
        "users:read",
        "users:update",
        "users:delete",
        "businesses:create",
        "businesses:read",
        "businesses:update",
        "businesses:delete",
        "customers:read",
        "roles:manage",
        "system:settings",
      ],
    },
    {
      name: "business",
      description: "Business account role",
      permissions: [
        "customers:create",
        "customers:read",
        "customers:update",
        "customers:delete",
        "loyalty:manage",
        "rewards:manage",
        "profile:edit",
      ],
    },
    {
      name: "customer",
      description: "Customer account role",
      permissions: [
        "profile:read",
        "profile:edit",
        "loyalty:read",
        "rewards:view",
      ],
    },
  ];

  for (const roleData of roles) {
    const existingRole = await findRoleByName(roleData.name);
    if (!existingRole) {
      await createRole(roleData);
    }
  }
}
