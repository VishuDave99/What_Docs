import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Remix icon CSS from CDN
const remixIconLink = document.createElement('link');
remixIconLink.rel = 'stylesheet';
remixIconLink.href = 'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css';
document.head.appendChild(remixIconLink);

// Import IBM Plex and Inter fonts from Google Fonts
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap';
document.head.appendChild(fontLink);

// Add custom styles for tooltips and scrollbars
const style = document.createElement('style');
style.textContent = `
  .tooltip {
    position: relative;
  }
  
  .tooltip .tooltip-text {
    visibility: hidden;
    width: 200px;
    background-color: #36373D;
    color: #E5E5E5;
    text-align: center;
    border-radius: 6px;
    padding: 8px;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    margin-left: -100px;
    opacity: 0;
    transition: opacity 0.3s;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }
  
  .tooltip:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
  }
  
  /* For custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1E1F22;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #36373D;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #4A4A4D;
  }
  
  /* Font family overrides */
  .font-display {
    font-family: 'IBM Plex Sans', sans-serif;
  }
  
  .font-mono {
    font-family: 'IBM Plex Mono', monospace;
  }
  
  .font-sans {
    font-family: 'Inter', sans-serif;
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
