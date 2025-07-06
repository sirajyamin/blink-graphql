const mutations = `#graphql
  createUser(
    first_name: String,
    last_name: String,
    email: String,
    password: String,
    confirm_password: String,
    phone: String,
    role: String,
    profile_picture: String,
    status: String,
  ): UserCreateUserResponse

  updateUser(
    _id: String!,
    first_name: String,
    last_name: String,
    email: String,
    password: String,
    confirm_password: String,
    phone: String,
    profile_picture: String,
    status: String,
    account_status: String,
    skills: [String],
    verified: [String],
  ): UserUpdateUserResponse



  verifyEmail(email: String!, otp: String!): UserTokenResponse

  verifyUser(phone: String, email: String,): UserTokenResponse

  verifyOtp(phone: String, email: String, otp: String!): UserGetUserTokenResponse

  resendVerificationEmail(email: String!): Response

  forgotPassword(email: String!): Response

  resetPassword(email: String!, otp: String!, password: String!, confirm_password: String!): UserTokenResponse

  changePassword(old_password: String!, new_password: String!): Response

  deleteUserById(id: String!): Response
 
  getUserToken(email: String, phone: String, password: String): UserGetUserTokenResponse
  
`;
module.exports.mutations = mutations;
