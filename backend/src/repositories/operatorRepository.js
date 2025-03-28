import Operator from '../models/operator.js';
class OperatorRepository {
  async findById(operatorid) {
    return await Operator.findById(operatorid);
  }

  async findByEmail(email) {
    return await Operator.findOne({ email });
  }
}

export default new OperatorRepository();