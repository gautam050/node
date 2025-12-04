const EventEmitter = require("events");

class MyEmitter extends EventEmitter {}
const emitter = new MyEmitter();

emitter.on("userLoggedIn", (user) => {
  console.log(`User ${user} logged in`);
});

emitter.on("userLoggedIn", (user) => {
  console.log(`Notification sent to ${user}`);
});

emitter.on("messageReceived", (msg) => {
  console.log(`New message: ${msg}`);
});

emitter.on("dataSynced", () => {
  console.log("Data sync complete");
});

function startApp() {
  console.log("\n=== Event-Driven Demo Started ===\n");

  setTimeout(() => {
    emitter.emit("userLoggedIn", "John");
  }, 1000);

  setTimeout(() => {
    emitter.emit("messageReceived", "Welcome to the system!");
  }, 2000);

  setTimeout(() => {
    console.log("Syncing user data...");
    setTimeout(() => {
      emitter.emit("dataSynced");
    }, 1500);
  }, 3000);
}

startApp();
