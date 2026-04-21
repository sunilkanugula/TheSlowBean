import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <ToastContainer position="top-right" autoClose={3000} />
  </>
);

// Hide splash once React has painted the first frame
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.getElementById("splash")?.classList.add("hide");
  });
});
