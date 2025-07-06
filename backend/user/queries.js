const queries = `#graphql 

   getAllUsers(
    page: Int,
    limit: Int,
    sortField: String,
    sortOrder: String,
    filters: UserFilterInput
  ): GetAllUsersResponse

   getUserById(id: String!): GetUserResponse

   getUsersBySkillIdSorted(
    skillId: String!,
  ): GetAllUsersResponse
`;

module.exports.queries = queries;
