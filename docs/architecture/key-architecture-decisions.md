# Key Architecture Decisions

## Why Monolith vs Microservices?
Single user with straightforward CRUD workflows doesn't justify microservice complexity. Monolith is faster to build, easier to deploy, and meets all NFRs.

## Why Traditional Server vs Serverless?
The PRD emphasizes <500ms response times. Serverless cold starts would violate these requirements. Session-based auth also requires persistent server state.

## Why Session-Based vs JWT?
Single-user system doesn't need distributed auth. Sessions are simpler to implement, more secure (HTTP-only, server-side revocation), and avoid token refresh complexity.

## Why PostgreSQL Sessions vs Redis?
For 1-2 users, PostgreSQL session lookup (~1-3ms) vs Redis (~0.5-1ms) difference is negligible compared to network latency (20-30ms). Zero additional infrastructure simplifies deployment and reduces costs.

## Why Railway?
Railway offers best DX for monorepo + PostgreSQL + traditional server at lowest cost ($10-15/month). Simple migration path exists (standard PostgreSQL + Express). Heroku pricing increased significantly; Vercel optimized for serverless/edge.

---
