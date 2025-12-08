const request = require("supertest");
const app = require("../app");
const { resetStore } = require("../store");

async function login(username) {
  await request(app).post("/auth/signup").send({ username, password: "123" });
  const res = await request(app).post("/auth/login").send({ username, password: "123" });
  return res.body.token;
}

beforeEach(() => resetStore());

describe("Todos Tests", () => {

  test("Create todo with valid token", async () => {
    const token = await login("u1");
    const res = await request(app)
      .post("/todos")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Task1" });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Task1");
  });

  test("Get all todos for logged-in user", async () => {
    const t1 = await login("u1");
    const t2 = await login("u2");

    await request(app).post("/todos").set("Authorization", `Bearer ${t1}`).send({ title: "A1" });
    await request(app).post("/todos").set("Authorization", `Bearer ${t1}`).send({ title: "A2" });

    await request(app).post("/todos").set("Authorization", `Bearer ${t2}`).send({ title: "B1" });

    const res = await request(app).get("/todos").set("Authorization", `Bearer ${t1}`);

    expect(res.body.length).toBe(2);
  });

  test("Only owner can update", async () => {
    const owner = await login("owner");
    const other = await login("hacker");

    const create = await request(app)
      .post("/todos")
      .set("Authorization", `Bearer ${owner}`)
      .send({ title: "Secret" });

    const id = create.body.id;

    const forbidden = await request(app)
      .put(`/todos/${id}`)
      .set("Authorization", `Bearer ${other}`)
      .send({ title: "Hack" });

    expect(forbidden.status).toBe(403);

    const ok = await request(app)
      .put(`/todos/${id}`)
      .set("Authorization", `Bearer ${owner}`)
      .send({ title: "Updated" });

    expect(ok.status).toBe(200);
    expect(ok.body.title).toBe("Updated");
  });

  test("Delete todo", async () => {
    const token = await login("x");

    const create = await request(app)
      .post("/todos")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "DeleteMe" });

    const del = await request(app)
      .delete(`/todos/${create.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.status).toBe(200);
  });

  test("Unauthenticated access fails", async () => {
    const res = await request(app).post("/todos").send({ title: "Nope" });
    expect(res.status).toBe(401);
  });

  test("Cannot update/delete other's todo", async () => {
    const a = await login("a");
    const b = await login("b");

    const create = await request(app)
      .post("/todos")
      .set("Authorization", `Bearer ${a}`)
      .send({ title: "Private" });

    const id = create.body.id;

    const upd = await request(app)
      .put(`/todos/${id}`)
      .set("Authorization", `Bearer ${b}`)
      .send({ title: "Try" });

    const del = await request(app)
      .delete(`/todos/${id}`)
      .set("Authorization", `Bearer ${b}`);

    expect(upd.status).toBe(403);
    expect(del.status).toBe(403);
  });
});
