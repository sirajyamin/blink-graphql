const { UserService } = require("./datasource");
const UserModel = require("./model");
const authorize = require("../authorize");
const { VerifyDomainDkimCommand } = require("@aws-sdk/client-ses");
const queries = {
  getUserById: authorize("GET_USER_BY_ID")(
    async (parent, args, context, info) => {
      try {
        if (!context.user) throw new Error("You are not logged in");
        if (context.user._id !== args.id && context.user.role !== "admin") {
          throw new Error("You are not authorized to access this user");
        }

        if (!args) throw new Error("Invalid arguments");
        if (!args.id) throw new Error("User ID is required");
        return await UserService.getUserById(args.id);
      } catch (error) {
        console.log(error);
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    }
  ),

  getUsersBySkillIdSorted: authorize("GET_ALL_USERS")(
    async (parent, args, context, info) => {
      try {
        return await UserService.getUsersBySkillIdSorted(args);
      } catch (error) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    }
  ),

  getAllUsers: authorize("GET_ALL_USERS")(
    async (parent, args, context, info) => {
      try {
        if (!context.user) throw new Error("You are not logged in");
 

        return await UserService.getAllUsers(args);
      } catch (error) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    }
  ),
};

const mutations = {
  createUser: async (parent, args, context, info) => {
    console.log(args);
    try {
      if (!args) throw new Error("Invalid arguments");
      if (!args.phone) {
        delete args.phone;
      }
      if (!args.email) {
        delete args.email;
      }
      // if (!args.phone && !args.email)
      //   throw new Error("Phone or email is required");
      if (!args.role) throw new Error("Role is required");

      // if (args.role === "tradesman") {
      //   if (!args.first_name) throw new Error("First name is required");
      //   if (!args.password) throw new Error("Password is required");
      //   if (args.password.length < 8) throw new Error("Password is too short");
      //   if (args.password.length > 20) throw new Error("Password is too long");
      //   if (args.password !== args.confirm_password)
      //     throw new Error("Passwords do not match");
      //   if (!args.confirm_password)
      //     throw new Error("Confirm password is required");
      //   if (!args.cnic) throw new Error("CNIC is required");
      //   if (!args.skills) throw new Error("Skills are required");
      // }

      return await UserService.createUser(args);
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },

  getUserToken: async (parent, args, context, info) => {
    try {
      if (!args) throw new Error("Invalid arguments");

      if (!args.email && !args.phone)
        throw new Error("Email or phone is required");

      if (args.password) {
        if (args.password.length < 8) throw new Error("Password too short");

        if (args.password.length > 20) throw new Error("Password too long");
      }

      return await UserService.getUserToken(args);
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },

  updateUser: authorize("UPDATE_USER")(async (parent, args, context, info) => {
    try {
      if (!context.user) throw new Error("You are not logged in");
      if (!args) throw new Error("Invalid arguments");
      if (!args._id) throw new Error("User ID is required");
      if (context.user._id !== args._id && context.user.role !== "admin")
        throw new Error("You are not authorized to update this user");

      if (args.role && context.user.role !== "admin")
        throw new Error("You are not authorized to update role");

      if (args.account_status && context.user.role !== "admin")
        throw new Error("You are not authorized to update status");

      if (args.first_name && args.first_name.length < 3)
        throw new Error("First name is too short");

      if (args.first_name && args.first_name.length > 30)
        throw new Error("First name is too long");

      return await UserService.updateUser(args);
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }),

  deleteUserById: authorize("DELETE_USER_BY_ID")(
    async (parent, args, context, info) => {
      try {
        if (!context.user) throw new Error("You are not logged in");
        if (!args) throw new Error("Invalid arguments");
        if (!args.id) throw new Error("User ID is required");
        if (context.user._id !== args.id && context.user.role !== "admin")
          throw new Error("You are not authorized to delete this user");
        return await UserService.deleteUserById(args.id);
      } catch (error) {
        return {
          success: false,
          message: error.message,
          data: null,
        };
      }
    }
  ),

  verifyEmail: async (parent, args, context, info) => {
    try {
      if (!args) throw new Error("Invalid arguments");

      if (!args.email) throw new Error("Email is required");
      if (!args.otp) throw new Error("OTP is required");

      return await UserService.verifyEmail(args);
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },

  verifyUser: async (parent, args, context, info) => {
    try {
      if (!args) throw new Error("Invalid arguments");
      if (!args.email && !args.phone)
        throw new Error("Please enter email or phone number");
      return await UserService.verifyUser(args);
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },

  verifyOtp: async (parent, args, context, info) => {
    try {
      if (!args) throw new Error("Invalid arguments");
      if (!args.email && !args.phone)
        throw new Error("Please enter email or phone number");
      return await UserService.verifyOtp(args);
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },
  resendVerificationEmail: async (parent, args, context, info) => {
    try {
      if (!args) throw new Error("Invalid arguments");
      if (!args.email) throw new Error("Email is required");
      return await UserService.resendVerificationEmail(args);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  forgotPassword: async (parent, args, context, info) => {
    try {
      if (!args) throw new Error("Invalid arguments");
      if (!args.email) throw new Error("Email is required");
      return await UserService.forgotPassword(args);
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  },

  resetPassword: async (parent, args, context, info) => {
    try {
      if (!args) throw new Error("Invalid arguments");
      if (!args.email) throw new Error("Email is required");
      if (!args.otp) throw new Error("OTP is required");
      if (!args.password) throw new Error("Password is required");
      if (!args.confirm_password)
        throw new Error("Confirm password is required");
      if (args.password !== args.confirm_password)
        throw new Error("Passwords do not match");

      if (args.password.length < 8) throw new Error("Password too short");

      if (args.password.length > 20) throw new Error("Password too long");

      return await UserService.resetPassword(args);
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  },

  changePassword: async (parent, args, context, info) => {
    try {
      if (!args) throw new Error("Invalid arguments");
      const user = context.user;
      if (!user) throw new Error("User not found");

      if (!args.old_password) throw new Error("Old password is required");

      if (!args.new_password) throw new Error("New password is required");

      if (args.new_password.length < 8)
        throw new Error("New password too short");

      if (args.new_password.length > 20)
        throw new Error("New password too long");

      return await UserService.changePassword({
        _id: user._id,
        ...args,
      });
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
};

module.exports.resolvers = { queries, mutations };
