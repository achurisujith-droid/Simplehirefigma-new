import crypto from 'crypto';

export const sha256Hash = (text: string): string => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

export const generateRandomToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};
