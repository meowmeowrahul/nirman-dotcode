import re

with open('frontend/src/components/AppLayout.tsx', 'r') as f:
    content = f.read()

# Remove city pill
city_pill_regex = re.compile(r'<div\s+className="city-pill"\s+style={{[^}]*}}[^>]*>\s+<MapPin[^>]*/>\s+<span[^>]*>\{city \|\| t\("City not set"\)\}<\/span>\s+<\/div>', re.MULTILINE | re.DOTALL)
content = city_pill_regex.sub('', content)

# Remove status pill
status_pill_regex = re.compile(r'<div\s+className="status-pill"\s+style={{[^}]*}}\s*>\s*\{t\("Status"\)\}: \{tStatus\(userStatus\)\}\s*<\/div>', re.MULTILINE | re.DOTALL)
content = status_pill_regex.sub('', content)

with open('frontend/src/components/AppLayout.tsx', 'w') as f:
    f.write(content)

