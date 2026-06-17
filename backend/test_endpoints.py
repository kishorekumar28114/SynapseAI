"""
SynapseAI — Comprehensive API Endpoint Tester
Tests every endpoint in the application end-to-end.
Run from: backend/
Usage: python test_endpoints.py
"""

import requests
import json
import uuid
import sys
import time
from datetime import datetime

BASE_URL = "http://localhost:8000/api"
PASS = "[PASS]"
FAIL = "[FAIL]"
SKIP = "[SKIP]"
INFO = "[INFO]"

results = {"pass": 0, "fail": 0, "skip": 0}

# ── State shared across tests ──────────────────────────────────────────────────
state = {
    "manager_token": None,
    "employee_token": None,
    "team_id": None,
    "project_id": None,
    "employee_id": None,
    "employee_username": None,
    "employee_password": None,
    "meeting_id": None,
}

timestamp = int(time.time())


def headers(token=None):
    h = {"Content-Type": "application/json"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def check(label, response, expected_status, extract=None):
    ok = response.status_code == expected_status
    status = PASS if ok else FAIL
    results["pass" if ok else "fail"] += 1
    body = ""
    try:
        data = response.json()
        if not ok:
            body = f" → {json.dumps(data)[:200]}"
    except Exception:
        data = {}
    print(f"  {status} [{response.status_code}] {label}{body}")
    if ok and extract and callable(extract):
        extract(data)
    return ok, data


def section(title):
    print(f"\n" + "-"*60)
    print(f"  {title}")
    print("-"*60)


# -----------------------------------------------------------------------------
# 1. Health
# -----------------------------------------------------------------------------
section("1. HEALTH & ROOT")

r = requests.get("http://localhost:8000/")
check("GET / (root)", r, 200)

r = requests.get("http://localhost:8000/health")
check("GET /health", r, 200)

r = requests.get(f"{BASE_URL}/ai/health")
check("GET /api/ai/health (Ollama status)", r, 200)


# -----------------------------------------------------------------------------
# 2. Auth — Manager Registration & Login
# -----------------------------------------------------------------------------
section("2. AUTH — MANAGER")

email = f"test.manager.{timestamp}@synapseai.test"
username = f"mgr_{timestamp}"

r = requests.post(f"{BASE_URL}/auth/register", json={
    "full_name": "Test Manager",
    "email": email,
    "username": username,
    "password": "TestPass123!",
}, headers=headers())
ok, data = check("POST /auth/register", r, 201)
if ok:
    state["manager_token"] = data.get("access_token")
    print(f"    {INFO} Manager token acquired")

# Duplicate registration
r = requests.post(f"{BASE_URL}/auth/register", json={
    "full_name": "Test Manager",
    "email": email,
    "username": username,
    "password": "TestPass123!",
}, headers=headers())
check("POST /auth/register (duplicate → 409)", r, 409)

# Login
r = requests.post(f"{BASE_URL}/auth/login", json={
    "identifier": email,
    "password": "TestPass123!",
}, headers=headers())
check("POST /auth/login (manager by email)", r, 200)

# Wrong password
r = requests.post(f"{BASE_URL}/auth/login", json={
    "identifier": email,
    "password": "wrongpassword",
}, headers=headers())
check("POST /auth/login (wrong password → 401)", r, 401)

# Get current user
r = requests.get(f"{BASE_URL}/auth/me", headers=headers(state["manager_token"]))
check("GET /auth/me", r, 200)

# Unauthenticated
r = requests.get(f"{BASE_URL}/auth/me")
check("GET /auth/me (no token → 401)", r, 401)


# -----------------------------------------------------------------------------
# 3. Teams
# -----------------------------------------------------------------------------
section("3. TEAMS")

r = requests.post(f"{BASE_URL}/teams", json={
    "name": f"Test Team {timestamp}",
    "description": "Created by automated tests",
}, headers=headers(state["manager_token"]))
ok, data = check("POST /teams (create)", r, 201)
if ok:
    state["team_id"] = data.get("id")
    print(f"    {INFO} Team ID: {state['team_id']}")

r = requests.get(f"{BASE_URL}/teams", headers=headers(state["manager_token"]))
check("GET /teams (list)", r, 200)

if state["team_id"]:
    r = requests.get(f"{BASE_URL}/teams/{state['team_id']}", headers=headers(state["manager_token"]))
    check("GET /teams/:id", r, 200)

    r = requests.put(f"{BASE_URL}/teams/{state['team_id']}", json={
        "description": "Updated description"
    }, headers=headers(state["manager_token"]))
    check("PUT /teams/:id (update)", r, 200)

r = requests.get(f"{BASE_URL}/teams/{uuid.uuid4()}", headers=headers(state["manager_token"]))
check("GET /teams/:id (not found → 404)", r, 404)


# -----------------------------------------------------------------------------
# 4. Employees
# -----------------------------------------------------------------------------
section("4. EMPLOYEES")

r = requests.post(f"{BASE_URL}/employees/invite", json={
    "full_name": f"Test Employee {timestamp}",
    "email": f"test.employee.{timestamp}@synapseai.test",
    "role": "team_member",
    "team_id": state.get("team_id"),
}, headers=headers(state["manager_token"]))
ok, data = check("POST /employees/invite", r, 201)
if ok:
    state["employee_id"] = data.get("id")
    state["employee_username"] = data.get("username")
    state["employee_password"] = data.get("temp_password")
    print(f"    {INFO} Employee: {state['employee_username']} / {state['employee_password']}")

r = requests.get(f"{BASE_URL}/employees", headers=headers(state["manager_token"]))
check("GET /employees (list)", r, 200)

if state["employee_id"]:
    r = requests.get(f"{BASE_URL}/employees/{state['employee_id']}", headers=headers(state["manager_token"]))
    check("GET /employees/:id", r, 200)


# -----------------------------------------------------------------------------
# 5. Employee Login
# -----------------------------------------------------------------------------
section("5. AUTH — EMPLOYEE LOGIN")

if state.get("employee_username") and state.get("employee_password"):
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "identifier": state["employee_username"],
        "password": state["employee_password"],
    }, headers=headers())
    ok, data = check("POST /auth/login (employee by username)", r, 200)
    if ok:
        state["employee_token"] = data.get("access_token")
        print(f"    {INFO} Employee token acquired")
