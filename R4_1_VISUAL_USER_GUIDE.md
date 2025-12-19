# R4.1 — SHARE CARD GENERATION
## Visual User Guide & Feature Walkthrough

---

## User Journey

### Step 1: Recap Slideshow Playing
```
┌─────────────────────────────────────────────────────┐
│ Slide 5 of 6                           [Share] [X]  │  ← Share button here!
│                                                     │
│  🏆 CHAMPION 🏆 WINS!                              │
│  89 Points • 12 Games                              │
│  Golden Trophy Animation                           │
│                                                     │
│  [‹ Previous]                   [Next ›]           │
│  |████████░░░░░░░| 75% ────────────                │
│  [Pause]                    Slide: Winner          │
│                                                     │
│  Keyboard: Arrow Keys • Space to Pause • Esc Exit  │
└─────────────────────────────────────────────────────┘
```

### Step 2: Share Button Clicked
```
User clicks [Share] button in top-right
         ↓
Share Modal Opens (centered on screen)
```

### Step 3: Share Modal - Preview Tab (Default)
```
╔════════════════════════════════════════════════════════════╗
║ Share Your Recap                                      [X]  ║
╠════════════════════════════════════════════════════════════╣
║ 📸 Preview Tab          │ 🔗 Share Tab                    ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Preview of Share Card:                                   ║
║  ┌──────────────────────────────────────────────┐         ║
║  │ GameScore 🎮                                 │         ║
║  │                    🏆                        │         ║
║  │           Summer Tournament                  │         ║
║  │          TEAM ALPHA WINS!                    │         ║
║  │     ┌─────────────────────────┐              │         ║
║  │     │  89 POINTS   12 GAMES   │              │         ║
║  │     └─────────────────────────┘              │         ║
║  │    Share your GameScore recap!               │         ║
║  └──────────────────────────────────────────────┘         ║
║                                                            ║
║  This is how your recap will appear in WhatsApp,         ║
║  Twitter, and Facebook previews.                         ║
║                                                            ║
║              [📥 Download as Image]                       ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                    [Done]                  ║
╚════════════════════════════════════════════════════════════╝
```

### Step 4a: Download Image Flow
```
User clicks [📥 Download as Image]
         ↓
Canvas renders share card to PNG
         ↓
Browser save dialog appears
         ↓
File saved: "gamescore-recap-team-alpha.png"
         ↓
User can share/upload anywhere!
```

### Step 4b: Share Link Flow
```
User clicks "🔗 Share Tab"
         ↓
Share Modal shows:

╔════════════════════════════════════════════════════════════╗
║ Share Your Recap                                      [X]  ║
╠════════════════════════════════════════════════════════════╣
║ 📸 Preview Tab          │ 🔗 Share Tab                    ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  📋 Share Link                                            ║
║  ┌──────────────────────────────────────────────────────┐ ║
║  │ https://gamescore.app/recap/team-alpha         [Copy]│ ║
║  └──────────────────────────────────────────────────────┘ ║
║                                  ↑                         ║
║                           (Copy feedback)                  ║
║                                                            ║
║  🚀 Share to Social Media                                 ║
║  ┌──────────────────────────────────────────────────────┐ ║
║  │  [💬 WhatsApp]  [𝕏 Twitter]  [f Facebook]           │ ║
║  └──────────────────────────────────────────────────────┘ ║
║                                                            ║
║  📊 Share Stats                                           ║
║  ┌──────────────────────────────────────────────────────┐ ║
║  │ Winner: TEAM ALPHA          Points: 89              │ ║
║  │ Games: 12                   Event: Summer Tour       │ ║
║  └──────────────────────────────────────────────────────┘ ║
║                                                            ║
║  💡 Pro Tips                                              ║
║  ✓ WhatsApp shows full recap card in previews            ║
║  ✓ Twitter displays image prominently in feeds           ║
║  ✓ Download the image and share it anywhere             ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                    [Done]                  ║
╚════════════════════════════════════════════════════════════╝
```

### Step 5a: Copy Link Flow
```
User clicks [Copy] button
         ↓
URL copied to clipboard
         ↓
Button shows "✓ Copied!" for 2 seconds
         ↓
User can paste link anywhere:
- Email
- Chat apps
- Social media
- Documents
```

