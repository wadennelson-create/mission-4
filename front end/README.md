# Mission 4: Turners Insurance AI Frontend

React + Vite frontend for Tina, a Turners insurance recommendation assistant.

The app shows a chat transcript, lets the user reply to Tina's questions, and sends the conversation to the backend API for a Gemini-powered insurance recommendation.

## Run Locally

```bash
npm install
npm run dev
```

The frontend expects the backend API at:

```text
http://localhost:5000/api
```

Override the API URL with:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

## Build

```bash
npm run build
```
