---
name: can-i-deploy
description: This skills will perform all checks, that would run at CI level, in a local environment
---

# My Skill

Making use of all quality standards are met.

## When to Use

- Use this skill when promted /can-i-deploy.

## Instructions

1. Backend checks
   When there are changes on the /backend:

- activate existing .venv (source backend/.venv/bin/activate )
- make sure that linting through Flake8 is correct
- make sure all unit tests are passing
- make sure all unit integration tests are passing

2. Frontend checks
   When there are changes on the /frontend:

- make sure that linting through Prettier is correct
- make sure all unit tests are passing
- make sure all unit integration tests are passing
- make sure unit test coverage is above 80% for all branches
