# WImage

An experimental web application that captures images from your camera and transforms them into expressive typographic visualizations through a multi-stage AI pipeline.

Created during a generative AI workshop by Ivan Iovine as part of master studies Studio X - Speculative Software at University of Applied Sciences Potsdam (FH-potsdam) by:
- [Fabian Morón Zirfas](https://github.com/ff6347)
- [Lele Schlaich](#)

## What It Does

WImage takes a photo from your webcam and processes it through a creative pipeline:

1. **Vision AI Analysis** - Moondream identifies objects in the image
2. **Term Extraction** - GPT-4o-mini extracts key items
3. **Knowledge Retrieval** - Wikipedia articles are fetched for identified objects
4. **Summarization** - GPT-5 distills key facts from articles
5. **Visualization** - GPT-5 generates unique expressive typography HTML

The result is a creative, text-based visual experience inspired by what the AI sees in your photo.

## Information Flow

See the [information flow canvas](./docs/information-flow.canvas) for a visual representation of the data pipeline. Open it with [Obsidian](https://obsidian.md/) to explore the architecture interactively.

## Setup

### Prerequisites

- Node.js 18+
- API keys (see below)

### Installation

1. Install dependencies:
```sh
npm install
```

2. Create a `.env` file in the project root:
```sh
MOONDREAM_API_KEY=your-moondream-key
OPENAI_API_KEY=your-openai-key
```

**API Keys:**
- **Moondream**: Get your free key from [Moondream Console](https://console.moondream.ai/) (5,000 free requests per day)
- **OpenAI**: Get your key from [OpenAI Platform](https://platform.openai.com/)

## Development

All commands run from the project root:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build production site to `./dist/`               |
| `npm run preview`         | Preview build locally before deploying           |
| `npm run astro ...`       | Run Astro CLI commands                           |

## Project Structure

```text
/
├── docs/
│   └── information-flow.canvas  # Obsidian canvas of data flow
├── src/
│   ├── components/
│   │   └── camera-capture.astro # Camera UI component
│   ├── pages/
│   │   ├── index.astro          # Main interactive page
│   │   ├── demo.astro           # Auto-workflow demo
│   │   └── api/                 # API endpoints
│   │       ├── analyze.ts       # Moondream vision analysis
│   │       ├── extract-json.ts  # Extract items from text
│   │       ├── clean-terms.ts   # Clean terms for Wikipedia
│   │       ├── check-wikipedia.ts        # Find Wikipedia articles
│   │       ├── fetch-wikipedia-text.ts   # Fetch article content
│   │       ├── summarize-text.ts         # Summarize articles
│   │       └── generate-visualization.ts # Create typography
│   ├── lib/
│   │   └── cors.ts              # CORS and rate limiting
│   └── styles/
│       └── shared.css           # Shared styles
├── .env                         # Environment variables (create this)
└── package.json
```

## Features

### API Transparency

Each API endpoint exposes its system prompts and model information through GET requests. When you interact with the app, you'll see exactly what prompts are sent to each AI model before execution.

### Rate Limiting

Built-in rate limiting protects against abuse while allowing legitimate usage. Limits are per-client-ID with a sliding window approach.

### Two Modes

- **Interactive Mode** (`/`) - Step through the pipeline manually, seeing results at each stage
- **Demo Mode** (`/demo`) - Automatic workflow from capture to final visualization

## Technology Stack

- **[Astro](https://astro.build)** - Web framework
- **[Moondream AI](https://moondream.ai)** - Vision language model
- **[OpenAI GPT-4o-mini & GPT-5](https://openai.com)** - Text processing and generation
- **[Wikipedia MediaWiki API](https://www.mediawiki.org/wiki/API)** - Knowledge retrieval
- **TypeScript** - Type-safe development

## Deployment

The project is configured for deployment on [Cloudflare Pages](https://pages.cloudflare.com/). Set environment variables in your Cloudflare Pages dashboard.

## License

This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/).

**You are free to:**
- Share — copy and redistribute the material in any medium or format
- Adapt — remix, transform, and build upon the material

**Under the following terms:**
- **Attribution** — You must give appropriate credit to Fabian Morón Zirfas and Lele Schlaich, provide a link to the license, and indicate if changes were made
- **NonCommercial** — You may not use the material for commercial purposes
- **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license

## Resources

- [Moondream Documentation](https://docs.moondream.ai/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Astro Documentation](https://docs.astro.build)
- [Wikipedia API Documentation](https://www.mediawiki.org/wiki/API:Main_page)
