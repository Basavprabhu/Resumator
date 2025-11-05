import { ResumeData } from '../types/resume';

// A4 dimensions in pixels (at 96 DPI) - Standard print size
export const A4_DIMENSIONS = {
  width: 794,   // 210mm at 96 DPI
  height: 1123, // 297mm at 96 DPI
  margin: 32,   // Reduced margin for better space utilization
  usableWidth: 730,   // width - 2*margin
  usableHeight: 1059  // height - 2*margin
};

export interface LayoutConfig {
  // Font sizes (in pixels)
  nameFontSize: number;
  titleFontSize: number;
  sectionTitleFontSize: number;
  bodyFontSize: number;
  smallFontSize: number;
  
  // Spacing (in pixels)
  sectionSpacing: number;
  itemSpacing: number;
  lineHeight: number;
  containerPadding: number;
  
  // Layout properties
  sidebarWidth?: number;
  compactMode: boolean;
  scaleFactor: number;
  
  // Content limits for overflow prevention
  maxExperienceItems: number;
  maxEducationItems: number;
  maxBulletsPerExp: number;
  maxSkillsDisplay: number;
  maxAchievements: number;
  
  // Template-specific adjustments
  templateType: 'minimal' | 'modern' | 'creative';
}

export interface ContentMetrics {
  experienceCount: number;
  educationCount: number;
  skillsCount: number;
  achievementsCount: number;
  totalBulletPoints: number;
  summaryLength: number;
  hasImage: boolean;
  sectionCount: number;
  estimatedHeight: number;
  contentDensity: 'sparse' | 'normal' | 'dense' | 'overflow';
}

export function analyzeContent(data: ResumeData): ContentMetrics {
  const experienceCount = data.experience?.length || 0;
  const educationCount = data.education?.length || 0;
  const skillsCount = data.skills?.length || 0;
  const achievementsCount = data.achivements?.length || 0;
  const summaryLength = data.summary?.length || 0;
  
  const totalBulletPoints = data.experience?.reduce((total, exp) => {
    return total + (Array.isArray(exp.description) ? exp.description.length : 1);
  }, 0) || 0;

  // Count active sections
  let sectionCount = 0;
  if (data.summary) sectionCount++;
  if (experienceCount > 0) sectionCount++;
  if (educationCount > 0) sectionCount++;
  if (skillsCount > 0) sectionCount++;
  if (data.softSkills?.length) sectionCount++;
  if (data.languages?.length) sectionCount++;
  if (data.certifications?.length) sectionCount++;
  if (achievementsCount > 0) sectionCount++;
  if (data.volunteer?.length) sectionCount++;
  if (data.interests?.length) sectionCount++;

  // Estimate content height with improved accuracy
  let estimatedHeight = 0;
  
  // Header section (name, title, contact) - varies by template
  estimatedHeight += 100;
  
  // Image space
  if (data.photoUrl) {
    estimatedHeight += 40; // Additional space for image
  }
  
  // Summary section
  if (data.summary) {
    const summaryLines = Math.ceil(summaryLength / 80); // ~80 chars per line
    estimatedHeight += 30 + (summaryLines * 16); // Title + content
  }
  
  // Experience section
  if (experienceCount > 0) {
    estimatedHeight += 35; // Section title
    const limitedExperienceCount = Math.min(experienceCount, 6); // Limit for calculation
    estimatedHeight += limitedExperienceCount * 60; // Base per experience
    estimatedHeight += Math.min(totalBulletPoints, limitedExperienceCount * 4) * 16; // Bullet points
  }
  
  // Education section
  if (educationCount > 0) {
    estimatedHeight += 35 + (Math.min(educationCount, 4) * 45);
  }
  
  // Skills sections
  if (skillsCount > 0) {
    estimatedHeight += 35 + Math.ceil(skillsCount / 6) * 25; // Skills in rows
  }
  
  if (data.softSkills?.length) {
    estimatedHeight += 35 + Math.ceil(data.softSkills.length / 4) * 20;
  }
  
  // Other sections
  const otherSections = [
    data.languages?.length ? 55 : 0,
    data.certifications?.length ? (35 + Math.min(data.certifications.length, 4) * 25) : 0,
    achievementsCount ? (35 + Math.min(achievementsCount, 6) * 18) : 0,
    data.volunteer?.length ? (35 + Math.min(data.volunteer.length, 3) * 50) : 0,
    data.interests?.length ? 55 : 0
  ].reduce((sum, height) => sum + height, 0);
  
  estimatedHeight += otherSections;

  // Determine content density
  let contentDensity: ContentMetrics['contentDensity'] = 'normal';
  if (estimatedHeight > A4_DIMENSIONS.usableHeight * 1.1) {
    contentDensity = 'overflow';
  } else if (estimatedHeight > A4_DIMENSIONS.usableHeight * 0.85) {
    contentDensity = 'dense';
  } else if (estimatedHeight < A4_DIMENSIONS.usableHeight * 0.6) {
    contentDensity = 'sparse';
  }

  return {
    experienceCount,
    educationCount,
    skillsCount,
    achievementsCount,
    totalBulletPoints,
    summaryLength,
    hasImage: !!data.photoUrl,
    sectionCount,
    estimatedHeight,
    contentDensity
  };
}

