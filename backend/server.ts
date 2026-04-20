import "dotenv/config";
import express from "express";
import cors from "cors";
import { handler as communityCountsHandler } from "./lambda/getCommunityCounts";
import { handler as communitiesByCellIdHandler } from "./lambda/getCommunitiesByCellId";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
const port = 4000;

app.get(
  "/CommunityCounts",
  async (req: express.Request, res: express.Response) => {
    try {
      const response = await communityCountsHandler();
      res
        .status(response.statusCode ?? 200)
        .json(JSON.parse(response.body as string));
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Internal Server Error" });
    }
  },
);

app.get(
  "/getCommunitiesByCellId",
  async (req: express.Request, res: express.Response) => {
    try {
      const response = await communitiesByCellIdHandler(
        req as unknown as Parameters<typeof communitiesByCellIdHandler>[0],
      );
      res
        .status(response.statusCode ?? 200)
        .json(JSON.parse(response.body as string));
    } catch (err) {
      console.error(err);
      res.status(500).send({ error: "Internal Server Error" });
    }
  },
);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
