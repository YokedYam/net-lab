# Agent brief

Read **`.github/copilot-instructions.md`** first. It is the full handoff: how to run/build/test/
deploy, the hard rules (human voice, no em dashes, de-personalized, accuracy), the architecture
map, how to add missions and PBQs, how to verify your work with Playwright before handing it
back, and the remaining roadmap.

Standing objective: extend this into a complete, hands-on CompTIA Network+ (N10-009) study tool,
one domain at a time, without breaking the existing voice, look, or test suite. Every change
must pass `npm run build` and `npm test`, contain no em dashes, stay in the human voice, and be
screenshot-verified with Playwright. Deploy to the live site (`npm run deploy`) only when asked.
