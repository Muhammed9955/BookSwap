# Git Branch & Production Deployment Rules

1. **Active Development**: All features, bug fixes, and modifications must be performed and verified on the `dev` branch.
2. **Explicit User Confirmation Required**:
   - **NEVER** automatically merge `dev` into `main`.
   - **NEVER** automatically push `main` to remote / production (`origin/main`).
   - **ALWAYS** ask the user explicitly for confirmation/approval before merging `dev` into `main` and before pushing to `main` for production, UNLESS the user explicitly says "push to production".
3. **Meaning of "Push to Production"**:
   - When the user says "push to production" or "push production", this specifically means:
     a) Checkout `main`.
     b) Merge `dev` into `main`.
     c) Push `main` to `origin/main` (production deployment).
     d) Switch back to `dev` for subsequent development.

