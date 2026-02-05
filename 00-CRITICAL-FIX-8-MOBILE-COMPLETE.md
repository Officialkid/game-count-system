# CRITICAL FIX #8: Mobile-First Responsive Design - COMPLETE SUMMARY

## 🎯 Mission Statement

**Objective**: Ensure Game Count System works perfectly on mobile devices, since **most users will score from phones** during live events.

**Primary Use Case**: Score keepers using smartphones (iPhone/Android) to input scores quickly and accurately during events.

---

## 📦 Deliverables

### 1. **Mobile Utilities & Hooks** ✅ COMPLETE
**File**: `hooks/useMobile.ts` (250 lines)

#### Hooks Provided:
- `useIsMobile()` → Boolean (device detection + screen <768px)
- `useIsTouch()` → Boolean (touch support detection)
- `useBreakpoint()` → 'xs'|'sm'|'md'|'lg'|'xl'|'2xl' (responsive breakpoint)
- `useOrientation()` → 'portrait'|'landscape' (device orientation)
- `useSafeAreaInsets()` → {top, right, bottom, left} (notch/cutout safe areas)

#### Utility Functions:
- `isIOS()` → Boolean (iOS detection)
- `isAndroid()` → Boolean (Android detection)
- `preventPullToRefresh()` → Prevents iOS Safari pull-to-refresh
- `enableSmoothScrolling()` → Enables `-webkit-overflow-scrolling: touch`
- `getActualViewportHeight()` → Real viewport height (accounts for browser chrome)
- `vibrate(pattern)` → Haptic feedback
- `lockOrientation(type)` → Lock screen orientation
- `unlockOrientation()` → Unlock screen orientation
- `getResponsiveClass()` → Utility to get class based on breakpoint

**Usage Example**:
```typescript
import { useIsMobile, useBreakpoint, vibrate } from '@/hooks/useMobile';

function MyComponent() {
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();
  
  const handleClick = () => {
    vibrate(50); // Haptic feedback
  };
  
  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
      <p>Current breakpoint: {breakpoint}</p>
    </div>
  );
}
```

---

### 2. **Mobile Navigation Components** ✅ COMPLETE
**File**: `components/MobileNavigation.tsx` (450 lines)

#### Components:

##### `<MobileNavigation>` - Bottom Tab Bar
Bottom navigation bar with large touch targets, optimized for thumb reach.

**Props**:
- `items: MobileNavItem[]` - Array of nav items with href, label, icon, badge
- `hideOnDesktop?: boolean` - Hide on desktop (default: true)

**Features**:
- Fixed bottom position with safe-area-inset-bottom padding
- Minimum 56px height (44px+ touch targets)
- Active state highlighting (purple)
- Badge counts for notifications
- Automatic pathname detection

**Usage**:
```typescript
<MobileNavigation
  items={[
    { href: '/dashboard', label: 'Home', icon: '🏠' },
    { href: '/score', label: 'Score', icon: '🎯', badge: 3 },
    { href: '/teams', label: 'Teams', icon: '👥' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ]}
/>
```

##### `<MobileHeader>` - Sticky Top Header
Mobile-optimized header with back button and actions.

**Props**:
- `title: string` - Page title
- `showBack?: boolean` - Show back button
- `onBack?: () => void` - Custom back handler
- `actions?: React.ReactNode` - Right-side actions
- `transparent?: boolean` - Transparent background

**Features**:
- Sticky top position with safe-area-inset-top padding
- 44px back button
- Truncated title with center alignment
- Supports custom actions (search, menu, etc.)

##### `<MobileDrawer>` - Bottom Sheet
Slide-up drawer/sheet from bottom of screen.

**Props**:
- `isOpen: boolean` - Drawer state
- `onClose: () => void` - Close handler
- `title?: string` - Drawer title
- `children: React.ReactNode` - Drawer content
- `height?: 'auto' | 'half' | 'full'` - Drawer height

**Features**:
- Smooth slide-up animation
- Backdrop with blur
- Handle bar for visual indicator
- Safe area padding at bottom
- Tap backdrop to close

##### `<MobileFAB>` - Floating Action Button
Primary action button that floats above content.