export function optimizeLayout(data: ResumeData, templateType: 'minimal' | 'modern' | 'creative'): LayoutConfig {
  const metrics = analyzeContent(data);
  
  // Base configurations optimized for better A4 utilization
  const baseConfigs = {
    minimal: {
      nameFontSize: 32,
      titleFontSize: 18,
      sectionTitleFontSize: 16,
      bodyFontSize: 12,
      smallFontSize: 11,
      sectionSpacing: 24,
      itemSpacing: 14,
      lineHeight: 1.4,
      containerPadding: 32,
      maxExperienceItems: 6,
      maxEducationItems: 4,
      maxBulletsPerExp: 4,
      maxSkillsDisplay: 20,
      maxAchievements: 8
    },
    modern: {
      nameFontSize: 36,      // Increased from 32
      titleFontSize: 20,     // Increased from 18
      sectionTitleFontSize: 15, // Increased from 13
      bodyFontSize: 13,      // Increased from 12
      smallFontSize: 11,     // Increased from 10
      sectionSpacing: 28,    // Increased from 24
      itemSpacing: 18,       // Increased from 16
      lineHeight: 1.5,
      containerPadding: 40,  // Increased for better balance
      sidebarWidth: 220,     // Increased from 200
      maxExperienceItems: 5,
      maxEducationItems: 4,
      maxBulletsPerExp: 4,
      maxSkillsDisplay: 16,
      maxAchievements: 6
    },
    creative: {
      nameFontSize: 34,
      titleFontSize: 18,
      sectionTitleFontSize: 15,
      bodyFontSize: 12,
      smallFontSize: 11,
      sectionSpacing: 22,
      itemSpacing: 16,
      lineHeight: 1.4,
      containerPadding: 36,
      maxExperienceItems: 5,
      maxEducationItems: 4,
      maxBulletsPerExp: 3,
      maxSkillsDisplay: 18,
      maxAchievements: 6
    }
  };

  let config = { 
    ...baseConfigs[templateType],
    templateType,
    compactMode: false,
    scaleFactor: 1.0
  };

  // Optimize based on content density
  switch (metrics.contentDensity) {
    case 'overflow':
      // Aggressive optimization for overflow content
      config.nameFontSize = Math.max(config.nameFontSize - 6, 26);
      config.titleFontSize = Math.max(config.titleFontSize - 3, 15);
      config.sectionTitleFontSize = Math.max(config.sectionTitleFontSize - 2, 13);
      config.bodyFontSize = Math.max(config.bodyFontSize - 1, 11);
      config.smallFontSize = Math.max(config.smallFontSize - 1, 10);
      
      config.sectionSpacing = Math.max(config.sectionSpacing - 8, 16);
      config.itemSpacing = Math.max(config.itemSpacing - 4, 10);
      config.lineHeight = Math.max(config.lineHeight - 0.1, 1.3);
      config.containerPadding = Math.max(config.containerPadding - 8, 24);
      
      // Strict content limits
      config.maxExperienceItems = Math.max(config.maxExperienceItems - 2, 3);
      config.maxBulletsPerExp = Math.max(config.maxBulletsPerExp - 1, 2);
      config.maxAchievements = Math.max(config.maxAchievements - 2, 4);
      
      config.compactMode = true;
      config.scaleFactor = 0.95;
      
      // Template-specific overflow adjustments
      if (templateType === 'modern' && config.sidebarWidth) {
        config.sidebarWidth = Math.max(config.sidebarWidth - 30, 180);
      }
      break;

    case 'dense':
      // Moderate optimization for dense content
      config.nameFontSize = Math.max(config.nameFontSize - 2, 28);
      config.sectionSpacing = Math.max(config.sectionSpacing - 4, 18);
      config.itemSpacing = Math.max(config.itemSpacing - 2, 12);
      config.maxBulletsPerExp = Math.max(config.maxBulletsPerExp - 1, 3);
      config.compactMode = true;
      config.scaleFactor = 0.98;
      break;

    case 'sparse':
      // Expand for sparse content to better utilize space
      config.nameFontSize = Math.min(config.nameFontSize + 4, 40);
      config.titleFontSize = Math.min(config.titleFontSize + 2, 22);
      config.sectionTitleFontSize = Math.min(config.sectionTitleFontSize + 1, 17);
      config.bodyFontSize = Math.min(config.bodyFontSize + 1, 14);
      
      config.sectionSpacing = Math.min(config.sectionSpacing + 6, 36);
      config.itemSpacing = Math.min(config.itemSpacing + 4, 22);
      config.lineHeight = Math.min(config.lineHeight + 0.1, 1.6);
      
      config.compactMode = false;
      config.scaleFactor = 1.02;
      
      // Template-specific sparse adjustments
      if (templateType === 'modern' && config.sidebarWidth) {
        config.sidebarWidth = Math.min(config.sidebarWidth + 20, 250);
      }
      break;

    case 'normal':
    default:
      // Use base configuration with minor tweaks
      config.compactMode = false;
      config.scaleFactor = 1.0;
      break;
  }

  return config;
}

