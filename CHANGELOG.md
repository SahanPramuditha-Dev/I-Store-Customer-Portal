# Changelog

All notable changes to the **iStore Customer Portal** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-08-17

### Added
- Multi-store brand profile loading and dynamic branch query parameter support (`?store=...`).
- Real-time repair ticket milestone timeline (Received → Diagnosing → Pending Parts → Completed → Delivered).
- Digital tax invoice verification and instant client-side PDF receipt generation (`html2pdf.js`).
- QR code generator for easy invoice sharing and mobile scanning.
- Customer phone number verification and multi-format lookup support.
- GitHub Actions CI workflow for automated TypeScript build verification.

### Changed
- Refactored `.gitignore` to prevent secret leakage and clean build artifacts.
- Modernized `README.md` with complete architecture maps, feature breakdown, and Vercel deployment guide.
