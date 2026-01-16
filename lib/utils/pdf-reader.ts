/**
 * PDF Reader Utility
 *
 * Extracts text content from PDF files for brand voice analysis and RAG system.
 * Uses pdf-parse library to handle PDF parsing.
 */

import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';

export interface PDFContent {
  text: string;
  numPages: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  info?: Record<string, any>;
}

/**
 * Read and extract text from a PDF file
 */
export async function readPDF(filePath: string): Promise<PDFContent> {
  try {
    // Read the PDF file as a buffer
    const dataBuffer = await fs.readFile(filePath);

    // Parse the PDF
    const data = await pdfParse(dataBuffer);

    return {
      text: data.text,
      numPages: data.numpages,
      metadata: data.metadata,
      info: data.info,
    };
  } catch (error) {
    console.error(`Error reading PDF file ${filePath}:`, error);
    throw new Error(`Failed to read PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Read multiple PDF files from a directory
 */
export async function readPDFsFromDirectory(dirPath: string): Promise<Map<string, PDFContent>> {
  const results = new Map<string, PDFContent>();

  try {
    const files = await fs.readdir(dirPath);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

    console.log(`Found ${pdfFiles.length} PDF files in ${dirPath}`);

    for (const file of pdfFiles) {
      const filePath = path.join(dirPath, file);
      try {
        console.log(`Reading PDF: ${file}...`);
        const content = await readPDF(filePath);
        results.set(file, content);
        console.log(`✓ Successfully read ${file} (${content.numPages} pages, ${content.text.length} characters)`);
      } catch (error) {
        console.error(`✗ Failed to read ${file}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    throw error;
  }

  return results;
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get list of PDF files in directory
 */
export async function listPDFFiles(dirPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    return files.filter(file => file.toLowerCase().endsWith('.pdf'));
  } catch (error) {
    console.error(`Error listing PDF files in ${dirPath}:`, error);
    return [];
  }
}
