# Past Events Admin UI - Visual Design Guide

## 🎨 Component Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                       Admin Interface                           │
│  (Event Name, Status, Links, Scoring, Teams, etc.)              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                      📚 Past Events                              │
│                View finalized events and their results            │
│                                                                 │
│  ┌─────────────────────────┬─────────────────────────┐          │
│  │                         │                         │          │
│  │  📦 Archived            │  📦 Archived            │          │
│  │                         │                         │          │
│  │  Event Name Here        │  Another Event Name     │          │
│  │                         │                         │          │
│  │  [Quick] • 3 days       │  [Camp] • 5 days        │          │
│  │                         │                         │          │
│  │  3 teams                │  5 teams                │          │
│  │                         │                         │          │
│  │  Finalized              │  Finalized              │          │
│  │  Jan 8, 2025            │  Jan 7, 2025            │          │
│  │                         │                         │          │
│  │ [View Final Results]    │ [View Final Results]    │          │
│  └─────────────────────────┴─────────────────────────┘          │
│                                                                 │
│  ┌─────────────────────────┐                                   │
│  │                         │                                   │
│  │  📦 Archived            │                                   │
│  │                         │                                   │
│  │  Third Event            │                                   │
│  │                         │                                   │
│  │  [Quick]                │                                   │
│  │                         │                                   │
│  │  2 teams                │                                   │
│  │                         │                                   │
│  │  Finalized              │                                   │
│  │  Jan 5, 2025            │                                   │
│  │                         │                                   │
│  │ [View Final Results]    │                                   │
│  └─────────────────────────┘                                   │
│                                                                 │
│  ────────────────────────────────────────────────────           │
│                                                                 │
│         📊 Summary Statistics                                   │
│                                                                 │
│      3 Past Events  |  10 Total Teams  |  3 Finalized           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Card Anatomy

```
┌──────────────────────────────────────────┐
│                                          │
│ Top Right: 📦 Archived Badge             │
│                                          │
│ Event Name (max 2 lines, truncated)      │
│                                          │
│ [Mode Badge] • Days Info                 │
│                                          │
│ Number teams                             │
│                                          │
│ Finalized                                │
│ Date (formatted)                         │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ View Final Results                   │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ [Hover border effect]                    │
└──────────────────────────────────────────┘
```

## 🎨 Color Palette

### Primary Colors
- **Indigo-600**: CTA buttons, active states
- **Indigo-700**: Button hover states
- **Indigo-100**: Mode badges background
- **Indigo-200**: Card border on hover

### Neutral Colors
- **Gray-900**: Primary text
- **Gray-700**: Badges (Archived badge)
- **Gray-600**: Secondary text (dates, labels)
- **Gray-200**: Card border, dividers
- **Gray-50**: Card background
- **Indigo-50**: Card background gradient

### State Colors
- **Red-50/200/700**: Error states
- **Green-50/200/700**: Success states (if needed)
- **Blue-200**: Loading spinner

## 📱 Responsive Design

### Mobile (< 768px)
```
Single Column Layout:
┌─────────────────────┐
│      Card 1         │
└─────────────────────┘
┌─────────────────────┐
│      Card 2         │
└─────────────────────┘
┌─────────────────────┐
│      Card 3         │
└─────────────────────┘
```

### Tablet (768px - 1024px)
```
Two Column Layout:
┌─────────────────┬─────────────────┐
│      Card 1     │      Card 2     │
└─────────────────┴─────────────────┘
┌─────────────────┐
│      Card 3     │
└─────────────────┘
```

### Desktop (> 1024px)
```
Three Column Layout:
┌────────────┬────────────┬────────────┐
│  Card 1    │  Card 2    │  Card 3    │
└────────────┴────────────┴────────────┘
┌────────────┐
│  Card 4    │
└────────────┘
```

## ⚡ Interactive States

### Idle State
```
Card: Subtle gray border, soft shadow
Button: Indigo background, ready to click
```

### Hover State
```
Card:
  - Shadow increases
  - Border changes to indigo
  - Smooth transition
  - Slight scale effect

Button:
  - Background changes to indigo-700
  - Smooth color transition
```

### Loading State
```
┌────────────────────────────┐
│                            │
│      ⏳ Loading Spinner    │
│                            │
│   Loading past events...    │
│                            │
└────────────────────────────┘
```

### Error State
```
┌────────────────────────────┐
│                            │
│   ❌ Error Loading Events   │
│                            │
│   Failed to fetch data      │
│                            │
└────────────────────────────┘
```

### Empty State
```
┌────────────────────────────┐
│                            │
│          📭                │
│                            │
│    No Past Events Yet       │
│                            │
│  Finalized events will     │
│    appear here             │
│                            │
└────────────────────────────┘
```

## 🏷️ Badge Styles

### Mode Badge
```
Dimensions: Small, compact
Colors: Indigo-100 bg, Indigo-700 text
Text: "Quick" | "Camp" | "Advanced"
Style: Rounded pill shape
Font: Semibold, small size
```

### Archived Badge
```
Position: Top right of card
Text: "📦 Archived"
Colors: Gray-200 bg, Gray-700 text
Style: Rounded pill shape
Purpose: Clearly indicate archived status
```

## 📊 Statistics Footer

```
┌─────────────────────────────────────────┐
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│      📊 Summary Statistics              │
│                                         │
│   Events  │  Teams   │  Finalized       │
│      3    │    10    │      3           │
│                                         │
└─────────────────────────────────────────┘
```

## 🎯 Button Styling

### View Final Results Button
```
Width: Full card width
Height: 2.5rem (40px)
Padding: Horizontal 1rem, Vertical 0.625rem
Background: Indigo-600
Hover: Indigo-700
Text: White, semibold, small
Border Radius: 0.5rem (8px)
Transition: Smooth color transition (200ms)
```

## 🌈 Typography

### Headings
```
h2 (Section Title): 24px, Bold, Gray-900
h3 (Event Name): 18px, Bold, Gray-900
```

### Body Text
```
Event Details: 14px, Regular, Gray-700
Labels: 12px, Medium, Gray-600
Badges: 12px, Semibold, Indigo-700
```

## 💫 Animations

### Hover Effects
```
Card: 300ms ease-in-out transition
Border: Color change from gray-200 to indigo-200
Shadow: Subtle increase
Border-radius: Maintains 0.75rem (12px)
```

### Loading Spinner
```
Size: 3rem (48px)
Colors: Gray-200 border, Indigo-500 top
Animation: Continuous rotation
Duration: Smooth animation
```

### Transitions
```
All state changes: 200-300ms smooth transitions
Easing: ease-in-out
No jarring or abrupt changes
```

## 🎨 Design Principles Applied

1. **Calm & Trustworthy**: Indigo and gray palette, minimal vibrancy
2. **Read-Only**: No edit/delete UI elements
3. **Clear Hierarchy**: Important info prominent, metadata secondary
4. **Accessibility**: Proper contrast ratios, semantic HTML
5. **Responsive**: Works on all devices
6. **Consistent**: Matches existing admin interface styling
7. **User-Focused**: Clear CTAs, good feedback
8. **Efficient**: Single view shows key info, links to details

## ✨ UX Micro-interactions

- **Hover cards**: Subtle lift and border color change
- **Button hover**: Color deepens, feels clickable
- **Loading**: Smooth spinner animation
- **Navigation**: Instant transition to recap page
- **Empty state**: Friendly emoji and message
- **Error state**: Clear red indication with message

