import UserModel from '../models/User.js';

// Repository functions isolate raw mongoose calls from business logic.
export async function findUserByEmail(email) {
  return UserModel.findOne({ email }).exec();
}

export async function createUser(payload) {
  const user = new UserModel(payload);
  await user.save();
  return user;
}

export async function findUserById(id) {
  return UserModel.findById(id).exec();
}

export async function findUserByEmailAndUsername(email, username) {
  return UserModel.findOne({ email, username }).exec();
}

export async function updateUserPasswordById(id, passwordHash) {
  return UserModel.findByIdAndUpdate(
    id,
    { password: passwordHash },
    { new: true },
  ).exec();
}
