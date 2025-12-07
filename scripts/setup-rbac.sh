#!/bin/bash

# RBAC Setup Script
# This script sets up the RBAC system

echo "🚀 Setting up RBAC system..."

# Step 1: Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Step 2: Run Migration
echo "🗄️  Running database migration..."
npx prisma migrate dev --name add_rbac_tables

# Step 3: Seed RBAC Data
echo "🌱 Seeding RBAC data..."
npx tsx prisma/seed-rbac.ts

echo "✅ RBAC setup completed!"
echo ""
echo "Next steps:"
echo "1. Restart your development server"
echo "2. Test the system by logging in as Admin"
echo "3. Visit /dashboard/rbac to manage roles"


