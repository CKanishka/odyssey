# Odyssey - Collaborative Slide Editor

Odyssey is a beautiful, real-time collaborative slide editor that enables teams to create and edit presentations together seamlessly. Built with modern web technologies, it offers a smooth editing experience with instant synchronization across all collaborators.

## ✨ Features

- **Real-Time Collaboration**: Multiple users can edit the same presentation simultaneously with live cursors and presence indicators
- **Rich Text Editing**: Powered by ProseMirror with support for formatting, lists, and more
- **Scoped Undo/Redo**: Each user's undo/redo stack is independent, only affecting their own changes
- **Flexible Sharing**: Share entire presentations or individual slides with unique shareable links
- **Slide Management**: Add, delete, and reorder slides with ease
- **Modern UI**: Clean, aesthetic design built with Tailwind CSS
- **State Management**: Robust application state handling with XState

## 🛠 Tech Stack

### Frontend

- **React** - UI library
- **TypeScript** - Type safety
- **XState** - State management
- **Liveblocks** - Real-time collaboration infrastructure
- **Yjs** - CRDT for collaborative editing
- **ProseMirror** - Rich text editor
- **Tailwind CSS** - Styling
- **Vite** - Build tool

### Backend

- **Node.js** - Runtime
- **Express** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **Liveblocks Node SDK** - Server-side collaboration support

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd odyssey
```

### 2. Install dependencies

```bash
npm install
```

This will install dependencies for both the client and server workspaces.

### 3. Set up Liveblocks

1. Go to [Liveblocks](https://liveblocks.io) and create a free account
2. Create a new project
3. Get your public and secret keys from the dashboard

### 4. Set up PostgreSQL database

Create a new PostgreSQL database:

```bash
createdb odyssey
```

### 5. Configure environment variables

#### Server (`server/.env`)

```env
DATABASE_URL="postgresql://username:password@localhost:5432/odyssey?schema=public"
PORT=3001
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key
```

#### Client (`client/.env`)

```env
VITE_LIVEBLOCKS_PUBLIC_KEY=your_liveblocks_public_key
VITE_API_URL=http://localhost:3001
```

Replace the placeholders with your actual values:

- `username` and `password` with your PostgreSQL credentials
- `your_liveblocks_secret_key` with your Liveblocks secret key
- `your_liveblocks_public_key` with your Liveblocks public key

### 6. Set up the database schema

```bash
cd server
npm run db:push
cd ..
```

### 7. Start the development servers

From the root directory:

```bash
npm run dev
```

This will start both the backend (port 3001) and frontend (port 3000) servers concurrently.

### 8. Open the application

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### Creating a Presentation

1. On the home page, click "Create New Presentation"
2. You'll be redirected to the editor with a blank slide

### Editing Slides

- Click on a slide in the left sidebar to select it
- Use the editor to add and format text
- Use arrow keys to navigate between slides
- All changes are automatically saved and synced in real-time

### Managing Slides

- **Add Slide**: Click the "Add Slide" button in the toolbar
- **Delete Slide**: Hover over a slide thumbnail and click the delete (×) button
- **Navigate**: Use the arrow buttons or keyboard arrows to move between slides

### Sharing

1. Click the "Share" button in the toolbar
2. Choose between:
   - **Share All Slides**: Creates a link to the entire presentation
   - **Share Current Slide**: Creates a link to only the current slide
3. Copy the generated link and share it with collaborators
4. Collaborators can edit in real-time without signing in

### Collaboration Features

- See other users' cursors and selections in real-time
- View active collaborators in the top-right corner
- Undo/redo only affects your own changes, not others'

## 🏗 Project Structure

```
odyssey/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities and configurations
│   │   ├── machines/    # XState state machines
│   │   ├── types/       # TypeScript type definitions
│   │   └── hooks/       # Custom React hooks
│   └── package.json
├── server/              # Backend Node.js application
│   ├── src/
│   │   ├── routes/      # API routes
│   │   └── index.ts     # Server entry point
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
└── package.json         # Root package.json
```

## 🗄 Database Schema

The application uses three main models:

- **Presentation**: Contains metadata and has many slides
- **Slide**: Belongs to a presentation, stores position and content
- **Share**: Represents shareable links for presentations or individual slides

## 🔧 Development

### Running tests

```bash
# Frontend tests
cd client
npm test

# Backend tests
cd server
npm test
```

### Database management

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Building for production

```bash
# Build client
cd client
npm run build

# Build server
cd server
npm run build
```

## 🌟 Key Technical Decisions

### Why Liveblocks + Yjs?

- **Liveblocks** provides infrastructure for real-time features (presence, authentication)
- **Yjs** is a CRDT that ensures conflict-free collaborative editing
- Together, they provide a robust foundation for real-time collaboration

### Why ProseMirror?

- Powerful, extensible rich text editor
- Excellent support for collaborative editing via y-prosemirror
- Transaction-based architecture perfect for undo/redo functionality

### Why XState?

- Explicit state management prevents bugs
- Makes complex UI states predictable
- Great developer experience with visualization tools

### Why Prisma + PostgreSQL?

- Type-safe database access
- Easy migrations and schema management
- PostgreSQL's reliability and features for production use

## 🎨 Design Decisions

- **Clean, minimal interface**: Focus on content creation without distractions
- **Sidebar navigation**: Easy access to all slides while editing
- **Color-coded collaboration**: Each user has a unique color for easy identification
- **Responsive design**: Works well on different screen sizes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the MIT License.

## 🐛 Known Issues & Future Improvements

- [ ] Add support for images and media
- [ ] Implement presentation mode (full-screen slide view)
- [ ] Add slide templates
- [ ] Support for comments and annotations
- [ ] Export to PDF/PowerPoint
- [ ] User authentication and presentation ownership
- [ ] Slide themes and styling options

## 💡 Tips

- Use `Cmd/Ctrl + Z` to undo your changes
- Use `Cmd/Ctrl + Shift + Z` to redo
- Use arrow keys to quickly navigate between slides
- Share specific slides when you want focused collaboration
- Keep the browser tab open to maintain real-time connection

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for seamless collaboration
