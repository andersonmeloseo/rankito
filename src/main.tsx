import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Garantir que apenas light mode está ativo
document.documentElement.classList.remove('dark');
document.documentElement.classList.add('light');
localStorage.removeItem('theme-mode');

createRoot(document.getElementById("root")!).render(<App />);
