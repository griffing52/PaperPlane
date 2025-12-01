import { vi } from "vitest";
import * as auth from "../src/middleware/auth";
import { prisma } from "../src/config";

// The test seed database always has this user present
const TEST_EMAIL = "michael.smith@outlook.com"
const TEST_EMAIL_HASH =
  "1c61d3af9e95de4b161dc5c7d5d7e0cbc6de90f884defcfe6d49a5e8bce62806";

// These are separate because
// getAuthData is used by functions other than requireUser,
// but requireUser also checks for an auth header, which we don't provide for tests

vi.spyOn(auth, "getAuthData").mockResolvedValue({
  email: TEST_EMAIL,
  emailHash: TEST_EMAIL_HASH,
});

vi.spyOn(auth, "requireUser").mockImplementation(async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { emailHash: TEST_EMAIL_HASH },
  });

  if (!user) {
    res.status(404).json({ error: "Test user not in database" });
    return;
  }

  req.user = user;
  next();
});
