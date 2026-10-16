const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");

// Enterprise System Permissions Definition
const SYSTEM_PERMISSIONS = [
  {
    code: "CHEQUE_PRESENT",
    name: "Cheque Presentment & OCR",
    description: "Scan, upload & OCR ingest inward/outward cheques into clearing queues",
    category: "Operations",
  },
  {
    code: "CHEQUE_VERIFY",
    name: "Drawee Verification & Signature Check",
    description: "Inspect drawer signature, compare specimens, and verify Positive Pay records",
    category: "Operations",
  },
  {
    code: "HIGH_VALUE_APPROVAL",
    name: "High-Value Counter-Signature",
    description: "Mandatory secondary approval for clearing instruments >= ₹50,000",
    category: "Governance",
  },
  {
    code: "BATCH_DISPATCH",
    name: "Batch Seal & Dispatch",
    description: "Reconcile, lock, and dispatch branch clearing batches to the Central Switch",
    category: "Operations",
  },
  {
    code: "SETTLEMENT_EXECUTE",
    name: "Multilateral Net Settlement",
    description: "Execute multilateral settlement cycles and continuous clearing runs",
    category: "Treasury",
  },
  {
    code: "EKUBER_PACS009",
    name: "RBI e-Kuber pacs.009 Generation",
    description: "Authorize and produce Financial Institution Credit Transfer XML",
    category: "Treasury",
  },
  {
    code: "CHAOS_SIMULATE",
    name: "SRE Chaos Engineering",
    description: "Inject network latency, error spikes, and toggle automated circuit breakers",
    category: "Infrastructure",
  },
  {
    code: "AUDIT_INSPECT",
    name: "SHA-256 Ledger & Fraud Audit",
    description: "Cryptographically verify hash-chain integrity, inspect forensic fraud flags & RBI trails",
    category: "Audit & Risk",
  },
  {
    code: "USER_MANAGEMENT",
    name: "RBAC User & Branch Provisioning",
    description: "Create, configure, and manage user accounts with role-wise limitations across branches",
    category: "Administration",
  },
  {
    code: "MONITORING_VIEW",
    name: "Telemetry & SLO Dashboard",
    description: "Inspect live Prometheus feeds, switch latency, and clearing throughput",
    category: "Infrastructure",
  },
];

