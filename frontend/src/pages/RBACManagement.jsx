import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function RBACManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [branches, setBranches] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users"); // "users" | "matrix" | "branches"

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("ALL");

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Form State for User Creation
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "password123",
    role: "PRESENTING_BANK",
    bankId: "",
    branchName: "Athwa Lines Branch Surat",
    customBranch: "",
  });

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    name: "",
    role: "",
    branchName: "",
    password: "",
  });

  async function loadData() {
    try {
      setLoading(true);
      const [matrixRes, branchesRes, usersRes, banksRes] = await Promise.all([
        client.get("/rbac/matrix"),
        client.get("/rbac/branches"),
        client.get("/rbac/users"),
        client.get("/admin/banks").catch(() => ({ data: [] })),
      ]);

      setMatrixData(matrixRes.data);
      setBranches(branchesRes.data);
      setUsers(usersRes.data);
      
      const banksList = banksRes.data || [];
      setBanks(banksList);
      if (banksList.length > 0 && !formData.bankId) {
        setFormData((prev) => ({ ...prev, bankId: currentUser?.bank?.id || banksList[0].id }));
      }
    } catch (err) {
      console.error("Failed to load RBAC data:", err);
      setErrorMessage(err.response?.data?.error || "Failed to load RBAC configuration.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateUser(e) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage(null);

      const targetBranch =
        formData.branchName === "CUSTOM"
          ? formData.customBranch.trim()
          : formData.branchName;

      if (!targetBranch) {
        throw new Error("Please specify a valid branch name.");
      }

      const res = await client.post("/rbac/users", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        bankId: formData.bankId || currentUser?.bank?.id,
        branchName: targetBranch,
      });

      setStatusMessage(res.data.message || "User successfully provisioned.");
      setShowCreateModal(false);
      setFormData({
        name: "",
        email: "",
        password: "password123",
        role: "PRESENTING_BANK",
        bankId: banks[0]?.id || "",
        branchName: "Athwa Lines Branch Surat",
        customBranch: "",
      });

      await loadData();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    if (!showEditModal) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const res = await client.patch(`/rbac/users/${showEditModal.id}`, {
        name: editFormData.name,
        role: editFormData.role,
        branchName: editFormData.branchName,
        password: editFormData.password || undefined,
      });

      setStatusMessage(res.data.message || "User successfully updated.");
      setShowEditModal(null);
      await loadData();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || "Failed to update user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteUser(userToDelete) {
    if (!window.confirm(`Are you sure you want to remove user '${userToDelete.name}' (${userToDelete.email}) from the system?`)) {
      return;
    }

    try {
      setErrorMessage(null);
      const res = await client.delete(`/rbac/users/${userToDelete.id}`);
      setStatusMessage(res.data.message || "User removed.");
      await loadData();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      setErrorMessage(err.response?.data?.error || err.message || "Failed to delete user.");
    }
  }

  function openEditModal(targetUser) {
    setShowEditModal(targetUser);
    setEditFormData({
      name: targetUser.name,
      role: targetUser.role,
      branchName: targetUser.branchName || "",
      password: "",
    });
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.branchName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === "ALL" || u.role === selectedRoleFilter;
    const matchesBranch = selectedBranchFilter === "ALL" || u.branchName === selectedBranchFilter;
    return matchesSearch && matchesRole && matchesBranch;
  });

  const selectedPolicy = matrixData?.rolePolicies?.[formData.role] || {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200/70 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
              Enterprise RBAC & Identity Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Role-Based Access Control & User Provisioning
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Centralized identity governance for National Clearing Gateway. Provision users across all branches with strict role-specific permission scopes, high-value transaction approval limits, and cryptographic verification rights.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setShowCreateModal(true);
              }}
              className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              Provision New User / Role
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {statusMessage && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl p-4 flex items-center gap-3">
            <span className="font-semibold">{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Active Personnel
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
              {users.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Across all registered banks & entities</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Configured Roles
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-600 mt-1.5 tracking-tight">
              {Object.keys(matrixData?.rolePolicies || {}).length || 7} / 7
            </div>
            <div className="text-xs text-slate-500 mt-1">Strict RBAC policy boundaries</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Branches Covered
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1.5 tracking-tight">
              {branches.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Nationwide clearing network points</div>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-5 shadow-xs">
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Governance Officers
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1.5 tracking-tight">
              {users.filter((u) => ["BRANCH_MANAGER", "ADMIN", "COMPLIANCE_AUDITOR"].includes(u.role)).length}
            </div>
            <div className="text-xs text-amber-700/80 mt-1">Managers, Auditors & Switch Admins</div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "users"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>User Directory & Provisioning</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "matrix"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Role-Permission Matrix & Limits</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
              RBAC Policy
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("branches")}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "branches"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Branch Personnel Distribution</span>
          </button>
        </div>

        {/* TAB 1: User Directory & Provisioning */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or branch..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="ALL">All Roles ({users.length})</option>
                  {Object.keys(matrixData?.rolePolicies || {}).map((r) => (
                    <option key={r} value={r}>
                      {matrixData?.rolePolicies?.[r]?.title || r}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedBranchFilter}
                  onChange={(e) => setSelectedBranchFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-[200px]"
                >
                  <option value="ALL">All Branches ({branches.length})</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">User Details</th>
                      <th className="py-3 px-4">Assigned Role & Title</th>
                      <th className="py-3 px-4">Branch & Institution</th>
                      <th className="py-3 px-4">Role Limitations & Scope</th>
                      <th className="py-3 px-4">Active Permissions</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No users match the search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isSelf = user.id === currentUser?.id;
                        return (
                          <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-100 text-brand-700">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {user.email}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${user.roleBadge}`}>
                                {user.roleTitle || user.role}
                              </span>
                              <div className="text-[10px] text-slate-400 font-mono mt-1">
                                {user.roleCategory}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">
                                {user.branchName || "Main Branch"}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {user.bank?.name || "State National Bank"}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 max-w-[260px]">
                              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                {user.limitations}
                              </p>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {(user.permissions || []).slice(0, 3).map((perm) => (
                                  <span
                                    key={perm}
                                    className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-mono border border-slate-200"
                                  >
                                    {perm}
                                  </span>
                                ))}
                                {(user.permissions || []).length > 3 && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-mono">
                                    +{(user.permissions || []).length - 3} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(user)}
                                  className="px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold border border-slate-200 transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                                {!isSelf && user.email !== "admin@MISDESC.com" && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(user)}
                                    className="px-2.5 py-1 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 font-semibold border border-rose-200 transition-colors cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Interactive Role-Permission Matrix */}
        {activeTab === "matrix" && matrixData && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                MISDESC Master RBAC Capabilities & Operational Thresholds
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Formal role definitions, segregation of duties (SoD), and financial transaction authorities prescribed under NPCI MISDESC-2010 and RBI Clearing Corporation guidelines.
              </p>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-900 text-white font-semibold text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4 min-w-[200px]">System Capability</th>
                      {Object.keys(matrixData.rolePolicies).map((roleKey) => (
                        <th key={roleKey} className="py-3.5 px-3 text-center min-w-[130px]">
                          <div>{matrixData.rolePolicies[roleKey].title.replace(" (Teller)", "").replace(" (Branch Manager)", "")}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{roleKey}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {matrixData.systemPermissions.map((perm) => (
                      <tr key={perm.code} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 border-r border-slate-200">
                          <div className="font-bold text-slate-900">{perm.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{perm.description}</div>
                          <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {perm.category}
                          </span>
                        </td>
                        {Object.keys(matrixData.rolePolicies).map((roleKey) => {
                          const policy = matrixData.rolePolicies[roleKey];
                          const hasPermission = policy.permissions.includes(perm.code);
                          return (
                            <td key={roleKey} className="py-3 px-3 text-center border-r border-slate-200 last:border-r-0">
                              {hasPermission ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                  YES
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono text-sm">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Role Charters & Limitations Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(matrixData.rolePolicies).map((roleKey) => {
                const policy = matrixData.rolePolicies[roleKey];
                return (
                  <div key={roleKey} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${policy.badge}`}>
                          {policy.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {policy.category}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                        {policy.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {policy.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 text-[11px] block">Operational Scope:</span>
                        <span className="text-slate-500 text-[11px]">{policy.scope}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 text-[11px] block">Enforced Limitations:</span>
                        <span className="text-amber-800 bg-amber-50/80 border border-amber-200 rounded p-1.5 text-[10px] block mt-0.5 leading-snug">
                          {policy.limitations}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Branch Personnel Distribution */}
        {activeTab === "branches" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => {
              const branchStaff = users.filter((u) => u.branchName === branch);
              const branchRoles = Array.from(new Set(branchStaff.map((u) => u.roleTitle || u.role)));
              return (
                <div key={branch} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        Active Branch Point
                      </span>
                      <span className="text-xs font-mono font-bold text-brand-600">
                        {branchStaff.length} Personnel
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 mt-3 tracking-tight">
                      {branch}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Active Roles Assigned:
                    </div>
                    {branchRoles.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No operators currently assigned.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {branchRoles.map((r) => (
                          <span key={r} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: Provision New User / Role */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Provision New Clearing Operator / Role
                </h3>
                <p className="text-xs text-slate-500">
                  Assign user credentials, branch location, and role-based permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Meera Patel"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. meera.patel@snb.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Banking Institution *
                  </label>
                  <select
                    value={formData.bankId}
                    onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {banks.length === 0 ? (
                      <option value={currentUser?.bank?.id || ""}>{currentUser?.bank?.name || "State National Bank"}</option>
                    ) : (
                      banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Branch Allocation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Branch Location *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Specify New Branch...</option>
                  </select>

                  {formData.branchName === "CUSTOM" && (
                    <input
                      type="text"
                      required
                      placeholder="Enter new branch name..."
                      value={formData.customBranch}
                      onChange={(e) => setFormData({ ...formData, customBranch: e.target.value })}
                      className="w-full bg-slate-50 border border-brand-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign System Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {Object.keys(matrixData?.rolePolicies || {}).map((r) => (
                    <option key={r} value={r}>
                      {matrixData?.rolePolicies?.[r]?.title || r} ({r})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Live Policy Preview */}
              {selectedPolicy.title && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Enforced Policy: {selectedPolicy.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${selectedPolicy.badge}`}>
                      {selectedPolicy.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {selectedPolicy.description}
                  </p>

                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 leading-relaxed">
                    <span className="font-bold block text-amber-950 text-[10px] uppercase tracking-wider mb-0.5">
                      Operational Limitation:
                    </span>
                    {selectedPolicy.limitations}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Granted Permissions ({selectedPolicy.permissions?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(selectedPolicy.permissions || []).map((perm) => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 rounded bg-white text-slate-700 text-[10px] font-mono border border-slate-200"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? "Provisioning User..." : "Confirm & Provision User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit User */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Edit User: {showEditModal.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Update branch location, role authorization, or reset password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Branch
                </label>
                <select
                  value={editFormData.branchName}
                  onChange={(e) => setEditFormData({ ...editFormData, branchName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  System Role
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {Object.keys(matrixData?.rolePolicies || {}).map((r) => (
                    <option key={r} value={r}>
                      {matrixData?.rolePolicies?.[r]?.title || r} ({r})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reset Password (leave empty to keep unchanged)
                </label>
                <input
                  type="password"
                  placeholder="New password..."
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
