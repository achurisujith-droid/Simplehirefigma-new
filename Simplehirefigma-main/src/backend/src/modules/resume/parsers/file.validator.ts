import { fileTypeFromFile } from 'file-type';
import fs from 'fs/promises';
import logger from '../../../config/logger';

const MAGIC_BYTES = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  docx: [0x50, 0x4b, 0x03, 0x04],
  doc: [0xd0, 0xcf, 0x11, 0xe0],
};

export async function verifyFileSignature(
  filePath: string,
  expectedExtension: string
): Promise<{ isValid: boolean; fileType: any }> {
  try {
    const fileHandle = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(4);
    await fileHandle.read(buffer, 0, 4, 0);
    await fileHandle.close();

    const detectedType = await fileTypeFromFile(filePath);
    logger.info('File signature check', {
      expectedExtension,
      detectedType: detectedType?.ext,
      magicBytes: Array.from(buffer).map((b) => b.toString(16).padStart(2, '0')),
    });

    const normalizedExt = expectedExtension.toLowerCase().replace('.', '');
    let isValid = false;

    if (normalizedExt === 'pdf') {
      isValid =
        detectedType?.mime === 'application/pdf' ||
        buffer.slice(0, 4).equals(Buffer.from(MAGIC_BYTES.pdf));
    } else if (normalizedExt === 'docx') {
      isValid =
        detectedType?.mime ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        detectedType?.mime === 'application/zip' ||
        buffer.slice(0, 4).equals(Buffer.from(MAGIC_BYTES.docx));
    } else if (normalizedExt === 'doc') {
      isValid =
        detectedType?.mime === 'application/msword' ||
        buffer.slice(0, 4).equals(Buffer.from(MAGIC_BYTES.doc));
    }

    return { isValid, fileType: detectedType };
  } catch (error: any) {
    logger.error('Failed to verify file signature', { error: error.message, filePath });
    return { isValid: false, fileType: null };
  }
}

export function validateFileExtension(filename: string, mimetype: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  const validMimeTypes: { [key: string]: string[] } = {
    pdf: ['application/pdf'],
    docx: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream',
    ],
    doc: ['application/msword', 'application/octet-stream'],
  };
  if (!ext || !validMimeTypes[ext]) {
    return false;
  }
  return validMimeTypes[ext].includes(mimetype);
}
