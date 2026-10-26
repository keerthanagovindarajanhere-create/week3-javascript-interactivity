# Technical Documentation: Week 3 JavaScript Interactivity

**Project:** Spectra '26, a landing page for a student tech symposium
**Task:** Integrating JavaScript for an interactive user experience
**Stack:** HTML5, CSS3, vanilla JavaScript (no libraries)

---

## 1. Objective

The goal was to take a static page and add behaviour that helps the person using it. I didn't want animation for its own sake. Before writing any code, I went through the static version as if I were a student wanting to attend, and wrote down every point where I got stuck or had to work too hard:

| Problem on the static page | Interactive feature I planned |
|---|---|
| Navigation took up the whole screen on mobile | Hamburger menu that opens and closes |
| No sense of where I was on a long page | Active nav link while scrolling |
| Nine events in one long list made it hard to find one | Category filters + live search |
| Event details either cluttered the cards or were missing | "Details" modal |
| The form accepted anything and gave no feedback | Real-time validation with clear error messages |
| FAQ answers were always visible, so the page felt long | Accordion |
| Bright page at night | Dark mode that remembers the choice |
| Nothing told you how soon the event was | Countdown timer |

This table became my plan, and each row maps to a section in `script.js`.

---

## 2. File structure and how the three files work together

```
index.html   → structure and content; elements have IDs/classes the JS hooks into
css/style.css → all visual states (.open, .active, .invalid, .in-view, [data-theme="dark"])
js/script.js  → listens for events and only adds/removes classes or attributes
```

The main rule I followed is that **JavaScript changes state and CSS decides how that state looks**. For example, the menu script only toggles an `.open` class. The slide animation lives in CSS. This kept the JS short, and I never had to set inline styles to move things around. The one exception is the accordion, which sets `max-height` because CSS can't animate to `height: auto`.

The script is loaded with `defer`, so it runs after the HTML is parsed and every element it looks for already exists.

---

## 3. Feature-by-feature implementation

### 3.1 Theme toggle
- All colours are CSS custom properties defined in `:root`. A second set is defined under `[data-theme="dark"]`.
- Clicking the button flips the `data-theme` attribute on `<html>`, and every colour updates at once.
- The choice is saved with `localStorage`. On the first visit, the page reads `prefers-color-scheme` so it matches the user's system.
- `localStorage` is wrapped in `try/catch` because it throws in some private-browsing modes.

### 3.2 Mobile menu
- The `setMenu(open)` function sets the `.open` class on both the menu and the button. It also updates `aria-expanded` and the button label so screen readers know the state.
- The three bars turn into an ✕ purely in CSS (`rotate` + `opacity`).
- The menu closes when a link is clicked, when the user taps outside the nav, or when the window is resized to desktop width.

### 3.3 Header shadow, active link, back-to-top
- A scroll listener (debounced) adds a shadow to the header after 10px and shows the back-to-top button after 600px.
- **Active link:** the common approach compares `scrollY` with each section's `offsetTop`, but that breaks for the last section when it is shorter than the screen, because it never reaches the top. I used an `IntersectionObserver` with `rootMargin: '-45% 0px -50% 0px'` instead. It treats a thin band in the middle of the screen as "current", and it doesn't run on every scroll event.

### 3.4 Typing effect
- A recursive `setTimeout` adds or removes one character at a time and pauses at the end of each word.
- It is skipped completely if the user has *reduced motion* turned on.

### 3.5 Countdown
- `setInterval` runs every second and computes days, hours, minutes and seconds from the difference between the event date and `Date.now()`.
- The event date includes the `+05:30` offset, so the countdown is correct in any timezone.
- Each box is only updated when its number actually changes, which also retriggers a small "tick" animation. When the event starts, the timer is cleared and replaced with a message.

### 3.6 Stat counters
- An `IntersectionObserver` starts the animation only when the numbers are visible, then calls `unobserve` so it runs once.
- `requestAnimationFrame` with an ease-out curve makes the count slow down near the end instead of stopping abruptly.

### 3.7 Dynamic event cards, filter and search
- Events are stored once in an `EVENTS` array. The cards **and** the form dropdown are both generated from it, so adding an event means editing one place.
- `renderEvents()` filters by the active category and the search text (title, description or level), builds one HTML string and writes it to the DOM **once**. Writing each card separately would cause more reflows.
- The search input is debounced (200ms) so filtering doesn't run on every keystroke.
- All text is passed through `escapeHTML()` before going into `innerHTML`. That avoids injection if the data ever comes from a server.
- Cards with 10 or fewer seats left are highlighted in red, and a result counter ("Showing 3 of 9") is announced through `aria-live`.

### 3.8 Event delegation for "Details"
Because the cards are re-created every time the filter changes, attaching a listener to each button would mean re-attaching them after every render. Instead there is **one** click listener on the grid, which uses `e.target.closest('.details-btn')` to find which button was clicked.

