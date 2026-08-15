export interface AdminUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  liveUrl: string | null;
  githubUrl: string | null;
  category: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  technologies: Technology[];
  createdAt: string;
  updatedAt: string;
}

export interface Technology {
  id: string;
  name: string;
  icon: string | null;
  category: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  featured: boolean;
  sortOrder: number;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SiteSettings {
  id: string;
  name: string;
  title: string;
  bio: string;
  profileImage: string | null;
  email: string | null;
  telegram: string | null;
  twitter: string | null;
  github: string | null;
  linkedin: string | null;
}
