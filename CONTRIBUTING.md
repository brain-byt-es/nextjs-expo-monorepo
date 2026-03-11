# Contributing to Template Monorepo

Thanks for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites
- Node.js >= 20.0.0 (use [nvm](https://github.com/nvm-sh/nvm) or [asdf](https://asdf-vm.com/))
- pnpm >= 10.32.0

### Setup Development Environment

```bash
git clone https://github.com/brain-byt-es/template-monorepo.git
cd template-monorepo

# Install correct Node version (if using nvm/asdf)
nvm use  # or: asdf install

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Keep commits atomic and well-described
   - Follow the project's code style (enforced by EditorConfig)
   - Test your changes locally

3. **Lint and Type Check**
   ```bash
   pnpm lint
   pnpm typecheck
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - A new feature
   - `fix:` - A bug fix
   - `refactor:` - Code refactoring
   - `docs:` - Documentation changes
   - `chore:` - Build, dependencies, or tooling
   - `test:` - Adding or updating tests

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a PR on GitHub with a clear description

## Project Structure

```
Template Monorepo/
├── apps/
│   ├── web/          Next.js + shadcn/ui
│   └── mobile/       Expo + NativeWind UI
├── packages/
│   ├── shadcn-ui/    Web component library
│   ├── nativewindui/  Mobile component library
│   ├── typescript-config/
│   └── eslint-config/
```

## Areas for Contribution

### 📦 packages/shadcn-ui
- Add new shadcn/ui components
- Fix component bugs or styling issues
- Improve TypeScript types
- Write component documentation

### 📦 packages/nativewindui
- Add new NativeWindUI components
- Fix React Native component issues
- Improve NativeWind styling
- Add platform-specific variants (iOS/Android)

### 🚀 apps/web
- Build new features
- Fix bugs
- Improve performance
- Update dependencies

### 📱 apps/mobile
- Build new screens/features
- Fix Expo-related issues
- Improve mobile UX
- Add platform-specific code

### 🛠️ Shared Packages
- Enhance TypeScript configs
- Improve ESLint rules
- Add shared utilities
- Documentation improvements

## Code Style

The project uses:
- **EditorConfig** - Consistent formatting
- **Prettier** - Code formatting (via ESLint)
- **ESLint** - Code quality
- **TypeScript** - Type safety

All tooling is enforced automatically. Run:
```bash
pnpm lint    # Check and fix linting issues
pnpm format  # Format code (if available)
```

## Testing

While the project doesn't have a formal test suite yet, we encourage:
- Manual testing in both `pnpm --filter @repo/web dev` and `pnpm --filter @repo/mobile dev`
- Testing cross-platform compatibility for shared packages
- Documentation of any edge cases

## Pull Request Process

1. **Update README.md** if you're adding new features or changing API
2. **Test thoroughly**
   ```bash
   pnpm build
   pnpm typecheck
   pnpm lint
   ```
3. **Keep PRs focused** - One feature per PR is ideal
4. **Write clear PR descriptions** - Explain what, why, and how
5. **Be responsive** to code review feedback

## Release Process

Maintainers only. We follow semantic versioning:
- **MAJOR** - Breaking changes
- **MINOR** - New features
- **PATCH** - Bug fixes

## Questions or Need Help?

- **Issues** - Open an issue for bugs or feature requests
- **Discussions** - Use GitHub discussions for questions
- **Email** - Contact the maintainers directly

## Code of Conduct

- Be respectful and inclusive
- No harassment or discrimination
- Focus on the work, not the person
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Happy coding! 🚀
