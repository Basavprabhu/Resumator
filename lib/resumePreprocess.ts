// pages/lib/resumePreprocess.ts
import type { ResumeData } from "../types/resume";
import { validateResumeData, estimateContentHeight } from "./universalTemplateHelpers";
import { optimizeLayout, LayoutConfig, analyzeContent } from "./layoutOptimizer";

/** Layout hints that the template will consume */
export type SectionFontSizes = {
  name: number; // px
  sectionTitle: number;
  body: number;
  sidebarTitle: number;
  sidebarBody: number;
  duration: number;
};

export type LayoutHints = {
  compactMode: boolean;
  nameFontSize: number;
  maxExperienceItems: number;
  maxBulletsPerExp: number;
  maxEducationItems: number;
  truncateCharPerLine: number;
  sectionFontSizes: SectionFontSizes;
  sidebarWidthPx: number;
};

export type ProcessedResume = ResumeData & { _layout?: LayoutHints };

/* helpers */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const uniqStrings = (arr?: string[]) =>
  Array.from(new Set((arr || []).map((s) => (s || "").trim()).filter(Boolean)));

const joinExpText = (exp?: ResumeData["experience"]) =>
  (exp || []).map((e) => `${e.role} ${e.company} ${e.duration} ${(e.description || []).join(" ")}`).join(" ");

const joinEduText = (edu?: ResumeData["education"]) =>
  (edu || []).map((e) => `${e.degree} ${e.school} ${e.year}`).join(" ");

const joinSimple = (arr?: string[]) => (arr || []).join(" ");

/**
 * preprocessResume
 * - returns a ProcessedResume (immutable copy)
 * - decides compact mode, caps counts, moves overflow to achievements
 * - computes per-section font sizes that the template should use
 */
