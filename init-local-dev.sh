#!/bin/bash

# Initialize local development for Herschell CRM project
echo "Setting up local development environment for Herschell CRM..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << 'EOL'
# Server configuration
PORT=5000
NODE_ENV=development

# Database configuration - update these with your actual database details
DATABASE_URL=postgresql://user:password@localhost:5432/herschell_crm

# Session secret - change this in production
SESSION_SECRET=development-secret-$(date +%s)

# Email configuration (if using SendGrid)
SENDGRID_API_KEY=
EMAIL_FROM=admin@example.com

# File uploads configuration
UPLOAD_DIR=uploads
EOL
  echo ".env file created. Please update with your database credentials."
else
  echo ".env file already exists."
fi

# Create uploads directory if it doesn't exist
if [ ! -d uploads ]; then
  echo "Creating uploads directory..."
  mkdir -p uploads
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Instructions for next steps
echo ""
echo "===== NEXT STEPS ====="
echo "1. Update the .env file with your PostgreSQL credentials"
echo "2. Create a PostgreSQL database (if not created already)"
echo "3. Run 'npm run db:push' to set up database schema"
echo "4. Run 'npm run dev:local' to start the application"
echo ""
echo "See LOCAL_DEVELOPMENT.md for more detailed instructions." 