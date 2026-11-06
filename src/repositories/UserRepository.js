
const fs = require('fs');
const path = require('path');
const os = require('os');

class UserRepository {
  constructor(file) {
    this.file = file || (
      process.env.VERCEL
        ? path.join(os.tmpdir(), 'findmyspecialist-users.json')
        : path.join(__dirname, '../../storage/users.json')
    );

    fs.mkdirSync(path.dirname(this.file), {
      recursive: true
    });
  }

  all() {
    if (!fs.existsSync(this.file)) return [];

    try {
      return JSON.parse(
        fs.readFileSync(this.file, 'utf8')
      );
    } catch {
      return [];
    }
  }

  findByEmail(email) {
    return this.all().find(
      u => u.email === email.toLowerCase()
    );
  }

  findById(id) {
    return this.all().find(u => u.id === id);
  }

  save(user) {
    const users = this.all();
    const i = users.findIndex(u => u.id === user.id);

    if (i < 0) users.push(user);
    else users[i] = user;

    fs.writeFileSync(
      this.file,
      JSON.stringify(users, null, 2)
    );

    return user;
  }
}

module.exports = UserRepository;
