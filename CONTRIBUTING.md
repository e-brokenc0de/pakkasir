# Contributing to pakkasir

Thanks for your interest in contributing! This document describes the
expectations and workflow for contributing code or documentation to the
project.

By participating you agree to our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Getting started

1. **Fork** the repository and create a feature branch from `main`.
2. Install dependencies:
   ```sh
   pnpm install
   ```
3. Make your changes. Keep commits small, focused, and self-contained.
4. Run the full quality gate locally before pushing:
   ```sh
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```
5. Open a pull request against `main`. Fill out the PR template completely.

## Development workflow

```sh
pnpm install          # install deps
pnpm typecheck        # strict TypeScript check
pnpm lint             # ESLint
pnpm lint:fix         # ESLint + autofix
pnpm format           # Prettier (write)
pnpm format:check     # Prettier (check only)
pnpm test             # Vitest (single run)
pnpm test:watch       # Vitest in watch mode
pnpm test:coverage    # Vitest with coverage report
pnpm build            # emit dist/
pnpm example          # run examples/usage.ts
```

Pre-commit hooks (installed automatically by Husky when you run
`pnpm install`) will lint and format staged files and validate commit
messages.

## Commit message conventions

Commit messages follow the [Conventional Commits][cc] specification:

```
<type>(<scope>): <subject>
```

Allowed types include `feat`, `fix`, `docs`, `refactor`, `test`, `chore`,
`build`, `ci`, `perf`, `revert`, and `style`.

Examples:

```
feat(transactions): add idempotency-key header
fix(http): retry on ECONNRESET
docs(readme): clarify webhook verification
```

[cc]: https://www.conventionalcommits.org/

## Pull request checklist

- [ ] The change is covered by unit tests.
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass.
- [ ] Public API changes are reflected in `README.md` and `CHANGELOG.md`.
- [ ] JSDoc is present on new public exports.
- [ ] No new `any` usage has been introduced.
- [ ] Commit messages follow Conventional Commits.

## Coding guidelines

- **Strict types, no `any`.** The repo compiles with `strict: true`,
  `exactOptionalPropertyTypes`, and `noUncheckedIndexedAccess`. Prefer
  `unknown` + narrowing over `any`.
- **Small, composable modules.** Each domain module owns its types and
  never talks to the network directly — it delegates to `HttpTransport`.
- **Public APIs need JSDoc.** Every exported function/class/type should
  carry a TSDoc-style comment.
- **Tests live beside behavior.** Every new method gets unit tests in
  `tests/`.

## Reporting issues

Please file bugs and feature requests via the
[issue tracker](https://github.com/e-brokenc0de/pakkasir/issues) using the
appropriate template. For security issues, read
[SECURITY.md](./SECURITY.md) first.

## Releases

This project follows [Semantic Versioning 2.0](https://semver.org/) and uses
[semantic-release](https://github.com/semantic-release/semantic-release) to
**automate every release**. You do not bump the version by hand.

On every push to `main`, the release workflow inspects all commits since the
previous release and decides what to do based on the Conventional Commit
type:

| Commit type                       | Effect                            |
| --------------------------------- | --------------------------------- |
| `fix:`                            | Patch release (`0.1.0` → `0.1.1`) |
| `feat:`                           | Minor release (`0.1.0` → `0.2.0`) |
| `feat!:` / `BREAKING CHANGE:`     | Major release (`0.1.0` → `1.0.0`) |
| `chore:`, `docs:`, `refactor:`, … | No release                        |

The automation then:

1. Computes the next version.
2. Regenerates `CHANGELOG.md` from commit history.
3. Commits the bump (`chore(release): vX.Y.Z [skip ci]`) and tags `vX.Y.Z`.
4. Publishes to npm with provenance.
5. Creates a GitHub Release.

All you need to do as a contributor is follow the commit-message conventions.

## License

By contributing, you agree that your contributions will be licensed under
the [MIT License](./LICENSE) of this project.
