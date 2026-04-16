import re

with open('frontend/src/index.css', 'r') as f:
    css = f.read()

# 1. Colors
css = css.replace('--bg-subtle: #fff8f2;', '--bg-subtle: #f9fafb;')
css = css.replace('--brand-600: #f97316;', '--brand-600: #2563eb;')
css = css.replace('--brand-700: #ea580c;', '--brand-700: #1d4ed8;')
css = css.replace('--brand-800: #c2410c;', '--brand-800: #1e40af;')
css = css.replace('--brand-100: #ffedd5;', '--brand-100: #dbeafe;')

# 2. Form interactions (remove orange focus)
css = css.replace('rgba(249, 115, 22, 0.4)', 'rgba(37, 99, 235, 0.4)')
css = css.replace('rgba(249, 115, 22, 0.25)', 'rgba(37, 99, 235, 0.25)')
css = css.replace('rgba(249, 115, 22, 0.13)', 'rgba(37, 99, 235, 0.13)')
css = css.replace('rgba(249, 115, 22, 0.6)', 'rgba(37, 99, 235, 0.6)')

# 3. Card-itis (remove dropshadows and bounce)
card_old = """.card {
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: 14px;
  padding: 20px;
  transition:
    transform var(--motion-medium) var(--motion-ease),
    box-shadow var(--motion-medium) var(--motion-ease),
    border-color var(--motion-fast) var(--motion-ease),
    background-color var(--motion-fast) var(--motion-ease);
  transform: translateZ(0);
  animation: card-enter var(--motion-slow) var(--motion-ease) both;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px -22px rgba(31, 41, 55, 0.55);
}"""

card_new = """.card {
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 24px;
  transition: border-color var(--motion-fast) var(--motion-ease), background-color var(--motion-fast) var(--motion-ease);
}

.card:hover {
  /* Removed bounce and shadow for a cleaner, flatter look */
}"""
css = css.replace(card_old, card_new)

# 4. Subtle Card
subtle_old = """.subtle-card {
  background: var(--bg-subtle);
}"""
subtle_new = """.subtle-card {
  background: var(--bg-subtle);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 20px;
}"""
css = css.replace(subtle_old, subtle_new)

# 5. Buttons (remove transforms and box shadow)
btn_old = """.primary-btn,
.secondary-btn,
.danger-btn {
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transform: translateY(0);
  transition:
    transform var(--motion-fast) var(--motion-ease),
    box-shadow var(--motion-fast) var(--motion-ease),
    background-color var(--motion-fast) var(--motion-ease),
    border-color var(--motion-fast) var(--motion-ease);
}"""

btn_new = """.primary-btn,
.secondary-btn,
.danger-btn {
  border: none;
  border-radius: 8px;
  padding: 12px 18px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition:
    background-color var(--motion-fast) var(--motion-ease),
    border-color var(--motion-fast) var(--motion-ease);
}"""
css = css.replace(btn_old, btn_new)

btn_hover_old = """.primary-btn:hover {
  background: var(--brand-700);
  transform: translateY(-1px);
  box-shadow: 0 10px 18px -14px rgba(234, 88, 12, 0.75);
}

.primary-btn:active {
  background: var(--brand-800);
  transform: translateY(1px) scale(0.985);
}"""
btn_hover_new = """.primary-btn:hover {
  background: var(--brand-700);
}

.primary-btn:active {
  background: var(--brand-800);
}"""
css = css.replace(btn_hover_old, btn_hover_new)

sec_btn_old = """.secondary-btn:hover {
  background: var(--bg-subtle);
  transform: translateY(-1px);
}

.secondary-btn:active,
.danger-btn:active {
  transform: translateY(1px) scale(0.985);
}

.danger-btn {
  background: var(--error);
  color: #fff;
}

.danger-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px -14px rgba(220, 38, 38, 0.8);
}"""
sec_btn_new = """.secondary-btn:hover {
  background: var(--bg-subtle);
}

.secondary-btn:active,
.danger-btn:active {
}

.danger-btn {
  background: var(--error);
  color: #fff;
}

.danger-btn:hover {
  background: #b91c1c; /* darker red */
}"""
css = css.replace(sec_btn_old, sec_btn_new)