### 3.9 Modal
- The modal fills in its content with `textContent`, then removes `hidden` and locks page scroll.
- It closes with the ✕ button, by clicking the dark overlay, or with **Esc**.
- **Focus management:** focus moves into the modal when it opens, Tab/Shift+Tab are kept inside it, and focus returns to the button that opened it on close. Keyboard users don't lose their place.
- "Register for this event" closes the modal, pre-selects that event in the form, and scrolls to the form.

### 3.10 Form validation
- The browser's default validation is turned off (`novalidate`) so all messages look consistent.
- Validation rules live in one `rules` object. Each rule returns an error string, or `''` if the value is valid:
  - Name: letters, spaces, `.`, `'`, `-`, 2–50 characters
  - Email: basic `something@domain.tld` pattern
  - Phone: 10 digits starting with 6–9 (Indian mobile numbers)
  - College: at least 3 characters
  - Event: must be selected
  - Code of conduct: must be checked
- **Timing:** a field is checked when the user leaves it (`blur`). Once it has an error, it is re-checked on every keystroke so the error disappears as soon as it's fixed. Showing errors while someone is still typing their first letter felt unfriendly.
- The phone field strips non-digits as you type and caps the input at 10 digits.
- On submit, every field is validated, the first invalid one gets focus, and a toast explains what happened. If everything is valid, the button shows "Submitting…" for a moment (there's no backend for this task, so this is simulated), and then the form resets and a success toast appears.

### 3.11 FAQ accordion
- Only one item is open at a time.
- The panel's `max-height` is set to its `scrollHeight`, so the animation matches the real content height instead of a guessed fixed value.

### 3.12 Scroll reveal and toast
- Elements with `.reveal` fade and slide in the first time they enter the viewport (`IntersectionObserver` + `unobserve`).
- `showToast(text, type)` is one reusable function for success and error messages. It clears the previous timer, so quick repeated messages don't hide each other early.

---

## 4. Key choices and why

| Choice | Reason |
|---|---|
| Vanilla JS, no jQuery | The task asked for plain JS, and modern DOM APIs (`querySelector`, `classList`, `closest`) make jQuery unnecessary. |
| `IntersectionObserver` instead of scroll math | More accurate, less code, and the browser handles performance. |
| Data array + render function | One source of truth for the cards and the dropdown. |
| Event delegation | Works for elements created after page load. Uses one listener instead of nine. |
| CSS classes for state | Keeps styling in CSS and logic in JS. Easier to debug. |
| Debounce on scroll/search/resize | Avoids running work dozens of times a second. |
| Accessibility (ARIA states, focus trap, skip link, reduced motion) | The page should work for keyboard and screen-reader users too. |

---

## 5. Challenges and debugging

1. **Highlighting the right nav link near the bottom of the page.**
   A position-based check can't mark the FAQ section as active, because that section is shorter than the screen and never reaches the top. Watching a band in the middle of the viewport with `IntersectionObserver` avoids this.

2. **Buttons inside re-rendered content.**
   The grid is rebuilt on every filter or search, so listeners attached to individual buttons at page load would be lost after the first filter. Event delegation on the parent grid avoids this entirely.

3. **Pasted phone numbers were cut off.**
   I had `maxlength="10"` on the input. When someone pasted "98765 43210", the browser cut it to 10 characters *including the space* before my code removed the space, so only 9 digits remained. I removed `maxlength` and did the trimming in JS (`replace(/\D/g, '').slice(0, 10)`).

4. **Toast was faintly visible when hidden.**
   It was only pushed down with `transform`, and on some screen heights its top edge still showed. I added `opacity: 0` and `visibility: hidden` to the hidden state.

5. **Accordion animation snapped instead of sliding.**
   CSS can't transition to `height: auto`. Reading `scrollHeight` and setting it as `max-height` in JS solved this.

6. **Keeping the countdown smooth.**
   Rewriting all four numbers every second would retrigger the tick animation on boxes that hadn't changed. Updating a box only when its value changes keeps the animation meaningful.

---

## 6. Testing

I tested in Chrome at desktop (1280px) and mobile (390px) widths:

- All 9 cards render; each filter tab shows the right count (e.g. Talks → 3); searching "git" → 1 result.
- The modal opens, closes with Esc/overlay/✕, and keeps focus inside.
- "Register for this event" pre-selects the right event in the form.
- Submitting an empty form shows 5 inline errors and an error toast; a valid form shows the success toast and resets.
- The theme persists after a page reload.
- The mobile menu opens and closes, and there is no horizontal scroll at 390px.
- No JavaScript errors in the console.

---

## 7. What I'd improve next

- Connect the form to a real backend or a service like Formspree.
- Load events from a JSON file with `fetch()` instead of a hard-coded array.
- Add a "Saved events" list that persists in `localStorage`.