export function preprocessResume(input: ResumeData): ProcessedResume {
  // Validate input
  if (!input) {
    throw new Error('preprocessResume: input is required');
  }
  
  // Use universal data validator for consistency
  const validatedData = validateResumeData(input);
  const data: ProcessedResume = JSON.parse(JSON.stringify(validatedData));
  
  // Estimate content height for PDF safety
  const estimatedHeight = estimateContentHeight(data);
  const isPDFSafe = estimatedHeight <= 800; // Rough threshold for A4 page
  
  // Analyze content and optimize layout (new system)
  const contentMetrics = analyzeContent(data);
  const layoutConfig = optimizeLayout(data, 'modern'); // Default to modern, will be overridden by templates

  // Character counts (heuristic to compute density)
  const nameLen = (data.name || "").length;
  const titleLen = (data.title || "").length;
  const summaryLen = (data.summary || "").length;
  const expLen = joinExpText(data.experience).length;
  const eduLen = joinEduText(data.education).length;
  const skillsLen = joinSimple(data.skills).length;
  const softLen = joinSimple((data as any).softSkills)?.length || 0;
  const achLen = joinSimple(data.achivements).length;
  const langsLen = joinSimple(data.languages).length;
  const certLen = (data.certifications || []).map((c) => (c.name || "") + (c.year || "")).join(" ").length;
  const volunteerLen = (data.volunteer || []).map((v) => `${v?.role || ''} ${v?.org || ''} ${(v?.description || []).join(" ")}`).join(" ").length;

  const totalChars = Math.max(
    nameLen +
    titleLen +
    summaryLen +
    expLen +
    eduLen +
    skillsLen +
    softLen +
    achLen +
    langsLen +
    certLen +
    volunteerLen,
    50 // Minimum character count to prevent division by zero
  );

  // thresholds — tweak if you like
  const TARGET_CHARS = 3600; // target "comfortable" amount to fit A4 without much scaling
  const MEDIUM_CHARS = 2200; // medium threshold
  const COMPACT_CHAR_THRESHOLD = 4200; // above this, aggressive compacting
  const MIN_CHARS = 800; // below this, scale up fonts for better A4 usage

  // compact mode decision - consider both content density and PDF safety
  const compactMode = totalChars > MEDIUM_CHARS || !isPDFSafe;

  // compute a global density scale factor (1 = normal, <1 shrink, >1 grow for sparse content)
  // For sparse content (< MIN_CHARS), we want to scale up slightly
  // For normal content, keep scale at 1
  // For dense content, scale down but keep minimum at 0.70
  let globalScale = 1;
  
  if (totalChars < MIN_CHARS) {
    // Scale up for sparse content to better fill A4 page
    const upScale = Math.min(MIN_CHARS / Math.max(1, totalChars), 1.3);
    globalScale = clamp(Math.pow(upScale, 0.3) * 1.1, 1.0, 1.25);
  } else if (totalChars > TARGET_CHARS) {
    // Scale down for dense content
  const rawScale = TARGET_CHARS / Math.max(1, totalChars);
    globalScale = clamp(Math.pow(rawScale, 0.5), 0.7, 1);
  }

  // Name font size heuristic: long names smaller, but scale up for sparse content
  const baseName = totalChars < MIN_CHARS ? 44 : 40; // Larger base for sparse content
  const nameFontSize = clamp(Math.round(baseName * globalScale - (nameLen > 24 ? (nameLen - 24) * 0.25 : 0)), 18, 52);

  // Base sizes for sections (px) then apply globalScale and some section weighting
  // Increase base sizes for sparse content to better fill A4
  const baseSectionTitle = totalChars < MIN_CHARS ? 16 : 14;
  const baseBody = totalChars < MIN_CHARS ? 13 : 12;
  const baseSidebarTitle = totalChars < MIN_CHARS ? 13 : 12;
  const baseSidebarBody = totalChars < MIN_CHARS ? 12 : 11;
  const baseDuration = totalChars < MIN_CHARS ? 11 : 10;

  // If resume is extremely dense, reduce sidebar sizes slightly more
  const sidebarPenalty = totalChars > COMPACT_CHAR_THRESHOLD ? 0.88 : 1;

  const sectionFontSizes: SectionFontSizes = {
    name: nameFontSize,
    sectionTitle: clamp(Math.round(baseSectionTitle * globalScale), 12, 20),
    body: clamp(Math.round(baseBody * globalScale), 10, 16),
    sidebarTitle: clamp(Math.round(baseSidebarTitle * globalScale * sidebarPenalty), 10, 16),
    sidebarBody: clamp(Math.round(baseSidebarBody * globalScale * sidebarPenalty), 9, 14),
    duration: clamp(Math.round(baseDuration * globalScale), 9, 14),
  };

  // Decide counts / caps based on compact mode and char density
  const maxExperienceItems = compactMode ? 3 : 6;
  const maxBulletsPerExp = compactMode ? 2 : 4;
  const maxEducationItems = compactMode ? 2 : 6;
  const truncateCharPerLine = compactMode ? 120 : 220;

  // Move overflow experiences / educations into achievements (without duplicates)
  const extraAchievements: string[] = [];
  // ensure arrays are defined and sanitized
  data.experience = Array.isArray(data.experience) ? data.experience.filter(exp => exp && (exp.role || exp.company)) : [];
  data.education = Array.isArray(data.education) ? data.education.filter(edu => edu && (edu.degree || edu.school)) : [];

  if (data.experience.length > maxExperienceItems) {
    const extras = data.experience.slice(maxExperienceItems);
    data.experience = data.experience.slice(0, maxExperienceItems);
    extras.forEach((e) => {
      const title = `${e.role || ""} — ${e.company || ""}`.trim();
      const bullets = (e.description || []).slice(0, maxBulletsPerExp).map((b) => (b || "").trim());
      const entry = [title, ...(bullets || [])].filter(Boolean).join(" • ");
      if (entry) extraAchievements.push(entry);
    });
  }

  if (data.education.length > maxEducationItems) {
    const extras = data.education.slice(maxEducationItems);
    data.education = data.education.slice(0, maxEducationItems);
    extras.forEach((ed) => {
      const entry = `${ed.degree || ""} — ${ed.school || ""} ${(ed.year || "").trim()}`.trim();
      if (entry) extraAchievements.push(entry);
    });
  }

  // Trim bullets per remaining experience entries and truncate them
  data.experience = data.experience.map((e) => {
    const desc = Array.isArray(e.description) ? e.description.slice(0, maxBulletsPerExp).map((d) => (d || "").trim()) : [];
    return { ...e, description: desc.map((d) => (d.length > truncateCharPerLine ? d.slice(0, truncateCharPerLine - 1).trim() + "…" : d)) };
  });

  // Normalize certifications, softSkills, languages, skills
  data.certifications = Array.isArray(data.certifications) ? data.certifications.map((c) => ({ name: (c.name || "").trim(), year: (c.year || "").trim() })).slice(0, 20) : [];
  (data as any).softSkills = uniqStrings((data as any).softSkills).slice(0, compactMode ? 6 : 12);
  data.skills = uniqStrings(data.skills).slice(0, compactMode ? 12 : 30);
  (data as any).languages = uniqStrings(data.languages).slice(0, compactMode ? 3 : 8);

  // Combine existing achievements and extraAchievements; dedupe and cap
  const existingAch = Array.isArray(data.achivements) ? data.achivements.map((a) => (a || "").trim()) : [];
  const combined = Array.from(new Set([...existingAch, ...extraAchievements])).filter(Boolean);
  const achCap = compactMode ? 6 : 12;
  data.achivements = combined.slice(0, achCap);

  // final layout hints
  const layout: LayoutHints = {
    compactMode,
    nameFontSize,
    maxExperienceItems,
    maxBulletsPerExp,
    maxEducationItems,
    truncateCharPerLine,
    sectionFontSizes,
    sidebarWidthPx: 180,
  };

  data._layout = layout;
  
  // Add new optimized layout data
  (data as any)._layoutConfig = layoutConfig;
  (data as any)._contentMetrics = contentMetrics;

  // Final validation before returning
  if (!data.name && !data.title && !data.summary && data.experience.length === 0) {
    console.warn('preprocessResume: Processed resume appears to be mostly empty');
  }

  return data;
}
