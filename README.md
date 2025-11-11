# Moondream Vision AI Camera App

A web application that uses your computer's camera to capture images and analyze them using Moondream AI's vision language model.

## Setup

1. Install dependencies:
```sh
npm install
```

2. Create a `.env` file in the project root:
```sh
MOONDREAM_API_KEY=your-api-key-here
```

Get your free API key from [Moondream Console](https://console.moondream.ai/) (5,000 free requests per day).

## Project Structure

```text
/
├── src/
│   ├── components/
│   │   └── camera-capture.astro  # Camera UI component
│   └── pages/
│       ├── index.astro            # Main page
│       └── api/
│           └── analyze.ts         # Moondream API endpoint
├── .env                           # Environment variables (create this)
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## How It Works

1. Click "Start Camera" to access your webcam
2. Click "Capture Image" to take a photo
3. Enter a question about the image (e.g., "What do you see?" or "Describe this scene")
4. Click "Analyze" to get AI-powered insights from Moondream

## Resources

- [Moondream Documentation](https://docs.moondream.ai/)
- [Astro Documentation](https://docs.astro.build)
