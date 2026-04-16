import re

with open('frontend/src/pages/common/DashboardPage.tsx', 'r') as f:
    dashboard_code = f.read()

# Fix the invalid comment
dashboard_code = dashboard_code.replace('backgroundColor: "#dc2626", # emergency red', 'backgroundColor: "#dc2626", /* emergency red */')

with open('frontend/src/pages/common/DashboardPage.tsx', 'w') as f:
    f.write(dashboard_code)