### Step 5b: WhatsApp Share Flow
```
User clicks [💬 WhatsApp] button
         ↓
WhatsApp opens (web or app) with pre-filled message:
"🏆 TEAM ALPHA Wins! 🎮 Just scored 89 points 
 across 12 games on @GameScore!
 
 https://gamescore.app/recap/team-alpha"
         ↓
User selects contact/group
         ↓
Message sent with link preview showing share card!
```

### Step 5c: Twitter Share Flow
```
User clicks [𝕏 Twitter] button
         ↓
Twitter opens with pre-filled tweet:
"🏆 TEAM ALPHA WINS! 🎮 Just scored 89 points 
 across 12 games on @GameScore! 
 https://gamescore.app/recap/team-alpha"
         ↓
Tweet composer shows link preview
(1200x675px card image displays)
         ↓
User clicks "Post"
         ↓
Card appears in feed with image!
```

### Step 5d: Facebook Share Flow
```
User clicks [f Facebook] button
         ↓
Facebook share dialog opens
         ↓
OG image displays in preview (1200x630px)
         ↓
User can:
- Share to timeline
- Share to groups
- Send via messenger
         ↓
Card appears with full preview!
```

### Step 6: Modal Closes
```
User clicks [Done] button or outside modal
         ↓
Modal closes smoothly
         ↓
User back in recap player
```

---

## Share Card Design Reference

### Full Card (1200×630px)
```
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║  GameScore 🎮 (28px, font-weight 600)        [Top-Left Branding]     ║
║                                                                        ║
║                                                                        ║
║                              🏆                                        ║
║                         (120px emoji)                                  ║
║                                                                        ║
║                      Summer Tournament                                 ║
║                    (18px, opacity 0.85)                                ║
║                                                                        ║
║                   TEAM ALPHA WINS!                                    ║
║                  (56px, font-weight 800)                               ║
║                                                                        ║
║             ╔─────────────────────────────╗                           ║
║             │  89 POINTS    12 GAMES     │                           ║
║             │ (Glass-morphism box)        │                           ║
║             ╚─────────────────────────────╝                           ║
║                  (backdrop blur)                                       ║
║                                                                        ║
║              Share your GameScore recap!                              ║
║            (14px, opacity 0.8)                                         ║
║                                                                        ║
║  Background: Gradient purple → pink                                  ║
║  Pattern: Radial circles overlay                                      ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
```

### Color Palette
```
Background Gradient:
┌─────────────────────────┐
│ #667eea (Purple)        │  Top-left
│        ╱╱╱╱╱╱           │
│       ╱╱╱╱╱╱╱           │
│      ╱╱╱╱╱╱╱╱           │
│     ╱╱╱╱╱╱╱╱╱           │
│    ╱╱╱╱╱╱╱╱╱╱           │
│   ╱╱╱╱╱╱╱╱╱╱╱           │
│  ╱╱╱╱╱╱╱╱╱╱╱╱           │
│ #764ba2 (Pink)          │  Bottom-right
└─────────────────────────┘

Text Colors:
- Main Text: #FFFFFF (white)
- Secondary: rgba(255, 255, 255, 0.8)
- Tertiary: rgba(255, 255, 255, 0.6)

Stats Box:
- Background: rgba(255, 255, 255, 0.15)
- Border: rgba(255, 255, 255, 0.3) [2px]
- Backdrop: blur(10px)
```

---

## Platform-Specific Previews

### WhatsApp Link Preview
```
┌──────────────────────────┐
│ 🏆 TEAM ALPHA WINS!      │
│                          │
│ [1200x630 Card Image     │
│  (auto-cropped to 1:1)]  │
│                          │
│ gamescore.app/recap/...  │
│                          │
│ 🏆 TEAM ALPHA Wins!...  │
│ Just scored 89 points... │
└──────────────────────────┘
```

### Twitter Card Preview
```
┌──────────────────────────────────────┐
│ 1200x675px Card Image                │
│ (16:9, fills full width)             │
│                                      │
│ 🏆 TEAM ALPHA WINS!                 │
│ Just scored 89 points across 12... │
│                                      │
│ gamescore.app/recap/team-alpha      │
└──────────────────────────────────────┘
```

### Facebook Preview
```
┌──────────────────────────┐
│ [1200x630 Card Image]    │
│ TEAM ALPHA WINS!         │
│ Just scored 89 points... │
│ gamescore.app/recap/...  │
└──────────────────────────┘
```

---

