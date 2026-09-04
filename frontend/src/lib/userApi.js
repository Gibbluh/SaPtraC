import api from "./axios";
import useAuth from "./useAuth";

// User API integration layer
export const useUserApi = () => {
useAuth();

  // Get all users
  const getUsers = async () => {
    const res = await api.get("/users");
    return res.data;
  };

  // Get a single user by ID
  const getSingleUser = async (userId) => {
    const res = await api.get(`/users/${userId}`);
    return res.data;
  };

  // Create a new user
  const createUser = async (userData) => {
    const res = await api.post("/users", userData);
    return res.data;
  };

  // Update an existing user
  const updateUser = async (userId, userData) => {
    const res = await api.put(`/users/${userId}`, userData);
    return res.data;
  };

  // Deactivate a user (soft delete)
  const deactivateUser = async (userId) => {
    const res = await api.patch(`/users/${userId}/deactivate`);
    return res.data;
  };

  // Delete a user (hard delete)
  const deleteUser = async (userId) => {
    const res = await api.delete(`/users/${userId}`);
    return res.data;
  };

  return {
    getUsers,
    getSingleUser,
    createUser,
    updateUser,
    deactivateUser,
    deleteUser,
  };
};

