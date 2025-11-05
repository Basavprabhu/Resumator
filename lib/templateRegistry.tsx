// pages/lib/templateRegistry.tsx
import React, { ComponentType } from "react";
import { ResumeData } from "../types/resume";

// Template component type
export type TemplateComponent = ComponentType<{ 
  data: ResumeData;
}>;

// Template metadata
export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  category: "professional" | "modern" | "creative" | "academic";
  component: TemplateComponent;
  previewImage?: string;
  features: string[];
  isDefault?: boolean;
}

// Template registry - centralized template management
export const TEMPLATE_REGISTRY: Record<string, TemplateInfo> = {
  "template-professional": {
    id: "template-professional",
    name: "Professional",
    description: "Clean, traditional resume format perfect for corporate roles",
    category: "professional",
    component: require("../components/templates/minimal").default,
    features: ["ATS-friendly", "Clean layout", "Professional typography", "Easy to read"],
    isDefault: true,
  },
  "template-modern": {
    id: "template-modern", 
    name: "Modern",
    description: "Contemporary design with subtle styling for tech roles",
    category: "modern",
    component: require("../components/templates/modern").default,
    features: ["Modern design", "Tech-focused", "Good visual hierarchy", "Balanced layout"],
  },
  "template-creative": {
    id: "template-creative",
    name: "Creative",
    description: "Stylish design for creative and design positions",
    category: "creative", 
    component: require("../components/templates/creative").default,
    features: ["Creative layout", "Visual appeal", "Design-focused", "Unique styling"],
  },
};

// Get all available templates
export const getAllTemplates = (): TemplateInfo[] => {
  return Object.values(TEMPLATE_REGISTRY);
};

// Get template by ID
export const getTemplate = (templateId: string): TemplateInfo | null => {
  return TEMPLATE_REGISTRY[templateId] || null;
};

// Get default template
export const getDefaultTemplate = (): TemplateInfo => {
  return Object.values(TEMPLATE_REGISTRY).find(t => t.isDefault) || Object.values(TEMPLATE_REGISTRY)[0];
};

// Render template component
export const renderTemplate = (
  templateId: string, 
  data: ResumeData, 
  context: 'preview' | 'export' = 'export'
): React.JSX.Element | null => {
  const template = getTemplate(templateId);
  if (!template) {
    console.warn(`Template ${templateId} not found, using default`);
    const defaultTemplate = getDefaultTemplate();
    const Component = defaultTemplate.component;
    return <Component data={data} context={context} />;
  }
  
  const Component = template.component;
  return <Component data={data} context={context} />;
};

// Get templates by category
export const getTemplatesByCategory = (category: TemplateInfo["category"]): TemplateInfo[] => {
  return Object.values(TEMPLATE_REGISTRY).filter(t => t.category === category);
};

// Validate template ID
export const isValidTemplateId = (templateId: string): boolean => {
  return templateId in TEMPLATE_REGISTRY;
};

// Get template names for API/form validation
export const getTemplateIds = (): string[] => {
  return Object.keys(TEMPLATE_REGISTRY);
}; 