## Feature Comparison

### Download Image
```
✓ Works offline
✓ Portable file
✓ Can email/upload anywhere
✓ Print-friendly
✗ Requires manual sharing
```

### Copy Link
```
✓ Instant sharing anywhere
✓ Works in emails/chats/posts
✓ Social media previews
✓ Small file size (URL only)
✗ Requires internet access
```

### WhatsApp Share
```
✓ Pre-filled message
✓ Link preview shows card
✓ Direct to recipients
✓ One-click sharing
✗ Requires WhatsApp installed
```

### Twitter Share
```
✓ Pre-filled tweet
✓ Card image in timeline
✓ Hashtag friendly
✓ Viral potential
✗ Requires Twitter account
```

### Facebook Share
```
✓ Large audience reach
✓ OG preview
✓ Group sharing
✓ Analytics tracking
✗ Requires Facebook account
```

---

## Accessibility Features

### Keyboard Navigation
```
[Share Button] → Modal Opens
    ↓
Tab through controls:
  - Preview tab
  - Share tab (if visible)
  - Download button
  - Copy button
  - Social media buttons
  - Done button
    ↓
Enter/Space → Activate button
    ↓
Escape → Close modal
```

### Screen Reader
```
Modal announced:
"Share Your Recap dialog"

Each section announced:
"📸 Preview tab, selected"
"Live preview of share card"
"Download as Image button"

"🔗 Share tab"
"Share link text box, https://..."
"Copy button"
"WhatsApp share button"
... etc

Focus indicators visible
All interactive elements labeled
```

### High Contrast
```
Text: White (#FFFFFF) on gradient background
Buttons: Clear hover states
Links: Underlined and color-coded
Icons: Both icon + text labels
```

---

## Mobile Experience

### Portrait Mode (320px+)
```
╔═══════════════════════════╗
║ Share Your Recap      [X] ║
╠═══════════════════════════╣
║ 📸 Preview │ 🔗 Share    ║
╠═══════════════════════════╣
║                           ║
║ [Share card preview]      ║
║ (scaled 50%, scrollable)  ║
║                           ║
║ [Download Button]         ║
║                           ║
╠═══════════════════════════╣
║           [Done]          ║
╚═══════════════════════════╝
```

### Landscape Mode (640px+)
```
╔────────────────────────────────────────╗
║ Share Your Recap               [X]     ║
╠────────────────────────────────────────╣
║ 📸 Preview │ 🔗 Share                 ║
╠────────────────────────────────────────╣
║                                        ║
║ [Card Preview]     [Action Buttons]   ║
║ (50% scale)        [Download]         ║
║                    [Copy]             ║
║                    [Share Options]    ║
║                    [Done]             ║
║                                        ║
╚────────────────────────════════════════╝
```

---

## Error Scenarios Handled

### Image Download Fails
```
"Failed to download image. Please try again."
↓
User can:
- Try download again
- Copy link instead
- Share via social media
```

### Clipboard Not Available
```
Fallback method used:
- textarea.select() + document.execCommand('copy')
- Works on IE11 and older browsers
- User gets same feedback
```

### Canvas Rendering Error
```
Fallback to DOM rendering
↓
Visual feedback still works
↓
User can copy link or share socially
```

---

## Success Indicators

### User Successfully Shares
```
✅ Image Downloaded
   - File appears in Downloads folder
   - Can attach to email/upload to web

✅ Link Copied
   - Clipboard contains URL
   - Can paste anywhere

✅ WhatsApp Shared
   - Link opens WhatsApp
   - Pre-filled with message

✅ Twitter Shared
   - Link opens Twitter
   - Pre-filled with tweet

✅ Facebook Shared
   - Link opens Facebook
   - Dialog shows preview
```

---

## Key Statistics for Users

### What Gets Shared
- Winner name: "TEAM ALPHA"
- Points: "89"
- Games: "12"
- Event: "Summer Tournament"
- Brand: "GameScore"

### Card Dimensions
- Social Media: 1200×630px (optimal)
- File Size: ~80KB (PNG)
- Download Time: <1 second (typical)

### Supported Platforms
- WhatsApp ✅
- Twitter ✅
- Facebook ✅
- Email ✅
- SMS ✅
- Chat Apps ✅
- Forums ✅
- Blogs ✅

---

**Visual Guide Complete!**  
**Ready for User Testing!**

