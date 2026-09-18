import { ModuleItem, PortalLinks } from '../types';

export const DEFAULT_PORTAL_LINKS: PortalLinks = {
  gclass: 'https://classroom.google.com',
  emabini: 'https://e-mabini.mabini.edu.ph',
  gdrive: 'https://drive.google.com',
};

// Initial modules starts clean with NO fake or demo modules.
// All modules are created and persisted permanently by real classmates and admins!
export const INITIAL_MODULES: ModuleItem[] = [];
