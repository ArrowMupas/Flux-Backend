# 📘 Project Best Practices

## 1. Project Purpose
A Node.js (Express) RESTful backend for an e-commerce domain. It manages users, products, carts, orders (including walk-in orders), payments, reviews, reports, permissions, and inventory notifications. It uses MySQL (mysql2/promise) with a connection pool, JWT-based authentication, role-based authorization, and a layered architecture (routes → controllers → services → models). It includes scheduled inventory checks and integrates with Cloudinary, Nodemailer, and caching.

## 2. Project Structure
- server.js
  - Application entrypoint. Configures dotenv, CORS, cookie-parser, helmet, compression, JSON body parsing, routes, 404 handler, and centralized error middleware. Initializes inventory stock checker after server starts.
- routes/
  - Express Router instances mapping HTTP endpoints to controllers. Common middlewares (rate limiting, auth, access control, validation) are applied here per route.
- controllers/
  - Thin layer: validate request assumptions, compose service calls, and send standardized responses. Use express-async-handler to forward errors.
- services/
  - Business logic. Coordinate transactions, orchestrate workflows, and call models. Never access req/res directly.
- models/
  - Data access layer. Use mysql2/promise with parameterized queries. Accept an optional connection for transactional operations.
- validations/
  - Joi schemas per domain (e.g., orderValidation.js). Used via validate middleware.
- middlewares/
  - Cross-cutting concerns: auth (JWT), access control (roles), rate limiter, caching, validation, error handling, admin logging, response helpers, auto stock checks.
- database/
  - DB pool (mysql2), knex prototype, schema init (init.sql), init & drop scripts. All DB credentials come from .env.
- helpers/
  - Reusable helpers (HttpError, existence checks, transaction utilities, email templates, logging, inventory notifier).
- utilities/
  - Integrations and shared utilities (cache, cloudinary, email, inventory logs, stock checker, app logger).
- workflows/
  - Orchestrated multi-step domain processes (e.g., createOrderWorkflow) to keep services focused and composable.
- constants/
  - Enumerations and constant sets (roles, admin activity types, inventory actions).
- Config files
  - .env (not committed), .prettierrc, eslint.config.mjs, nodemon.json, Dockerfile, docker-compose.yml

Conventions
- File naming: featureType.js (e.g., orderController.js, orderService.js, orderModel.js)
- Module system: CommonJS (require/module.exports)
- Response: sendResponse helper for consistent API responses; centralized errorMiddleware for errors

## 3. Test Strategy
Current State
- No tests are present. test script is a placeholder.

Recommended Approach
- Frameworks
  - Jest for unit tests
  - supertest for HTTP integration tests (Express routes)

Structure
- tests/
  - unit/ (helpers, utilities, pure services with mocked DB)
  - integration/ (routes/controllers/services hitting a test DB)
  - e2e/ optional (full flow with seeded DB)

Database Strategy
- Unit tests: mock mysql2/promise or inject a fake connection object into models/services
- Integration tests: use a dedicated test database with migrations/seed data; wrap each test in a transaction and rollback in afterEach for isolation

Guidelines
- Write unit tests for:
  - helpers (errorHelper, existence helpers)
  - services with business rules (order limits, cancel rules)
  - validations (Joi schemas happy/sad paths)
- Write integration tests for:
  - critical routes (auth flows, checkout, cancel, product listing)
  - permissions/roles per route
- Coverage targets: 80%+ statements/branches for critical modules (auth, order, payment)
- Mocking:
  - For email/cloudinary/axios/logger use Jest mocks to avoid network or external side effects
  - For cache layers, reset state between tests

## 4. Code Style
General
- Use async/await throughout. Avoid mixing .then/.catch
- Keep controllers thin; put domain logic in services/workflows
- Prefer small, composable functions; keep modules cohesive

Naming
- Variables/functions: camelCase
- Classes: PascalCase (e.g., HttpError, InventoryStockChecker)
- Constants/enums: UPPER_SNAKE_CASE (e.g., ROLES)
- Files: featureType.js (e.g., paymentService.js)

Error Handling
- Throw HttpError(status, message, errorFields?) for controllable errors
- Controllers must be wrapped in express-async-handler to forward errors
- Rely on errorMiddleware to standardize error responses
- In transactions: try/catch, rollback on error, release in finally
- In production, do not expose stack traces (middleware already gates by NODE_ENV)

Validation
- Use Joi schemas in validations/ with validate middleware per route
- Keep schemas strict by default; .unknown() only where justified and documented
- Validation messages should be user-friendly and not expose system details

Security
- JWT auth via Authorization: Bearer token or cookie; use verifyToken middleware
- Role-based access with accessMiddleware and ROLES constants
- CORS origin is read from FRONTEND env; review for correctness in each environment
- Use helmet and rate-limiting for basic hardening
- Never interpolate user input into SQL; always use placeholders/parameters
- Keep SECRET_KEY and DB credentials in .env (never commit secrets)
- Review database ssl settings for production (rejectUnauthorized=false is not recommended for prod)

Responses
- Use the response helper (sendResponse) for success cases to keep shape consistent
- For not-found routes, use the global 404 handler already configured in server.js

Formatting & Linting
- Follow Prettier (.prettierrc) and ESLint (eslint.config.mjs) rules
- Prefer consistent import order: core → third-party → local modules

Transactions & DB Access
- Always pass a connection from pool.getConnection() to models within a transaction
- Always beginTransaction/commit/rollback and release in finally
- Models accept a connection parameter (default to pool); leverage this for atomic operations

## 5. Common Patterns
Layering
- Route → Controller → Service → Model
  - Routes: compose middlewares and map endpoints
  - Controllers: gather params, call services, use sendResponse
  - Services: business rules, transactions, orchestrate workflows
  - Models: SQL only, no HTTP concerns

Order/Inventory Patterns
- Reservation flow: createReservation → deductStockForOrder → delete reservations
- Order status lifecycle logged via order_status_history
- Cancel flow: cancel_requested vs cancelled rules enforced in services

Workflows
- Complex multi-step processes live in workflows/ (e.g., createOrderWorkflow: validate cart, enforce order limits, create order, reserve stock, payment handling, status init)

Scheduling/Background Tasks
- InventoryStockChecker handles periodic checks using setInterval
- Initialize once after app starts; expose start/stop for control

Caching
- apicache/node-cache available; prefer route-level cache where applicable and explicit cache invalidation on writes

File Uploads
- multer + multer-storage-cloudinary for uploads; validate mime types and sizes at the route/middleware level

Logging
- Use Winston (with @axiomhq/winston if configured) for structured logs
- Avoid console.log in production paths; prefer logger with levels

## 6. Do's and Don'ts
Do
- Validate all incoming data with Joi via validate middleware
- Use HttpError for controlled failures; rely on errorMiddleware
- Keep controllers thin; put logic in services and workflows
- Use parameterized queries; pass connection to models during transactions and release in finally
- Apply verifyToken and accessMiddleware consistently to protect routes
- Use sendResponse for successful responses
- Keep secrets in .env; provide an .env.example file
- Add integration tests for critical flows; mock external services in unit tests
- Use rate limiter on public/critical endpoints

Don't
- Access the database directly from controllers or routes
- Expose stack traces in production responses
- Interpolate user input into SQL strings
- Hardcode secrets, credentials, or origins in code
- Start multiple background intervals inadvertently
- Swallow errors; always propagate to errorMiddleware

## 7. Tools & Dependencies
Core
- express: HTTP server and routing
- mysql2/promise: MySQL access with promises and pooling
- jsonwebtoken: JWT auth
- joi: Input validation
- express-async-handler: Async error forwarding
- helmet, compression, cors: HTTP hardening and performance
- express-rate-limit: Basic DoS protection
- apicache, node-cache: Caching layers
- multer, multer-storage-cloudinary, cloudinary: File uploads and storage
- nodemailer: Email sending
- winston, @axiomhq/winston: Structured logging
- dayjs: Date utilities
- axios: HTTP client for external integrations

Dev
- eslint, @eslint/js, eslint-plugin-n, eslint-plugin-security: Linting
- prettier: Formatting (via .prettierrc)
- nodemon: Dev server reload

Setup
- Install: npm install
- Dev run: npm run dev
- Serve: npm run serve
- Initialize DB: node database/initDB.js
- Drop DB (dangerous): node database/dropDB.js
- Environment: create .env (see README for keys: DB_*, PORT, NODE_ENV, SECRET_KEY, FRONTEND)

## 8. Other Notes
- Consistency
  - Follow the layered structure; add new features across constants → validations → routes → controllers → services → models
  - Reuse helpers/utilities (HttpError, response helper, logger, stock checker, notifier) before writing new ones
- API Response Shape
  - Prefer a consistent { success, message, data } shape for successes; for errors, rely on errorMiddleware contract
- Inventory Edge Cases
  - Respect reservation counts and cancellation rules; clean up reservations on order lifecycle changes
- Auth & Roles
  - Always enforce verifyToken and role checks (ROLES) for protected routes; ensure admin/customer boundaries are clear
- Payload Limits
  - server.js sets JSON/urlencoded parsing and limits; keep uploads and JSON payload sizes within acceptable thresholds
- Production Readiness
  - Revisit DB SSL configuration, CORS origins, logging verbosity, and rate limits for production
- LLM Guidance
  - When generating code, always:
    - Add Joi schema first, wire validate middleware, and keep controllers small
    - Use services for business rules and pass connection for transactions
    - Throw HttpError for predictable failures and rely on errorMiddleware
    - Use response helper for success messages
