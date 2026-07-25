#!/bin/bash
# Deploy script for FUOYE Grading System
# Builds the Vite project and pushes dist/public to gh-pages branch

set -e

echo "=== Building FUOYE Grading System ==="

cd "$(dirname "$0")/uni-grading-system"

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build the project
echo "Building for production..."
pnpm run build

echo "=== Build complete ==="
echo "Output in: uni-grading-system/dist/public/"

# Check if gh-pages branch exists, if not create it
echo ""
echo "To deploy, run the following commands:"
echo ""
echo "  git add uni-grading-system/dist/ --force"
echo "  git commit -m 'Build for GitHub Pages deployment'"
echo "  git subtree split --prefix uni-grading-system/dist/public -b gh-pages"
echo "  git push origin gh-pages --force"
echo ""
echo "Then in GitHub repo settings > Pages, set source to 'gh-pages' branch."
