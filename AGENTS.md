<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:auto-execution-rule -->
# Auto-Execution Mode
When working on multi-phase implementation plans or complex projects, execute all phases sequentially and continuously. Do NOT stop to ask for the user's explicit approval or acceptance between phases or steps, unless there is a critical blocker, a completely ambiguous choice that requires user input, or the user explicitly asks to pause. Proactively write code, run commands, and complete tasks autonomously.
<!-- END:auto-execution-rule -->

<!-- BEGIN:auto-push-rule -->
# Auto-Push to GitHub
Whenever you make any code changes, complete a feature, or finish a task, automatically commit and push the changes to GitHub IMMEDIATELY without waiting for explicit user instructions. 
IMPORTANT: Since the OS is Windows and the shell is PowerShell, always use `;` instead of `&&` to chain commands (e.g., `git add .; git commit -m "..."; git push`).
<!-- END:auto-push-rule -->