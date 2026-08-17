# Contributing to iStore Customer Portal

Thank you for your interest in contributing to the **iStore Customer Portal**!

---

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SahanPramuditha-Dev/I-Store-Customer-Portal.git
   cd I-Store-Customer-Portal
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```
   Add your Supabase URL and anonymous public API key.

3. **Install Dependencies & Start Dev Server:**
   ```bash
   npm install
   npm run dev
   ```

4. **Verify TypeScript & Production Build:**
   ```bash
   npm run build
   ```

---

## Pull Request Guidelines

- Branch naming: `feat/feature-name` or `fix/bug-fix-name`.
- Ensure TypeScript compiles cleanly (`tsc -b && vite build`).
- Verify responsive layout on mobile, tablet, and desktop viewports.
- Submit PRs against the `main` branch with clear description and screenshots.
