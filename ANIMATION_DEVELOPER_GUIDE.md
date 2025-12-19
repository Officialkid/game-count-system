# R3.1 Animation System — Developer Reference Guide

## Quick Start

### Using Animation Classes

All animations are available as Tailwind classes or inline styles:

```tsx
// Fade animations
<div className="animate-fade-in">Content</div>  // 400ms ease-out
<div className="animate-fade-out">Content</div> // 300ms ease-in

// Scale animations
<div className="animate-scale-in">Content</div>  // 400ms ease-out
<div className="animate-scale-out">Content</div> // 300ms ease-in

// Slide animations
<div className="animate-slide-up">Content</div>    // 500ms ease-out
<div className="animate-slide-down">Content</div>  // 400ms ease-in
<div className="animate-slide-left">Content</div>  // 500ms ease-out
<div className="animate-slide-right">Content</div> // 400ms ease-in
```

### GPU Acceleration

Always apply to animating elements:

```tsx
<div className="gpu-accelerated will-animate">
  Your content
</div>
```

**What it does:**
- `gpu-accelerated`: Applies `transform-gpu` and `perspective: 1000px` for hardware acceleration
- `will-animate`: Applies `will-change-transform` and `will-change-opacity` for layer pre-allocation

### Staggered Animations

For multiple items, use the stagger system (up to 10 items):

```tsx
{items.map((item, idx) => (
  <div
    key={item.id}
    data-stagger-index={idx}
    className="stagger-item"
  >
    {item.content}
  </div>
))}
```

**Stagger increments:** 75ms per item (0ms, 75ms, 150ms, 225ms, etc.)
**Max stagger:** 675ms (9 items)

---

## Animation Principles

### ✅ DO

- Use `transform` and `opacity` for all animations
- Specify explicit durations (300-600ms for entry, decorative can be longer)
- Use `ease-out` for entry, `ease-in` for exit
- Apply `gpu-accelerated` and `will-animate` classes
- Use component-scoped `<style jsx>` for custom animations
- Cap stagger animations to prevent O(n) overhead
- Test on low-end devices (6x CPU throttle in DevTools)

### ❌ DON'T

- Animate `width`, `height`, `padding`, `margin` (layout shifts)
- Use `height: 0 → auto` transitions (layout thrashing)
- Use `display: none ↔ block` (creates reflow)
- Specify arbitrary animation times (stick to 300-600ms range)
- Use implicit easing (always specify `ease-out`, `ease-in`, etc.)
- Apply animations without GPU acceleration hints
- Create animations with unbounded stagger (O(n) time)

---

## Component Pattern

### Basic Pattern (No Custom Animations)

```tsx
export function MySlide({ onAnimationComplete }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => onAnimationComplete?.(), 500);
    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="w-full h-full flex items-center justify-center gpu-accelerated">
      <div
        className={`text-center will-animate transform transition-all duration-500 ease-out ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
      >
        Your content
      </div>
    </div>
  );
}
```

### Advanced Pattern (Custom Animations)

```tsx
export function ComplexSlide({ onAnimationComplete }) {
  const [phase, setPhase] = useState('enter');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('animate'), 200);
    const timer2 = setTimeout(() => onAnimationComplete?.(), 1000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onAnimationComplete]);

  return (
    <div className="w-full h-full flex items-center justify-center gpu-accelerated">
      <div
        className="will-animate"
        style={{
          animation: phase === 'enter'
            ? 'customEnter 500ms ease-out forwards'
            : 'customAnimate 500ms ease-in-out infinite',
        }}
      >
        Your content
      </div>

      <style jsx>{`
        @keyframes customEnter {
          from {
            opacity: 0;
            transform: scale(0.9) rotateZ(-45deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotateZ(0deg);
          }
        }

        @keyframes customAnimate {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}
```

---

## Common Animation Tasks

### Progress Bar

❌ **Wrong:**
```tsx
<div style={{ width: `${progress}%` }} />
// Layout shift on every update!
```

✅ **Right:**
```tsx
<div
  className="will-animate"
  style={{
    width: `${progress}%`,
    transformOrigin: 'left',
    transition: 'width 100ms linear, transform 100ms linear',
  }}
/>
// GPU accelerated, no layout shift
```

### Bounce Animation

❌ **Wrong:**
```tsx
<div className="animate-bounce">🏆</div>
// Tailwind's animate-bounce is 1s, too long for low-end devices
```

✅ **Right:**
```tsx
<div
  style={{
    animation: 'customBounce 600ms ease-in-out infinite',
  }}
>
  🏆
</div>

<style jsx>{`
  @keyframes customBounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-12px);
    }
  }
`}</style>
```

### Staggered List Reveal

❌ **Wrong:**
```tsx
{items.map((item, idx) => (
  <div
    key={item.id}
    style={{
      animation: `fadeIn 400ms ease-out ${idx * 100}ms forwards`,
      // Each item delays by 100ms - will be slow!
    }}
  >
    {item.content}
  </div>
))}
```

