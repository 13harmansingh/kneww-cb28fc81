# KNEW Network

A modern, AI-powered news aggregation and analysis platform that provides unbiased news coverage from around the world with intelligent bias detection, sentiment analysis, and multi-language support.

## 🌟 Features

- **Global News Coverage**: Access news from 195+ countries in 50+ languages
- **AI Analysis**: Automatic bias detection, sentiment analysis, and fact verification
- **Smart Search**: Entity-based AI search to find related news across the globe
- **Translation**: Real-time article translation to any language
- **Bookmarks**: Save and organize your favorite articles
- **Compare View**: Side-by-side comparison of news coverage
- **Admin Dashboard**: User management, roles, and telemetry monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- npm or bun package manager

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:8080`

## 📚 Documentation

- [Setup Guide](./docs/setup.md) - Detailed installation and configuration
- [Architecture](./docs/architecture.md) - System design and patterns
- [Deployment](./docs/deployment.md) - Production deployment guide
- [Testing](./docs/testing.md) - Testing strategies and checklist

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Zustand** - State management
- **React Router** - Routing

### Backend
- **Supabase (Lovable Cloud)** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Edge Functions (Deno)** - Serverless API
- **Lovable AI** - AI analysis and translation

### External APIs
- **WorldNews API** - News aggregation
- **Mapbox** - Interactive maps

## 📦 Project Structure

```
knew-network/
├── src/
│   ├── api/              # API client layer
│   ├── components/       # React components
│   ├── config/           # Configuration & constants
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── stores/           # State management
│   └── lib/              # Utilities
├── supabase/
│   └── functions/        # Edge functions
├── docs/                 # Documentation
└── public/              # Static assets
```

## 🔧 Development

### Available Scripts

```sh
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

### Code Quality

- TypeScript strict mode enabled
- ESLint for code linting
- Prettier for code formatting (recommended)
- Automated CI checks on PR

## 🚢 Deployment

### Via Lovable (Recommended)

1. Open [Lovable Project](https://lovable.dev/projects/4cd5d26c-ab1d-4667-bba9-bb677571534c)
2. Click Share → Publish
3. Click "Update" to deploy frontend changes

**Note:** Backend changes (Edge Functions, DB) deploy automatically.

### Via Other Platforms

See [Deployment Guide](./docs/deployment.md) for Vercel, Netlify, or custom hosting.

## 🌐 Custom Domain

Navigate to Project > Settings > Domains in Lovable to connect your custom domain.

**Requirements:** Paid Lovable plan

[Learn more about custom domains](https://docs.lovable.dev/features/custom-domain)

## 🔐 Security

- Row Level Security (RLS) on all database tables
- JWT authentication on all API endpoints
- Rate limiting per user and IP
- Input validation with Zod schemas
- XSS protection via React
- Secure secret management

## 🎨 Design System

- Semantic color tokens in `src/index.css`
- Responsive design (mobile-first)
- Dark mode support
- Accessibility-first approach
- Custom component variants

## 📊 Performance

- Bundle size optimized
- Code splitting by route
- Request deduplication
- Debouncing & throttling
- AI analysis caching (24h TTL)
- Skeleton loading states

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader compatible
- Focus indicators
- ARIA labels
- Reduced motion support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- Powered by [Supabase](https://supabase.com)
- News data from [WorldNews API](https://worldnewsapi.com)
- Maps by [Mapbox](https://mapbox.com)

## 📞 Support

For issues or questions:
- Check the [documentation](./docs/)
- Review existing issues
- Create a new issue with detailed information

---

**Built with ❤️ using Lovable**
