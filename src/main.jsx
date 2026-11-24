import React, { Component } from "react";
import ReactDOM from "react-dom/client";
import { AudioProvider } from "./context/AudioContext";
import App from "./App";
import "./index.css";

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    event.preventDefault();
  });

  window.addEventListener("unhandledrejection", (event) => {
    event.preventDefault();
  });

  window.alert = () => {};
  window.confirm = () => false;
  window.prompt = () => null;
}

class SilentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SilentErrorBoundary>
      <AudioProvider>
        <App />
      </AudioProvider>
    </SilentErrorBoundary>
  </React.StrictMode>,
);
