# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based web application that integrates with Moondream AI's vision API. The app allows users to capture images from their camera and analyze them using Moondream's vision language model. Users can ask questions about images and receive AI-powered responses.

## Development Commands

All commands run from the project root:

- `npm run dev` - Start local dev server at `localhost:4321`
- `npm run build` - Build production site to `./dist/`
- `npm run preview` - Preview production build locally
- `npm run astro ...` - Run Astro CLI commands (e.g., `astro add`, `astro check`)

## Project Structure

- `src/pages/` - File-based routing (each `.astro` or `.md` file becomes a route)
- `src/components/` - Astro/React/Vue/Svelte/Preact components
- `public/` - Static assets (images, fonts, etc.)
- `astro.config.mjs` - Astro configuration
- `tsconfig.json` - TypeScript configuration (extends `astro/tsconfigs/strict`)

## TypeScript Configuration

The project uses Astro's strict TypeScript configuration. Type checking is enforced.

## Environment Variables

Create a `.env` file in the project root with the following variable:

```
MOONDREAM_API_KEY=your-api-key-here
```

Get a free API key from https://console.moondream.ai/ (5,000 free requests per day).

## API Routes

- `POST /api/analyze` - Accepts form data with `image` (File) and `query` (string), returns Moondream detection results

## Architecture

- **Frontend**: Camera capture component (`src/components/camera-capture.astro`) handles webcam access, image capture, and API communication
- **Backend**: API route (`src/pages/api/analyze.ts`) processes images using the Moondream SDK and returns results
- **Dependencies**: Uses the `moondream` npm package for vision AI capabilities
