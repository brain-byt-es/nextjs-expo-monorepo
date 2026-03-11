# Template Monorepo

> 🚀 A production-ready monorepo template with **Next.js + shadcn/ui** for web and **Expo + NativeWind UI** for mobile. Built with pnpm & Turborepo.

[![GitHub](https://img.shields.io/badge/GitHub-brain--byt--es%2Ftemplate--monorepo-blue?logo=github)](https://github.com/brain-byt-es/template-monorepo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node 20+](https://img.shields.io/badge/Node-20%2B-green)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.32%2B-blue)](https://pnpm.io/)

## ✨ Features

- 🏗️ **Modern Monorepo Setup** - pnpm workspaces + Turborepo for fast builds
- 🌐 **Full-Stack Web** - Next.js 16 with React 19 & Tailwind CSS v4
- 📱 **Cross-Platform Mobile** - Expo 54 with Expo Router & React Native 0.81
- 🎨 **Unified Design System** - shadcn/ui for web, NativeWind UI for mobile
- 📦 **Shared Packages** - Reusable components & configuration
- ⚡ **High Performance** - Optimized builds with Turborepo caching
- 🔒 **Type Safe** - Full TypeScript setup with shared configs
- 📝 **Production Ready** - Best practices, CI/CD ready, comprehensive docs

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.0.0 ([nvm](https://github.com/nvm-sh/nvm) / [asdf](https://asdf-vm.com/))
- **pnpm** >= 10.32.0 (auto via Corepack)

### Installation

```bash
# Clone the repository
git clone https://github.com/brain-byt-es/template-monorepo.git
cd template-monorepo

# Use correct Node version (nvm / asdf)
nvm use  # or: asdf install

# Install dependencies
pnpm install

# Start development (Turborepo TUI)
pnpm dev
```

**That's it!** 🎉 Both apps will start in parallel.

## 📦 What's Included

### Applications

| App | Tech Stack | Port |
|-----|-----------|------|
| **Web** | Next.js 16 + React 19 + Tailwind v4 + shadcn/ui | 3003 |
| **Mobile** | Expo 54 + React Native 0.81 + NativeWind v4 | 8081 |

### Shared Packages

| Package | Purpose |
|---------|---------|
| `@repo/shadcn-ui` | 52+ Web components (Radix UI) |
| `@repo/nativewindui` | Native components (React Native) |
| `@repo/typescript-config` | Shared TypeScript presets |
| `@repo/eslint-config` | Shared ESLint rules |

## 📁 Project Structure

```
Template Monorepo/
├── apps/
│   ├── web/                    Next.js app with shadcn/ui
│   └── mobile/                 Expo app with NativeWind UI
├── packages/
│   ├── shadcn-ui/              Web component library
│   ├── nativewindui/           Mobile component library
│   ├── typescript-config/      Shared TS configs
│   └── eslint-config/          Shared ESLint configs
├── pnpm-workspace.yaml         Workspace definition
├── turbo.json                  Build pipeline config
├── package.json                Root package config
└── README.md                   This file
```

## 🛠️ Available Commands

### Root Level (Turborepo)

```bash
pnpm dev           # 🚀 Start all apps (dev mode)
pnpm build         # 📦 Build all apps & packages
pnpm lint          # 🔍 Lint all code
pnpm typecheck     # ✓ TypeScript check
```

### Web App (Next.js)

```bash
cd apps/web

pnpm dev           # Start dev server (http://localhost:3003)
pnpm build         # Production build
pnpm start         # Run production server
pnpm lint          # Lint & format
```

### Mobile App (Expo)

```bash
cd apps/mobile

pnpm dev                       # Start Expo dev server
npx expo prebuild --clean      # Setup native code
npx expo run:ios               # Build & run on iOS
npx expo run:android           # Build & run on Android
```

## 🎨 Styling & Components

### Web (shadcn/ui)

Built on **Radix UI** + **Tailwind CSS v4** (CSS-first):

```tsx
import { Button, Card } from "@repo/shadcn-ui/components";
import { cn } from "@repo/shadcn-ui/lib/utils";

export function MyComponent() {
  return (
    <Card>
      <Button className={cn("w-full", "bg-blue-500")}>
        Click me
      </Button>
    </Card>
  );
}
```

### Mobile (NativeWind UI)

Built on **React Native** + **NativeWind v4** + **Tailwind CSS v3**:

```tsx
import { Button, Card } from "@repo/nativewindui";
import { View, Text } from "react-native";

export function MyScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Card>
        <Button className="w-full bg-blue-500">
          <Text>Click me</Text>
        </Button>
      </Card>
    </View>
  );
}
```

## 🔧 Technology Stack

### Core Tools
- **[pnpm](https://pnpm.io/)** - Fast package manager
- **[Turborepo](https://turbo.build/)** - High-performance build system
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

### Web
- **[Next.js 16](https://nextjs.org/)** - React framework
- **[React 19](https://react.dev/)** - UI library
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme management

### Mobile
- **[Expo 54](https://expo.dev/)** - React Native platform
- **[React Native 0.81](https://reactnative.dev/)** - Mobile framework
- **[Expo Router v4](https://docs.expo.dev/router/)** - Navigation
- **[NativeWind v4](https://www.nativewind.dev/)** - Tailwind for RN
- **[react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)** - Animations

## 📚 Documentation

- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[License](LICENSE)** - MIT License
- [pnpm Docs](https://pnpm.io/)
- [Turborepo Docs](https://turbo.build/)
- [Next.js Docs](https://nextjs.org/docs)
- [Expo Docs](https://docs.expo.dev/)

## 🚀 Deployment

### Deploy Web App

**Vercel (Recommended)**
```bash
pnpm build
# Push to GitHub → auto-deploy via Vercel
```

**Docker**
```bash
docker build -f apps/web/Dockerfile -t my-web-app .
docker run -p 3000:3000 my-web-app
```

### Deploy Mobile App

**EAS Build** (Expo's cloud build service)
```bash
cd apps/mobile
eas build --platform ios
eas build --platform android
eas submit  # Submit to stores
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Setting up your development environment
- Code style guidelines
- Pull request process
- Commit message conventions

## 📝 License

MIT © 2026 Template Monorepo Contributors

See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Component design inspiration
- [NativeWind UI](https://nativewindui.com/) - Mobile components
- [Expo](https://expo.dev/) - Cross-platform framework
- [Vercel](https://vercel.com/) - Inspiration for monorepo setup

## 📞 Support

- 📖 Check the [Documentation](README.md)
- 💬 [GitHub Discussions](https://github.com/brain-byt-es/template-monorepo/discussions)
- 🐛 [Report Issues](https://github.com/brain-byt-es/template-monorepo/issues)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/brain-byt-es">brain-byt-es</a>
</p>
