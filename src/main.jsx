import React, { StrictMode, Component } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught React Error Boundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }
  handleReset = () => { try { localStorage.clear(); } catch(e) {} window.location.reload(); };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05080c] text-white flex flex-col items-center justify-center p-6 font-sans text-center">
          <div className="max-w-2xl bg-[#0a1118] border border-white/10 p-8 rounded-3xl shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-[#f2b300]/10 border border-[#f2b300]/20 text-[#f2b300] rounded-full flex items-center justify-center text-2xl mx-auto font-bold">⚡</div>
            <h2 className="text-xl font-black uppercase text-white tracking-wider">Optimizando Interfaz ALACOR</h2>
            <p className="text-xs text-gray-400 leading-relaxed font-light">Hemos actualizado la estructura y catálogo del sitio. Haz clic abajo para sincronizar con la versión más reciente.</p>
            <button onClick={this.handleReset} className="w-full bg-[#f2b300] text-[#05080c] font-black py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all cursor-pointer border-none shadow-lg shadow-[#f2b300]/20">Sincronizar &amp; Cargar Sitio</button>
            <div className="mt-6 text-left bg-black/50 p-4 rounded-xl overflow-auto text-[10px] text-red-400 font-mono border border-red-500/20 max-h-48">
              <p className="font-bold">Error Info:</p>
              <pre>{this.state.error && this.state.error.toString()}</pre>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
