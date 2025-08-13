# 🧠 Idea Structuring Agent

[![CI](https://github.com/piotrlaczkowski/WebGUIBased-local-IdeationAgent/actions/workflows/ci.yml/badge.svg)](https://github.com/piotrlaczkowski/WebGUIBased-local-IdeationAgent/actions/workflows/ci.yml)
[![Deploy](https://github.com/piotrlaczkowski/WebGUIBased-local-IdeationAgent/actions/workflows/deploy.yml/badge.svg)](https://github.com/piotrlaczkowski/WebGUIBased-local-IdeationAgent/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](#)

> **An intelligent AI-powered chatbot that helps users structure and develop their ideas through interactive conversations.**

Powered by **LFM2 (LiquidFoundationModel-2)** running entirely in your browser using WebGPU, this application provides a sophisticated idea development experience with real-time conversation analysis, automatic summarization, and mobile-responsive design.

## ✨ Features

### 🤖 **AI-Powered Idea Development**
- **Local AI Processing**: Runs entirely in-browser using WebGPU acceleration
- **Intelligent Conversations**: LFM2 model provides contextual responses and follow-up questions
- **Smart Context Management**: Automatically manages conversation context for longer sessions
- **Real-time Summary Generation**: Live idea structuring and progress tracking

### 📱 **Mobile-First Design**
- **Fully Responsive**: Seamlessly adapts from mobile to desktop
- **Touch-Optimized**: Large touch targets and smooth interactions
- **Tab Navigation**: Easy switching between chat and summary on mobile
- **Safe Area Support**: Works perfectly on devices with notches
- **Performance Optimized**: Smooth animations and efficient rendering

### 🎯 **Idea Structuring**
- **Dynamic Summarization**: Real-time extraction of key concepts, goals, and next steps
- **Progress Tracking**: Visual progress bars and completion metrics
- **Smart Categorization**: Automatic organization of problems, solutions, and requirements
- **Export Capabilities**: Generate comprehensive idea reports

### 🛠️ **Developer Experience**
- **Modern Tech Stack**: React 19, TypeScript, Tailwind CSS 4, Vite 7
- **Type Safety**: Full TypeScript coverage with strict mode
- **ESLint Integration**: Code quality enforcement
- **Hot Reload**: Instant development feedback
- **Optimized Builds**: Code splitting and performance optimization

## 🚀 Live Demo

**[Try it Live](https://piotrlaczkowski.github.io/WebGUIBased-local-IdeationAgent/)** 

*Note: WebGPU support required (Chrome/Edge 113+, Firefox Nightly)*

## 🏗️ Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Build Tool**: Vite 7
- **AI Model**: Hugging Face Transformers.js with LFM2
- **Compute**: WebGPU for AI acceleration
- **State Management**: React Hooks + IndexedDB for persistence
- **Icons**: Lucide React
- **Code Editor**: Monaco Editor (for system prompt editing)

## 🛠️ Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Modern Browser** with WebGPU support:
  - Chrome/Edge 113+
  - Firefox Nightly (with WebGPU enabled)
  - Safari Technology Preview (experimental)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/piotrlaczkowski/WebGUIBased-local-IdeationAgent.git
   cd WebGUIBased-local-IdeationAgent
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### First Time Setup

1. **Model Loading**: On first visit, the LFM2 model (~350MB) will download automatically
2. **WebGPU Check**: The app will verify WebGPU support and initialize the model
3. **Start Chatting**: Begin describing your idea to start the structuring process

## 🏃‍♂️ Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run type-check` | Run TypeScript type checking |
| `npm run build:github` | Build for GitHub Pages |
| `npm run serve` | Build and serve locally |

### Development Workflow

1. **Code Style**: ESLint and Prettier are configured for consistent formatting
2. **Type Safety**: TypeScript strict mode ensures type safety
3. **Hot Reload**: Changes reflect instantly in development
4. **Module Federation**: Optimized chunk splitting for performance

### Browser Compatibility

| Browser | WebGPU Support | Status |
|---------|----------------|---------|
| Chrome 113+ | ✅ Native | Fully Supported |
| Edge 113+ | ✅ Native | Fully Supported |
| Firefox Nightly | ⚠️ Flag Required | Experimental |
| Safari TP | ⚠️ Experimental | Limited Support |

## 🚀 Deployment

### Automatic Deployment (GitHub Pages)

This project includes automatic deployment to GitHub Pages via GitHub Actions.

#### Setup Steps:

1. **Enable GitHub Pages**
   - Go to repository **Settings** → **Pages**
   - Select **GitHub Actions** as source

2. **Push to Main Branch**
   ```bash
   git push origin main
   ```

3. **Deployment Process**
   - CI runs tests and builds the app
   - Deployment workflow publishes to GitHub Pages
   - Site available at `https://piotrlaczkowski.github.io/WebGUIBased-local-IdeationAgent/`

#### Manual Deployment

```bash
# Build for GitHub Pages
npm run build:github

# Deploy dist folder to your hosting provider
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BASE_PATH` | Base path for deployment | `/` |

## 🔄 CI/CD Pipeline

### Continuous Integration

**Triggers**: Pull requests and pushes to `main`

**Checks**:
- ✅ ESLint code quality
- ✅ TypeScript type checking  
- ✅ Build verification
- ✅ Dependency caching

### Continuous Deployment

**Triggers**: Pushes to `main` branch

**Process**:
1. Run full CI pipeline
2. Build optimized production bundle
3. Deploy to GitHub Pages
4. Update live site

### Build Optimization

- **Code Splitting**: Vendor, UI, and ML libraries separated
- **Tree Shaking**: Unused code eliminated
- **Asset Optimization**: Images and fonts optimized
- **Caching Strategy**: Long-term caching for static assets

## 📱 Mobile Experience

### Responsive Design
- **Breakpoints**: Mobile-first approach with `lg:` prefix for desktop
- **Touch Targets**: Minimum 44px for accessibility
- **Safe Areas**: Support for notched devices
- **Viewport Handling**: Proper mobile viewport configuration

### Performance Optimizations
- **Reduced Animations**: Simplified animations on mobile
- **Touch Scrolling**: Native smooth scrolling
- **GPU Acceleration**: Hardware acceleration where beneficial
- **Memory Management**: Efficient resource usage

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](.github/CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode, full type coverage
- **ESLint**: Airbnb configuration with React hooks
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Standard commit message format

## 📋 Project Structure

```
LFM2-WebGPU-IDEATOR/
├── .github/                 # GitHub Actions workflows
│   ├── workflows/
│   │   ├── ci.yml          # Continuous Integration
│   │   └── deploy.yml      # Deployment workflow
│   └── DEPLOYMENT.md       # Deployment documentation
├── public/                 # Static assets
│   ├── .nojekyll          # Disable Jekyll processing
│   └── liquidai-logo.svg  # App icon
├── src/
│   ├── components/        # React components
│   │   ├── icons/        # Icon components
│   │   └── *.tsx         # UI components
│   ├── constants/        # App configuration
│   ├── hooks/           # Custom React hooks
│   ├── utils.ts         # Utility functions
│   ├── index.css        # Global styles
│   └── main.tsx         # App entry point
├── dist/                # Build output (generated)
└── ...config files
```

## 🔧 Configuration

### Vite Configuration
- **Base Path**: Automatically configured for GitHub Pages
- **Build Optimization**: Code splitting and source maps
- **Development**: HMR and fast refresh

### Tailwind CSS
- **Version**: 4.x with modern features
- **Mobile-First**: Responsive design approach
- **Custom Classes**: Specialized mobile and animation classes

## 🎯 Roadmap

- [ ] **Offline Support**: PWA capabilities for offline usage
- [ ] **Voice Input**: Speech-to-text for idea input
- [ ] **Collaboration**: Real-time collaboration features
- [ ] **Templates**: Pre-built idea structuring templates
- [ ] **Export Formats**: PDF, Word, and other export options
- [ ] **Analytics**: Idea development analytics dashboard

## ❓ FAQ

### WebGPU Issues
**Q: Model fails to load?**
A: Ensure you're using a supported browser with WebGPU enabled. Try Chrome 113+ for best compatibility.

**Q: App runs slowly?**
A: WebGPU acceleration requires a modern GPU. Integrated graphics may have reduced performance.

### Development Issues
**Q: Build fails?**
A: Run `npm run type-check` to identify TypeScript issues, then `npm run lint:fix` for code quality.

**Q: Hot reload not working?**
A: Clear browser cache and restart development server: `npm run dev`

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using React, TypeScript, and WebGPU**

[🌟 Star this repo](https://github.com/piotrlaczkowski/WebGUIBased-local-IdeationAgent) • [🐛 Report Bug](https://github.com/piotrlaczkowski/WebGUIBased-local-IdeationAgent/issues) • [💡 Request Feature](https://github.com/piotrlaczkowski/WebGUIBased-local-IdeationAgent/issues)

</div>