# PostgreSQL Migration Guide for BPN

To transition from SQLite (local development) to PostgreSQL (production), follow these steps:

## 1. Setup PostgreSQL
Ensure you have a PostgreSQL instance running. You can use Render, AWS RDS, or a local Docker container:
```bash
docker run --name bpn-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

## 2. Update Environment Variables
In `services/backend/.env`, update the `DATABASE_URL`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/bpn_network?schema=public"
```

## 3. Update Prisma Schema
The schema is already prepared for PostgreSQL. Ensure `prisma/schema.prisma` has:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 4. Run Migrations
Generate the SQL and apply it to your PostgreSQL database:
```bash
npx prisma migrate dev --name init_postgres
```

## 5. Verify
The backend will automatically use the new PostgreSQL datasource on the next restart.
