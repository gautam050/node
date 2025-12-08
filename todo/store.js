let users = [];
let todos = [];
let idCounter = 1;

function resetStore() {
  users = [];
  todos = [];
  idCounter = 1;
}

function nextId() {
  return String(idCounter++);
}

module.exports = {
  users,
  todos,
  resetStore,
  nextId
};
