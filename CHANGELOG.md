## [0.0.1-beta] - 2026-07-N/A - Cloud Integration, UI Polish & Fixes

- Improved the UX/UI.
- Enhanced our photo strip editor and made significant improvements to its stability and functionality.
- Security is key! New user sign-ups now require email confirmation to verify identity before logging in.
- We've added strict password requirements (uppercase, lowercase, number, and special character) to keep accounts secure.
- Added custom HTML email templates for all auth emails (Welcome, Reset Password, Magic Links, and Verification Codes) powered by Resend.
- We've added one-click OAuth login! You can now securely sign up and log in using your Google account right from the authentication modal.
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

## [0.0.1-alpha] - 2026-07-15 - Initial Project Release

- We launched a brand new home page! It features a cool dark theme and two columns of photos that scroll endlessly up and down. As you scroll down the page, different sections smoothly slide into view.
- We built a full photo strip creator. You can open a design studio right in your browser, pick colors, adjust sizes, and see exactly what your photo strip will look like before you save it.
- You can now browse a huge, full-screen catalog of photo strip templates to find inspiration or a starting point for your own designs.
- We added a secure account system. You can sign up, log in, and even use your GitHub account to get in quickly. If you forget your password, the system will automatically email you a link to reset it.
- Every user gets their own personal profile page. It looks great in the dark theme and lets you easily keep track of all the templates you have created.
- Behind the scenes, we completely changed how the app stores information. Instead of running our own custom server, we now securely save all your designs and account information using a fast, reliable cloud database. This makes the app much faster and less likely to break.
- We created a hidden dashboard for ourselves so we can monitor the app. It lets us see how many people are visiting and makes sure everything is running smoothly without any errors.
- Removed herobrine from appearing on the screen.