# Introduction

This document outlines the complete fullstack architecture for the **Lean IT Consulting Ticketing System**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## Starter Template or Existing Project

**Based on:** Monorepo with separate frontend and backend applications
- **Frontend:** Custom Vite + React + TypeScript setup with shadcn/ui components (Lovable UI builder used for initial UI generation)
- **Backend:** Custom Node.js + Express setup (no starter template)
- **Architectural Constraints:**
  - Monorepo structure already established (`/frontend` and `/backend` directories)
  - Session-based authentication already implemented
  - PostgreSQL database with 8 complete migrations
  - shadcn/ui component library already integrated

**Current State:** Brownfield project with Epics 1 & 2 backend complete, frontend partially integrated. Architecture document being created retroactively to guide completion and future development.

---
