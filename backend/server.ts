import "dotenv/config";
import express from "express";
import cors from "cors";
import { handler } from "./lambda/getCommunityCounts";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
const port = 4000;

app.get("/communityCounts", async (_, res) => {
  const response = await handler();
  res.status(response.statusCode).send(response.body);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:4000`);
});