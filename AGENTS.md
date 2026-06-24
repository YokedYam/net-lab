# Agent brief

Read **`.github/copilot-instructions.md`** first. It is the full handoff: how to run/build/test/
deploy, the hard rules (human voice, no em dashes, de-personalized, accuracy), the architecture
map, how to add missions and PBQs, how to verify your work with Playwright before handing it
back, and the remaining roadmap.

Standing objective: extend this into a complete, hands-on CompTIA Network+ (N10-009) study tool,
one domain at a time, without breaking the existing voice, look, or test suite. Every change
must pass `npm run build` and `npm test`, contain no em dashes, stay in the human voice, and be
screenshot-verified with Playwright. Deploy to the live site (`npm run deploy`) only when asked.

---

## Next task: Exam Sim section

`src/examData.ts` has been written with 150 exam-caliber N10-009 questions ready to use. Your
job is to wire up a new Exam Sim section in the app.

### What to build

**New tab/section:** Add an "Exam Sim" section in `src/App.tsx` after the existing Quiz section.
It should appear as a tab in the section switcher at the top (same pattern as Quiz, Flashcards,
Visual Lab, etc.).

**Per-session question selection:** On each new exam attempt, randomly shuffle `EXAM_BANK` from
`src/examData.ts` and select the first 65 questions. Use a simple Fisher-Yates shuffle. Do not
persist the shuffle across page reloads.

**Timer:** Start a 90-minute countdown when the user clicks "Start Exam." Display it visibly
(MM:SS). When it reaches 0:00, automatically end the exam and show the results screen. The timer
does not pause.

**Question display:** Show one question at a time. The user picks one of four choices. Once
submitted, they cannot change the answer. Navigation: Next button advances. Do not allow backward
navigation during the exam (keeps it closer to real exam conditions).

**On wrong answer:** Show the static `explanation` from the question object immediately after the
user submits an incorrect answer. Below that explanation, show an "Ask AI" button. When clicked,
call the existing `/api/generate` Azure Function with a prompt like:

```
The user answered this Network+ question incorrectly.
Question: {question}
Correct answer: {choices[answer]}
Their answer: {choices[selected]}
Explanation: {explanation}
Give a 2-3 sentence deeper explanation of why the correct answer is right and what makes the wrong answer plausible. Be direct and use plain English.
```

Stream or display the response below the static explanation. On correct answers, just show the
explanation without the AI button.

**End screen:** When all 65 questions are answered (or the timer expires), show a results screen:
- Score: X / 65 (pass if >= 39, which is ~60% -- the real N10-009 passing threshold)
- Pass/fail indicator
- Per-domain breakdown: list each domain (1.0 through 5.0) with questions correct / questions
  seen in that session
- "Retake" button that re-shuffles and starts fresh

### File changes expected

- `src/examData.ts` -- already done, do not modify the question content
- `src/App.tsx` -- add the Exam Sim section
- `src/ExamSim.tsx` (or inline) -- the exam component; create wherever makes sense for the
  existing pattern
- Do NOT modify `src/quizData.ts` or existing Quiz behavior

### Hard rules (from copilot-instructions.md, repeated for emphasis)

- No em dashes anywhere in any new string, label, or copy
- Human voice: contractions, plain words, no jargon
- De-personalized: no names, schools, homelabs, specific tools outside the exam content
- Must pass `npm run build` (TypeScript strict + Vite) and `npm test` (Vitest, 38+ tests)
- Verify visually with Playwright before reporting done
- Do not deploy; leave `npm run deploy` for the user to run
