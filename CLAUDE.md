# TrustYourPill — Design System & Development Context

## Project Structure

```
/frontend/TrustYourPill   ← Main Expo/React Native app
/backend                  ← Backend services
```

---

## Design Language

### Theme
- **Mode**: Light only (`userInterfaceStyle: "light"` in app.json)
- **Aesthetic**: Modern, clean, soft & friendly — minimalist with pastel gradients and generous whitespace
- **Feel**: Healthcare-grade clarity combined with consumer-app warmth

---

### Color Palette

#### Brand
| Token | Value | Usage |
|---|---|---|
| Accent Blue | `#006BFF` | Primary CTA, active states, buttons |
| Success Green | `#26B81E` | Positive status, streaks |
| Green Glow | `#52FF4A` | Shadow on success indicators |

#### Neutrals
| Token | Value | Usage |
|---|---|---|
| White | `#FFFFFF` | Backgrounds, cards, primary text |
| Light Gray | `#EAEAEA` | Hero section background |
| Card Gray | `#EFEFEF` | Default card background |
| Dark | `#111111` | Primary body text |
| Meta | `rgba(0,0,0,0.5–0.7)` | Secondary text, timestamps |

#### Card Gradients (Linear, diagonal 0→1 on both axes)
| Card | From | To |
|---|---|---|
| Adherence | `#F4D6E4` | `#D9C8EF` |
| Paracetamol | `#E8F4FA` | `#CFE5F2` |
| Ibuprofen | `#E2DBF6` | `#C9BFEE` |
| Streak | `#D9EFDC` | `#BFE3C8` |
| Next Dose | `#FCE2CF` | `#F6C9A8` |
| Adherence Ring | `#B44FD6` | `#5C45E2` (stroke gradient) |

Every major card uses a unique pastel diagonal gradient — never a flat fill.

---

### Typography

**Font family**: `Geist` (from `@expo-google-fonts/geist`)

| Weight | Token | Usage |
|---|---|---|
| 400 | `Geist_400Regular` | Body text, descriptions |
| 500 | `Geist_500Medium` | Labels, secondary headings, UI text |
| 600 | `Geist_600SemiBold` | Primary headings, emphasis |

**Font sizes**
| Size | Usage |
|---|---|
| 41px | Large display headline |
| 30px | Stat values (streaks, times) |
| 24px | Section titles |
| 22px | Pill dosage labels |
| 20px | User name |
| 15px | Status text, active pill count |
| 13px | Card labels, greeting, meta |
| 12px | Secondary metadata, action labels |

**Letter spacing**: Tight negative throughout (`-0.25` to `-1.23`) — modern, compact feel. Never loose.

---

### Spacing System

| Value | Usage |
|---|---|
| 4px | Minimal icon gaps |
| 6–8px | Small intra-element gaps |
| 12px | Gap unit between cards / rows (primary rhythm unit) |
| 16–20px | Card inner padding |
| 28px | Main horizontal content padding |
| 35px | Hero section horizontal padding |
| 52px | Avatar diameter |
| 110px | Bottom nav safe area bottom padding |

**Primary gap rhythm**: `12px` — use this between cards, list items, and sibling elements.

---

### Border Radius

| Value | Usage |
|---|---|
| 22px | Standard cards |
| 30–40px | Navigation items |
| 38px | Hero section container |
| `9999px` | Pills / badges / fully circular elements |

Never use sharp corners (`0` or `4px`) on user-facing surfaces.

---

### Shadows & Elevation

Do not use heavy borders for elevation. Use shadows exclusively.

| Context | Shadow |
|---|---|
| Active/selected card | Blue glow: `#006BFF`, opacity 0.4, radius 6.6 |
| Bottom navigation | Dark: `#000000`, offset (0,8), radius 18, opacity 0.1 |
| Status indicator | Green glow: `#52FF4A`, opacity 1, radius 3 |

---

### Component Patterns

#### Cards
- Background: pastel diagonal `LinearGradient` (never flat fill)
- Border radius: `22px`
- Padding: `16–20px`
- No visible border

#### Buttons & Interactives
- **Action card (default)**: `#EFEFEF` background, white circular icon container, white 4px border
- **Action card (active)**: `#006BFF` background, white icon, blue glow shadow
- **Solid round button**: `43px` circle, `21.5px` radius, white icon, blue background

#### Navigation (Bottom Nav)
- `BlurView` with intensity `45` — glassmorphic backdrop
- Animated width transitions on active item (spring physics)
- Icon color interpolates from dark gray → `#006BFF` on activation
- Label slides in/out on expand/collapse

