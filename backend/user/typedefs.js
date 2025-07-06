const typedefs = `
  type User {
    _id: String
    first_name: String
    last_name: String
    email: String
    age: Int
    role: String
    gender: String
    profile_picture: String
    phone: String
    verified: [String]
    status: String
    password: String
    token: String
    otp: String
    otp_expiry: String
    online: Boolean 
    lastSeen: String
    created_at: String
    updated_at: String
  }

  type UserUpdateUserResponse {
    success: Boolean
    message: String
    data: User
  }

  type UserCreateUserResponse {
    success: Boolean!
    message: String!
    data: String!
  }

  type UserTokenResponse {
    success: Boolean
    message: String
    data: String
  }

  type UserGetUserTokenResponse {
    success: Boolean
    message: String
    data: UserLoginUserResponse
  }

  type UserLoginUserResponse {
    verified: [String]
    token: String
  }

  type GetAllUsersResponse {
    success: Boolean!
    message: String!
    data: [User]
    pageInfo: PageInfo
  }

  type PageInfo {
    totalRecords: Int
    totalPages: Int
    currentPage: Int
    hasNextPage: Boolean
    hasPreviousPage: Boolean
  }

  input UserFilterInput {
    first_name: String
    email: String
    role: String
    verified: [String]
    status: String
  }

  type GetUserResponse {
    success: Boolean
    message: String
    data: User
  }
`;

module.exports.typedefs = typedefs;
