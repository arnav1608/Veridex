const API = "http://localhost:3001/api/moderator";
const token = localStorage.getItem("veridex_token");
const role = localStorage.getItem("veridex_role");

if (!token || role !== "moderator") {
  window.location.href = "index.html";
}

/* LOAD DASHBOARD */
async function loadDashboard() {
  const res = await fetch(`${API}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();

  document.getElementById("totalUsers").textContent = data.totalUsers;
  document.getElementById("totalClaims").textContent = data.totalClaims;
  document.getElementById("lockedClaims").textContent = data.lockedClaims;
  document.getElementById("suspendedUsers").textContent = data.suspendedUsers;
  document.getElementById("acceptedClaims").textContent = data.acceptedClaims;
document.getElementById("flaggedClaims").textContent = data.flaggedClaims;
document.getElementById("rejectedClaims").textContent = data.rejectedClaims;
document.getElementById("pendingClaims").textContent = data.pendingClaims;

  // 🆕 NEW INSIGHTS
  if (document.getElementById("activeClaims")) {
    document.getElementById("activeClaims").textContent = data.activeClaims;
    document.getElementById("lockedPercent").textContent = data.lockedPercentage + "%";
    document.getElementById("suspendedPercent").textContent = data.suspendedPercentage + "%";
  }
}

/* LOAD CLAIMS */
async function loadClaims() {
  const res = await fetch(`${API}/claims`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const claims = await res.json();

  let html = `
    <div class="table-wrapper">
    <table>
      <tr>
        <th>Claim</th>
        <th>User</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
  `;

  claims.forEach(c => {
    html += `
      <tr class="status-${c.status}">
        <td>${c.claimText}</td>
        <td>${c.createdBy?.email || "Unknown"}</td>
        <td>${c.status}</td>
        <td>
          <button class="action-btn accept"
            onclick="acceptClaim('${c._id}')">Accept</button>

          <button class="action-btn warn"
            onclick="flagClaim('${c._id}')">Flag</button>

          <button class="action-btn danger"
            onclick="rejectClaim('${c._id}')">Reject</button>
        </td>
      </tr>
    `;
  });

  html += "</table></div>";
  document.getElementById("claimsTable").innerHTML = html;
}

/* LOAD USERS */
async function loadUsers() {
  const res = await fetch(`${API}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const users = await res.json();

  let html = `
    <div class="table-wrapper">
    <table>
      <tr>
        <th>Email</th>
        <th>Role</th>
        <th>Actions</th>
      </tr>
  `;

  users.forEach(u => {
    html += `
      <tr>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>
          <button class="action-btn danger"
            onclick="suspendUser('${u._id}')">Suspend</button>
        </td>
      </tr>
    `;
  });

  html += "</table></div>";

  document.getElementById("usersTable").innerHTML = html;
}

/* ACTIONS */
async function lockClaim(id) {
  await fetch(`${API}/claim/${id}/lock`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  loadClaims();
  loadDashboard();
}

async function deleteClaim(id) {
  await fetch(`${API}/claim/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  loadClaims();
  loadDashboard();
}

async function suspendUser(id) {
  await fetch(`${API}/user/${id}/suspend`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  loadUsers();
  loadDashboard();
}
async function acceptClaim(id) {
  await fetch(`${API}/claim/${id}/accept`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  loadClaims();
  loadDashboard();
}

async function flagClaim(id) {
  await fetch(`${API}/claim/${id}/flag`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  loadClaims();
  loadDashboard();
}

async function rejectClaim(id) {
  await fetch(`${API}/claim/${id}/reject`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
  loadClaims();
  loadDashboard();
}

loadDashboard();
loadClaims();
loadUsers();