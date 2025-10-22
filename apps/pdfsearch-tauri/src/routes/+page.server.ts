import type { PageServerLoad } from './$types';
// import { getSubjects } from '../db/models/book'; // Disabled for Tantivy/SQLite migration

/**
 * Loads PDF subjects data directly from database
 * @returns Object containing the PDF subjects data
 * TODO: Replace with Tantivy/SQLite implementation
 */
export const load: PageServerLoad = async () => {
  try {
    // TODO: Implement with Tauri commands for Tantivy/SQLite
    const dataPdfSubjects: any[] = []; // Temporary empty array
    return { dataPdfSubjects };
  } catch (error) {
    console.error('Load function error:', error);
    return { dataPdfSubjects: [] };
  }
};