else:
    print(f"  {SKIP} Employee login skipped (no credentials)")
    results["skip"] += 1


# -----------------------------------------------------------------------------
# 6. Team Members
# -----------------------------------------------------------------------------
section("6. TEAM MEMBERS")

if state.get("team_id") and state.get("employee_id"):
    r = requests.post(
        f"{BASE_URL}/teams/{state['team_id']}/members",
        json={"user_id": state["employee_id"], "role_in_team": "team_member"},
        headers=headers(state["manager_token"]),
    )
    check("POST /teams/:id/members (add member)", r, 200)
else:
    print(f"  {SKIP} Add member skipped")
    results["skip"] += 1


# -----------------------------------------------------------------------------
# 7. Projects
# -----------------------------------------------------------------------------
section("7. PROJECTS")

r = requests.post(f"{BASE_URL}/projects", json={
    "name": f"Test Project {timestamp}",
    "description": "Automated test project",
    "team_id": state.get("team_id"),
    "deadline": "2025-12-31",
    "budget": 50000,
}, headers=headers(state["manager_token"]))
ok, data = check("POST /projects (create)", r, 201)
if ok:
    state["project_id"] = data.get("id")
    print(f"    {INFO} Project ID: {state['project_id']}")

r = requests.get(f"{BASE_URL}/projects", headers=headers(state["manager_token"]))
check("GET /projects (list)", r, 200)

