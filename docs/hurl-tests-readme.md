# Hurl API Tests

Individual Hurl test files for each API endpoint. Each file tests a single API independently with comprehensive test cases.

## Prerequisites

1. Install Hurl: `brew install hurl` (macOS) or see https://hurl.dev/docs/installation.html
2. Start the dev server: `npm run dev`
3. Set up `.env` file with required API keys:
   - `MOONDREAM_API_KEY` (for analyze endpoint)
   - `OPENAI_API_KEY` (for extract-json and summarize-text endpoints)

## Test Files

### extract-json.hurl
Tests the JSON extraction endpoint that uses OpenAI to parse Moondream results.

**Run:**
```bash
hurl --test docs/extract-json.hurl
```

**Test coverage:**
- Natural language description parsing
- Array format parsing
- Markdown code block parsing
- Error handling (empty, missing, invalid input)

### check-wikipedia.hurl
Tests the Wikipedia article existence checker using MediaWiki API.

**Run:**
```bash
hurl --test docs/check-wikipedia.hurl
```

**Test coverage:**
- Technical terms (should exist)
- Common objects
- Non-existent terms
- Mixed results
- Error handling

### fetch-wikipedia-text.hurl
Tests the Wikipedia article text fetcher.

**Run:**
```bash
hurl --test docs/fetch-wikipedia-text.hurl
```

**Test coverage:**
- Single article fetch
- Multiple articles fetch
- Special characters in URLs
- Invalid URL formats
- Mixed valid/invalid URLs
- Error handling

### summarize-text.hurl
Tests the article summarization endpoint using OpenAI.

**Run:**
```bash
hurl --test docs/summarize-text.hurl
```

**Test coverage:**
- Single article summarization
- Multiple articles summarization
- Long article handling
- Missing text/title handling
- Mixed valid/invalid articles
- Error handling

## Running Tests

### Run all tests
```bash
hurl --test docs/*.hurl
```

### Run specific test file
```bash
hurl --test docs/extract-json.hurl
```

### Run with verbose output
```bash
hurl --test --verbose docs/extract-json.hurl
```

### Run specific test by entry number
```bash
hurl --test docs/extract-json.hurl --from-entry 3
```

### Run tests in parallel (requires GNU parallel)
```bash
ls docs/*.hurl | parallel -j4 "hurl --test {}"
```

## Test Structure

Each test file follows this pattern:

1. **Happy path tests** - Valid inputs with expected successful responses
2. **Edge case tests** - Special characters, long inputs, boundary conditions
3. **Error tests** - Invalid inputs, missing fields, wrong types

## Expected Behavior

- **200 OK**: Request processed successfully (even if individual items have errors)
- **400 Bad Request**: Invalid request format or missing required fields
- **500 Internal Server Error**: Server-side errors (API key issues, etc.)

## Notes

- Wikipedia API tests don't require authentication
- OpenAI-dependent tests (extract-json, summarize-text) require `OPENAI_API_KEY`
- Tests are independent and can run in any order
- Each test file can be run standalone without dependencies
