class Users {
  users = {};

  addUser(id, user) {
    this.users[id] = user;
  }

  removeUser(id) {
    delete this.users[id];
  }

  getUsers() {
    return this.users[id];
  }
}

const users = new Users();

export { users };
