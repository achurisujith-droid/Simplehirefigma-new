import pdf from 'pdf-parse';
import fs from 'fs/promises';
import logger from '../../../config/logger';

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains no extractable text');
    }
    logger.info('PDF parsed successfully', { pages: data.numpages, textLength: data.text.length });
    return data.text.trim();
  } catch (error: any) {
    logger.error('Failed to extract text from PDF', { error: error.message, filePath });
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}