✅ **Right:**
```tsx
{items.map((item, idx) => (
  <div
    key={item.id}
    className="will-animate"
    style={{
      animation: visibleItems.includes(item.id)
        ? 'fadeIn 400ms ease-out forwards'
        : 'hidden',
      animationDelay: `${Math.min(idx * 75, 675)}ms`,
    }}
  >
    {item.content}
  </div>
))}

<style jsx>{`
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`}</style>
```

---

## Performance Checklist

- [ ] Animation uses `transform` and `opacity` only
- [ ] `gpu-accelerated` class applied to container
- [ ] `will-animate` class applied to animated element
- [ ] Duration is 300-600ms (decorative: up to 1s OK)
- [ ] Easing is explicit (`ease-out`, `ease-in`, `cubic-bezier`)
- [ ] Custom keyframes use `<style jsx>`
- [ ] Stagger is capped (`Math.min(idx * increment, max)`)
- [ ] Tested on low-end device (Chrome DevTools 6x CPU throttle)
- [ ] No layout shift during animation (no width/height changes)
- [ ] Progress animates smoothly (60fps on low-end)

---

## Testing & Profiling

### Test on Low-End Device

1. Open Chrome DevTools → Performance tab
2. Click the ⚙️ settings icon (bottom right of DevTools)
3. Check "Settings" → "Rendering"
4. Set CPU throttling to "6x slowdown"
5. Play your animation
6. Check for stuttering or jank

### Profile Animation Performance

1. Open Chrome DevTools → Performance tab
2. Click "Record" button
3. Play animation (2-3 seconds)
4. Click "Stop" button
5. Review:
   - FPS meter (target: 60fps)
   - "Main" thread time
   - "Rendering" time
   - Look for long tasks (>50ms)

### Measure Frame Time

In your component:

```tsx
useEffect(() => {
  let lastTime = performance.now();
  let frameCount = 0;
  let totalTime = 0;

  const checkFrame = () => {
    const now = performance.now();
    const delta = now - lastTime;
    totalTime += delta;
    frameCount++;

    if (delta > 16.67) {  // 60fps = 16.67ms per frame
      console.warn(`Frame drop: ${delta.toFixed(2)}ms`);
    }

    lastTime = now;
  };

  const interval = setInterval(checkFrame, 0);
  
  const timer = setTimeout(() => {
    clearInterval(interval);
    console.log(`Average frame time: ${(totalTime / frameCount).toFixed(2)}ms`);
  }, 5000);

  return () => {
    clearInterval(interval);
    clearTimeout(timer);
  };
}, []);
```

---

## Troubleshooting

### Animation Jank on Low-End Devices

**Problem:** Animation stutters or drops frames

**Solution:**
1. Verify using `transform` and `opacity` only (not width/height)
2. Add `gpu-accelerated` and `will-animate` classes
3. Reduce duration to 300-400ms
4. Check for layout shifts in DevTools (pink highlights)
5. Use linear easing for progress bars (not cubic-bezier)

### Animation Delays Don't Trigger

**Problem:** Staggered animation doesn't animate some items

**Solution:**
```tsx
// Ensure items are tracked in state
const [visibleItems, setVisibleItems] = useState<string[]>([]);

// Use explicit condition in animation style
animation: visibleItems.includes(item.id) ? 'fadeIn 400ms ...' : 'hidden'
```

### Confetti/Emoji Animations Too Fast

**Problem:** Multiple bouncing elements look janky

**Solution:**
- Stagger each emoji with `animationDelay: `${i * 60}ms``
- Use `ease-in-out` for smoother motion
- Cap to 6-8 emojis (more = more overhead)

### Progress Bar Doesn't Animate Smoothly

**Problem:** Progress bar jumps or stutters

**Solution:**
```tsx
// Use linear easing, not cubic-bezier
transition: 'width 100ms linear'

// Use transform with proper origin
transformOrigin: 'left'
transform: `scaleX(${progress / 100})`

// Apply will-animate
className="will-animate"
```

---

## File Structure

```
game-count-system/
├── app/
│   ├── animations.css              ← Central animation definitions
│   ├── layout.tsx                  ← Imports animations.css
│   └── ...
└── components/
    ├── RecapSlideComponents.tsx    ← All 6 slides with optimized animations
    ├── RecapPlayerNew.tsx          ← Player with optimized progress bar
    ├── RecapIntroModal.tsx         ← Modal with scoped animations
    └── ...
```

---

## Best Practices Summary

1. **Always think GPU-first:** Transform + opacity only
2. **Be explicit:** Specify durations, easing, delays
3. **Respect users:** Implement prefers-reduced-motion
4. **Measure:** Profile on low-end devices regularly
5. **Scope animations:** Use `<style jsx>` for component isolation
6. **Cap stagger:** Prevent O(n) animation overhead
7. **Test thoroughly:** Chrome DevTools throttling + real devices
8. **Document:** Add comments explaining complex animations

---

**Version:** 1.0
**Last Updated:** 2025-12-20
**Status:** Production Ready ✅
