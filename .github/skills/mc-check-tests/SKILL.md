---
name: mc-check-tests
description: Run and diagnose tests, fix defects in the test itself, and report code failures without changing production code.
---

# Check test execution

Use this skill when asked to run tests and determine whether a failure comes from the test or from the application code.

## Scope

- If the user supplies or tags a file as context, inspect only that file. Do not open implementation files, neighboring tests, configuration, or documentation to investigate the failure.
- You may read the execution output and stack trace. A path mentioned by the runner is not permission to inspect that file.
- If no file is supplied, run the complete project test suite and inspect all failures, including the relevant tests and the smallest implementation paths needed to establish each root cause.
- Keep any edits within the supplied test file when the test itself is defective. Preserve existing user changes; do not revert unrelated work.

## Procedure

1. Determine scope from the supplied context. If a file is supplied or tagged, run the narrowest test command for that file and respect the file-only inspection scope. If no file is supplied, run the complete project test suite first; use the repository's aggregate command if it covers the whole project, or run the test commands for all test-bearing workspaces. Do not limit a project-wide run to changed files or to a root command that covers only one package. Then isolate each failure with focused reruns.
2. Record the command and complete failure details: assertion, expected and actual values, stack trace, and whether the result is reproducible. Separate test/code failures from environment, setup, and intermittent failures rather than forcing an unsupported binary diagnosis.
3. Attribute the root cause using evidence:
   - **Test defect:** the test has an invalid expectation, fixture, mock, setup, or assertion relative to the behavior it claims to verify. Correct the test; do not weaken or remove coverage merely to make it pass.
   - **Code defect:** the test is valid and execution demonstrates that application behavior violates its expectation. Do not modify production code. Deliver a report so the user can decide how to proceed.
   - **Environment or inconclusive:** explain the evidence and what prevents a reliable test-versus-code attribution.
4. With a supplied-file restriction, never inspect other files to confirm a suspected code defect. If the test output and supplied file do not prove the implementation is wrong, report it as suspected or inconclusive, state that the scope prevented confirmation, and do not edit application code.
5. After correcting a test defect, rerun that exact test and verify the correction. If it still fails, reassess the cause instead of making further expectation-only changes.

## Report

Respond in the user's language. Keep the report concise and include:

- The exact command run and whether it passed.
- For a test defect, the root cause, the test-only change, and the rerun result.
- For a code defect, the failing behavior, evidence from the test output, and the relevant test location. State explicitly that production code was not changed and identify any limits on confirmation.
- For an environment or inconclusive result, the observed error and why it does not establish a test or code defect.
