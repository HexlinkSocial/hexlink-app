import "dotenv/config";
import express from "express";
import cors from "cors";
import { handler } from "./lambda/getCommunityCounts";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
const port = 4000;

app.get(
  "/communityCounts",
  async (req: express.Request, res: express.Response) => {
    try {
      const response = await handler();
      res.send(response);
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Internal Server Error" });
    }
  },
);

app.listen(port, () => {
  console.log(`Server running on http://localhost:4000`);
});
