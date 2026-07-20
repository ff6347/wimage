<!-- ABOUTME: Records investigation and verification for provider-specific model IDs. -->
<!-- ABOUTME: Captures the deployment failure, implementation decision, and remaining type issue. -->

# Provider-specific model IDs

- [lesson] OpenRouter accepts qualified IDs such as `openai/gpt-5-mini`, while the direct OpenAI provider requires `gpt-5-mini`.
- [decision] Keep model constants qualified for OpenRouter and remove the `openai/` namespace only when creating a direct OpenAI model.
- [technique] Regression tests cover direct OpenAI formatting, OpenRouter formatting, and already-unqualified OpenAI IDs.
- [blocked] `git-bug` and branch pushes cannot read `~/.ssh/known_hosts` under the current nono profile.
- [risk] Full TypeScript checking fails because Astro `Locals` does not declare `runtime`; issue `49ef9ae` tracks the project-wide declaration.
