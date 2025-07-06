# chest-nest Agent Guide

## Commands
- **Build**: `npm run build`
- **Format**: `npm run format`
- **Lint**: `npm run lint`
- **Test**: `npm test` (single test: `npm test -- --testNamePattern="test name"`)
- **Test Watch**: `npm run test:watch`
- **Test Coverage**: `npm run test:cov`
- **E2E Tests**: `npm run test:e2e`
- **Development**: `npm run start:dev`

## Architecture
- **Framework**: NestJS with TypeScript
- **Chess Engine**: chess.js library
- **Real-time**: Socket.IO WebSocket gateway
- **Structure**: src/app.module.ts (root), src/chess/ (chess game logic)
- **Tests**: Jest with spec files alongside source

## Code Style
- **Formatting**: Prettier (single quotes, trailing commas)
- **Linting**: ESLint with TypeScript, Prettier integration
- **Imports**: NestJS decorators first, then third-party, then local
- **Naming**: camelCase for variables/methods, PascalCase for classes
- **Error Handling**: Return success/error objects with messages
- **Types**: TypeScript strict mode, allow `any` for flexibility
