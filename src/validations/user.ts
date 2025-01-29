import Joi from "joi";

// Define a Joi schema for user validation
export const registerUserSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().trim().lowercase(),
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(8).required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
    .message('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  phoneNumber: Joi.string().required(),
  role: Joi.string().valid("USER", "DRIVER", "ADMIN").default("USER"),
  avatar: Joi.string().uri().optional(),
  isEmailVerified: Joi.boolean().default(false),
  isPhoneVerified: Joi.boolean().default(false),
  address: Joi.string().optional(),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(8).required(),
});

// Validation schema for forgot password
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
});

// Validation schema for reset password
export const resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
    .message('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
  confirmPassword: Joi.string().required().valid(Joi.ref('password'))
    .messages({
      'any.only': 'Passwords do not match'
    })
});