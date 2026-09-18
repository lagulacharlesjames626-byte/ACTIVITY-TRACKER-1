export type OutputLocation = 'Gclass' | 'Emabini' | 'Gdrive' | 'Other';

export type ActivityStatus = 'pending' | 'in_progress' | 'submitted';

export interface LocationLinks {
  gclass?: string;
  emabini?: string;
  gdrive?: string;
  other?: string;
  [key: string]: string | undefined;
}

export interface SubModuleItem {
  id: string;
  subNumber: string | number; // e.g. "1", "2", "3", "4"
  title: string;              // e.g. "Module 1: Exercise 1 - Reflection"
  instructions?: string;      // specific instructions for this sub-module
  locations: OutputLocation[];
  links: LocationLinks;       // separate links for this sub-module
  customLocation?: string;
  completedBy?: string[];     // Surnames who completed this sub-module
  completedAt?: Record<string, string>; // ISO timestamps
}

export interface ModuleItem {
  id: string;
  moduleNumber: number | string;
  subject: string;
  activity: string;
  locations: OutputLocation[]; // Multi-select support: e.g. ['Gclass', 'Gdrive']
  links: LocationLinks;        // Separated links for each selected location
  customLocation?: string;
  deadline: string;            // ISO string e.g. "2026-09-20T08:00"
  status: ActivityStatus;
  completedBy?: string[];      // Array of student surnames in order of submission
  completedAt?: Record<string, string>; // ISO timestamp when each surname checked finished
  notes?: string;              // Parent/shared instructions or PDF notes
  subModules?: SubModuleItem[]; // Bundled sub-modules inside one parent PDF/deadline!
  submittedAt?: string;
  createdAt: string;
  createdBy?: string;          // Full name/surname of who created this module
  updatedAt?: string;
  lastUpdatedBy?: string;      // Full name/surname of who recently edited this module
}

export interface DeletedModuleItem extends ModuleItem {
  deletedAt: string;
  deletedBy?: string;
  expiresAt: string;
}

export interface StudentAccount {
  id: string;
  fullName: string;     // e.g. "LAGULA, Charles James"
  surname: string;      // e.g. "LAGULA"
  registeredAt: string; // ISO string
  lastActive?: string;
}

export interface SiteSettings {
  courseName: string;         // e.g. "BSBA-HRM Class 1-A"
  courseSubtitle: string;     // e.g. "College of Business Administration"
  announcement?: string;      // Banner announcement if any
  fontFamily: 'default' | 'sans' | 'poppins' | 'outfit' | 'serif' | 'mono';
  buttonPlacement: 'bottom-right' | 'bottom-left' | 'top-right';
  cardTheme: 'vibrant' | 'soft' | 'bordered';
  adminPassword?: string;     // Moderator password (default "admin123")
  portalLinks: PortalLinks;
}

export interface ActiveUser {
  id: string;
  name: string;
  editingModuleId?: string | null;
  lastSeen: number; // timestamp
}

export interface PortalLinks {
  gclass: string;
  emabini: string;
  gdrive: string;
}

export interface FilterState {
  search: string;
  subject: string;
  location: string;
  status: 'all' | 'pending' | 'in_progress' | 'submitted' | 'overdue' | 'my_finished' | 'my_pending';
  sortOrder: 'asc' | 'desc'; // 'asc' = earliest deadline first
}

export interface SyncMessage {
  type: 'MODULES_UPDATED' | 'EDITING_START' | 'EDITING_END' | 'USER_PRESENCE' | 'SETTINGS_UPDATED' | 'ROSTER_UPDATED' | 'ADMINS_UPDATED';
  senderId: string;
  senderName: string;
  moduleId?: string;
  modules?: ModuleItem[];
  deletedModules?: DeletedModuleItem[];
  roster?: string[];
  admins?: string[];
  settings?: SiteSettings;
  timestamp: number;
}

export type TimingCategory = 'early' | 'on_time' | 'late';

export interface CompletionBoosterEvent {
  id: string;
  studentName: string;
  moduleNumber: number | string;
  subject: string;
  activity: string;
  category: TimingCategory;
  speedHeadline: string;
  timeDetail: string;
  boostSentence: string;
  rank?: number;
  rankText: string;
  durationMs: number;
}
