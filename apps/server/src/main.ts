import { createServer } from "node:http";

const PORT = process.env.PORT || 3000;

const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Hello World from the server!" }));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running smoothly at http://localhost:${PORT}/`);
});