if state.get("team_id"):
    r = requests.get(f"{BASE_URL}/projects/team/{state['team_id']}", headers=headers(state["manager_token"]))
    check("GET /projects/team/:id", r, 200)

if state.get("project_id"):
    r = requests.get(f"{BASE_URL}/projects/{state['project_id']}", headers=headers(state["manager_token"]))
    check("GET /projects/:id", r, 200)

    r = requests.put(f"{BASE_URL}/projects/{state['project_id']}", json={
        "description": "Updated project description"
    }, headers=headers(state["manager_token"]))
    check("PUT /projects/:id (update)", r, 200)


# -----------------------------------------------------------------------------
# 8. Meetings
# -----------------------------------------------------------------------------
section("8. MEETINGS — UPLOAD")

if state.get("team_id"):
    # Create a test TXT file
    test_transcript = """Meeting Transcript - Sprint Planning

    John: Let's discuss the user authentication feature. We need to complete it by next Friday.
    Sarah: I'll take the backend API task. It should take about 3 days.
    Mike: I can handle the frontend implementation. I'll need the API specs first.
    John: Great. Sarah, can you also document the API? 
    Sarah: Sure, I'll add documentation by Wednesday.
    Mike: I need to set up the testing environment. Can we schedule that for Monday?
    John: Approved. Let's aim to have integration tests done by Thursday.
    """

    import io
    files = {"file": ("test_meeting.txt", io.BytesIO(test_transcript.encode()), "text/plain")}
    data_form = {
        "title": f"Sprint Planning {timestamp}",
        "team_id": state["team_id"],
        "description": "Automated test meeting upload",
    }

    # Note: meeting upload requires team_lead role. We use manager token as fallback.
    # First, let's try with the employee who needs team_lead role
    # We'll use manager here since they have broader access
    r = requests.post(
        f"{BASE_URL}/meetings",
        files=files,
        data=data_form,
        headers={"Authorization": f"Bearer {state['manager_token']}"},
    )
    # Manager is not a team_lead, so this may return 403 — that's correct behaviour
    if r.status_code == 403:
        print(f"  {INFO} Meeting upload correctly requires team_lead role (403)")
        results["skip"] += 1

        # Invite a team lead and upload with their token
        r2 = requests.post(f"{BASE_URL}/employees/invite", json={
            "full_name": f"Test Lead {timestamp}",
            "email": f"lead.{timestamp}@synapseai.test",
            "role": "team_lead",
            "team_id": state["team_id"],
        }, headers=headers(state["manager_token"]))
        if r2.status_code == 201:
            lead_data = r2.json()
            lead_creds = requests.post(f"{BASE_URL}/auth/login", json={
                "identifier": lead_data["username"],
                "password": lead_data["temp_password"],
            }, headers=headers())
            if lead_creds.status_code == 200:
                lead_token = lead_creds.json()["access_token"]
                files = {"file": ("test_meeting.txt", io.BytesIO(test_transcript.encode()), "text/plain")}
                r3 = requests.post(
                    f"{BASE_URL}/meetings",
                    files=files,
                    data=data_form,
                    headers={"Authorization": f"Bearer {lead_token}"},
                )
                ok3, d3 = check("POST /meetings (upload, team_lead token)", r3, 201)
                if ok3:
                    state["meeting_id"] = d3.get("id")
    else:
        ok, data = check("POST /meetings (upload)", r, 201)
        if ok:
            state["meeting_id"] = data.get("id")
else:
    print(f"  {SKIP} Meeting upload skipped (no team)")
    results["skip"] += 1

# GET /meetings/my
r = requests.get(f"{BASE_URL}/meetings/my", headers=headers(state["manager_token"]))
check("GET /meetings/my", r, 200)

if state.get("team_id"):
    r = requests.get(f"{BASE_URL}/meetings/team/{state['team_id']}", headers=headers(state["manager_token"]))
    check("GET /meetings/team/:id", r, 200)

