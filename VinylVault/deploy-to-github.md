# Deploying Your Vinyl Record Collection App to GitHub Pages

## Prerequisites
- A GitHub account
- Git installed on your computer
- Your project code ready for deployment

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in to your account
2. Click the "+" button in the upper right corner and select "New repository"
3. Name your repository (e.g., "vinyl-record-collection")
4. Set the repository to "Public" 
5. Do not initialize with a README, .gitignore, or license (we'll push your existing code)
6. Click "Create repository"

## Step 2: Prepare Your Project for GitHub Pages

Your Firebase app needs a small configuration change to work correctly on GitHub Pages. Add a basename to your router:

1. Open your `client/src/App.tsx` file
2. Modify your Router component to include a basename that matches your repository name

```tsx
<Router basename="/vinyl-record-collection">
  {/* Your routes */}
</Router>
```

## Step 3: Create a GitHub Pages Build Configuration

1. Create a new file in your project root named `vite.config.ts` (or modify your existing one):

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/vinyl-record-collection/', // Replace with your repository name
  build: {
    outDir: 'dist',
  }
})
```

## Step 4: Create a GitHub Actions Workflow for Automatic Deployment

1. Create a directory structure in your project: `.github/workflows/`
2. Create a file named `deploy.yml` inside this directory:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}

      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages
```

## Step 5: Commit and Push Your Code to GitHub

1. Initialize a Git repository in your project (if not already done):
```bash
git init
```

2. Add your files to the repository:
```bash
git add .
```

3. Commit your changes:
```bash
git commit -m "Initial commit for GitHub Pages deployment"
```

4. Add your GitHub repository as a remote:
```bash
git remote add origin https://github.com/YOUR-USERNAME/vinyl-record-collection.git
```

5. Push your code to GitHub:
```bash
git push -u origin main
```

## Step 6: Configure GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Click on "Secrets and variables" → "Actions"
4. Add the following secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_PROJECT_ID`
   
   (Use the same values you're using in your local development)

## Step 7: Verify Deployment

1. Go to your GitHub repository
2. Click on the "Actions" tab to see the workflow running
3. Once completed, your site will be available at:
   https://YOUR-USERNAME.github.io/vinyl-record-collection/

## Step 8: Update Firebase Authorized Domains

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Authentication → Settings → Authorized domains
4. Add your GitHub Pages domain: `YOUR-USERNAME.github.io`

## Troubleshooting

- If you have issues with routes, make sure you're using the correct basename in your Router
- If authentication isn't working, check that you've added your GitHub Pages domain to Firebase Authorized domains
- For any build errors, check the GitHub Actions logs for details