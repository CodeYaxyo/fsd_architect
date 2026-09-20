# FSD Architect

A professional Next.js + Feature-Sliced Design (FSD) architecture assistant for Visual Studio Code.

## Problem it solves
Managing Feature-Sliced Design (FSD) architectures manually can be tedious. Creating slices, maintaining index barrels, keeping imports clean, and ensuring cross-layer dependency rules aren't broken takes significant time. FSD Architect automates these workflows inside your IDE.

## Features

- **Architecture Guard & Quick Fixes**: Real-time validation of FSD rules as you type. If you violate a layer constraint (e.g., importing a `feature` into an `entity`), the extension provides inline diagnostics and Quick Fix lightbulbs to resolve the issue.
- **Smart Next.js Integration**: Automatically understands the difference between Next.js App Router conventions (e.g. `app/page.tsx`) and FSD layer boundaries.
- **Generate & Update Barrels**: Automatically generate and safely update `index.ts` files. It handles named exports, default exports, and type exports gracefully without duplication.
- **Optimize Imports**: Intelligently detect imports from the same directory and safely consolidate them into a single barrel import (verifying the barrel exists first).
- **Architecture Visualization**: Instantly generate a Mermaid.js diagram of your project's theoretical FSD structure.
- **Slice Generators**: Quickly scaffold new `features`, `entities`, `widgets`, `pages`, and `shared` modules with standard folders (`ui`, `model`, `api`, `lib`).

## Configuration (Optional)

Create a `fsd-architect.config.json` file in your workspace root to customize layers and folders:
```json
{
  "layers": ["shared", "entities", "features", "widgets", "pages", "app"],
  "sliceFolders": ["ui", "model", "api", "lib"],
  "barrel": {
    "filename": "index.ts"
  }
}
```

## How to use

Access all tools directly from the Explorer Context Menu (Right-Click), the Command Palette (`Ctrl+Shift+P`), or the dedicated **FSD Architect Sidebar**.

## Known Limitations
- The visual Architecture Graph currently shows the configured theoretical layers rather than parsing the entire physical AST of your workspace for actual edges.
- Complex nested barrel resolution across monorepos is still under development.

## License
MIT
