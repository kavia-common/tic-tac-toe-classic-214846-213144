# Lightweight React Template for KAVIA (Tic Tac Toe with AI)

This project provides a minimal React template with a clean, modern UI and minimal dependencies, extended with:
- Human vs Human and Human vs AI modes
- OpenAI-powered AI opponent with a deterministic prompt and a local heuristic fallback
- Right-side chat panel where the AI posts short, family-friendly trash talk tied to game events
- Responsive layout: side panel on desktop, stacked on smaller screens
- Theme-aligned styling using light theme with #3b82f6 and #06b6d4 accents

## Environment Variables

Create a `.env` file (or configure your preview environment) and set:

```
REACT_APP_OPENAI_API_KEY=<your-openai-key>
```

For this exercise, the app calls OpenAI directly from the browser using the key injected by the environment. Do NOT hardcode keys in source control. In production, you should proxy such requests via a backend.

See `.env.example`.

## Getting Started

In the project directory, you can run:

### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

## Learn More

To learn React, check out the [React documentation](https://reactjs.org/).
