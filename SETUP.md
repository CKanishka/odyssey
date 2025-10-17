# Odyssey Setup Guide

## Quick Start

### Step 1: Fix NPM Cache Permissions

Run this command to fix the npm cache permission issue:

```bash
sudo chown -R $(id -u):$(id -g) "$HOME/.npm"
```

### Step 2: Install Dependencies

From the project root directory:

```bash
npm install
```

### Step 3: Set Up Liveblocks

1. Go to [https://liveblocks.io](https://liveblocks.io) and create a free account
2. Create a new project
3. Copy your **Public Key** (starts with `pk_`) and **Secret Key** (starts with `sk_`)

### Step 4: Configure Environment Variables

#### Server Environment (`server/.env`)

Create a file at `server/.env` with the following content:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/odyssey?schema=public"
PORT=3001
LIVEBLOCKS_SECRET_KEY=sk_prod_your_actual_secret_key
```

Replace:

- `username` and `password` with your PostgreSQL credentials
- `sk_prod_your_actual_secret_key` with your actual Liveblocks secret key

#### Client Environment (`client/.env`)

Create a file at `client/.env` with the following content:

```env
VITE_LIVEBLOCKS_PUBLIC_KEY=pk_prod_your_actual_public_key
VITE_API_URL=http://localhost:3001
```

Replace:

- `pk_prod_your_actual_public_key` with your actual Liveblocks public key

### Step 5: Set Up PostgreSQL Database

If you don't have PostgreSQL installed:

**macOS (using Homebrew):**

```bash
brew install postgresql@14
brew services start postgresql@14
```

**Create the database:**

```bash
createdb odyssey
```

Or use psql:

```bash
psql postgres
CREATE DATABASE odyssey;
\q
```

### Step 6: Initialize Database Schema

```bash
cd server
npm run db:push
cd ..
```

This will create all the necessary tables in your PostgreSQL database.

### Step 7: Start the Application

From the project root:

```bash
npm run dev
```

This will start:

- Backend server on http://localhost:3001
- Frontend application on http://localhost:3000

### Step 8: Open the App

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Troubleshooting

### Database Connection Issues

If you get database connection errors:

1. Make sure PostgreSQL is running:

   ```bash
   brew services list  # macOS
   ```

2. Verify your DATABASE_URL in `server/.env` is correct

3. Test connection:
   ```bash
   psql -d odyssey
   ```

### Liveblocks Connection Issues

If you see authentication errors:

1. Verify your Liveblocks keys are correct in both `.env` files
2. Make sure you copied the complete keys (they're quite long)
3. Don't include quotes around the keys

### Port Already in Use

If port 3000 or 3001 is already in use:

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9  # For port 3000
lsof -ti:3001 | xargs kill -9  # For port 3001
```

### Module Not Found Errors

If you get "module not found" errors after installation:

```bash
# Clean install
rm -rf node_modules client/node_modules server/node_modules
rm package-lock.json client/package-lock.json server/package-lock.json
npm install
```

## Alternative: Using Docker (Optional)

If you prefer using Docker, here's a docker-compose setup:

Create `docker-compose.yml` in the project root:

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: odyssey
      POSTGRES_USER: odyssey
      POSTGRES_PASSWORD: odyssey
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start PostgreSQL:

```bash
docker-compose up -d
```

Update your `server/.env`:

```env
DATABASE_URL="postgresql://odyssey:odyssey@localhost:5432/odyssey?schema=public"
```

## Next Steps

Once everything is running:

1. **Create a presentation**: Click "Create New Presentation" on the home page
2. **Add slides**: Use the "Add Slide" button in the toolbar
3. **Edit content**: Click on any slide and start typing in the editor
4. **Share**: Click the "Share" button to generate shareable links
5. **Collaborate**: Share the link with others and edit together in real-time!

## Development Commands

```bash
# Start development servers
npm run dev

# Start only client
npm run dev:client

# Start only server
npm run dev:server

# Build for production
npm run build

# Database commands
cd server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio (database GUI)
```

## Features to Try

✅ **Real-time collaboration**: Open the same presentation in multiple browser windows
✅ **Scoped undo/redo**: Use Cmd/Ctrl+Z - it only affects your changes
✅ **Share single slide**: Click Share → Share Current Slide
✅ **Share presentation**: Click Share → Share All Slides
✅ **Navigate with keyboard**: Use arrow keys to move between slides
✅ **See collaborators**: Check the top-right corner for active users
✅ **Delete slides**: Hover over thumbnails and click the × button

Enjoy using Odyssey! 🚀