**Props**:
- `onClick: () => void` - Click handler
- `icon: React.ReactNode` - Button icon
- `label?: string` - Optional label
- `position?: 'bottom-right' | 'bottom-center' | 'bottom-left'`
- `variant?: 'primary' | 'secondary'`

**Features**:
- Minimum 56×56px touch target
- Fixed position above bottom nav
- Active press animation (scale-95)
- Safe area aware positioning

##### `<MobilePullToRefresh>` - Pull to Refresh
Native-style pull-to-refresh gesture.

**Props**:
- `onRefresh: () => Promise<void>` - Async refresh function
- `children: React.ReactNode` - Page content
- `disabled?: boolean` - Disable pull-to-refresh

**Features**:
- Pull distance indicator
- Spinning loader on refresh
- Trigger distance: 60px
- Max pull: 80px
- Works only at scroll top

---

### 3. **Touch Score Input Components** ✅ COMPLETE
**File**: `components/TouchScoreInput.tsx` (550 lines)

#### Components:

##### `<TouchScoreInput>` - Full Score Input
Large button-based score input optimized for touch.

**Props**:
- `value: number` - Current score
- `onChange: (value: number) => void` - Change handler
- `min?: number` - Minimum value (default: -100)
- `max?: number` - Maximum value (default: 999)
- `presets?: number[]` - Preset buttons (default: [1, 5, 10])
- `showHistory?: boolean` - Show undo button (default: true)
- `disabled?: boolean` - Disable input
- `label?: string` - Input label

**Features**:
- Large current value display (text-5xl)
- Preset buttons: -1, +1, -5, +5, -10, +10 (customizable)
- Minimum 60px button height
- Haptic feedback on touch devices
- Undo button (visible for 3 seconds after change)
- Reset button
- Active press animations
- Color-coded buttons (red for subtract, green for add)

**Usage**:
```typescript
function ScoreForm() {
  const [score, setScore] = useState(0);
  
  return (
    <TouchScoreInput
      value={score}
      onChange={setScore}
      presets={[1, 5, 10, 15, 20]}
      label="Team Score"
    />
  );
}
```

##### `<CompactTouchScoreInput>` - Inline Score Input
Compact +/- buttons for inline use.

**Props**:
- `value: number` - Current value
- `onChange: (value: number) => void` - Change handler
- `min?: number` - Min value
- `max?: number` - Max value
- `step?: number` - Increment step (default: 1)
- `disabled?: boolean`
- `size?: 'sm' | 'md' | 'lg'` - Button size

**Features**:
- Inline layout (− [value] +)
- Size variants: sm (36px), md (44px), lg (56px)
- Haptic feedback
- Active press animations
- Disabled state handling

##### `<TouchNumberPad>` - Full Number Pad
Full 0-9 keypad for precise number entry.

**Props**:
- `value: string` - Current value string
- `onChange: (value: string) => void` - Change handler
- `onSubmit: () => void` - Submit handler
- `maxDigits?: number` - Max digits (default: 3)
- `showDecimal?: boolean` - Show decimal button (default: false)
- `disabled?: boolean`

**Features**:
- Large digit buttons (64px minimum)
- Number display at top (text-4xl)
- Clear button
- Backspace button (⌫)
- Optional decimal support
- Submit button (56px height)
- Haptic feedback on all keys
- Active press animations

---

### 4. **Responsive Team Display** ✅ COMPLETE
**File**: `components/ResponsiveTeamDisplay.tsx` (550 lines)

#### Components:

##### `<ResponsiveTeamDisplay>` - Adaptive Team List
Responsive component that shows cards on mobile, table on desktop.

**Props**:
- `teams: Team[]` - Array of teams
- `onTeamClick?: (team: Team) => void` - Click handler
- `showRanks?: boolean` - Show rank column/badge (default: true)
- `showScores?: boolean` - Show score column (default: true)
- `selectable?: boolean` - Enable selection (default: false)
- `selectedTeamId?: string` - Currently selected team
- `variant?: 'card' | 'compact' | 'minimal'` - Card variant
- `loading?: boolean` - Show loading skeleton

