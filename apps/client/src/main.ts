import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  app.innerHTML = `
    <h1>Booking Client Active</h1>
    <p id="server-status">Connecting to server...</p>
  `;
}

// Fetching through the proxy link
async function checkBackend() {
  const statusEl = document.getElementById("server-status");
  try {
    const response = await fetch("/api/"); // Routes through proxy to http://localhost:3000/
    const data = await response.json();
    if (statusEl) {
      statusEl.textContent = `Server response: "${data.message}"`;
      statusEl.style.color = "#4ade80"; // Green
    }
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = "Failed to connect to backend server.";
      statusEl.style.color = "#f87171"; // Red
    }
  }
}

checkBackend();
