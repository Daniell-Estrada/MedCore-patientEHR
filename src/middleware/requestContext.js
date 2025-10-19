const { AsyncLocalStorage } = require("async_hooks");

const als = new AsyncLocalStorage();

function contextMiddleware(req, res, next) {
  als.run({}, () => next());
}

function getStore() {
  return als.getStore();
}

function setToken(token) {
  const store = getStore();
  if (store) store.token = token;
}

function getToken() {
  const store = getStore();
  return store?.token;
}

function setUser(user) {
  const store = getStore();
  if (store) store.user = user;
}

function getUser() {
  const store = getStore();
  return store?.user;
}

function getAuthHeader() {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  contextMiddleware,
  getStore,
  setToken,
  getToken,
  setUser,
  getUser,
  getAuthHeader,
};
