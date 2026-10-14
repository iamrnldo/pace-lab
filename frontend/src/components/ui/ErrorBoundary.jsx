// src/components/ui/ErrorBoundary.jsx
// Menangkap error runtime apa pun dan menampilkannya di layar, supaya
// kegagalan tidak muncul sebagai "blue screen" tanpa penjelasan.
import { Component } from "react";

const COLORS = {
  bg: "var(--retro-black, 0 91 172)",
  accent: "var(--retro-green, 223 245 255)",
  text: "var(--retro-white, 255 255 255)",
};

const panelStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  backgroundColor: `rgb(${COLORS.bg})`,
  color: `rgb(${COLORS.text})`,
  fontFamily: '"Barlow Condensed", system-ui, sans-serif',
};

const boxStyle = {
  width: "100%",
  maxWidth: "880px",
  border: `2px solid rgb(${COLORS.accent})`,
  backgroundColor: `rgb(${COLORS.text} / 0.04)`,
  padding: "24px",
};

const buttonStyle = {
  fontFamily: '"Bebas Neue", Impact, sans-serif',
  letterSpacing: "0.1em",
  border: `2px solid rgb(${COLORS.accent})`,
  background: "transparent",
  color: `rgb(${COLORS.text})`,
  padding: "8px 18px",
  cursor: "pointer",
  fontSize: "15px",
};

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, showDetail: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Tetap catat ke console supaya bisa dilaporkan/di-copy.
    console.error("[PaceLab] Runtime error:", error, info?.componentStack);
    this.setState({ componentStack: info?.componentStack || "" });
  }

  handleCopy = async () => {
    const { error, componentStack } = this.state;
    const payload = [
      `MESSAGE: ${error?.message || error}`,
      "",
      "STACK:",
      error?.stack || "-",
      "",
      "COMPONENT STACK:",
      componentStack || "-",
      "",
      `URL: ${typeof window !== "undefined" ? window.location.href : "-"}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(payload);
      this.setState({ copied: true });
    } catch {
      this.setState({ copied: false });
    }
  };

  render() {
    const { error, componentStack, showDetail, copied } = this.state;

    if (!error) return this.props.children;

    return (
      <div style={panelStyle}>
        <div style={boxStyle}>
          <p
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "11px",
              letterSpacing: "0.3em",
              color: `rgb(${COLORS.accent})`,
              marginBottom: "8px",
            }}
          >
            PACELAB PRO // RUNTIME ERROR
          </p>
          <h1
            style={{
              fontFamily: '"Bebas Neue", Impact, sans-serif',
              fontSize: "38px",
              lineHeight: 1.05,
              letterSpacing: "0.04em",
              marginBottom: "12px",
            }}
          >
            APLIKASI BERHENTI KARENA ERROR
          </h1>
          <p
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "13px",
              color: `rgb(${COLORS.accent})`,
              wordBreak: "break-word",
              marginBottom: "16px",
            }}
          >
            {String(error?.message || error)}
          </p>

          <div
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: "15px",
              lineHeight: 1.6,
              opacity: 0.85,
              marginBottom: "16px",
            }}
          >
            <p style={{ marginBottom: "6px" }}>
              Klik <strong>LIHAT DETAIL</strong> lalu kirim isinya ke developer.
              Penyebab paling umum:
            </p>
            <ul style={{ paddingLeft: "20px", listStyle: "square" }}>
              <li>
                File belum lengkap saat deploy — pastikan{" "}
                <code>src/main.jsx</code>, <code>src/context/ThemeContext.jsx</code>,
                dan <code>src/utils/themeUtils.js</code> berasal dari versi yang sama.
              </li>
              <li>
                Cache Vite masih lama — hapus <code>node_modules/.vite</code> lalu
                restart <code>npm run dev</code>.
              </li>
              <li>
                Ada perubahan manual di file tema; jalankan <code>npm run doctor</code>
                untuk memeriksa.
              </li>
            </ul>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => window.location.reload()}
            >
              RELOAD PAGE
            </button>
            <button
              type="button"
              style={buttonStyle}
              onClick={this.handleCopy}
            >
              {copied ? "COPIED ✓" : "COPY ERROR"}
            </button>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => this.setState((prev) => ({ showDetail: !prev.showDetail }))}
            >
              {showDetail ? "SEMBUNYIKAN DETAIL" : "LIHAT DETAIL"}
            </button>
          </div>

          {showDetail && (
            <pre
              style={{
                marginTop: "16px",
                maxHeight: "320px",
                overflow: "auto",
                border: `1px solid rgb(${COLORS.accent} / 0.4)`,
                background: "rgba(0,0,0,0.28)",
                padding: "12px",
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: "11px",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {`${error?.stack || error}\n\nCOMPONENT STACK:${componentStack || " -"}`}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
