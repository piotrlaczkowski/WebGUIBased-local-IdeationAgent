# 🚀 Deployment Guide

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

## 📋 Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** > **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

### 2. Repository Configuration

The deployment is configured for a repository named `LFM2-WebGPU-IDEATOR`. If your repository has a different name:

1. Update the `VITE_BASE_PATH` in `vite.config.ts` (line 14)
2. Update the `build:github` script in `package.json` (line 13)

Or set a custom base path using repository secrets:
1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Add a new secret: `VITE_BASE_PATH` with value `/your-repo-name/`

### 3. Automatic Deployment

The deployment happens automatically when:
- Code is pushed to the `main` branch
- You manually trigger the workflow from the Actions tab

## 🔧 Workflows

### Deploy Workflow (`.github/workflows/deploy.yml`)
- **Triggers**: Push to main branch, manual trigger
- **Actions**: Build the application and deploy to GitHub Pages
- **Dependencies**: Node.js 20, automatic package manager detection
- **Caching**: Optimized caching for faster builds

### CI Workflow (`.github/workflows/ci.yml`)
- **Triggers**: Pull requests to main, pushes to main
- **Actions**: Linting, type checking, build verification
- **Purpose**: Ensure code quality before deployment

## 📦 Build Configuration

### Vite Configuration
- **Base Path**: Automatically configured for GitHub Pages
- **Chunk Splitting**: Optimized for caching (vendor, UI, ML chunks)
- **Source Maps**: Generated in production for debugging
- **Static Assets**: Properly handled with `.nojekyll` file

### Environment Variables
- `VITE_BASE_PATH`: Override the base path for deployment
- `NODE_ENV`: Automatically set by the build process

## 🛠️ Local Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Build specifically for GitHub Pages
npm run build:github

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

## 🌐 Access Your Deployed App

After successful deployment, your app will be available at:
```
https://your-username.github.io/your-repository-name/
```

## 🔧 Troubleshooting

### Common Issues

1. **404 Error on Deployment**
   - Check if the base path is correctly configured
   - Verify the repository name matches the configuration

2. **Assets Not Loading**
   - Ensure `.nojekyll` file exists in the `public` folder
   - Check browser console for CORS or path issues

3. **Build Failures**
   - Check the Actions tab for detailed error logs
   - Verify all dependencies are properly installed
   - Ensure TypeScript compilation passes

4. **Permissions Issues**
   - Verify GitHub Pages is enabled in repository settings
   - Check if the workflow has proper permissions to deploy

### Debug Steps

1. Check the **Actions** tab for workflow run details
2. Review build logs for specific error messages
3. Test local build with `npm run build:github`
4. Verify the generated `dist` folder contains expected files

## 📊 Performance Optimizations

- **Code Splitting**: Vendor libraries separated for better caching
- **Asset Optimization**: Images and fonts optimized for web
- **Lazy Loading**: Components loaded on demand
- **Bundle Analysis**: Use `npm run build` and analyze the output

## 🔒 Security

- **Secrets Management**: Use GitHub secrets for sensitive data
- **HTTPS**: Automatically enforced by GitHub Pages
- **CSP Headers**: Consider adding Content Security Policy headers

## 📈 Monitoring

- **GitHub Actions**: Monitor deployment status
- **GitHub Pages**: Check deployment history in repository settings
- **Analytics**: Consider adding Google Analytics or similar tools

---

For more detailed information about GitHub Pages and Actions, refer to the [official documentation](https://docs.github.com/en/pages).
