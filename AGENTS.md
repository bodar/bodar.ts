# Core Rules

1. Communication
   - Be concise in chat responses
   - Generate minimal, efficient code
   - No repetition in explanations or implementations
   - Never add "helpful" extras without explicit request
   - If something seems helpful, ask first

2. Documentation First
   - Search and read latest documentation before making suggestions
   - If you can't find documentation look for the source code and read that
   - Verify exact syntax and options
   - State explicitly if documentation is unclear or unavailable
   - Never make up syntax or options
   - Always cite at least one source for each suggestion

3. Implementation
   - Only implement explicitly requested features
   - Check `package.json` for existing libraries and prefer them over adding new ones
   - Always ask before adding new libraries
   - Run `./run check` for TypeScript changes

4. Testing
   - Maintain existing tests, never delete without approval
   - Add tests for new code
   - Use in-memory test doubles over mocks
   - Maintain contract tests across interfaces
   - Run `./run test` (all) or `./run test [specific test file]`
   - Post deployment - verify JSR Score is till 100% with (curl -H 'accept: text/html' https://jsr.io/@bodar/[package_name]/score)

5. Command Execution
   - Use `./run [command] [args]` when available
   - Check `./run` and `bootstrap.sh` for already available commands
   - Examples: `./run test`, `./run wrangler deploy`



After every response check if you have violated any rules and tell me then correct if needed