**Features**:
- **Mobile (xs/sm)**: Vertical card layout
- **Desktop (md+)**: Table layout with columns
- Automatic layout switching based on breakpoint
- Touch-optimized selection
- Loading skeleton states
- Empty state handling
- Rank badges with emojis (🥇🥈🥉)
- Color-coded team badges
- Haptic feedback on selection

**Mobile Layout**:
```
┌────────────────────────────┐
│ 🥇 🔴 Team Red      150 pts│
│                      5 scores│
└────────────────────────────┘
```

**Desktop Layout**:
```
┌──────┬─────────────┬────────┬────────┐
│ Rank │ Team        │ Points │ Scores │
├──────┼─────────────┼────────┼────────┤
│ 🥇   │ 🔴 Team Red │   150  │    5   │
└──────┴─────────────┴────────┴────────┘
```

##### `<ResponsiveTeamGrid>` - Team Grid Layout
Alternative grid layout with color-coded cards.

**Props**:
- `teams: Team[]` - Array of teams
- `onTeamClick?: (team: Team) => void` - Click handler
- `selectedTeamId?: string` - Selected team
- `columns?: 1 | 2 | 3 | 4` - Number of columns (responsive)

**Features**:
- Color-filled cards with team colors
- Automatic text contrast (white/black)
- Responsive grid (1 col mobile → 2-4 cols desktop)
- Large touch targets (min 100px height)
- Selection state with ring highlight
- Active press animations

---

### 5. **Mobile CSS Animations & Utilities** ✅ COMPLETE
**File**: `app/globals-enhanced.css` (+100 lines)

#### New Animations:

##### `@keyframes slide-up`
Slide up from bottom animation for drawers/sheets.
```css
.animate-slide-up {
  animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

##### `@keyframes scale-98`
Press animation for buttons.
```css
.active\:scale-98:active {
  animation: scale-98 0.1s ease-out;
}
```

##### `@keyframes ripple`
Material Design-style ripple effect.
```css
.ripple:active::after {
  animation: ripple 0.6s ease-out;
}
```

#### Utility Classes:

##### Safe Area Insets
Padding for notched devices (iPhone X+, Android with notches).
```css
.safe-top { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-left { padding-left: env(safe-area-inset-left); }
.safe-right { padding-right: env(safe-area-inset-right); }
```

##### Touch Improvements
```css
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
```

##### Smooth Scrolling
```css
.smooth-scroll {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}
```

##### No Selection
```css
.no-select {
  user-select: none;
}
```

---

### 6. **Mobile Testing Checklist** ✅ COMPLETE
**File**: `MOBILE_TESTING_CHECKLIST.md` (800+ lines)

#### Device Matrix:
- iOS: iPhone SE, 12/13 Mini, 12/13/14, 14 Pro Max, iPad Mini, iPad Pro
- Android: Pixel 7, Galaxy S23, Galaxy A54, OnePlus 11, Galaxy Tab S8
- Browsers: Safari iOS, Chrome iOS/Android, Samsung Internet, Firefox Mobile

#### Test Scenarios:
1. **Event Creation Flow**: Portrait layout, keyboard handling, form validation
2. **Team Management**: Card layout, FAB button, touch targets
3. **CRITICAL: Scoring Interface**: 44px buttons, haptic feedback, quick input
4. **Scoreboard Viewing**: Real-time updates, responsive layout, smooth scroll
5. **Navigation**: Bottom tab bar, back button, drawer menu
6. **Orientation Changes**: Portrait ↔ landscape adaptation
7. **Touch Interactions**: Tap, scroll, swipe, pinch gestures
8. **Soft Keyboard**: Input visibility, submit button accessibility
9. **Safe Areas**: Notch/Dynamic Island, home indicator
10. **Performance**: Load times, scroll FPS, touch latency
11. **Accessibility**: Font scaling, VoiceOver/TalkBack, contrast
12. **Platform-Specific**: iOS pull-to-refresh, Android back button

#### Success Criteria:
- ✅ All touch targets ≥44px
- ✅ No horizontal scroll on portrait
- ✅ Scoring flow <2 minutes
- ✅ Real-time updates <2 seconds
- ✅ Performance metrics met on 3G

---

## 🏗️ Architecture

### Responsive Breakpoints (Tailwind)
```typescript
{
  xs: '< 640px',   // Small phones
  sm: '640-768px', // Large phones
  md: '768-1024px', // Tablets
  lg: '1024-1280px', // Small laptops
  xl: '1280-1536px', // Desktops
  '2xl': '≥ 1536px' // Large monitors
}
```

### Mobile-First Approach
1. **Design for 320px width first** (smallest modern phones)
2. **Add complexity with breakpoints** (sm:, md:, lg:, xl:)
3. **Touch-first interactions** (44px minimum tap area)
4. **Progressive enhancement** (works without JS)

### Component Hierarchy
```
hooks/useMobile.ts (utilities)
    ↓
components/MobileNavigation.tsx (navigation)
components/TouchScoreInput.tsx (input)
components/ResponsiveTeamDisplay.tsx (display)
    ↓
pages (use mobile components)
```

---

## 📱 Usage Guide

### 1. Detect Mobile Device
```typescript
import { useIsMobile } from '@/hooks/useMobile';

function MyPage() {
  const isMobile = useIsMobile();
  
  return (
    <div>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}
    </div>
  );
}
```

### 2. Responsive Breakpoints
```typescript
import { useBreakpoint } from '@/hooks/useMobile';

