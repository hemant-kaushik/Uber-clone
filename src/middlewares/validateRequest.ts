import { Request, Response, NextFunction } from "express";
import Joi from "joi";

// Middleware to validate request data
export const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Validate the request body against the schema
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      // If validation fails, send a 400 response with all error details
      res.status(400).json({
        success: false,
        message: "Validation failed",
        statusCode: 400,
        errors: error.details.map(detail => detail.message),
      });
    } else {
      // If validation passes, proceed to the next middleware or route handler
      next();
    }
  };
};

export default validateRequest;