# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Midnight Network smart contract package (`@midnight-ntwrk/counter-contract`). The contract is written in Compact (a zero-knowledge DSL) and compiled to zkIR circuits. TypeScript provides the witness definitions, test simulator, and build tooling.

## Commands

```bash
npm run compact          # Compile src/counter.compact → src/managed/counter/ (circuits, keys, contract bindings)
npm run build            # TypeScript build + copy managed artifacts to dist/
npm run test             # Run vitest (requires compact compilation first)
npm run test:compile     # Compile compact + run tests in one step
npm run lint             # ESLint (src/ only, excludes src/managed/)
npm run typecheck        # tsc --noEmit
```

First-time setup requires the Compact toolchain:
```bash
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
source $HOME/.local/bin/env
compact update 0.30.0
```

## Architecture

**Compact contract** (`src/counter.compact`): Defines on-chain ledger state and circuits. `compact compile` generates everything under `src/managed/counter/` — never edit managed files directly.

**Generated bindings** (`src/managed/counter/contract/index.{js,d.ts}`): Exports `Contract<PS>` class, `Ledger` type, `ledger()` helper, and typed circuit interfaces (`ImpureCircuits`, `ProvableCircuits`).

**Witnesses** (`src/witnesses.ts`): Defines `CounterPrivateState` (the local/private state shape) and exports the witnesses object (currently empty — no private inputs needed for this contract).

**Entry point** (`src/index.ts`): Re-exports the managed contract as `Counter` and all witness types.

**Test pattern** (`src/test/counter-simulator.ts`): Wraps `Contract` in a simulator using `@midnight-ntwrk/compact-runtime` helpers (`createConstructorContext`, `createCircuitContext`, `sampleContractAddress`). Tests call `contract.impureCircuits.<circuit>(circuitContext)` and inspect the resulting ledger/private state.

## Key Conventions

- Compact language version: `>= 0.20` (pragma in .compact files)
- The `src/managed/` directory is compiler output — gittracked but never hand-edited
- Private state is passed as a generic type parameter `PS` to `Contract<PS>`
- Ledger values are `bigint` (e.g., `round: bigint`)
- Tests use `setNetworkId("undeployed")` before any contract interaction
- ESM throughout (`"type": "module"` in package.json, `.js` extensions in imports)
