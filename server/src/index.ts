import express from "express";
import cors from "cors";
import { PORT, prisma, logger } from "./config";
import router from "./routes";
import { Request, Response, NextFunction } from "express";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(router);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err, "Internal server error");

  res.status(500).json({
    error: "Internal server error",
  });
});
export { app, prisma };

// AI Disclosure by Bolun Thompson. I used Claude Code with Sonnet 4.5 with Thinking enabled.
// At the start of this project, in commit 5ec3ae7, 67fb230. and a09a751, I setup the project
// with the help of AI and generated example endpoints. 

// I found its output educational to understand the structure of a CRUD express backend
// but I decided I'd rather write the rest, so I removed 
// all the non-trivial code. This was because:
// (1): The generated endpoints were not based on real requirements
// (2): I needed to understand the code to add more features
// (3): I didn't precisely keep track of the prompts I used.

// At this point, the only code that remains from 5ec3ae7 is this 
// server listening function, server/controllers/HealthController.ts, and 
// the validation middleware in server/middlewares/validation.ts.
// I fully undid the other two commits (except for server/middlewares/validation.ts -- see prompt there).
// See commit ee60bc7 for the removals. 

// For the sake of disclosure, what follows is the prompt I remember using for the first commit.
// I don't include the other two since I reverted them. I removed the endpoints and schema it created, but kept
// the health check endpoint.
// I reviewed the plan it produced and told it to implement it.

// You're a skilled senior developer. Ultrathink. Plan how to setup a simple idiomatic basic express backend in
// Typescript with the Prisma ORM in the server/ directory.
// As an example, add a users table with a get and post request. Test that it's working.

if (require.main === module) {
  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
