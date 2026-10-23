# Git Branch & Production Deployment Rules

1. **Active Development**: All features, bug fixes, and modifications must be performed and verified on the `dev` branch.
2. **Explicit User Confirmation Required**:
   - **NEVER** automatically merge `dev` into `main`.
   - **NEVER** automatically push `main` to remote / production (`origin/main`).
   - **ALWAYS** ask the user explicitly for confirmation/approval before merging `dev` into `main` and before pushing to `main` for production.
