import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppWrapper from "./App";
import { AuthProvider } from "./AuthContext";
import { DataRefreshProvider } from "./DataRefreshContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <DataRefreshProvider>
        <AppWrapper />
      </DataRefreshProvider>
    </AuthProvider>
  </StrictMode>
);
