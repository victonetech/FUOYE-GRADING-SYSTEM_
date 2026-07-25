# University Grading System — Design Brainstorm

## Three Design Approaches

### 1. Bureaucratic Modern
- **Very Brief Intro**: A clean, institutional aesthetic inspired by Scandinavian civic design — cool greys, crisp whites, and a single authoritative blue. It communicates trust, precision, and official authority without feeling heavy.
- **Probability**: 0.72

### 2. Warm Academic
- **Very Brief Intro**: A rich, warm palette of deep forest green and cream, evoking the feel of old library desks and leather-bound ledgers. Classic serif headings pair with modern sans-serif body text for a timeless university feel.
- **Probability**: 0.04

### 3. Tech Dashboard
- **Very Brief Intro**: A dark-mode analytics dashboard aesthetic with monospace data fonts, subtle grid lines, and electric accent colors. Feels like a modern SaaS tool built for data-heavy workflows.
- **Probability**: 0.24

---

## Selected Approach: Bureaucratic Modern

### Design Movement
Inspired by **Swiss International Typographic Style** mixed with modern civic/government digital services (like Gov.uk). Clean, functional, no-nonsense, but visually refined.

### Core Principles
1. **Clarity Over Decoration** — Every pixel serves a purpose. No decorative elements that don't convey information.
2. **Hierarchical Authority** — Visual weight communicates importance: Faculty > Department > Course > Student.
3. **Data-First Layouts** — Tables and grids are the hero. The design serves the data, not the other way around.
4. **Trustworthy Restraint** — Minimal color palette, generous whitespace, and consistent spacing build confidence.

### Color Philosophy
- **Primary**: Deep navy `#1a3a5c` — authority, trust, institutional credibility
- **Accent**: Crisp blue `#2563eb` — actionable elements, links, CTAs
- **Surface**: Cool grey `#f8fafc` — card backgrounds, subtle depth
- **Canvas**: Pure white `#ffffff` — main workspace
- **Success**: Emerald `#10b981` — pass grades, good standing
- **Warning**: Amber `#f59e0b` — borderline scores (the 29, 39, 59, 69 range)
- **Danger**: Rose `#ef4444` — fail grades

### Layout Paradigm
**Persistent left sidebar navigation** with a wide content area. The sidebar contains Faculty/Department hierarchy. The main area is a full-width data table workspace. No centered hero layouts — this is a tool, not a marketing page.

### Signature Elements
1. **Grade badges** — Rounded pill badges with color-coded grade letters (A, B, C, D, E, F)
2. **Section dividers** — Subtle 2px top borders in the primary color that separate functional zones
3. **Status dots** — Small colored dots indicating grading status (pending, complete, flagged)

### Interaction Philosophy
Snappy, minimal feedback. Buttons press instantly with a subtle scale-down. Form validation shows inline errors without modals. Data loads feel immediate because we use local storage. No unnecessary animations — this is a work tool.

### Animation
- Page transitions: none (instant)
- Modal/dialog: 180ms fade + slight scale from 0.97
- Table row enter: 80ms stagger
- Button press: 100ms scale(0.97)
- Toast notifications: 200ms slide-up

### Typography System
- **Headings**: `Inter` weight 700 — clean, modern, authoritative
- **Body**: `Inter` weight 400/500 — highly readable at small sizes
- **Data/Numbers**: `JetBrains Mono` weight 500 — monospace for scores and IDs
- **Hierarchy**: 24px page titles, 18px section headers, 14px body, 12px labels/metadata

### Brand Essence
A fast, no-nonsense grading tool that faculty can use immediately without training — built for speed and accuracy in high-volume grading workflows.

**Personality**: Authoritative, Efficient, Reliable

### Brand Voice
- Headlines are direct and action-oriented
- CTAs are imperative: "Enter Scores", "Calculate Grades", "Export Results"
- No generic filler: instead of "Welcome to the Grading System", use "Select Faculty to Begin"

### Wordmark & Logo
A clean geometric "G" mark — formed from two overlapping rectangles suggesting a document/checklist, in the primary navy. Simple enough to work as a favicon.

### Signature Brand Color
**Navy `#1a3a5c`** — appears on the sidebar, active states, and key headings. Instantly recognizable as "the grading system blue."
