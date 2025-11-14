# API Testing with Hurl

This directory contains Hurl test files for testing the Wimage API endpoints.

## Prerequisites

1. Install Hurl: `brew install hurl` (macOS) or see https://hurl.dev/docs/installation.html
2. Make sure the dev server is running: `npm run dev`
3. Set up your `.env` file with required keys:
   - `MOONDREAM_API_KEY`
   - `OPENAI_API_KEY`

## Test Files

- **api-test.hurl** - Complete integration test suite (all endpoints)
- **extract-json.hurl** - JSON extraction endpoint tests
- **check-wikipedia.hurl** - Wikipedia article checker tests
- **fetch-wikipedia-text.hurl** - Wikipedia text fetcher tests
- **summarize-text.hurl** - Article summarization tests
- **generate-visualization.hurl** - Expressive typography generation tests

See [hurl-tests-readme.md](./hurl-tests-readme.md) for detailed documentation on individual test files.

## Running Tests

Run all tests:
```bash
hurl --test docs/*.hurl
```

Run integration tests:
```bash
hurl --test docs/api-test.hurl
```

Run specific endpoint tests:
```bash
hurl --test docs/extract-json.hurl
hurl --test docs/check-wikipedia.hurl
hurl --test docs/fetch-wikipedia-text.hurl
hurl --test docs/summarize-text.hurl
hurl --test docs/generate-visualization.hurl
```

Run with verbose output:
```bash
hurl --test --verbose docs/extract-json.hurl
```

## API Endpoints

### POST /api/generate-visualization
Generates unique expressive HTML pages with spatial typography using OpenAI GPT-5 Mini.

**Request:**
```json
{
  "summaries": [
    {
      "title": "JavaScript",
      "summary": "JavaScript is a high-level programming language..."
    },
    {
      "title": "Python",
      "summary": "Python is an interpreted language..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "html": "<!DOCTYPE html><html>... complete HTML page with inline CSS ..."
}
```

**Note:** Each request generates a completely unique design. The HTML includes experimental spatial layouts, creative typography, animations, and modern design techniques. Temperature is set to 1.2 for maximum creativity.

### POST /api/extract-json
Extracts structured JSON from Moondream text results using OpenAI GPT-4o Mini.

**Request:**
```json
{
  "result": "The image shows a laptop, coffee mug, and notebook"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "rawResult": "..."
}
```

### POST /api/check-wikipedia
Checks if Wikipedia articles exist for given terms.

**Request:**
```json
{
  "items": ["term1", "term2", "term3"]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "term": "term1",
      "exists": true,
      "pageId": 12345,
      "url": "https://en.wikipedia.org/wiki/Term1"
    }
  ]
}
```

### POST /api/summarize-text
Summarizes Wikipedia articles using OpenAI GPT-4o Mini into two concise sentences.

**Request:**
```json
{
  "articles": [
    {
      "title": "JavaScript",
      "text": "Full article text..."
    },
    {
      "title": "Python",
      "text": "Full article text..."
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "title": "JavaScript",
      "summary": "JavaScript is a high-level programming language that conforms to the ECMAScript standard. It supports multiple programming paradigms including event-driven, functional, and imperative styles."
    }
  ]
}
```

### POST /api/fetch-wikipedia-text
Fetches full article text from Wikipedia URLs.

**Request:**
```json
{
  "urls": [
    "https://en.wikipedia.org/wiki/JavaScript",
    "https://en.wikipedia.org/wiki/Python_(programming_language)"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "url": "https://en.wikipedia.org/wiki/JavaScript",
      "title": "JavaScript",
      "text": "Full article text...",
      "preview": "First 5 lines..."
    }
  ]
}
```

### POST /api/analyze
Analyzes images using Moondream vision AI.

**Request:** multipart/form-data with `image` file

**Response:**
```json
{
  "result": "Description of the image..."
}
```

## Complete Workflow

The app follows this data flow:

1. **Capture Image** → `/api/analyze` (Moondream)
2. **Extract JSON** → `/api/extract-json` (OpenAI GPT-5 Mini)
3. **Check Wikipedia** → `/api/check-wikipedia` (MediaWiki API)
4. **Fetch Article Text** → `/api/fetch-wikipedia-text` (MediaWiki API)
5. **Summarize Articles** → `/api/summarize-text` (OpenAI GPT-5 Mini)
6. **Generate Visualization** → `/api/generate-visualization` (OpenAI GPT-5 Mini)

## Iterating on the Visualization Prompt

The visualization generation prompt is located in `/src/pages/api/generate-visualization.ts`. You can modify the prompt to experiment with different design styles:

- Adjust `temperature` (currently 1.2) for more/less creativity
- Modify the requirements list to change design constraints
- Add specific design styles (brutalist, minimalist, maximalist, etc.)
- Request specific CSS techniques (grid, flexbox, absolute positioning)
- Change color schemes, typography styles, or animation types

After modifying the prompt, test with:
```bash
hurl --test docs/generate-visualization.hurl
```
