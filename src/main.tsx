
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { restoreDarkMode } from "./app/lib/theme";

  restoreDarkMode();
  createRoot(document.getElementById("root")!).render(<App />);
  