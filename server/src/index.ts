import express from "express";
import cors from "cors";
import { PORT, prisma } from "./config";
import router from "./routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);

export { app, prisma };

if (require.main === module) {
  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