// Comprehensive Role-wise Configuration & Enforcement Policies
const ROLE_POLICIES = {
  ADMIN: {
    role: "ADMIN",
    title: "Clearing House Administrator",
    category: "Executive Governance",
    badge: "border-purple-800 bg-purple-950/80 text-purple-300",
    description: "Super Administrator with master oversight across all national banks, clearing switches, and security configurations.",
    permissions: SYSTEM_PERMISSIONS.map((p) => p.code),
    scope: "Global Enterprise",
    limitations: "Full unrestricted privileges across all entities. Every administrative operation is cryptographically signed and logged.",
  },
  BRANCH_MANAGER: {
    role: "BRANCH_MANAGER",
    title: "Branch Operations Manager",
    category: "Branch Governance",
    badge: "border-brand-800 bg-brand-950/80 text-brand-300",
    description: "Head of Branch operations overseeing teller presentment, high-value instrument counter-signature, and branch personnel.",
    permissions: [
      "HIGH_VALUE_APPROVAL",
      "BATCH_DISPATCH",
      "USER_MANAGEMENT",
      "CHEQUE_PRESENT",
      "CHEQUE_VERIFY",
      "MONITORING_VIEW",
    ],
    scope: "Assigned Branch & Bank Entity",
    limitations: "Counter-signature authority up to ₹5,00,000; staff provisioning restricted to assigned branch/bank; branch batch seal authority.",
  },
  IT_STAFF: {
    role: "IT_STAFF",
    title: "Core Switch SRE & IT Staff",
    category: "Site Reliability",
    badge: "border-cyan-800 bg-cyan-950/80 text-cyan-300",
    description: "Site Reliability Engineers maintaining Switch 99.9% SLOs, chaos experiments, database ping latency, and circuit breakers.",
    permissions: ["CHAOS_SIMULATE", "MONITORING_VIEW", "AUDIT_INSPECT"],
    scope: "Central Infrastructure & DevOps",
    limitations: "Strictly infrastructure, telemetry, and resilience testing. ZERO financial transaction creation or cheque approval authority.",
  },
  COMPLIANCE_AUDITOR: {
    role: "COMPLIANCE_AUDITOR",
    title: "Compliance & Regulatory Auditor",
    category: "Regulatory Oversight",
    badge: "border-amber-800 bg-amber-950/80 text-amber-300",
    description: "RBI & Independent Audit Officer inspecting cryptographic SHA-256 blockchain-style ledgers and resolving fraud anomalies.",
    permissions: ["AUDIT_INSPECT", "MONITORING_VIEW"],
    scope: "Regulatory & Compliance Wing",
    limitations: "Read-only forensic inspection. Can resolve compliance fraud flags but CANNOT inject cheques, settle funds, or alter balances.",
  },
  SETTLEMENT_OFFICER: {
    role: "SETTLEMENT_OFFICER",
    title: "Settlement & Treasury Officer",
    category: "Treasury & Clearing",
    badge: "border-emerald-800 bg-emerald-950/80 text-emerald-300",
    description: "National Treasury Officer managing multilateral net settlement windows, continuous T+0 cycles, and RBI e-Kuber pacs.009 pipelines.",
    permissions: ["SETTLEMENT_EXECUTE", "EKUBER_PACS009", "MONITORING_VIEW"],
    scope: "National Treasury Clearing Desk",
    limitations: "Interbank liquidity management and settlement run authority. Cannot create inward cheques or modify teller records.",
  },
  PRESENTING_BANK: {
    role: "PRESENTING_BANK",
    title: "Presenting Bank Operator (Teller)",
    category: "Branch Operations",
    badge: "border-blue-800 bg-blue-950/80 text-blue-300",
    description: "Front-desk teller capturing inward clearing cheques, executing OCR scans, and bundling items into initial batches.",
    permissions: ["CHEQUE_PRESENT", "BATCH_DISPATCH"],
    scope: "Branch Teller Counter",
    limitations: "Cheques with amount >= ₹50,000 are held in 'Awaiting Checker' state until counter-signed by Branch Manager.",
  },
  DRAWEE_BANK: {
    role: "DRAWEE_BANK",
    title: "Drawee Bank Verification Officer",
    category: "Branch Operations",
    badge: "border-indigo-800 bg-indigo-950/80 text-indigo-300",
    description: "Inward clearing decisioning officer performing signature comparison and Positive Pay record verification.",
    permissions: ["CHEQUE_VERIFY"],
    scope: "Drawee Clearing Cell",
    limitations: "Instrument verification and return decisioning only. Cannot dispatch batches or trigger multilateral settlement.",
  },
};

const STANDARD_BRANCHES = [
  "Athwa Lines Branch Surat",
  "Nariman Point Branch Mumbai",
  "Connaught Place Branch New Delhi",
  "Koramangala Branch Bangalore",
  "Sector 17 Branch Chandigarh",
  "Park Street Branch Kolkata",
  "Banjara Hills Branch Hyderabad",
  "Central Switch Infrastructure",
  "National Treasury Settlement Desk",
  "Regulatory Oversight Wing",
];

/**
 * Return master list of roles, capabilities matrix, and policy limitations
 */
