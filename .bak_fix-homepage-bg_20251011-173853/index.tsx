initHomeHeroRouteListener();
import { initHomeHeroRouteListener } from '../route-home-hero';
import './route-home-hero';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Buffer } from 'buffer';
import '../index.css';
import './app-overrides.css'; // keep this last so it wins
// keep this last so it wins
// keep this last so it wins
// Polyfill Buffer for libraries that might depend on it in a browser environment.
window.Buffer = Buffer;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);




