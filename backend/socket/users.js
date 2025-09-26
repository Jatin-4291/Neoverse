class Users {
  users = {};

  addUser(id, user) {
    console.log("Adding user:", id);
    this.users[id] = user;
  }

  removeUser(id) {
    delete this.users[id];
  }

  getUsers(id) {
    return this.users[id];
  }
}

const users = new Users();

export { users };