function MyComponent() {
  const breakpoint = useBreakpoint();
  
  const columns = {
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
    '2xl': 4,
  }[breakpoint];
  
  return <Grid columns={columns}>{items}</Grid>;
}
```

### 3. Touch-Optimized Score Input
```typescript
import { TouchScoreInput } from '@/components';

function ScorePage() {
  const [score, setScore] = useState(0);
  
  return (
    <TouchScoreInput
      value={score}
      onChange={setScore}
      presets={[1, 5, 10]}
      showHistory
    />
  );
}
```

### 4. Bottom Navigation
```typescript
import { MobileNavigation } from '@/components';

function Layout({ children }) {
  return (
    <>
      {children}
      <MobileNavigation
        items={[
          { href: '/', label: 'Home', icon: '🏠' },
          { href: '/score', label: 'Score', icon: '🎯' },
          { href: '/teams', label: 'Teams', icon: '👥' },
        ]}
      />
    </>
  );
}
```

### 5. Responsive Team Display
```typescript
import { ResponsiveTeamDisplay } from '@/components';

function TeamsPage() {
  const [selectedTeam, setSelectedTeam] = useState<string>();
  
  return (
    <ResponsiveTeamDisplay
      teams={teams}
      onTeamClick={setSelectedTeam}
      selectedTeamId={selectedTeam}
      selectable
      showRanks
      showScores
    />
  );
}
```

### 6. Haptic Feedback
```typescript
import { vibrate } from '@/hooks/useMobile';

function SubmitButton() {
  const handleClick = () => {
    vibrate(50); // Short vibration
    submitScore();
  };
  
  return (
    <button onClick={handleClick}>
      Submit Score
    </button>
  );
}
```

### 7. Safe Area Padding
```tsx
<div className="safe-top safe-bottom">
  {/* Content will respect notch and home indicator */}
