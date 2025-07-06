const roles = {
  USER: "user",
};

const permissions = {
  [roles.USER]:
    [
      // USER
      "DELETE_USER_BY_ID",
      "UPDATE_USER",
      "GET_USER_BY_ID",
      "GET_ALL_USERS",

      // SERVICE
      "CREATE_SERVICE",
      "UPDATE_SERVICE",
      "DELETE_SERVICE_BY_ID",
      "GET_ALL_SERVICES",
      "GET_SERVICE_BY_ID",

      // CATEGORY
      "CREATE_CATEGORY",
      "UPDATE_CATEGORY",
      "DELETE_CATEGORY_BY_ID",
      "GET_ALL_CATEGORIES",
      "GET_CATEGORY_BY_ID",

      // SUB CATEGORY
      "CREATE_SUB_CATEGORY",
      "UPDATE_SUB_CATEGORY",
      "DELETE_SUB_CATEGORY_BY_ID",
      "GET_ALL_SUB_CATEGORIES",

      // ADDON
      "CREATE_ADDON",
      "UPDATE_ADDON",
      "DELETE_ADDON_BY_ID",
      "GET_ALL_ADDONS",

      // BOOKING
      "CREATE_BOOKING",
      "UPDATE_BOOKING",
      "DELETE_BOOKING_BY_ID",
      "GET_ALL_BOOKINGS",
      "GET_BOOKING_BY_ID",
      "GET_FULL_BOOKING_BY_ID",
    ] || [],
};

module.exports = { roles, permissions };
