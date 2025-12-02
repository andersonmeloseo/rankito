import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Forçar light mode permanentemente - ignorar preferência do navegador/sistema
document.documentElement.classList.remove('dark');
document.documentElement.classList.add('light');
document.documentElement.style.colorScheme = 'light only';
localStorage.removeItem('theme-mode');

createRoot(document.getElementById("root")!).render(<App />);
