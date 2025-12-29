import { extractTextFromPDF } from './pdf.parser';
import { extractTextFromDOCX } from './docx.parser';
import { verifyFileSignature, validateFileExtension } from './file.validator';
import logger from '../../../config/logger';

export async function parseResumeFile(
  filePath: string,
  mimetype: string,
  filename: string
): Promise<string> {
  if (!validateFileExtension(filename, mimetype)) {
    throw new Error('File extension does not match MIME type');
  }

  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext || !['pdf', 'docx', 'doc'].includes(ext)) {
    throw new Error('Unsupported file type. Only PDF, DOCX, and DOC are allowed.');
  }

  const { isValid, fileType } = await verifyFileSignature(filePath, ext);
  if (!isValid) {
    logger.error('File signature verification failed', {
      filename,
      expectedExt: ext,
      detectedType: fileType,
    });
    throw new Error('File signature verification failed. File may be corrupted or invalid.');
  }

  let text: string;
  try {
    if (ext === 'pdf') {
      text = await extractTextFromPDF(filePath);
    } else if (ext === 'docx' || ext === 'doc') {
      text = await extractTextFromDOCX(filePath);
    } else {
      throw new Error('Unsupported file type');
    }

    if (!text || text.trim().length < 50) {
      throw new Error('Resume appears to be empty or too short');
    }

    logger.info('Resume parsed successfully', { filename, textLength: text.length });
    return text;
  } catch (error: any) {
    logger.error('Failed to parse resume', { error: error.message, filename, mimetype });
    throw error;
  }
}
