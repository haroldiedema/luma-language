<p align="center">
  <a href="https://github.com/haroldiedema/luma-language/actions/workflows/test.yml"><img src="https://github.com/haroldiedema/luma-language/actions/workflows/test.yml/badge.svg" alt="Tests" /></a>
  <a href="https://bundlephobia.com/package/luma-lang"><img src="https://img.shields.io/bundlephobia/minzip/luma-lang" alt="Bundle Size" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/luma-lang"><img src="https://img.shields.io/npm/v/luma-lang?color=red" alt="NPM Version" /></a>
  <a href="https://esm.sh/luma-language"><img src="https://img.shields.io/badge/esm.sh-luma-lang-f39c12" alt="esm.sh" /></a>
  <a href="https://unpkg.com/browse/luma-lang/"><img src="https://img.shields.io/badge/unpkg-luma-lang-3498db" alt="unpkg" /></a>
</p>

# Luma Language

**Luma Language** is a lightweight, indentation-based scripting language
designed to be embedded in **Game Engines** and **Interactive Applications**.
The language syntax is designed to be "_as-beginner-friendly-as-possible_" and
borrows heavily from Python's clean and readable style.

It features a **Bytecode Virtual Machine (VM)** with a "Tick Budget" system,
allowing you to pause and resume script execution across frames. This prevents
infinite loops from freezing your game and allows for complex, long-running
behavior scripts (like AI patrols) without blocking the main thread.

The language package is a zero-dependency TypeScript library that can be easily
integrated into any JavaScript/TypeScript project, in any environment.

---

## Quick Start

Install the package via your favorite package manager:

```bash
npm install luma-lang
```

Create a simple Luma script:

```typescript
import { Compiler, VirtualMachine } from 'luma-lang';

// Compile the Luma script
const program = Compiler.compile(`
fn greet(name):
    print("Hello, " + name + "!")
    
greet("World")
`);

// Create a VM instance and run the program.
const vm = new VirtualMachine(program);
vm.run();
```

---

## Contributing

To set up the development environment, clone the repository and install dependencies:

```bash
npm install
```

Build the project using `npm run build` or `npm run watch` for continuous builds.
Once built, you have two options to run the tests:

 - Run the entire suite once: `npm run test`
 - Run tests in watch mode: `npm run watch:test`

---
