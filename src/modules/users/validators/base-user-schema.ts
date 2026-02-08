import { Joi } from "celebrate";

export const baseUserFields = {
  name: Joi.string()
    .min(5)
    .max(50),

  username: Joi.string()
  .min(5)
  .max(20),

  birthDate: Joi.string()
  .pattern(/^\d{2}\/\d{2}\/\d{4}$/),

  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/[a-z]/, "lowercase letter")
    .pattern(/[A-Z]/, "uppercase letter")
    .pattern(/[0-9]/, "number")
};