const UserModel = require("./model");
const { createHmac, randomBytes } = require("node:crypto");
const JWT = require("jsonwebtoken");
const { SendEmail } = require("../notification/index");
const mongoose = require("mongoose");

function generateHash(salt, password) {
  const hashedPassword = createHmac("sha256", salt)
    .update(password)
    .digest("hex");
  return hashedPassword;
}

function generateToken(user) {
  if (!user) throw new Error("User not found");

  if (!user.verified) throw new Error("User not verified");

  if (user.account_status !== "active") throw new Error("User not active");

  return JWT.sign(
    {
      _id: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    process.env.JWT_SECRET
  );
}

async function getAllUsers(args) {
  try {
    const {
      page = 1,
      limit,
      sortField = "created_at",
      sortOrder = "asc",
      filters = {},
    } = args;

    const filterConditions = {};
    const exactMatchFields = [
      "status",
      "role",
      "isFeatured",
      "job_counts",
      "experience",
    ];

    // Handle date range filter for created_at
    if (filters.dateRange) {
      const currentDate = new Date();
      let fromDate;

      switch (filters.dateRange) {
        case "last_day":
          fromDate = new Date();
          fromDate.setDate(fromDate.getDate() - 1);
          break;
        case "last_week":
          fromDate = new Date();
          fromDate.setDate(fromDate.getDate() - 7);
          break;
        case "last_month":
          fromDate = new Date();
          fromDate.setMonth(fromDate.getMonth() - 1);
          break;
        case "last_3_months":
          fromDate = new Date();
          fromDate.setMonth(fromDate.getMonth() - 3);
          break;
        case "last_6_months":
          fromDate = new Date();
          fromDate.setMonth(fromDate.getMonth() - 6);
          break;
        case "last_year":
          fromDate = new Date();
          fromDate.setFullYear(fromDate.getFullYear() - 1);
          break;
        default:
          fromDate = null;
      }

      if (fromDate) {
        filterConditions.created_at = { $gte: fromDate, $lte: currentDate };
      }
    }

    for (let key in filters) {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        key !== "dateRange"
      ) {
        if (key === "skills" && Array.isArray(filters[key])) {
          filterConditions[key] = {
            $in: filters[key].map((id) => new mongoose.Types.ObjectId(id)),
          };
        } else if (key === "verified" && Array.isArray(filters[key])) {
          filterConditions[key] = { $in: filters[key] };
        } else if (Array.isArray(filters[key])) {
          filterConditions[key] = { $in: filters[key] };
        } else if (typeof filters[key] === "string") {
          if (exactMatchFields.includes(key)) {
            filterConditions[key] = filters[key];
          } else {
            filterConditions[key] = { $regex: new RegExp(filters[key], "i") };
          }
        } else {
          filterConditions[key] = filters[key];
        }
      }
    }

    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };
    const skip = (page - 1) * (limit || 0);

    const query = UserModel.find(filterConditions).sort(sortOptions);

    if (skip > 0) {
      query.skip(skip);
    }

    if (limit) {
      query.limit(limit);
    }

    const users = await query;
    const totalRecords = await UserModel.countDocuments(filterConditions);
    const totalPages = limit ? Math.ceil(totalRecords / limit) : 1;

    return {
      success: true,
      message: "Users fetched successfully",
      data: users,
      pageInfo: {
        totalRecords,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw new Error(error.message);
  }
}

async function getUserByEmail(email) {
  const user = await UserModel.findOne({ email });
  return user || null;
}

async function getUserByPhone(phone) {
  const user = await UserModel.findOne({ phone });
  return user || null;
}
async function getUserById(id) {
  try {
    if (!id) throw new Error("Id is required");
    const user = await UserModel.findById(id);
    if (!user) throw new Error("User not found");
    return {
      success: true,
      message: "User fetched successfully",
      data: user,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}
async function createUser(args) {
  try {
    if (args.phone) {
      const userExistByPhone = await getUserByPhone(args.phone);
      if (userExistByPhone) {
        throw new Error("Phone number already exists");
      }
    }

    if (args.email) {
      const userExistByEmail = await getUserByEmail(args.email);
      if (userExistByEmail) {
        throw new Error("Email already exists");
      }
    }

    if (args.password) {
      const salt = randomBytes(32).toString("hex");
      const hashedPassword = generateHash(salt, args.password);
      args = {
        ...args,
        salt,
        password: hashedPassword,
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000)
      .toString()
      .replace(/\d/g, "0");
    const otpCreatedAt = Date.now();
    console.log("Generated OTP:", otp);

    const user = await UserModel.create({
      ...args,
      otp,
      otp_expiry: otpCreatedAt + 3600000,
    });
    if (!user) throw new Error("User not created");

    // ✅ Send Email to HR for verification
    // const hrEmail = process.env.HR_EMAIL || "hr@example.com";
    // const subject = "New User Verification Required";
    // const message = `
    //   <div>
    //     <h3>New User Registration</h3>
    //     <p>A new user has registered and needs verification.</p>
    //     <p><strong>Name:</strong> ${args.name || "N/A"}</p>
    //     <p><strong>Email:</strong> ${args.email || "N/A"}</p>
    //     <p><strong>Phone:</strong> ${args.phone || "N/A"}</p>
    //     <p>Please verify the details in the admin panel.</p>
    //   </div>
    // `;

    // await SendEmail(hrEmail, subject, message);

    return {
      success: true,
      message: "User created successfully.",
    };
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
}
async function verifyUser(args) {
  try {
    let user;
    let type;

    if (args.email) {
      user = await getUserByEmail(args.email);
      type = "email";
    } else if (args.phone) {
      user = await getUserByPhone(args.phone);
      type = "phone";
    } else {
      throw new Error("Email or phone is required");
    }

    if (!user) throw new Error("User not found");

    if (user.verified?.includes(type)) {
      throw new Error(`${type} already verified`);
    }

    let otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 3600000;

    if (type === "phone") {
      otp = otp.replace(/\d/g, "0"); // Replace digits with 0 for phone verification
    } // remove this line if you want to keep the original OTP format

    console.log("Generated OTP:", otp);

    await UserModel.findByIdAndUpdate(user._id, {
      otp,
      otp_expiry: otpExpiry,
    });

    if (type === "email") {
      const sent = await SendEmail(args.email, "Verify Email", otp, "otp");
      if (!sent) throw new Error("Failed to send verification email");
    }

    return {
      success: true,
      message: `${type} verification sent successfully`,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function verifyOtp(args) {
  try {
    const { phone, email, otp } = args;

    if (!otp) throw new Error("OTP is required");

    let user, type;

    if (email) {
      user = await getUserByEmail(email);
      type = "email";
    } else if (phone) {
      user = await getUserByPhone(phone);
      type = "phone";
    } else {
      throw new Error("Phone or email is required");
    }

    if (!user) throw new Error("User not found");

    if (user.verified?.includes(type)) {
      throw new Error(`${type} already verified`);
    }

    if (user.otp !== otp) throw new Error("Invalid OTP");
    if (user.otp_expiry < Date.now()) throw new Error("OTP expired");

    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        $push: {
          verified: type,
        },
        otp: null,
        otp_expiry: null,
        otp_created_at: null,
        verification_attempts: 0,
      },
      { new: true }
    );

    const token = generateToken(updatedUser);

    return {
      success: true,
      message: `${type} verified successfully`,
      data: {
        verified: true,
        token,
      },
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function resendOTP(args) {
  try {
    let user;
    if (args.email) {
      user = await getUserByEmail(args.email);
    } else if (args.phone) {
      user = await getUserByPhone(args.phone);
    } else {
      throw new Error("Email or phone is required");
    }

    if (user.verified) throw new Error("User already verified");

    const MIN_RESEND_DELAY = 60000; // 1 minute
    if (
      user.otp_created_at &&
      Date.now() - user.otp_created_at < MIN_RESEND_DELAY
    ) {
      throw new Error("Please wait before requesting a new OTP");
    }

    const otp = Math.floor(100000 + Math.random() * 900000)
      .toString()
      .replace(/\d/g, "0");

    console.log(otp);

    const otpCreatedAt = Date.now();

    await UserModel.findByIdAndUpdate(user._id, {
      otp,
      otp_expiry: otpCreatedAt + 3600000,
      otp_created_at: otpCreatedAt,
      verification_attempts: 0,
    });

    return {
      success: true,
      message: "New OTP sent successfully",
      data: otp,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function updateUser(args) {
  try {
    const userExist = await getUserById(args._id);
    console.log("User exists:", userExist);
    if (!userExist) throw new Error("User not found");

    const verified = Array.isArray(userExist.verified)
      ? [...userExist.verified]
      : [];

    if (args.email) {
      const userByEmail = await getUserByEmail(args.email);
      if (userByEmail && userByEmail._id.toString() !== args._id.toString()) {
        throw new Error("Email already exists");
      }
    }

    if (args.phone) {
      const userByPhone = await getUserByPhone(args.phone);
      if (userByPhone && userByPhone._id.toString() !== args._id.toString()) {
        throw new Error("Phone number already exists");
      }
    }

    if (args.email && args.email !== userExist.email) {
      const index = verified.indexOf("email");
      if (index !== -1) verified.splice(index, 1);
    }

    if (args.phone && args.phone !== userExist.phone) {
      const index = verified.indexOf("phone");
      if (index !== -1) verified.splice(index, 1);
    }

    args.verified = verified;

    const user = await UserModel.findByIdAndUpdate(args._id, args, {
      new: true,
      runValidators: true,
    });

    return {
      success: true,
      message: "User updated successfully",
      data: user,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getUserToken({ email, phone, password }) {
  try {
    let user;

    if (email) {
      user = await getUserByEmail(email);
    } else if (phone) {
      user = await getUserByPhone(phone);
    } else {
      throw new Error("Email or phone is required");
    }

    if (!user) {
      throw new Error("User not found");
    }

    if (password) {
      const hashedPassword = generateHash(user.salt, password);
      if (hashedPassword !== user.password) {
        throw new Error("Incorrect password");
      }
    }

    if (!user.verified || user.verified.length === 0) {
      // const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otp = "000000";
      const otpExpiry = Date.now() + 3600000;

      await UserModel.findByIdAndUpdate(user._id, {
        otp,
        otp_expiry: otpExpiry,
      });

      // await SendEmail(user.email, "OTP Verification", otp, "otp");

      return {
        success: true,
        message: "Please verify your account",
        data: {
          verified: [],
          token: null,
        },
      };
    }

    // If verified, generate token
    const token = generateToken(user);

    return {
      success: true,
      message: "Login successful",
      data: {
        verified: [...user.verified],
        token,
      },
    };
  } catch (error) {
    console.error(error);
    throw new Error(
      error.message || "An error occurred while processing the request."
    );
  }
}

async function resendVerificationEmail(args) {
  try {
    const user = await getUserByEmail(args.email);
    if (!user) throw new Error("User not found");
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = Math.floor(100000 + Math.random() * 900000)
      .toString()
      .replace(/\d/g, "0");
    console.log(otp);
    // await SendEmail(args.email, "Verify Email", otp, "otp");

    await UserModel.findByIdAndUpdate(user._id, {
      otp,
      otp_expiry: Date.now() + 3600000,
    });
    return {
      success: true,
      message: "Email sent successfully",
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function forgotPassword(args) {
  try {
    const user = await getUserByEmail(args.email);
    if (!user) throw new Error("User not found");
    if (user.otp_expiry > Date.now() + 300000) {
      // 5 mints
      return {
        success: true,
        message: "OTP sent already",
      };
    }

    // const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otp = Math.floor(100000 + Math.random() * 900000)
      .toString()
      .replace(/\d/g, "0");

    // await SendEmail(args.email, "Reset Password", otp, "otp");

    await UserModel.findByIdAndUpdate(user._id, {
      otp,
      otp_expiry: Date.now() + 3600000, // 1 hour
    });

    return {
      success: true,
      message: "OTP sent successfully",
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function resetPassword(args) {
  try {
    const user = await getUserByEmail(args.email);
    if (!user) throw new Error("User not found");

    if (args.otp !== user.otp) throw new Error("Invalid OTP");

    if (user.otp_expiry < Date.now()) throw new Error("OTP expired");

    const salt = randomBytes(32).toString("hex");
    const hashedPassword = generateHash(salt, args.password);

    await UserModel.findByIdAndUpdate(user._id, {
      salt,
      password: hashedPassword,
      otp: null,
      otp_expiry: null,
    });

    const token = generateToken(user);

    return {
      success: true,
      message: "Password reset successfully",
      data: token,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function changePassword(args) {
  try {
    const user = await getUserById(args._id);
    if (!user) throw new Error("User not found");

    const userSalt = user.salt;
    const usersHashPassword = generateHash(userSalt, args.old_password);

    if (usersHashPassword !== user.password)
      throw new Error("Incorrect Password");

    const salt = randomBytes(32).toString("hex");
    const hashedPassword = generateHash(salt, args.new_password);

    await UserModel.findByIdAndUpdate(user._id, {
      salt,
      password: hashedPassword,
    });
    return {
      success: true,
      message: "Password Changed Successfully",
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function deleteUserById(id) {
  try {
    if (!id) throw new Error("Id is required");
    const user = await UserModel.findById(id);
    if (!user) throw new Error("User not found");
    await UserModel.findByIdAndDelete(id);
    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports.UserService = {
  getUserToken,
  createUser,
  updateUser,
  getUserById,
  getUserByEmail,
  getUserByPhone,
  resendOTP,
  verifyUser,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getAllUsers,
  deleteUserById,
  verifyOtp,
};
