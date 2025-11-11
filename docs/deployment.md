# Deployment to Cloudflare Pages

This project is configured to deploy to Cloudflare Pages with server-side rendering support.

## Prerequisites

1. A Cloudflare account
2. Git repository (GitHub, GitLab, etc.)
3. Environment variables set up:
   - `MOONDREAM_API_KEY`
   - `OPENAI_API_KEY`

## Deployment Methods

### Method 1: Deploy via Wrangler CLI (Manual)

1. Install dependencies:
```bash
npm install
```

2. Build and deploy:
```bash
npm run deploy
```

3. On first deployment, you'll be prompted to log in to Cloudflare and create a new project.

### Method 2: Deploy via Cloudflare Dashboard (CI/CD - Recommended)

1. Push your code to a Git repository

2. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)

3. Navigate to **Compute (Workers) > Workers & Pages**

4. Click **Create** and select the **Pages** tab

5. Connect your Git repository

6. Configure the build settings:
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

7. Add environment variables:
   - Go to **Settings > Environment Variables**
   - Add `MOONDREAM_API_KEY` with your Moondream API key
   - Add `OPENAI_API_KEY` with your OpenAI API key

8. Click **Save and Deploy**

## Environment Variables

You need to set these environment variables in the Cloudflare Dashboard:

- `MOONDREAM_API_KEY` - Your Moondream API key from https://console.moondream.ai/
- `OPENAI_API_KEY` - Your OpenAI API key from https://platform.openai.com/

## Local Development with Cloudflare

To test with Cloudflare Pages locally:

```bash
npm run pages:dev
```

This builds your site and runs it with Wrangler's local development server.

## Configuration Files

- `wrangler.jsonc` - Wrangler configuration for Cloudflare Pages
- `astro.config.mjs` - Astro configuration with Cloudflare adapter

## Important Notes

### Rate Limiting

The API endpoints have rate limiting (1 request per minute per endpoint per IP). This is tracked in-memory, so it will reset when your Worker restarts.

### CORS Protection

All API endpoints validate that requests come from the same origin. Direct API calls from external domains will be blocked with a 403 error.

### Sessions

The Cloudflare adapter enables sessions with Cloudflare KV using the "SESSION" binding. If you see an error about invalid bindings, you may need to configure KV in your wrangler config.

## Troubleshooting

### Build Warnings

You may see warnings about Node.js built-in modules (`http`, `https`). These are expected when using packages like Moondream and OpenAI that are designed for Node.js but work fine in the Cloudflare Workers environment.

### 404 Pages

The project uses Cloudflare Pages' default single-page application rendering behavior. If you want a custom 404 page, you'll need to create `src/pages/404.astro`.

## Monitoring

After deployment, you can monitor your site:

1. View logs in the Cloudflare Dashboard under **Workers & Pages > [Your Project] > Logs**
2. Check analytics under **Analytics**
3. Monitor function usage and costs under **Usage**