async function getRolesAndMatrix(req, res, next) {
  try {
    return res.json({
      systemPermissions: SYSTEM_PERMISSIONS,
      rolePolicies: ROLE_POLICIES,
      standardBranches: STANDARD_BRANCHES,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Return all unique branch locations
 */
async function getBranches(req, res, next) {
  try {
    const existingUsers = await prisma.user.findMany({
      where: { branchName: { not: null } },
      select: { branchName: true },
      distinct: ["branchName"],
    });

    const activeBranches = existingUsers
      .map((u) => u.branchName)
      .filter(Boolean);

    // Merge standard branches with existing ones
    const allBranches = Array.from(new Set([...STANDARD_BRANCHES, ...activeBranches])).sort();

    return res.json(allBranches);
  } catch (err) {
    next(err);
  }
}

/**
 * List all users with their roles, banks, and branch allocations
 */
async function getUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      include: {
        bank: {
          select: { id: true, name: true, ifsc: true, code: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Decorate each user with their role policy metadata
    const decoratedUsers = users.map((u) => {
      const policy = ROLE_POLICIES[u.role] || {};
      const { password, ...safeUser } = u;
      return {
        ...safeUser,
        roleTitle: policy.title || u.role,
        roleCategory: policy.category || "Staff",
        roleBadge: policy.badge || "border-slate-700 bg-slate-800 text-slate-300",
        permissions: policy.permissions || [],
        limitations: policy.limitations || "Standard operational bounds",
      };
    });

    return res.json(decoratedUsers);
  } catch (err) {
    next(err);
  }
}

/**
 * Provision a new user with role, branch, and bank linkage
 */
async function createUser(req, res, next) {
  try {
    const { name, email, password, role, bankId, branchName } = req.body;

    if (!name || !email || !password || !role || !bankId) {
      return res.status(400).json({
        error: "Missing required fields: name, email, password, role, bankId are mandatory.",
      });
    }

    if (!ROLE_POLICIES[role]) {
      return res.status(400).json({
        error: `Invalid role '${role}'. Must be one of: ${Object.keys(ROLE_POLICIES).join(", ")}`,
      });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: `User with email '${email}' already exists.` });
    }

    // Verify bank exists
    const bank = await prisma.bank.findUnique({ where: { id: bankId } });
    if (!bank) {
      return res.status(404).json({ error: `Specified Bank ID not found.` });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        bankId,
        branchName: branchName || "Main Branch",
      },
      include: {
        bank: {
          select: { id: true, name: true, ifsc: true, code: true },
        },
      },
    });

    const policy = ROLE_POLICIES[newUser.role] || {};
    const { password: _, ...safeUser } = newUser;

    return res.status(201).json({
      message: `User '${newUser.name}' provisioned successfully under role ${policy.title || newUser.role}.`,
      user: {
        ...safeUser,
        roleTitle: policy.title,
        permissions: policy.permissions,
        limitations: policy.limitations,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update existing user's role, branch, name, or password
 */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, role, branchName, bankId, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (branchName !== undefined) updateData.branchName = branchName;
    if (bankId) updateData.bankId = bankId;

    if (role) {
      if (!ROLE_POLICIES[role]) {
        return res.status(400).json({ error: `Invalid role '${role}'.` });
      }
      updateData.role = role;
    }

    if (password && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        bank: {
          select: { id: true, name: true, ifsc: true, code: true },
        },
      },
    });

    const policy = ROLE_POLICIES[updated.role] || {};
    const { password: _, ...safeUser } = updated;

    return res.json({
      message: `User '${updated.name}' updated successfully.`,
      user: {
        ...safeUser,
        roleTitle: policy.title,
        permissions: policy.permissions,
        limitations: policy.limitations,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a user (with safety checks)
 */
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (req.user?.id === id) {
      return res.status(400).json({ error: "Security restriction: You cannot delete your own active session account." });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    // Prevent deleting the primary admin account
    if (targetUser.email === "admin@MISDESC.com") {
      return res.status(403).json({ error: "Primary system administrator account cannot be deleted." });
    }

    await prisma.user.delete({ where: { id } });

    return res.json({
      message: `User '${targetUser.name}' (${targetUser.email}) removed from system.`,
      deletedUserId: id,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRolesAndMatrix,
  getBranches,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  ROLE_POLICIES,
  SYSTEM_PERMISSIONS,
  STANDARD_BRANCHES,
};
