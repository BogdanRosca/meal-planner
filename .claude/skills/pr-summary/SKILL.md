---
name: pr-summary
model: claude-haiku-4-5
description: Writes a pull request description. Use when user asks to summarise changes for a pull request.
---

When writing a PR description:

1. Run `git diff main` to see all changes on this branch
2. Write a description following this format:

# Summary

A short sentence, maximum 50 words, summarizing the scope of the changes.

# Changelog

## Backend changes:

- bullet point with most important changes in /backend
- no more than 6 points.
- merge when relevant.
- if no changes on /backend don't add the section

## Frontend changes:

- bullet point with most important changes in /frontend
- no more than 6 points.
- merge when relevant.
- if no changes on /frontend don't add the section

## CI changes:

- bullet point with most important changes in /.github
- no more than 6 points.
- merge when relevant.
- if no changes on /.github don't add the section

## Other changes

- bullet point with anything outside /backend /frontend or /.github
- no more than 6 points.
- merge when relevant.
- if no changes on anything outside /backend /frontend or /.github don't add the section

## Lastly sign the PR as:

🤖 Generated with Claude Code
