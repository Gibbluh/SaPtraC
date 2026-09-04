// Define application roles and the pages they can access
const ROLES = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  CASHIER: "Cashier",
  PUMP: "Fuel Pump Attendant",
  OP_MANAGER: "Operational Manager",
  MECHANIC: "Mechanic",
};

// Define pages and which roles can access them
const PERMISSIONS = [
  { key: "dashboard", path: "/dashboard", label: "Dashboard", roles: Object.values(ROLES) },
  { key: "users", path: "/users", label: "User Management", roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  { key: "drivers", path: "/drivers", label: "Drivers", roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OP_MANAGER] },
  { key: "units", path: "/units", label: "Units", roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OP_MANAGER] },
  { key: "schedules", path: "/schedules", label: "Scheduling", roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OP_MANAGER, ROLES.PUMP] },
  { key: "fuel", path: "/fuel", label: "Fuel Monitoring", roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CASHIER, ROLES.PUMP] },
  { key: "remittances", path: "/remittances", label: "Remittances", roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CASHIER] },
  { key: "maintenance", path: "/maintenance", label: "Maintenance", roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MECHANIC] },
  { key: "analytics", path: "/analytics", label: "Analytics", roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OP_MANAGER] },
];

export { ROLES, PERMISSIONS };