if state.get("meeting_id"):
    r = requests.get(f"{BASE_URL}/meetings/{state['meeting_id']}", headers=headers(state["manager_token"]))
    check("GET /meetings/:id", r, 200)


# -----------------------------------------------------------------------------
# 9. AI Routes
# -----------------------------------------------------------------------------
section("9. AI ENDPOINTS")

r = requests.get(f"{BASE_URL}/ai/health")
check("GET /ai/health", r, 200)

if state.get("meeting_id"):
    r = requests.get(f"{BASE_URL}/ai/status/{state['meeting_id']}", headers=headers(state["manager_token"]))
    check("GET /ai/status/:meeting_id", r, 200)
else:
    print(f"  {SKIP} AI status check skipped (no meeting)")
    results["skip"] += 1

if state.get("team_id"):
    r = requests.post(f"{BASE_URL}/ai/chat", json={
        "question": "What are the action items from recent meetings?",
        "team_id": state["team_id"],
    }, headers=headers(state["manager_token"]))
    check("POST /ai/chat (RAG query)", r, 200)


# -----------------------------------------------------------------------------
# 10. Analytics
# -----------------------------------------------------------------------------
section("10. ANALYTICS")

if state.get("team_id"):
    r = requests.get(f"{BASE_URL}/analytics/team/{state['team_id']}", headers=headers(state["manager_token"]))
    check("GET /analytics/team/:id", r, 200)

    r = requests.get(f"{BASE_URL}/analytics/meetings/{state['team_id']}", headers=headers(state["manager_token"]))
    check("GET /analytics/meetings/:id", r, 200)

if state.get("meeting_id"):
    r = requests.get(f"{BASE_URL}/analytics/meeting/{state['meeting_id']}/detail", headers=headers(state["manager_token"]))
    check("GET /analytics/meeting/:id/detail", r, 200)
else:
    print(f"  {SKIP} Meeting detail analytics skipped (no meeting)")
    results["skip"] += 1


# -----------------------------------------------------------------------------
# 11. RBAC Enforcement
# -----------------------------------------------------------------------------
section("11. RBAC ENFORCEMENT")

if state.get("employee_token"):
    r = requests.post(f"{BASE_URL}/teams", json={"name": "Hack Team"}, headers=headers(state["employee_token"]))
    check("POST /teams (employee → 403)", r, 403)

    r = requests.post(f"{BASE_URL}/employees/invite", json={
        "full_name": "Hacker",
        "email": f"hacker.{timestamp}@evil.com",
        "role": "manager",
    }, headers=headers(state["employee_token"]))
    check("POST /employees/invite (employee → 403)", r, 403)

    r = requests.post(f"{BASE_URL}/projects", json={
        "name": "Evil Project",
        "team_id": state.get("team_id"),
    }, headers=headers(state["employee_token"]))
    check("POST /projects (employee → 403)", r, 403)
else:
    print(f"  {SKIP} RBAC tests skipped (no employee token)")
    results["skip"] += 3


# -----------------------------------------------------------------------------
# 12. CLEANUP — Remove test team member
# -----------------------------------------------------------------------------
section("12. CLEANUP")

if state.get("team_id") and state.get("employee_id"):
    r = requests.delete(
        f"{BASE_URL}/teams/{state['team_id']}/members/{state['employee_id']}",
        headers=headers(state["manager_token"]),
    )
    check("DELETE /teams/:id/members/:user_id", r, 200)


# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
total = results["pass"] + results["fail"] + results["skip"]
print(f"\n" + "="*60)
print(f"  RESULTS: {results['pass']} passed | {results['fail']} failed | {results['skip']} skipped")
print(f"  Total: {total} checks")
if results["fail"] == 0:
    print(f"  *** All tests passed! ***")
else:
    print(f"  *** {results['fail']} test(s) FAILED - check output above ***")
print("="*60 + "\n")

if results["fail"] > 0:
    sys.exit(1)
