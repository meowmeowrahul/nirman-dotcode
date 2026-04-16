import re

with open('frontend/src/pages/common/DashboardPage.tsx', 'r') as f:
    dashboard_code = f.read()

# 1. Update the layout of "dashboard-actions"
# Before: gridTemplateColumns: "1fr 1fr"
# After: flex with column direction or custom sizing where Request is bigger.
action_grid_regex = re.compile(r'className="dashboard-actions"\s+style={{[^}]*display:\s*"grid",\s*gridTemplateColumns:\s*"1fr 1fr"[^}]*}}', re.MULTILINE)

new_action_grid = '''className="dashboard-actions"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}'''

dashboard_code = action_grid_regex.sub(new_action_grid, dashboard_code)

# 2. Make Request LPG card massive
request_card_regex = re.compile(r'className="action-card request-card"\s+style={{[^}]*backgroundColor:\s*"#1E3A8A"[^}]*}}', re.MULTILINE)
new_request_card = '''className="action-card request-card"
            style={{
              backgroundColor: "#dc2626", # emergency red
              color: "white",
              padding: "3rem 2rem",
              borderRadius: 12,
              position: "relative",
              overflow: "hidden",
            }}'''
dashboard_code = request_card_regex.sub(new_request_card, dashboard_code)

# 3. Lend LPG is secondary
lend_card_regex = re.compile(r'className="action-card lend-card"\s+style={{[^}]*backgroundColor:\s*"#059669"[^}]*}}', re.MULTILINE)
new_lend_card = '''className="action-card lend-card"
            style={{
              backgroundColor: "#f8fafc",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              padding: "1.5rem",
              borderRadius: 12,
              position: "relative",
              overflow: "hidden",
            }}'''
dashboard_code = lend_card_regex.sub(new_lend_card, dashboard_code)

# 4. Request Button bigger
request_btn_regex = re.compile(r'padding:\s*"0\.75rem 1\.5rem",\s*borderRadius:\s*4,\s*fontWeight:\s*"bold",\s*border:\s*"none",\s*cursor:\s*"pointer",\s*display:\s*"flex",\s*alignItems:\s*"center",\s*gap:\s*"0\.5rem",', re.MULTILINE)

new_request_btn = '''padding: "1rem 2rem",
                borderRadius: 8,
                fontWeight: "bold",
                fontSize: "1.25rem",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",'''
dashboard_code = request_btn_regex.sub(new_request_btn, dashboard_code)

# 5. Lend LPG title color update (since background is light now)
dashboard_code = dashboard_code.replace('color: "#D1FAE5"','color: "#0f172a"')
dashboard_code = dashboard_code.replace('color: "#FEE2E2"','color: "#ef4444"')

with open('frontend/src/pages/common/DashboardPage.tsx', 'w') as f:
    f.write(dashboard_code)

