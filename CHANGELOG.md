## [0.0.1-beta] - 2026-07-N/A - Cloud Integration, UI Polish & Fixes

### Known Bugs
- When printing 4x6 copies on the desktop versions, it only prints 1 page instead of N pages.
- When printing a 2×6 photo strip with bleed enabled (where the print option automatically places two strips on a single page), the bleed is currently applied to each individual strip. Instead, the bleed should be applied around the outer edges of the entire page layout, wrapping both strips as a single print composition.

### Changelogs
- Improved the UX/UI.
- Enhanced our photo strip editor and made significant improvements to its stability and functionality.
- Security is key! New user sign-ups now require email confirmation to verify identity before logging in.
- We've added strict password requirements (uppercase, lowercase, number, and special character) to keep accounts secure.
- Added custom HTML email templates for all auth emails (Welcome, Reset Password, Magic Links, and Verification Codes) powered by Resend.
- We've added one-click OAuth login! You can now securely sign up and log in using your Google account right from the authentication modal.
- Integrated Cloudflare Turnstile to provide privacy-first, frictionless bot protection during authentication instead of Google reCAPTCHA.
- Fixed an issue that prevented you from saving a customized version of catalog templates to your account.
- Overhauled save permissions to make saving custom templates completely smooth and error-free.
- When you delete a template, we now automatically clean up and remove its saved frame image from the cloud to keep storage tidy.
- Fixed the notification sound to play reliably whenever a toast message pops up on your screen.
- Cleaned up the browser's console logs to ensure your email addresses and account details stay strictly private.
- Fixed an issue where reloading the page or returning from Google login would show a 404 error page.
- Finally patched the issue where our developers thought they were allowed to sleep. Sleep is now officially deprecated in this beta.
- Fixed the double-mirroring bug on the webcam capture so that captured photos correctly match the mirror preview.
- Created a beautiful, reusable Dialog component with glassmorphism backdrop blur and smooth entrance animations.
- Replaced all synchronous, blocking browser `confirm` and `alert` prompts with the new custom Dialog component and toast system.
- Restored the dark/light mode toggle in the Booth Screen header.
- Added more layout theme options (including Graduation, Movie, Anniversary, Retro, etc.) in the Editor and synced them with the Gemini AI metadata generation.
- Implemented a seamless infinite scroll loop on the landing page carousel for a smoother continuous viewing experience.
- Refined the Contributors Sandbox with a fully responsive flat aesthetic and seamless light/dark mode theming.
- Added CMYK (Print) color mode support for both downloads and printing across Web and Electron apps.
- Web version now features a simulated CMYK gamut conversion for accurate print preview colors using canvas pixel manipulation.
- Web printing layout has been completely overhauled to match Electron's borderless template (zero margins, image stretches to fill the selected paper size).
- Added a new "Printer Settings" section to the User Profile (Electron only) with silent printing capabilities and a dedicated printer selection dropdown.
- Fixed a critical Electron crash related to Cloudflare Turnstile verification.
- Completely overhauled Electron's backend security by enforcing strict sandbox policies and dropping previous insecure renderer workarounds.
- Introduced a built-in local HTTP server proxy in Electron to seamlessly handle custom local frames with complete offline capabilities.


## [0.0.1-alpha] - 2026-07-15 - Initial Project Release

### Changelogs
- We launched a brand new home page! It features a cool dark theme and two columns of photos that scroll endlessly up and down. As you scroll down the page, different sections smoothly slide into view.
- We built a full photo strip creator. You can open a design studio right in your browser, pick colors, adjust sizes, and see exactly what your photo strip will look like before you save it.
- You can now browse a huge, full-screen catalog of photo strip templates to find inspiration or a starting point for your own designs.
- We added a secure account system. You can sign up, log in, and even use your GitHub account to get in quickly. If you forget your password, the system will automatically email you a link to reset it.
- Every user gets their own personal profile page. It looks great in the dark theme and lets you easily keep track of all the templates you have created.
- Behind the scenes, we completely changed how the app stores information. Instead of running our own custom server, we now securely save all your designs and account information using a fast, reliable cloud database. This makes the app much faster and less likely to break.
- We created a hidden dashboard for ourselves so we can monitor the app. It lets us see how many people are visiting and makes sure everything is running smoothly without any errors.
- Removed herobrine from appearing on the screen.