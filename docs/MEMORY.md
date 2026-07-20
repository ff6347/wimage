<!-- ABOUTME: Stores durable technical decisions and lessons for the project. -->
<!-- ABOUTME: Summarizes provider integration constraints discovered during development. -->

# Memory

## AI providers

- [decision] Model constants use OpenRouter-qualified IDs; direct OpenAI calls remove the `openai/` namespace through `modelIdForProvider`.
- [lesson] OpenRouter accepts IDs such as `openai/gpt-5-mini`, while the direct OpenAI API requires `gpt-5-mini`.

## Type checking

- [risk] Astro `Locals` does not declare the Cloudflare `runtime` property, so a full `tsc --noEmit` fails until issue `49ef9ae` is resolved.

## Package management

- [lesson] Cloudflare selects pnpm when `pnpm-lock.yaml` exists and requires it to match `package.json` during frozen installs.
- [technique] Reproduce deployment installs with the pnpm version reported by Cloudflare in a clean temporary directory.