#### Rings & Progress
- Stroke width: `6px`, rounded caps (`lineCap: "round"`)
- Use gradient stroke for adherence/progress rings (purple-to-blue)
- Smooth animated progress (no stepping)

---

### Icons

Library: **Lucide React Native**
- Size: `20px` default
- Stroke width: `2–2.4`
- Color: white on colored backgrounds, dark (`#111111`) on light backgrounds
- Never use filled icons — always outlined Lucide style

---

### Motion & Animation

- **Spring physics** for interactive expand/collapse (feels natural, not linear)
- **Opacity transitions** for state changes (active/inactive)
- **No instant jumps** — every state change should be animated
- Keep animations short: `200–350ms` perceived duration

---

### General Rules

1. Every card gets a unique pastel gradient — reuse the defined palette, don't invent new colors
2. Negative letter spacing always — never default or positive
3. Geist font only — no system fonts on UI surfaces
4. Rounded everything — minimum `22px` on cards
5. Elevation via shadow, never border
6. Glassmorphic bottom nav — always `BlurView`, never opaque
7. Icons: Lucide, outlined, consistent stroke width
8. Gap rhythm: `12px` between sibling elements
9. Light mode only — no dark mode handling needed
10. Safe area aware on all screens (respect notch / home indicator)

---

## Screen Specifications

### Bottom Navigation

4 tabs, always visible, glassmorphic (`BlurView` intensity 45):

| Position | Tab | Icon | Notes |
|---|---|---|---|
| Left | Home | `Home` | Default active tab |
| Center-left | — | — | — |
| Center | Scan / Add Pill | `Camera` or `ScanLine` | **Elevated** — larger button, `#006BFF` filled circle, floats above nav bar |
| Center-right | — | — | — |
| Right | Symptoms | `Activity` or `HeartPulse` | Symptom tracking tab |
| Far right | Pill Library | `BookOpen` or `Pill` | Pill library tab |

The center Scan button is the primary action — it should be visually dominant (raised circular button with blue glow shadow, larger than other icons). All other tabs follow the standard animated expand/collapse pattern.

---

### Pill Library Screen

Displays all pills the user has added to their personal library.

**Per pill card shows:**
- Pill name + dosage
- Date added (formatted: "Added Apr 12")
- **Conflicts badge** — "Does not work with" section listing other pills in the user's library that interact/conflict with this pill. Show as small warning chips (orange/red pastel gradient, `⚠` or `AlertTriangle` icon). If no conflicts: show nothing or a subtle "No conflicts" label.

**Layout:**
- Scrollable list of pill cards, `12px` gap
- Each card: pastel gradient background (cycle through the defined palette), `22px` radius, `16px` padding
- Conflict chips sit below the pill name, horizontally wrapping
- Empty state: friendly illustration + "No pills added yet" + CTA to scan first pill

**Conflict logic note:** Conflicts are computed against only the pills currently in the user's library — not a global drug database check in isolation. The warning is contextual ("X doesn't work with Y that you're already taking").

---

### Symptoms Tracking Screen

Entry point for logging how the user feels.

**Displays:**
- Quick mood / symptom picker (visual, not a text form) — common symptom chips the user can tap
- Timestamp of last check-in
- History of recent symptom logs (scrollable, cards with date + logged symptoms)

---

### Check-up Screen

A guided daily check-in flow. Presented as a step-by-step card stack or vertical scroll.

**Steps / sections:**

1. **Symptoms check-in** — "How are you feeling right now?" — tap symptoms or select "Feeling good"
2. **Pill adherence check** — "Did you take all your pills today?" — Yes / No / Partially
3. **Missed dose recommendation** — If no/partial: smart recommendation card:
   - If missed dose is recent enough → "Take it now" (catch up)
   - If too close to next scheduled dose → "Skip it, wait for next dose"
   - Recommendation displayed as a prominent action card with blue accent

**Card when feeling bad:**
- Pulls in current active pills
- Checks known side effects for each
- Displays "Could this be a side effect?" card per pill with matching symptom + side effect
- Tone: informative, never alarmist — "Ibuprofen can sometimes cause stomach discomfort. This may be related."

**Visual style:**
- Step-indicator at top (dots or numbered pills)
- Each step is a full-width card with pastel gradient
- CTA button at bottom of each step (`#006BFF`, full-width rounded, white text)
