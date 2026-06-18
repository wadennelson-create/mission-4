# Mission 4 MRK1

Full-stack Turners insurance app with an Express API and Vite React frontend.

## Run With Docker

From this folder:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:5173
```

The backend API is exposed at:

```text
http://localhost:5000
```

To enable Gemini responses, set `GEMINI_API_KEY` in `backend/.env`. Without it, the backend uses its local fallback response logic.

For local development when port `5000` or `5173` is already in use, run the override file:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Then open:

```text
http://localhost:5175
```

The backend API is exposed at:

```text
http://localhost:5002
```

Use `backend/.env.example` as the template for local configuration. Do not commit `backend/.env`.

## Stop

```bash
docker compose down
```
