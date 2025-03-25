const User = require('../models/user');
const Admin = require('../models/admin');
const Operator = require('../models/operator');

class Repository {
  constructor(model) {
    this.model = model;
  }

  async findByEmail(email) {
    return await this.model.findOne({ email });
  }

  async save(entity) {
    return await entity.save();
  }

  async findById(id) {
    return await this.model.findById(id);
  }

  async updateStatus(id, status) {
    return await this.model.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }
}

const UserRepo = new Repository(User);
const AdminRepo = new Repository(Admin);
const OperatorRepo = new Repository(Operator);

module.exports = { UserRepo, AdminRepo, OperatorRepo };