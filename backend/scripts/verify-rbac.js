const API = "http://localhost:5000/api";

async function post(url, data, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${url}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw { status: res.status, data: json };
  return json;
}

async function get(url, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${url}`, { method: "GET", headers });
  const json = await res.json();
  if (!res.ok) throw { status: res.status, data: json };
  return json;
}

async function del(url, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${url}`, { method: "DELETE", headers });
  const json = await res.json();
  if (!res.ok) throw { status: res.status, data: json };
  return json;
}

async function runTest() {
  console.log("=== MISDESC RBAC Module Diagnostic Suite ===");

  try {
    // 1. Manager Login
    console.log("\n[1] Authenticating as Branch Manager (manager@snb.com)...");
    const managerLogin = await post("/auth/login", {
      email: "manager@snb.com",
      password: "password123",
    });
    const managerToken = managerLogin.token;
    console.log("    [OK] Branch Manager authenticated successfully.");

    // 2. Fetch RBAC Matrix
    console.log("\n[2] Fetching RBAC Matrix & Policies (/api/rbac/matrix)...");
    const matrixRes = await get("/rbac/matrix", managerToken);
    const roles = Object.keys(matrixRes.rolePolicies);
    console.log(`    [OK] Loaded ${roles.length} roles: ${roles.join(", ")}`);
    console.log(`    [OK] Loaded ${matrixRes.systemPermissions.length} system permissions.`);

    // 3. Fetch Branches
    console.log("\n[3] Fetching Registered Branches (/api/rbac/branches)...");
    const branchesRes = await get("/rbac/branches", managerToken);
    console.log(`    [OK] Available branches (${branchesRes.length}): ${branchesRes.slice(0, 3).join(", ")}...`);

    // 4. Fetch Users List
    console.log("\n[4] Querying User Directory (/api/rbac/users)...");
    const usersRes = await get("/rbac/users", managerToken);
    console.log(`    [OK] Total registered users in system: ${usersRes.length}`);

    // Get Bank ID for provisioning
    const bankId = managerLogin.user.bank.id;

    // 5. Provision a New Operator for Koramangala Branch
    const testEmail = `operator_${Date.now()}@snb.com`;
    console.log(`\n[5] Provisioning new user: ${testEmail} at 'Koramangala Branch Bangalore'...`);
    const createRes = await post(
      "/rbac/users",
      {
        name: "Bangalore Clearing Teller",
        email: testEmail,
        password: "securePassword123!",
        role: "PRESENTING_BANK",
        bankId: bankId,
        branchName: "Koramangala Branch Bangalore",
      },
      managerToken
    );
    console.log("    [OK] Provisioned user:", createRes.user.name, `[${createRes.user.role}]`);
    console.log("    [OK] Assigned Branch:", createRes.user.branchName);
    console.log("    [OK] Granted Permissions:", createRes.user.permissions);

    // 6. Test Login with New User Credentials
    console.log("\n[6] Testing login with newly provisioned credentials...");
    const newUserLogin = await post("/auth/login", {
      email: testEmail,
      password: "securePassword123!",
    });
    const newUserToken = newUserLogin.token;
    console.log("    [OK] New user authenticated successfully!");
    console.log("    [OK] User Role:", newUserLogin.user.role);

    // 7. Verify RBAC Guard: Newly created PRESENTING_BANK must NOT be able to provision users
    console.log("\n[7] Verifying RBAC Security Guard: Non-manager must be 403 Forbidden on /api/rbac/users...");
    try {
      await get("/rbac/users", newUserToken);
      throw new Error("FAIL: Non-manager was allowed access to RBAC endpoint!");
    } catch (err) {
      if (err.status === 403) {
        console.log("    [OK] 403 Forbidden correctly returned. Unauthorized access prevented!");
      } else {
        throw err;
      }
    }

    // 8. Cleanup test user
    console.log("\n[8] Cleaning up test user...");
    await del(`/rbac/users/${createRes.user.id}`, managerToken);
    console.log("    [OK] Test user cleanly deleted.");

    console.log("\n[PASS] ALL 8 RBAC DIAGNOSTIC CHECKS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("[FAIL] RBAC Test Failed:", err);
    process.exit(1);
  }
}

runTest();