# 6. Navlinks (stop bounce)
nav_old = """.nav-link {
  border: 1px solid var(--border-default);
  border-radius: 999px;
  padding: 7px 12px;
  color: var(--text-primary);
  text-decoration: none;
  transform: translateY(0);
  transition:
    background-color var(--motion-fast) var(--motion-ease),
    border-color var(--motion-fast) var(--motion-ease),
    transform var(--motion-fast) var(--motion-ease),
    box-shadow var(--motion-fast) var(--motion-ease);
}

.nav-link:hover {
  background: var(--bg-subtle);
  text-decoration: none;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px -12px rgba(31, 41, 55, 0.5);
}"""
nav_new = """.nav-link {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 16px;
  color: var(--text-secondary);
  font-weight: 500;
  text-decoration: none;
  transition:
    background-color var(--motion-fast) var(--motion-ease),
    border-color var(--motion-fast) var(--motion-ease),
    color var(--motion-fast) var(--motion-ease);
}

.nav-link:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
  text-decoration: none;
}"""
css = css.replace(nav_old, nav_new)

# 7. Hover on brand
brand_old = """.brand:hover {
  transform: translateY(-1px);
}"""
brand_new = """.brand:hover {
  color: var(--brand-700);
}"""
css = css.replace(brand_old, brand_new)

# 8. Contributor card flat
cont_old = """.contributor-card {
  width: 100%;
  border: 1px solid var(--border-default);
  background: var(--bg-base);
  border-radius: 10px;
  padding: 12px;
  display: grid;
  gap: 6px;
  text-align: left;
  transition:
    transform var(--motion-fast) var(--motion-ease),
    border-color var(--motion-fast) var(--motion-ease),
    box-shadow var(--motion-fast) var(--motion-ease);
}

.contributor-card:hover {
  transform: translateY(-1px);
  border-color: rgba(249, 115, 22, 0.35);
  box-shadow: 0 10px 20px -18px rgba(249, 115, 22, 0.7);
}"""

cont_new = """.contributor-card {
  width: 100%;
  border: 1px solid var(--border-default);
  background: var(--bg-base);
  border-radius: 8px;
  padding: 16px;
  display: grid;
  gap: 6px;
  text-align: left;
  transition: border-color var(--motion-fast) var(--motion-ease), background-color var(--motion-fast) var(--motion-ease);
}

.contributor-card:hover {
  border-color: var(--brand-600);
  background: var(--brand-100);
}"""
css = css.replace(cont_old, cont_new)

# 9. city pill and status pill
pill_old = """.city-pill,
.status-pill {
  transition:
    transform var(--motion-fast) var(--motion-ease),
    box-shadow var(--motion-fast) var(--motion-ease);
}

.city-pill:hover,
.status-pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px -16px rgba(31, 41, 55, 0.6);
}"""
pill_new = """.city-pill,
.status-pill {
  /* Reduced visual noise, removed bounce */
}

.city-pill:hover,
.status-pill:hover {
}"""
css = css.replace(pill_old, pill_new)

# 10. profile trigger / icon action btn bounce
prof_old = """.icon-action-btn,
.profile-trigger {
  border-radius: 999px;
  transition:
    transform var(--motion-fast) var(--motion-ease),
    background-color var(--motion-fast) var(--motion-ease),
    color var(--motion-fast) var(--motion-ease);
}

.icon-action-btn {
  padding: 6px;
}

.icon-action-btn:hover,
.profile-trigger:hover {
  transform: translateY(-1px);
  background-color: rgba(249, 115, 22, 0.1) !important;
  color: var(--brand-700) !important;
}

.icon-action-btn:active,
.profile-trigger:active {
  transform: translateY(1px) scale(0.97);
}

.profile-avatar {
  transition:
    transform var(--motion-fast) var(--motion-ease),
    box-shadow var(--motion-fast) var(--motion-ease);
}

.profile-trigger:hover .profile-avatar {
  transform: scale(1.04);
  box-shadow: 0 8px 16px -10px rgba(31, 41, 55, 0.45);
}"""

prof_new = """.icon-action-btn,
.profile-trigger {
  border-radius: 999px;
  transition: background-color var(--motion-fast) var(--motion-ease), color var(--motion-fast) var(--motion-ease);
}

.icon-action-btn {
  padding: 6px;
}

.icon-action-btn:hover,
.profile-trigger:hover {
  background-color: var(--bg-subtle) !important;
}

.icon-action-btn:active,
.profile-trigger:active {
}

.profile-avatar {
  transition: transform var(--motion-fast) var(--motion-ease);
}

.profile-trigger:hover .profile-avatar {
}"""
css = css.replace(prof_old, prof_new)


with open('frontend/src/index.css', 'w') as f:
    f.write(css)

