// backend/src/utils/createSuperAdmin.js

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

dotenv.config();

const users = [
  {
    fullName: "System Super Admin",
    email: "admin@sptc.com",
    password: "Admin123!",
    role: "Super Admin",
    isActive: true,
  },
  {
  fullName: "Administrator",
  email: "administrator@gmail.com",
  password: "Admin123!",
  role: "Administrator",
  isActive: true,
},
{
    fullName: "Cashier User",
    email: "cashier@gmail.com",
    password: "Cashier123!",
    role: "Cashier",
    isActive: true,
  },
  {
    fullName: "Mechanic User",
    email: "mechanic@gmail.com",
    password: "Mechanic123!",
    role: "Mechanic",
    isActive: true,
  },
  {
    fullName: "Fuel Attendant",
    email: "fuel@gmail.com",
    password: "Fuel123!",
    role: "Fuel Pump Attendant",
    isActive: true,
  },
  {
  fullName: "Operations Manager",
  email: "opmanager@gmail.com",
  password: "Manager123!",
  role: "Operational Manager",
  isActive: true,
}
];



const createSuperAdmin = async () => {
  try {
    console.log("Mongo URI:", process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    for (const userData of users) {
  const existing = await User.findOne({
    email: userData.email,
  });

  if (!existing) {
    await User.create({
      ...userData,
      password: await bcrypt.hash(userData.password, 10),
    });
    console.log(`${userData.role} created`);
  } else {
    console.log(`${userData.role} already exists`);
  }
}

process.exit(0);
    /*const newAdmin = await User.create({
      fullName: "System Super Admin",
      email: "sptcadmin@gmail.com",
      password: "Admin123!",
      role: "Super Admin",
      isActive: true,
    }); */

  } catch (error) {
    console.error("Error creating super admin:", error);
    process.exit(1);
  }
};

createSuperAdmin();