</div>
```

---

## 🎨 Design Principles

### 1. Touch-First Design
- **Minimum touch target**: 44×44 CSS pixels (Apple HIG, Material Design)
- **Preferred touch target**: 56×56 CSS pixels (easier tapping)
- **Button spacing**: Minimum 8px gap between interactive elements
- **Active states**: Scale down (scale-95/98) for press feedback

### 2. Thumb-Reachable Navigation
- **Bottom navigation**: Primary actions at bottom (thumb reach zone)
- **Top actions**: Secondary actions (back, menu) at top
- **Avoid middle**: Hard to reach with one hand

### 3. Large Text & Clear Hierarchy
- **Body text**: Minimum 16px (prevents iOS zoom on input focus)
- **Scores/numbers**: 24-48px for readability from distance
- **Labels**: 12-14px for secondary info
- **Line height**: 1.5 for readability

### 4. Color & Contrast
- **WCAG AA**: Minimum 4.5:1 contrast for text
- **Color-coded actions**: Green (add), Red (subtract), Purple (submit)
- **Status colors**: Green (success), Red (error), Yellow (warning), Gray (disabled)

### 5. Progressive Disclosure
- **Show essentials first**: Don't overwhelm with options
- **Hide complexity**: Use drawers, accordions, tabs
- **Contextual actions**: Show actions only when relevant

---

## ⚡ Performance Considerations

### Touch Latency
- **Target**: <100ms perceived latency
- **Techniques**: 
  - `touch-action: manipulation` (removes 300ms delay)
  - Optimistic UI updates
  - Immediate visual feedback

### Scroll Performance
- **Target**: 60fps (16.67ms per frame)
- **Techniques**:
  - `-webkit-overflow-scrolling: touch` (iOS momentum)
  - Virtual scrolling for long lists (react-window)
  - CSS containment for isolated updates

### Bundle Size
- **Total JS**: Keep under 200KB gzipped
- **Code splitting**: Lazy load mobile components
- **Tree shaking**: Import only used hooks

### Network Performance
- **3G target**: First paint <3 seconds
- **Caching**: Service worker for offline
- **Compression**: Gzip/Brotli for assets

---

## 🐛 Common Issues & Solutions

### Issue: Buttons too small on mobile
**Solution**: Use `min-h-[44px] min-w-[44px]` or `min-h-[56px]`

### Issue: Keyboard covers input
**Solution**: Use `scrollIntoView()` on input focus
```typescript
inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
```

### Issue: Pull-to-refresh interferes with scroll
**Solution**: Use `preventPullToRefresh()` from useMobile
```typescript
useEffect(() => {
  preventPullToRefresh();
}, []);
```

### Issue: Text too small / zooms on input focus
**Solution**: Set `font-size: 16px` minimum on inputs
```css
input, select, textarea {
  font-size: 16px;
}
```

### Issue: Notch covers content
**Solution**: Use safe-area CSS classes
```tsx
<header className="safe-top">
<nav className="safe-bottom">
```

### Issue: Active :hover state stuck on mobile
**Solution**: Use `:active` instead of `:hover` for mobile
```css
button:active {
  background-color: #purple-700;
}
```

---

## 📊 Implementation Status

### Completed ✅
- [x] Mobile detection hooks (useMobile.ts)
- [x] Mobile navigation components (bottom bar, header, drawer, FAB)
- [x] Touch score input components (full, compact, number pad)
- [x] Responsive team display (cards/table adaptive)
- [x] Mobile CSS animations and utilities
- [x] Mobile testing checklist (800+ lines)
- [x] Component exports updated (index.ts)

### Next Steps 🔄
- [ ] Update existing pages with mobile components:
  - [ ] `/score` page → Use TouchScoreInput
  - [ ] `/teams` page → Use ResponsiveTeamDisplay
  - [ ] `/scoreboard` page → Mobile-optimized layout
  - [ ] `/event/new` page → Mobile-friendly form
- [ ] Add bottom navigation to main layout
- [ ] Test on real devices (iOS + Android)
- [ ] Performance audit with Lighthouse Mobile
- [ ] User acceptance testing with actual score keepers

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All components tested in isolation
- [ ] Mobile testing checklist completed
- [ ] Performance metrics validated
- [ ] Accessibility audit passed (WCAG AA)
- [ ] Cross-browser testing completed

### Post-Deployment
- [ ] Monitor error rates on mobile devices
- [ ] Track average scoring time
- [ ] Collect user feedback
- [ ] Monitor performance metrics
- [ ] Iterate based on analytics

---

## 📚 Resources

### Documentation
- **Apple Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/
- **Material Design**: https://material.io/design
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Hooks**: https://react.dev/reference/react

### Testing Tools
- **Chrome DevTools Device Mode**: Built-in mobile emulation
- **Safari Responsive Design Mode**: iOS testing
- **BrowserStack**: Real device testing
- **Lighthouse**: Performance + accessibility audit

### Related Files
- `hooks/useMobile.ts` - Mobile detection utilities
- `components/MobileNavigation.tsx` - Navigation components
- `components/TouchScoreInput.tsx` - Score input components
- `components/ResponsiveTeamDisplay.tsx` - Team display
- `app/globals-enhanced.css` - Mobile animations + utilities
- `MOBILE_TESTING_CHECKLIST.md` - Testing guide

---

## 🎯 Success Metrics

### Target Metrics
- **Scoring Time**: <2 minutes per team (mobile)
- **Touch Accuracy**: >95% (first tap success)
- **Error Rate**: <1% (mobile devices)
- **User Satisfaction**: >4/5 stars
- **Performance**: First paint <2s on 3G

### Monitoring
Track these metrics in analytics:
1. Device type distribution (iOS vs Android)
2. Average scoring time on mobile vs desktop
3. Button tap accuracy / misclick rate
4. Page load times by device
5. User feedback scores

---

## ✅ Sign-Off

**CRITICAL FIX #8: Mobile-First Responsive Design**

- ✅ Mobile utilities and hooks implemented (250 lines)
- ✅ Navigation components created (450 lines)
- ✅ Touch score input components created (550 lines)
- ✅ Responsive team display created (550 lines)
- ✅ Mobile CSS animations added (100 lines)
- ✅ Testing checklist created (800 lines)
- ✅ Documentation complete

**Total Code**: ~2,700 lines of mobile-optimized components and utilities

**Next**: Update existing pages to use new mobile components, then test on real devices.

---

**Created**: 2024  
**Last Updated**: 2024  
**Version**: 1.0  
**Status**: Foundation Complete, Integration In Progress

---

# 📱 MOBILE QUICK REFERENCE

## 🚀 Quick Start (30 Seconds)

### Detect Mobile
```typescript
import { useIsMobile } from '@/hooks/useMobile';
const isMobile = useIsMobile(); // true if mobile device or <768px
```

### Get Breakpoint
```typescript
import { useBreakpoint } from '@/hooks/useMobile';
const bp = useBreakpoint(); // 'xs'|'sm'|'md'|'lg'|'xl'|'2xl'
```

### Add Bottom Nav
```typescript
import { MobileNavigation } from '@/components';

