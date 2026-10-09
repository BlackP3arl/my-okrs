import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthGate } from './AuthGate.jsx';
import './styles.css';
import './strategy.css';
import './brand.css';

class PlanBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="boot">
          <div>
            <b>The strategy database is not available.</b>
            <p>Create the Cloudflare D1 database named strategy-plan and bind it to this project as DB.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate>
      <PlanBoundary>
        <React.Suspense fallback={<div className="boot">Loading the strategy plan…</div>}>
          <App />
        </React.Suspense>
      </PlanBoundary>
    </AuthGate>
  </React.StrictMode>,
);
