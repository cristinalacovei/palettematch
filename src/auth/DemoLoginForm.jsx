import React, { useState } from "react";

export default function DemoLoginForm({ onSubmit, onClose, error }) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    const success = await onSubmit(password);
    setSubmitting(false);
    if (success) {
      setPassword("");
      onClose();
    }
  }

  return (
    <section
      className="demo-login"
      aria-labelledby="demo-login-title"
      role="dialog"
      aria-modal="false"
    >
      <div className="demo-login__heading">
        <div>
          <h2 id="demo-login-title">Try the PaletteMatch demo</h2>
          <p>Sign in to save palettes in your private demo session.</p>
        </div>
        <button
          className="demo-login__close"
          type="button"
          onClick={onClose}
          aria-label="Close demo sign-in"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="demo-password">Demo password</label>
        <input
          id="demo-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          maxLength={72}
          required
          disabled={submitting}
        />
        {error && (
          <p className="demo-login__error" role="alert">
            {error}
          </p>
        )}
        <button className="demo-login__submit" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}
