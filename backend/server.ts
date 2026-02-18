import "dotenv/config";
import express from "express";
import { handler } from "./lambda/getCommunities";

const app = express();
const port = 4000;

app.get("/communities", async (_, res) => {
  const response = await handler();
  res.status(response.statusCode).send(response.body);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:4000`);
});