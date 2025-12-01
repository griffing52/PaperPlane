import express from "express";
import cors from "cors";
import { PORT, prisma, logger } from "./config";
import router from "./routes";
import { Request, Response, NextFunction } from "express";

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err, 'Internal server error');
  
  res.status(500).json({
    error: 'Internal server error',
  });
});
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