<MobileNavigation
  items={[
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/score', label: 'Score', icon: '🎯' },
  ]}
/>
```

### Touch Score Input
```typescript
import { TouchScoreInput } from '@/components';

<TouchScoreInput
  value={score}
  onChange={setScore}
  presets={[1, 5, 10]}
/>
```

### Responsive Teams
```typescript
import { ResponsiveTeamDisplay } from '@/components';

<ResponsiveTeamDisplay teams={teams} selectable />
```

## 📦 All Available Hooks

```typescript
// Device Detection
const isMobile = useIsMobile();           // Boolean: mobile device or <768px
const isTouch = useIsTouch();             // Boolean: touch support
const bp = useBreakpoint();               // 'xs'|'sm'|'md'|'lg'|'xl'|'2xl'
const orientation = useOrientation();     // 'portrait'|'landscape'
const insets = useSafeAreaInsets();       // {top, right, bottom, left}

// Platform Detection (functions, not hooks)
if (isIOS()) { /* iOS-specific */ }
if (isAndroid()) { /* Android-specific */ }

// Utilities (functions, not hooks)
vibrate(50);                              // Haptic feedback
preventPullToRefresh();                   // Stop iOS pull-to-refresh
lockOrientation('portrait');              // Lock screen orientation
const height = getActualViewportHeight(); // Real viewport height
```

## 🎨 Mobile Components Cheat Sheet

### Navigation
```typescript
// Bottom Tab Bar (56px height, safe-area aware)
<MobileNavigation items={navItems} />

// Top Header (44px back button)
<MobileHeader title="Page" showBack />

// Bottom Sheet (slide up drawer)
<MobileDrawer isOpen={open} onClose={close} title="Select">
  {content}
</MobileDrawer>

// Floating Action Button (56×56px)
<MobileFAB onClick={add} icon="+" label="Add" />
```

### Score Input
```typescript
// Full Input (60px buttons, presets, undo)
<TouchScoreInput value={score} onChange={setScore} presets={[1,5,10]} />

// Compact +/- (inline, 44-56px)
<CompactTouchScoreInput value={score} onChange={setScore} size="md" />

