# Security Policy

## Supported Versions

Only the latest minor release line receives security updates until v1.0.0.
Once a 1.x release is cut, the previous minor will receive critical security
fixes for 3 months after the next minor is released.

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark: |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

If you believe you have found a security vulnerability in pakkasir, please
report it privately via one of the following channels:

- GitHub's [private vulnerability reporting][gh-report] on this repository
  (preferred).
- Email: **security@pakkasir.dev** (PGP key available on request).

Please include:

- A clear description of the issue and its impact.
- Steps to reproduce (a minimal proof-of-concept if possible).
- Affected versions.
- Any suggested mitigations.

You can expect:

- **Within 72 hours:** acknowledgement of receipt.
- **Within 7 days:** an initial assessment and a rough timeline for a fix.
- **Within 30 days:** a coordinated disclosure plan if the issue is
  confirmed.

## Secret management

- **Never commit `PAKASIR_API_KEY`, webhook secrets, or any credential**
  into source control. The SDK reads credentials from environment variables
  (`PAKASIR_API_KEY`, `PAKASIR_PROJECT`); use your platform's secret-store
  of choice in production.
- `.env*` files are ignored by `.gitignore` in this repository. Always
  double-check your `git diff` before committing.
- CI runs via GitHub Actions using repository secrets; no credentials are
  embedded in workflow files.

## Dependency security

- `pnpm audit` runs on every push and pull request as part of CI.
- Dependabot is configured to open weekly PRs for npm and GitHub Actions
  dependency updates — see [`.github/dependabot.yml`](./.github/dependabot.yml).
- The SDK has **zero runtime dependencies**, which keeps the attack surface
  for consumers minimal.

[gh-report]: https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability
