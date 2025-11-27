# Workq

A distributed job processing system built with NestJS, Apache Pulsar, and Nx monorepo architecture.

## 🏗️ Architecture Overview

Workq is a microservices-based job processing platform with the following components:

- **Auth Service** - GraphQL API for user authentication with JWT and gRPC
- **Jobs Service** - GraphQL API for job submission and management
- **Executor Service** - Background worker that processes jobs from message queues

### Technology Stack

- **Framework**: NestJS
- **Message Queue**: Apache Pulsar
- **Database**: PostgreSQL with Prisma ORM
- **API**: GraphQL with Apollo Server
- **RPC**: gRPC for inter-service communication
- **Monorepo**: Nx workspace
- **Authentication**: JWT with Passport
- **Logging**: Pino

## 📁 Project Structure

```
workq/
├── apps/
│   ├── auth/          # Authentication service (GraphQL + gRPC)
│   ├── jobs/          # Job management service (GraphQL)
│   └── executor/      # Job execution worker
├── libs/
│   ├── graphql/       # Shared GraphQL utilities and guards
│   ├── grpc/          # gRPC protocol definitions
│   ├── nestjs/        # Shared NestJS utilities (logging, init)
│   ├── prisma/        # Database client and schemas
│   └── pulsar/        # Apache Pulsar client and consumer abstractions
└── docker-compose.yml # Local development environment
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start infrastructure (PostgreSQL, Pulsar)
docker-compose up -d

# Run database migrations
npx prisma migrate dev --schema apps/auth/prisma/schema.prisma
```

### Running Services

```bash
# Run all services in development mode
npm start

# Or run individual services
npx nx serve auth      # http://localhost:3000
npx nx serve jobs      # http://localhost:3001
npx nx serve executor  # Background worker
```

## 🔑 Key Features

### Distributed Job Processing

- **Job Submission**: Submit jobs via GraphQL API
- **Message Queue**: Apache Pulsar for reliable message delivery
- **Retry Logic**: Configurable retry with exponential backoff
- **Dead Letter Queue**: Failed messages sent to DLQ for investigation
- **Idempotency**: Prevent duplicate message processing

### Authentication & Authorization

- **User Management**: Create and authenticate users
- **JWT Tokens**: Secure token-based authentication
- **GraphQL Guards**: Protected queries and mutations
- **gRPC Auth Service**: Inter-service authentication

### Reliability Features

The Pulsar consumer implementation includes:

- **Retry Configuration**: Configurable max retries with exponential backoff
- **Dead Letter Queue**: Automatic routing of failed messages
- **Idempotent Processing**: Deduplication store prevents duplicate processing
- **Message Properties**: Track retry count and error details

### Example: Fibonacci Job

A sample job implementation demonstrating the job processing pipeline:

```typescript
// Submit a job
mutation {
  executeJob(executeJobInput: {
    name: "Fibonacci"
    data: { iterations: 10 }
  }) {
    name
    description
  }
}
```

## 📚 Core Libraries

### @workq/pulsar

Message queue abstraction with built-in reliability features:

- `PulsarClient` - Client for creating producers and consumers
- `PulsarConsumer` - Abstract consumer with retry/DLQ support
- `DeduplicationStore` - In-memory idempotency tracking
- Idempotency Utilities - Key generation helpers

### @workq/graphql

Shared GraphQL utilities:

- `AbstractModel` - Base GraphQL model with ID
- `GraphQLContext` - Request/response context
- `GqlAuthGuard` - Authentication guard using gRPC

### @workq/nestjs

NestJS initialization and logging:

- `init` - Common app initialization (validation, logging, cookies)
- `LoggerModule` - Pino logger configuration

### @workq/grpc

gRPC service definitions for inter-service communication.

## 🛠️ Development

### Building

```bash
# Build all projects
npx nx run-many -t build

# Build specific project
npx nx build auth
```

### Testing

```bash
# Run tests
npx nx test auth

# Run tests for all projects
npx nx run-many -t test
```

### Linting

```bash
# Lint all projects
npx nx run-many -t lint

# Auto-fix issues
npx nx run-many -t lint --fix
```

### Code Quality

Pre-commit hooks are configured with Husky and lint-staged:

- ESLint for code quality
- Prettier for formatting
- Staged files only

## 🐳 Docker Deployment

Each service has a multi-stage Dockerfile:

```bash
# Build auth service image
docker build -f apps/auth/Dockerfile -t workq-auth .

# Build jobs service image
docker build -f apps/jobs/Dockerfile -t workq-jobs .

# Build executor service image
docker build -f apps/executor/Dockerfile -t workq-executor .
```

## 📖 API Documentation

### Authentication Service (Port 3000)

**GraphQL Endpoints:**

- `mutation createUser` - Create a new user
- `mutation login` - Authenticate and receive JWT cookie
- `query users` - Get all users (requires authentication)

**gRPC Service:**

- `AuthService.authenticate` - Validate JWT tokens

### Jobs Service (Port 3001)

**GraphQL Endpoints:**

- `query jobs` - List all available job types
- `mutation executeJob` - Submit a job for processing

## 🔒 Security

- JWT tokens stored in HTTP-only cookies
- Password hashing with bcrypt
- GraphQL authentication guards
- gRPC authentication for inter-service calls
- Input validation with class-validator
- Environment-based configuration

## 🔧 Configuration

Environment variables (create `.env` files for each service):

```bash
# Auth Service
PORT=3000
JWT_SECRET=your-secret-key
JWT_EXPIRATION_MS=3600000
DATABASE_URL=postgresql://user:pass@localhost:5432/auth
PULSAR_SERVICE_URL=pulsar://localhost:6650

# Jobs Service
PORT=3001
PULSAR_SERVICE_URL=pulsar://localhost:6650

# Executor Service
PULSAR_SERVICE_URL=pulsar://localhost:6650
```

## 📦 Workspace Management

This project uses [Nx](https://nx.dev) for monorepo management:

```bash
# Visualize project dependencies
npx nx graph

# Show project details
npx nx show project auth

# Run affected tests
npx nx affected -t test

# Generate new library
npx nx g @nx/node:lib my-lib

# Generate new app
npx nx g @nx/nest:app my-app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT

## 🔗 Useful Links

- [Nx Documentation](https://nx.dev)
- [NestJS Documentation](https://docs.nestjs.com)
- [Apache Pulsar Documentation](https://pulsar.apache.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [GraphQL Documentation](https://graphql.org/learn)

---

Built with ❤️ using [Nx](https://nx.dev) and [NestJS](https://nestjs.com)