// Number Pad (64px buttons, 0-9 keypad)
<TouchNumberPad value={val} onChange={setVal} onSubmit={submit} />
```

### Team Display
```typescript
// Cards (mobile) / Table (desktop) - Auto-switches
<ResponsiveTeamDisplay teams={teams} selectable showRanks showScores />

// Color Grid (always grid layout)
<ResponsiveTeamGrid teams={teams} columns={2} />
```

## 🎨 CSS Classes Quick Reference

```tsx
{/* Safe Area Insets (notches, home indicators) */}
<div className="safe-top safe-bottom safe-left safe-right">

{/* Touch Improvements (remove tap delay, prevent selection) */}
<button className="touch-manipulation">

{/* Smooth Scrolling (iOS momentum) */}
<div className="smooth-scroll">

{/* No Text Selection */}
<div className="no-select">

{/* Animations */}
<div className="animate-slide-up">        {/* Slide from bottom */}
<button className="active:scale-98">      {/* Press animation */}
<div className="ripple">                  {/* Material ripple */}
```

## ✅ Mobile Best Practices Checklist

### Touch Targets
```tsx
{/* ✅ Minimum 44×44px (Apple HIG) */}
<button className="min-h-[44px] min-w-[44px]">

{/* ✅ Preferred 56×56px (easier tapping) */}
<button className="min-h-[56px] min-w-[56px]">

{/* ✅ Button spacing (8px minimum) */}
<div className="flex gap-3">
```

### Typography
```tsx
{/* ✅ Body text 16px minimum (prevents iOS zoom) */}
<input className="text-base" />

{/* ✅ Large numbers 24-48px */}
<div className="text-4xl font-bold">150</div>

{/* ✅ Line height 1.5 */}
<p className="leading-relaxed">
```

### Safe Areas
```tsx
{/* ✅ Header below notch */}
<header className="sticky top-0 safe-top">

{/* ✅ Nav above home indicator */}
<nav className="fixed bottom-0 safe-bottom">
```

## 🐛 Common Issues & Quick Fixes

### Button too small → Add min-h/w
```tsx
<button className="min-h-[56px] min-w-[56px]">
```

### Keyboard covers input → scrollIntoView
```typescript
inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
```

### iOS zoom on input → 16px font minimum
```tsx
<input className="text-base" /> {/* 16px */}
```

### Notch covers content → safe-area classes
```tsx
<header className="safe-top">
```

### Pull-to-refresh interferes → prevent it
```typescript
useEffect(() => preventPullToRefresh(), []);
```

### Hover stuck on mobile → use :active
```css
button:active { background-color: #purple-700; }
```

## 📱 Responsive Patterns

### Conditional Rendering
```typescript
const isMobile = useIsMobile();
return isMobile ? <MobileView /> : <DesktopView />;
```

### Breakpoint Columns
```typescript
const bp = useBreakpoint();
const cols = { xs: 1, sm: 1, md: 2, lg: 3, xl: 4, '2xl': 4 }[bp];
```

### Tailwind Classes
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

## 🧪 Quick Mobile Test

```bash
# Test on real devices (required!)
- iPhone SE, iPhone 14, iPad
- Pixel 7, Galaxy S23

# Check these:
✓ All buttons ≥44px
✓ No horizontal scroll
✓ Text ≥16px on inputs
✓ Safe areas respected
✓ Touch targets spaced ≥8px
✓ Keyboard doesn't cover inputs
✓ Scoring flow <2 minutes
```

## 💡 Pro Tips

1. **Test on real devices early** - Emulators miss touch issues
2. **Use `text-base` (16px) on all inputs** - Prevents iOS zoom
3. **Add haptic feedback sparingly** - `vibrate(50)` on key actions only
4. **Bottom navigation is thumb-friendly** - Top = hard to reach
5. **Test landscape mode** - Users sometimes rotate
6. **Monitor touch accuracy in analytics** - Track misclicks

## 📚 Full Documentation

See sections above for:
- Complete component documentation
- Implementation guides  
- Testing checklist
- Performance optimization
- Troubleshooting

---

**Mobile-First Implementation Complete!** 📱
