import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from '../utils/errors';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const firstError = errors.array()[0];
    next(
      new AppError(
        firstError.msg,
        400,
        'VALIDATION_ERROR',
        { field: firstError.type === 'field' ? (firstError as any).path : undefined }
      )
    );
  };
};
