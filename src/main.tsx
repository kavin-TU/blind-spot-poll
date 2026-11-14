import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Candidate from "./candidate/Candidate";
import Instructor from "./instructor/Instructor";

const isCandidate = window.location.pathname.replace(/\/$/, "") === "/join";

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isCandidate ? <Candidate /> : <Instructor />}</StrictMode>,
);
