import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import './index.css';

/**
 * PUBLIC_INTERFACE
 * A Tic Tac Toe game with Human vs Human and Human vs AI modes.
 * - Renders a 3x3 grid, detects wins/draws, highlights winning line.
 * - Human vs AI uses OpenAI via env var REACT_APP_OPENAI_API_KEY (not hardcoded).
 * - Safe client-side fetch with a deterministic prompt; falls back to local heuristic.
 * - Right-side chat panel for fun, family-friendly trash talk tied to events.
 * - Loading/disabled states while AI is thinking.
 * - Responsive layout: side panel on desktop, stacked on smaller screens.
 */
function App() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [mode, setMode] = useState('HUMAN_AI'); // 'HUMAN_AI' | 'HUMAN_HUMAN'
  const [chat, setChat] = useState([
    { from: 'AI', text: 'Ready to rumble! Good luck, human 🧠✨' }
  ]);
  const [aiThinking, setAiThinking] = useState(false);

  const aiMark = 'O'; // AI is O, human is X
  const humanMark = 'X';

  const { winner, line } = useMemo(() => calculateWinner(squares), [squares]);
  const isBoardFull = useMemo(() => squares.every((s) => s !== null), [squares]);
  const isDraw = !winner && isBoardFull;

  const status = useMemo(() => {
    if (winner) return `Winner: ${winner}`;
    if (isDraw) return "It's a draw!";
    return `Next Player: ${xIsNext ? 'X' : 'O'}`;
  }, [winner, isDraw, xIsNext]);

  // Chat utilities
  const pushChat = (from, text) => {
    setChat((c) => [...c, { from, text }]);
  };

  // Announce events
  useEffect(() => {
    if (winner === aiMark) {
      pushChat('AI', pickTrashTalk('win'));
    } else if (winner === humanMark) {
      pushChat('AI', pickTrashTalk('loss'));
    } else if (isDraw) {
      pushChat('AI', pickTrashTalk('draw'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, isDraw]);

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    const aiTurn = mode === 'HUMAN_AI' && !winner && !isDraw && !xIsNext;
    if (!aiTurn) return;
    // small delay to feel natural
    const t = setTimeout(async () => {
      setAiThinking(true);
      pushChat('AI', pickTrashTalk('turn'));
      const move = await getAiMoveSafe(squares, aiMark, humanMark, pushChat);
      if (move != null && squares[move] == null) {
        const next = squares.slice();
        next[move] = aiMark;
        // Optional: detect if it's a strong block/fork via heuristic and chat
        const wasStrongBlock = isStrongBlock(squares, humanMark, move);
        setSquares(next);
        setXIsNext(true); // human's turn after AI
        if (wasStrongBlock) {
          pushChat('AI', pickTrashTalk('block'));
        }
      }
      setAiThinking(false);
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, xIsNext, squares, winner, isDraw]);

  const onSquareClick = async (index) => {
    if (squares[index] || winner || aiThinking) return; // block clicks when AI is thinking or game over
    const next = squares.slice();
    next[index] = xIsNext ? humanMark : aiMark;
    setSquares(next);
    setXIsNext(!xIsNext);
  };

  const onReset = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setChat([{ from: 'AI', text: 'Fresh board, fresh banter. Your move!' }]);
    setAiThinking(false);
  };

  const handleModeChange = (e) => {
    const newMode = e.target.value;
    setMode(newMode);
    onReset();
  };

  return (
    <div className="ttt-app">
      <div className="ttt-layout">
        <div className="ttt-card">
          <h1 className="ttt-title">Tic Tac Toe</h1>

          <div className="ttt-controls">
            <label className="ttt-mode">
              <span className="ttt-mode-label">VS Mode:</span>
              <select
                className="ttt-select"
                value={mode}
                onChange={handleModeChange}
                aria-label="Versus Mode"
              >
                <option value="HUMAN_HUMAN">Human vs Human</option>
                <option value="HUMAN_AI">Human vs AI</option>
              </select>
            </label>
          </div>

          <div className={`ttt-board ${aiThinking ? 'ttt-board-disabled' : ''}`} role="grid" aria-label="Tic Tac Toe Board">
            {squares.map((value, idx) => {
              const isWinningCell = line.includes(idx);
              const disabled = !!value || !!winner || aiThinking || (mode === 'HUMAN_AI' && !xIsNext && !winner && !isDraw);
              return (
                <button
                  key={idx}
                  role="gridcell"
                  aria-label={`Cell ${idx + 1} ${value ? value : 'empty'}`}
                  className={`ttt-cell ${isWinningCell ? 'ttt-cell-win' : ''} ${value === 'X' ? 'ttt-x' : value === 'O' ? 'ttt-o' : ''}`}
                  onClick={() => onSquareClick(idx)}
                  disabled={disabled}
                >
                  {value}
                </button>
              );
            })}
          </div>

          <div className="ttt-status" aria-live="polite">
            {aiThinking ? 'AI is thinking…' : status}
          </div>

          <div className="ttt-actions">
            <button className="ttt-btn" onClick={onReset} disabled={aiThinking}>
              Reset / New Game
            </button>
          </div>

          <footer className="ttt-footer">
            {mode === 'HUMAN_AI' ? 'Human vs AI • Local play' : 'Two players • Local play'}
          </footer>
        </div>

        <aside className="ttt-side">
          <div className="ttt-chat-card" aria-label="AI Chat Panel">
            <div className="ttt-chat-header">
              <div className="ttt-chat-title">AI Trash Talk</div>
              <div className={`ttt-badge ${aiThinking ? 'ttt-badge-live' : ''}`}>
                {aiThinking ? 'Thinking' : 'Idle'}
              </div>
            </div>
            <ChatList items={chat} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function ChatList({ items }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items]);
  return (
    <div className="ttt-chat-list" ref={scrollRef}>
      {items.map((m, i) => (
        <div key={i} className={`ttt-chat-item ${m.from === 'AI' ? 'ai' : 'human'}`}>
          <div className="ttt-chat-bubble">{m.text}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Family-friendly, short trash talk depending on event type.
 */
function pickTrashTalk(type) {
  const lines = {
    turn: [
      "My circuits are warmed up. Let’s dance. 💃",
      "Scanning… I see your next three mistakes.",
      "I was born for this square. Watch closely.",
      "Beep boop… just kidding, I plan to win."
    ],
    block: [
      "Nope! That line was mine to stop. 🚫",
      "Nice try—blocked like a pro!",
      "I sensed danger and closed the door.🔒",
      "Guarded that fork like a chess knight."
    ],
    win: [
      "GG! All in a day’s compute. 🏆",
      "Good match! Want a rematch?",
      "Victory achieved. Snacks, anyone?",
      "We both learned something—I learned you’re fun."
    ],
    loss: [
      "Well played! That was brilliant. 🎉",
      "You got me this time. Respect!",
      "Impressive! Shall we go again?",
      "Plot twist: you’re the real AI."
    ],
    draw: [
      "Stalemate! Balanced as all things should be.",
      "Draw! We’re evenly matched… for now.",
      "Nobody loses, but I almost won. 😉",
      "A tie today, legend tomorrow."
    ]
  };
  const arr = lines[type] || ["Let's keep it friendly and fun!"];
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Heuristic to check if AI blocked an immediate human win with its move.
 */
function isStrongBlock(prevSquares, human, aiPlacedIndex) {
  // If before AI moved there was any human two-in-a-row w/ empty third that included aiPlacedIndex, it's a strong block.
  const lines = WIN_LINES;
  return lines.some(([a, b, c]) => {
    const s = prevSquares;
    const line = [a, b, c];
    if (!line.includes(aiPlacedIndex)) return false;
    const marks = line.map(i => s[i]);
    const humanCount = marks.filter(m => m === human).length;
    const emptyIdx = line.find(i => s[i] == null);
    return humanCount === 2 && emptyIdx != null;
  });
}

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

/**
 * PUBLIC_INTERFACE
 * Make an AI move safely: try OpenAI with deterministic prompt; fallback to a local heuristic.
 * Returns a move index (0-8) or null if none.
 */
async function getAiMoveSafe(squares, aiMark, humanMark, pushChatCb) {
  // First try OpenAI if key exists.
  const key = process.env.REACT_APP_OPENAI_API_KEY;
  if (key) {
    try {
      const move = await getMoveFromOpenAI(squares, aiMark, humanMark, key);
      if (typeof move === 'number' && move >= 0 && move <= 8 && squares[move] == null) {
        return move;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('OpenAI move failed, falling back:', e);
      pushChatCb?.('AI', "Clouds are cloudy—switching to my local smarts.");
    }
  } else {
    pushChatCb?.('AI', "No API key detected; using my built-in tactics.");
  }
  // Fallback: simple heuristic/minimax-lite
  return heuristicMove(squares, aiMark, humanMark);
}

/**
 * Deterministic prompt for OpenAI JSON output.
 * We use a minimal fetch wrapper to call the API directly from the client.
 * Note: In production, calling OpenAI from a browser is unsafe; this app expects
 * the environment to inject the key securely for preview. Do not hardcode.
 */
async function getMoveFromOpenAI(squares, aiMark, humanMark, apiKey) {
  const boardStr = squares.map(s => s ?? '.').join('');
  const sys = "You are a deterministic Tic Tac Toe engine. Return ONLY valid JSON like {\"move\": <0-8>} with an empty cell index that is a strong move. Never add commentary.";
  const user = `Board is a single string of 9 chars, row-major. '.' is empty, 'X' or 'O' marks.\n- Current player: '${aiMark}'\n- Opponent: '${humanMark}'\n- Board: "${boardStr}"\nRules:\n1) If a winning move exists, take it.\n2) Else if opponent can win next, block it.\n3) Else take center if free.\n4) Else take a corner if free.\n5) Else take any side.\nRespond with JSON only: {"move": <index 0-8>} with an empty cell index.`;

  // Use fetch to OpenAI Chat Completions API (gpt-4o-mini recommended for cost/latency)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${text}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON from OpenAI');
  }
  const mv = parsed?.move;
  return typeof mv === 'number' ? mv : null;
}

/**
 * Simple heuristic AI:
 * 1) Win if possible
 * 2) Block opponent's win
 * 3) Take center
 * 4) Take a corner
 * 5) Take a side
 */
function heuristicMove(squares, ai, opp) {
  // try to win
  let move = findWinningMove(squares, ai);
  if (move != null) return move;
  // block
  move = findWinningMove(squares, opp);
  if (move != null) return move;
  // center
  if (squares[4] == null) return 4;
  // corners
  const corners = [0,2,6,8].filter(i => squares[i] == null);
  if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
  // sides
  const sides = [1,3,5,7].filter(i => squares[i] == null);
  if (sides.length) return sides[Math.floor(Math.random()*sides.length)];
  return null;
}

function findWinningMove(squares, mark) {
  for (const [a,b,c] of WIN_LINES) {
    const line = [squares[a], squares[b], squares[c]];
    const empties = [a,b,c].filter((i, idx) => line[idx] == null);
    const count = line.filter(v => v === mark).length;
    if (count === 2 && empties.length === 1) return empties[0];
  }
  return null;
}

// PUBLIC_INTERFACE
export function calculateWinner(squares) {
  /**
   * Determine the winner of the Tic Tac Toe board.
   * Returns an object: { winner: 'X' | 'O' | null, line: number[] }
   * where line is the winning cell indices (length 3) or [] if no winner.
   */
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // cols
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return { winner: null, line: [] };
}

export default App;
