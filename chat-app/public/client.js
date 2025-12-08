const socket = io();

const $login = document.getElementById("login");
const $chat = document.getElementById("chat");
const $joinBtn = document.getElementById("joinBtn");
const $name = document.getElementById("name");
const $isAdmin = document.getElementById("isAdmin");
const $room = document.getElementById("room");
const $me = document.getElementById("me");
const $messages = document.getElementById("messages");
const $sendBtn = document.getElementById("sendBtn");
const $msgInput = document.getElementById("msgInput");
const $onlineList = document.getElementById("onlineList");
const $disconnectBtn = document.getElementById("disconnectBtn");
const $roomInput = document.getElementById("roomInput");
const $joinRoomBtn = document.getElementById("joinRoomBtn");
const $announceBtn = document.getElementById("announceBtn");

let currentUser = null;

function addMessage(m) {
  const div = document.createElement("div");
  div.className = "msg";
  if (m.system) div.classList.add("system");
  if (m.isAdmin) div.classList.add("admin");
  const time = new Date(m.ts || Date.now()).toLocaleTimeString();
  div.innerHTML = `<small>[${m.room || "global"} ${time}]</small> <strong>${m.sender||"System"}:</strong> ${m.text || m}`;
  $messages.appendChild(div);
  $messages.scrollTop = $messages.scrollHeight;
}

socket.on("connect", () => {
  console.log("socket connected");
});

socket.on("history", (payload) => {
  $messages.innerHTML = "";
  if (payload && payload.history) {
    payload.history.forEach(addMessage);
  }
  addMessage({ system: true, text: `--- Showing recent history for ${payload.room} ---`, ts: new Date().toISOString(), room: payload.room});
});

socket.on("message", (m) => addMessage(m));
socket.on("announcement", (m) => addMessage(m));
socket.on("onlineUsers", (list) => {
  $onlineList.textContent = list.join(", ");
});

$joinBtn.onclick = () => {
  const name = $name.value.trim();
  if (!name) return alert("Enter name");
  const payload = { name, isAdmin: $isAdmin.checked, room: $room.value.trim() || "global" };
  socket.emit("register", payload, (res) => {
    if (res && res.ok) {
      currentUser = payload;
      $me.textContent = `${payload.name}${payload.isAdmin ? " (admin)" : ""} @ ${res.room}`;
      $login.style.display = "none";
      $chat.style.display = "block";
      if (payload.isAdmin) $announceBtn.style.display = "inline-block";
    } else {
      alert(res && res.message ? res.message : "Register failed");
    }
  });
};

$sendBtn.onclick = () => {
  const txt = $msgInput.value.trim();
  if (!txt) return;
  socket.emit("sendMessage", { text: txt }, (ack) => {
    if (ack && ack.ok) {
      $msgInput.value = "";
    } else {
      alert(ack && ack.message ? ack.message : "Error sending");
    }
  });
};

$disconnectBtn.onclick = () => {
  socket.disconnect();
  $chat.style.display = "none";
  $login.style.display = "block";
  setTimeout(() => location.reload(), 200);
};

$joinRoomBtn.onclick = () => {
  const room = $roomInput.value.trim();
  if (!room) return alert("Enter room name");
  socket.emit("joinRoom", room, (res) => {
    if (res && res.ok) {
      $me.textContent = `${currentUser.name}${currentUser.isAdmin ? " (admin)" : ""} @ ${res.room}`;
    } else {
      alert(res && res.message ? res.message : "Failed to join room");
    }
  });
};

$announceBtn.onclick = () => {
  const text = prompt("Announcement text:");
  if (!text) return;
  socket.emit("adminBroadcast", { text }, (res) => {
    if (!res || !res.ok) alert(res && res.message ? res.message : "Failed to send");
  });
};
