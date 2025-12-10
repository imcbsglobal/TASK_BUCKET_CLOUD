# TaskBucket Cloud - Frontend

A modern, responsive React application for managing and uploading images to Cloudflare R2 storage via Django REST API.

## Features

- 🖼️ **Image Gallery** - Browse and manage uploaded images with real-time updates
- 📤 **Bulk Upload** - Upload multiple images with metadata (name, description)
- 🔍 **Search & Filter** - Quickly find images by name or description
- 🎨 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🌙 **Dark Mode** - Eye-friendly dark theme with neon accents
- 📊 **Dashboard** - View upload history and statistics
- 📖 **API Documentation** - Built-in interactive API docs for developers
- 🔐 **API Key Authentication** - Secure API access with key validation

## Tech Stack

- **React 18** - Modern React with hooks and context
- **Vite** - Fast build tool and dev server
- **TanStack Query** (React Query) - Powerful data fetching and caching
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Icon library (Material Design icons)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend server running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

## Project Structure

```
client/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Toast.jsx
│   │   └── ConfirmModal.jsx
│   ├── context/        # React Context providers
│   │   └── AuthContext.jsx
│   ├── pages/          # Route pages
│   │   ├── Dashboard.jsx
│   │   ├── Gallery.jsx
│   │   ├── ImageView.jsx
│   │   ├── Login.jsx
│   │   └── ApiDocs.jsx
│   ├── App.jsx         # Main app component with routes
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles (Tailwind)
├── public/             # Static assets
├── index.html          # HTML template
└── vite.config.js      # Vite configuration
```

## API Documentation

The app includes a comprehensive **API Documentation** page accessible from the sidebar after login. This page provides:

- Complete endpoint reference (GET, POST, PUT, DELETE)
- Request/response examples with syntax highlighting
- cURL command examples for each endpoint
- Authentication requirements and API key usage
- Copy-to-clipboard functionality for easy testing

### API Key Authentication

All API requests require an API key in the request header:

```bash
X-API-Key: imcbs-secret-key-2025
```

Example cURL request:

```bash
curl -X GET http://localhost:8000/api/list/ \
  -H "X-API-Key: imcbs-secret-key-2025"
```

## Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload/` | Upload a new image |
| `GET` | `/api/list/` | List all images |
| `PUT` | `/api/update/<id>/` | Update image metadata |
| `DELETE` | `/api/delete/<id>/` | Delete an image |

For detailed documentation with examples, visit the **API Docs** page in the app.

## Environment Variables

Create a `.env` file in the client directory (optional):

```env
VITE_API_BASE_URL=http://localhost:8000/api

# Optional: API key for the backend. If not provided, the app will fall back to the default hard-coded key for development.
VITE_API_KEY=imcbs-secret-key-2025
```

If not set, the app defaults to `http://localhost:8000/api`.

## Features Breakdown

### Dashboard
- Upload form with drag-and-drop support
- Recent uploads list with thumbnails
- Upload statistics and metrics

### Gallery
- Grid view of all images
- Search and filter functionality
- Click to view full image details
- Edit metadata (name, description)
- Delete images with confirmation

### API Documentation
- Interactive API reference
- Request/response examples
- Copy-to-clipboard for API key and cURL commands
- Color-coded by HTTP method
- Dark mode optimized code blocks

### Authentication
- Simple login system
- Protected routes
- Session management with context

## Development

### Available Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Code Style

This project uses ESLint with recommended React rules. Run `npm run lint` to check for issues.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of the TaskBucket Cloud system.

## Support

For issues or questions, please contact the development team or check the API Documentation page for endpoint usage.