export function getPrintStyles(config: LayoutConfig) {
  return {
    container: {
      fontSize: `${config.bodyFontSize}px`,
      lineHeight: config.lineHeight,
      maxHeight: `${A4_DIMENSIONS.height}px`,
      overflow: 'hidden' as const,
      padding: `${config.containerPadding}px`,
      transform: `scale(${config.scaleFactor})`,
      transformOrigin: 'top left',
      width: `${100 / config.scaleFactor}%`,
      pageBreakInside: 'avoid' as const,
      WebkitPrintColorAdjust: 'exact' as const
    },
    name: {
      fontSize: `${config.nameFontSize}px`,
      lineHeight: 1.2
    },
    title: {
      fontSize: `${config.titleFontSize}px`,
      lineHeight: 1.3
    },
    sectionTitle: {
      fontSize: `${config.sectionTitleFontSize}px`,
      marginBottom: `${config.itemSpacing}px`,
      lineHeight: 1.3
    },
    section: {
      marginBottom: `${config.sectionSpacing}px`
    },
    item: {
      marginBottom: `${config.itemSpacing}px`
    },
    sidebar: config.sidebarWidth ? {
      width: `${config.sidebarWidth}px`,
      minWidth: `${config.sidebarWidth}px`
    } : undefined
  };
}

export function getResponsiveClasses(config: LayoutConfig) {
  const getFontSizeClass = (size: number) => {
    if (size >= 36) return 'text-4xl';
    if (size >= 30) return 'text-3xl';
    if (size >= 24) return 'text-2xl';
    if (size >= 20) return 'text-xl';
    if (size >= 18) return 'text-lg';
    if (size >= 16) return 'text-base';
    if (size >= 14) return 'text-sm';
    return 'text-xs';
  };

  const getSpacingClass = (spacing: number) => {
    if (spacing >= 32) return 'mb-8';
    if (spacing >= 24) return 'mb-6';
    if (spacing >= 16) return 'mb-4';
    if (spacing >= 12) return 'mb-3';
    return 'mb-2';
  };

  return {
    name: `${getFontSizeClass(config.nameFontSize)} font-bold`,
    title: `${getFontSizeClass(config.titleFontSize)} text-gray-600`,
    sectionTitle: `${getFontSizeClass(config.sectionTitleFontSize)} font-semibold`,
    body: `${getFontSizeClass(config.bodyFontSize)}`,
    small: `${getFontSizeClass(config.smallFontSize)} text-gray-500`,
    sectionSpacing: getSpacingClass(config.sectionSpacing),
    itemSpacing: getSpacingClass(config.itemSpacing),
    compact: config.compactMode ? 'space-y-1' : 'space-y-2'
  };
}

// Utility function to truncate content based on limits
export function limitContent<T>(items: T[], maxItems: number): T[] {
  return items.slice(0, maxItems);
}

export function limitBulletPoints(description: string[] | string, maxBullets: number): string[] {
  if (typeof description === 'string') {
    return [description];
  }
  return description.slice(0, maxBullets);
} 