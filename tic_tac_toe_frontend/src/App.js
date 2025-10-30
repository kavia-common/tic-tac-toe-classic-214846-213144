import React, { useMemo, useState } from 'react';
import './App.css';
import './index.css';

/**
 * PUBLIC_INTERFACE
 * A simple Tic Tac Toe game component that renders a centered 3x3 grid,
 * handles alternating X/O turns, detects wins/draw, highlights the winning line,
 * and provides a Reset/New Game button. Styled with a light theme and
 * #3b82f6 (primary) and #06b6d4 (success) accents.
 */
function App() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const { winner, line } = useMemo(() => calculateWinner(squares), [squares]);
  const isBoardFull = useMemo(() => squares.every((s) => s !== null), [squares]);
  const isDraw = !winner && isBoardFull;

  const status = useMemo(() => {
    if (winner) return `Winner: ${winner}`;
    if (isDraw) return "It's a draw!";
    return `Next Player: ${xIsNext ? 'X' : 'O'}`;
  }, [winner, isDraw, xIsNext]);

  const onSquareClick = (index) => {
    if (squares[index] || winner) return; // Do not allow overriding or playing after game end
    const next = squares.slice();
    next[index] = xIsNext ? 'X' : 'O';
    setSquares(next);
    setXIsNext(!xIsNext);
  };

  const onReset = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <div className="ttt-app">
      <div className="ttt-card">
        <h1 className="ttt-title">Tic Tac Toe</h1>

        <div className="ttt-board" role="grid" aria-label="Tic Tac Toe Board">
          {squares.map((value, idx) => {
            const isWinningCell = line.includes(idx);
            return (
              <button
                key={idx}
                role="gridcell"
                aria-label={`Cell ${idx + 1} ${value ? value : 'empty'}`}
                className={`ttt-cell ${isWinningCell ? 'ttt-cell-win' : ''} ${value === 'X' ? 'ttt-x' : value === 'O' ? 'ttt-o' : ''}`}
                onClick={() => onSquareClick(idx)}
              >
                {value}
              </button>
            );
          })}
        </div>

        <div className="ttt-status" aria-live="polite">{status}</div>

        <div className="ttt-actions">
          <button className="ttt-btn" onClick={onReset}>
            Reset / New Game
          </button>
        </div>

        <footer className="ttt-footer">
          Two players • Local play
        </footer>
      </div>
    </div>
  );
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
