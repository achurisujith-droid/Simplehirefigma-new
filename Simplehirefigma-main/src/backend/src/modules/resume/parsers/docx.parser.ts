import mammoth from 'mammoth';
import logger from '../../../config/logger';

export async function extractTextFromDOCX(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('Document appears to be empty or contains no extractable text');
    }
    if (result.messages.length > 0) {
      logger.warn('DOCX parsing warnings', { messages: result.messages, filePath });
    }
    logger.info('DOCX parsed successfully', { textLength: result.value.length });
    return result.value.trim();
  } catch (error: any) {
    logger.error('Failed to extract text from DOCX', { error: error.message, filePath });
    throw new Error(`Failed to parse DOCX: ${error.message}`);
  }
}
