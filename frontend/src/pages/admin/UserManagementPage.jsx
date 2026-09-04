import { useEffect, useMemo, useState } from "react";
import { useUserApi } from "../../lib/userApi";
import useAuth from "../../lib/useAuth";

const PAGE_SIZE = 10;

const INITIAL_FORM_DATA = {
  fullName: "",
  email: "",
  password: "",
  role: "Cashier",
};

const normalizeRole = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const UserManagementPage = () => {
  const {
    getUsers,
    createUser,
    updateUser,
    deactivateUser,
  } = useUserApi();

  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [archivingId, setArchivingId] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const isSuperAdmin =
    normalizeRole(currentUser?.role) === "super admin";

  const currentUserId =
    currentUser?._id || currentUser?.id || currentUser?.userId;

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getUsers({
        page: 1,
        limit: 1000,
      });

      const receivedUsers = Array.isArray(data)
        ? data
        : Array.isArray(data?.users)
        ? data.users
        : [];

      setUsers(receivedUsers);
    } catch (err) {
      console.error("Failed to fetch users:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch users."
      );

      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getUsers({
          page: 1,
          limit: 1000,
        });

        if (!isMounted) return;

        const receivedUsers = Array.isArray(data)
          ? data
          : Array.isArray(data?.users)
          ? data.users
          : [];

        setUsers(receivedUsers);
      } catch (err) {
        if (!isMounted) return;

        console.error("Failed to fetch users:", err);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch users."
        );

        setUsers([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };

    // Run only when the page initially opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedSelectedRole = normalizeRole(role);

    return users.filter((userItem) => {
      const fullName = String(
        userItem?.fullName || ""
      ).toLowerCase();

      const email = String(
        userItem?.email || ""
      ).toLowerCase();

      const userRole = normalizeRole(userItem?.role);

      const matchesSearch =
        !normalizedSearch ||
        fullName.includes(normalizedSearch) ||
        email.includes(normalizedSearch);

      const matchesRole =
        !normalizedSelectedRole ||
        userRole === normalizedSelectedRole;

      return matchesSearch && matchesRole;
    });
  }, [users, search, role]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / PAGE_SIZE)
  );

  useEffect(() => {
    setPage(1);
  }, [search, role]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, page]);

  const openCreateModal = () => {
    if (!isSuperAdmin) {
      window.alert(
        "Only the Super Admin can create users."
      );
      return;
    }

    setSelectedUser(null);
    setFormData(INITIAL_FORM_DATA);
    setModalOpen(true);
  };

  const openEditModal = (userItem) => {
    if (!isSuperAdmin) {
      window.alert(
        "Only the Super Admin can edit users."
      );
      return;
    }

    setSelectedUser(userItem);

    setFormData({
      fullName: userItem?.fullName || "",
      email: userItem?.email || "",
      password: "",
      role: userItem?.role || "Cashier",
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setModalOpen(false);
    setSelectedUser(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const cleanName = formData.fullName.trim();
    const cleanEmail = formData.email.trim();

    if (!cleanName) {
      window.alert("Full name is required.");
      return false;
    }

    if (!cleanEmail) {
      window.alert("Email is required.");
      return false;
    }

    if (!selectedUser && !formData.password.trim()) {
      window.alert(
        "Password is required when creating a user."
      );
      return false;
    }

    if (!formData.role) {
      window.alert("Role is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isSuperAdmin) {
      window.alert(
        "Only the Super Admin can perform this action."
      );
      return;
    }

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        role: formData.role,
      };

      /*
       * Do not send an empty password while editing.
       * Sending an empty password may overwrite the current password.
       */
      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      if (selectedUser) {
        await updateUser(selectedUser._id, payload);

        window.alert("User updated successfully.");
      } else {
        await createUser(payload);

        window.alert("User created successfully.");
      }

      await fetchUsers();
      closeModal();
    } catch (err) {
      console.error("User operation failed:", err);

      window.alert(
        err?.response?.data?.message ||
          err?.message ||
          "Operation failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (userItem) => {
    if (!isSuperAdmin) {
      window.alert(
        "Only the Super Admin can archive users."
      );
      return;
    }

    if (!userItem?._id) {
      window.alert("Invalid user ID.");
      return;
    }

    if (
      currentUserId &&
      String(userItem._id) === String(currentUserId)
    ) {
      window.alert(
        "You cannot archive your own account."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to archive ${
        userItem.fullName || userItem.email
      }?`
    );

    if (!confirmed) return;

    setArchivingId(userItem._id);

    try {
      await deactivateUser(userItem._id);

      setUsers((previousUsers) =>
        previousUsers.map((existingUser) =>
          existingUser._id === userItem._id
            ? {
                ...existingUser,
                status: "Archived",
                isActive: false,
              }
            : existingUser
        )
      );

      window.alert("User archived successfully.");
    } catch (err) {
      console.error("Failed to archive user:", err);

      window.alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to archive user."
      );
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-black md:p-8">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-3xl md:text-4xl font-bold text-black tracking-tight">
          User Management
        </h1>

        <p className="mt-2 text-base font-medium text-black">
          {isSuperAdmin
            ? "Create, edit, and archive system users."
            : "You have view-only access to user accounts."}
        </p>
      </div>

      {/* Search, filter, and action bar */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">

        <input
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-black shadow-sm outline-none transition-all placeholder:text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 md:w-72"
        />

        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-black shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 md:w-60"
        >
          <option value="">All roles</option>
          <option value="Cashier">Cashier</option>
          <option value="Administrator">Administrator</option>
          <option value="Mechanic">Mechanic</option>
          <option value="Operational Manager">
            Operational Manager
          </option>
          <option value="Fuel Pump Attendant">
            Fuel Pump Attendant
          </option>
        </select>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-base font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 md:ml-auto"
          >
            + Add User
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-base font-semibold text-black">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">

            <thead>
              <tr className="border-b border-slate-200 bg-slate-100">

                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-black">
                  Name
                </th>

                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-black">
                  Email
                </th>

                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-black">
                  Role
                </th>

                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-black">
                  Status
                </th>

                <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-black">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-14 text-center text-base font-semibold text-black"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-14 text-center text-base font-semibold text-black"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((userItem) => {
                  const isArchived =
                    String(userItem.status || "").toLowerCase() ===
                      "archived" ||
                    userItem.isActive === false;

                  const isCurrentAccount =
                    currentUserId &&
                    String(userItem._id) ===
                      String(currentUserId);

                  return (
                    <tr
                      key={userItem._id}
                      className="border-b border-slate-200 transition-colors odd:bg-white even:bg-slate-50/20 hover:bg-slate-50"
                    >

                      {/* Name */}
                      <td className="px-6 py-4 text-base font-semibold text-black">
                        {userItem.fullName || "—"}

                        {isCurrentAccount && (
                          <span className="ml-2 rounded bg-blue-50 px-2 py-1 text-xs font-bold text-black">
                            You
                          </span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-base font-medium text-black">
                        {userItem.email || "—"}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4 text-base font-semibold text-black">
                        {userItem.role || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${
                            isArchived
                              ? "bg-slate-200 text-black"
                              : "bg-emerald-50 text-black"
                          }`}
                        >
                          {isArchived
                            ? "Archived"
                            : userItem.status || "Active"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        {isSuperAdmin ? (
                          <div className="flex items-center gap-3">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(userItem)
                              }
                              disabled={isArchived}
                              className="rounded-lg border border-blue-600 bg-blue-700 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleArchive(userItem)
                              }
                              disabled={
                                isArchived ||
                                isCurrentAccount ||
                                archivingId ===
                                  userItem._id
                              }
                              className="rounded-lg border border-red-400 bg-red-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {archivingId ===
                              userItem._id
                                ? "Archiving..."
                                : "Archive"}
                            </button>

                          </div>
                        ) : (
                          <span className="text-base font-semibold italic text-black">
                            View only
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">

        <div className="text-base font-semibold text-black">
          Page {page} of {totalPages}
          <span className="ml-2">
            ({filteredUsers.length} user
            {filteredUsers.length === 1 ? "" : "s"})
          </span>
        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={() =>
              setPage((current) =>
                Math.max(1, current - 1)
              )
            }
            disabled={page === 1}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-black transition-all hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50"
          >
            Prev
          </button>

          <button
            type="button"
            onClick={() =>
              setPage((current) =>
                Math.min(totalPages, current + 1)
              )
            }
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-black transition-all hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-50"
          >
            Next
          </button>

        </div>
      </div>

      {/* Create/Edit modal — Super Admin only */}
      {isSuperAdmin && modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-modal-title"
        >
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl">

            {/* Modal header */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">

              <h2
                id="user-modal-title"
                className="text-xl font-bold uppercase tracking-wider text-black"
              >
                {selectedUser
                  ? "Edit User"
                  : "Add User"}
              </h2>

            </div>

            <form
              className="space-y-5"
              onSubmit={handleSubmit}
            >

              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-base font-bold text-black"
                >
                  Full Name
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleFormChange}
                  placeholder="Enter full name"
                  disabled={submitting}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-medium text-black shadow-sm outline-none transition-all placeholder:text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-base font-bold text-black"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="Enter email address"
                  disabled={submitting}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-medium text-black shadow-sm outline-none transition-all placeholder:text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-base font-bold text-black"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder={
                    selectedUser
                      ? "Leave blank to keep current password"
                      : "Enter password"
                  }
                  disabled={submitting}
                  required={!selectedUser}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-medium text-black shadow-sm outline-none transition-all placeholder:text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
                />
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="role"
                  className="mb-2 block text-base font-bold text-black"
                >
                  Role
                </label>

                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  disabled={submitting}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-medium text-black shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100"
                >
                  <option value="Cashier">
                    Cashier
                  </option>

                  <option value="Administrator">
                    Administrator
                  </option>

                  <option value="Super Admin">
                    Super Admin
                  </option>

                  <option value="Mechanic">
                    Mechanic
                  </option>

                  <option value="Operational Manager">
                    Operational Manager
                  </option>

                  <option value="Fuel Pump Attendant">
                    Fuel Pump Attendant
                  </option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 border-t border-slate-200 pt-5">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base font-bold text-black transition-all hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-base font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? selectedUser
                      ? "Updating..."
                      : "Creating..."
                    : selectedUser
                    ? "Update User"
                    : "Create User"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagementPage;