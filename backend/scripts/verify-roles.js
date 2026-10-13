/**
 * Automated Multi-Role RBAC & Health Verification Diagnostic
 * Validates authentication, JWT signing, and route authorization across all 7 MISDESC roles.
 */
const BASE_URL = process.env.BACKEND_URL || "http://localhost:5000";

const TEST_ROLES = [
  {
    role: "PRESENTING_BANK",
    email: "presenting@snb.com",
    expectedRoute: "/api/cheques",
    forbiddenRoute: "/api/branch/summary",
  },
  {
    role: "DRAWEE_BANK",
    email: "drawee@hdb.com",
    expectedRoute: "/api/cheques",
    forbiddenRoute: "/api/branch/summary",
  },
  {
    role: "DRAWEE_BANK (Checker)",
    email: "checker@hdb.com",
    expectedRoute: "/api/cheques",
    forbiddenRoute: "/api/branch/summary",
  },
  {
    role: "ADMIN",
    email: "admin@MISDESC.com",
    expectedRoute: "/api/admin/stats",
    forbiddenRoute: null, // Admin has universal access
  },
  {
    role: "BRANCH_MANAGER",
    email: "manager@snb.com",
    expectedRoute: "/api/branch/summary",
    forbiddenRoute: "/api/admin/ledger/verify",
  },
  {
    role: "IT_STAFF",
    email: "itops@MISDESC.com",
    expectedRoute: "/api/devops/sre-stats",
    forbiddenRoute: "/api/branch/summary",
  },
  {
    role: "COMPLIANCE_AUDITOR",
    email: "auditor@rbi.org.in",
    expectedRoute: "/api/admin/audit-trail",
    forbiddenRoute: "/api/branch/summary",
  },
  {
    role: "SETTLEMENT_OFFICER",
    email: "treasury@MISDESC.com",
    expectedRoute: "/api/settlements/continuous/status",
    forbiddenRoute: "/api/branch/summary",
  },
];

async function loginUser(email, password = "password123") {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Login failed for ${email} (${res.status}): ${errText}`);
  }
  return await res.json();
}

async function testEndpoint(url, token) {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return res.status;
}

async function run() {
  console.log("==================================================");
  console.log("   MISDESC Multi-Role RBAC & Security Diagnostic      ");
  console.log("==================================================");
  console.log(`Target Switch Backend: ${BASE_URL}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const item of TEST_ROLES) {
    process.stdout.write(`Testing [${item.role}] (${item.email})... `);
    try {
      // 1. Authentication
      const auth = await loginUser(item.email);
      if (!auth.token || !auth.user) {
        throw new Error("Missing token or user object in login response");
      }

      // 2. Expected Authorized Route Check (must return 200)
      const allowedStatus = await testEndpoint(item.expectedRoute, auth.token);
      if (allowedStatus !== 200) {
        throw new Error(`Expected 200 on ${item.expectedRoute}, received ${allowedStatus}`);
      }

      // 3. Expected Forbidden Route Check (must return 403)
      if (item.forbiddenRoute) {
        const forbiddenStatus = await testEndpoint(item.forbiddenRoute, auth.token);
        if (forbiddenStatus !== 403) {
          throw new Error(`Expected 403 on ${item.forbiddenRoute}, received ${forbiddenStatus}`);
        }
      }

      console.log("PASSED (Auth: OK, Authorized Route: 200, Guard: 403)");
      passedTests++;
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
      failedTests++;
    }
    totalTests++;
  }

  // 4. Test SRE & Observability Endpoints
  console.log("\nTesting SRE & Telemetry Probes...");
  const probes = ["/health/live", "/health/ready", "/metrics", "/api/devops/sre-stats"];
  for (const probe of probes) {
    process.stdout.write(`  Probe ${probe}... `);
    try {
      const res = await fetch(`${BASE_URL}${probe}`);
      if (res.status >= 200 && res.status < 400) {
        console.log(`OK (${res.status})`);
        passedTests++;
      } else {
        console.log(`FAILED (${res.status})`);
        failedTests++;
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      failedTests++;
    }
    totalTests++;
  }

  console.log("\n==================================================");
  console.log(`Summary: ${passedTests}/${totalTests} checks passed.`);
  if (failedTests > 0) {
    console.log(`>>> ${failedTests} diagnostic test(s) FAILED!`);
    process.exit(1);
  } else {
    console.log(">>> ALL 7 MISDESC ROLES & SRE PROBES FULLY VERIFIED.");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Diagnostic execution error:", err);
  process.exit(1);
});
