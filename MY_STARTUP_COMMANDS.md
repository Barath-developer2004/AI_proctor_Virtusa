# Startup Commands

Here are the commands used to run the project.

You can simply run the automated script from the root directory:
```bash
.\START_EVERYTHING.bat
```

Behind the scenes, this script executes the following manual steps:

1. **Start the databases in the background:**
   ```bash
   docker compose up postgres redis -d
   ```

2. **Start the Go backend server:**
   ```bash
   cd backend
   go run ./cmd/server
   ```
   *(This listens on `http://localhost:8080`)*

3. **Start the Next.js frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   *(This listens on `http://localhost:3000`)*
