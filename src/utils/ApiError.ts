export class ApiError extends Error {
     // Declare class properties
     statusCode: number;
     data: null;
     success: boolean;
     errors: any[];
     
    constructor(statusCode: number, message = 'Something went wrong', stack = '', errors = []) {
        super(message)
        this.statusCode = statusCode; 
        this.data = null; 
        this.message = message; 
        this.success = false; 
        this.errors = errors;

        if(stack) {
            this.stack = stack; 
        }else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}