import test from "node:test";
import assert from "node:assert/strict";

import { generateToken } from "../src/utils/generateToken.js";

test("generateToken returns a jwt string", () => {
  process.env.JWT_SECRET = "test-secret";
  const token = generateToken({ id: 10, role: "ADMIN", tokenVersion: 3 });
  assert.equal(typeof token, "string");
  assert.ok(token.length > 20);
});
