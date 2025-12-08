const request = require("supertest");
const app = require("../app");
const { resetStore } = require("../store");

beforeEach(() => resetStore());

describe("Auth Tests", () => {
  test("Signup works", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ username: "a", password: "123" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
  });

  test("Login returns JWT", async () => {
    await request(app).post("/auth/signup").send({ username: "a", password: "123" });

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "a", password: "123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  test("Login fails for invalid credentials", async () => {
    await request(app).post("/auth/signup").send({ username: "a", password: "123" });

    const res = await request(app)
      .post("/auth/login")
      .send({ username: "a", password: "wrong" });

    expect(res.status).toBe(401);
  });

  test("Protected route without token fails", async () => {
    const res = await request(app).get("/todos");

    expect(res.status).toBe(401);
  });

  test("Protected route with invalid token fails", async () => {
    const res = await request(app)
      .get("/todos")
      .set("Authorization", "Bearer invalid");

    expect(res.status).toBe(401);
  });
});
