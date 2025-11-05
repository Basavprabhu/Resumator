// pages/components/templates/modern.tsx
import React, { useEffect, useRef, useState } from "react";
import { ResumeData } from "../../types/resume";
import { getPDFSafeStyles } from "../../lib/universalTemplateHelpers";
import { optimizeLayout, getPrintStyles, limitContent, limitBulletPoints } from "../../lib/layoutOptimizer";

type ExpItem = {
  role?: string;
  company?: string;
  duration?: string;
  description?: string[] | string;
};

type EduItem = {
  degree?: string;
  school?: string;
  year?: string;
};

type Props = {
  data: ResumeData & {
    _layout?: {
      nameFontSize?: number;
      sectionFontSizes?: {
        name?: number;
        sectionTitle?: number;
        body?: number;
        sidebarTitle?: number;
        sidebarBody?: number;
        duration?: number;
        profileImage?:string,
      };
      sidebarWidthPx?: number;
      maxBulletsPerExp?: number;
      maxExperienceItems?: number;
      maxEducationItems?: number;
      truncateCharPerLine?: number;
    };
  };
  context?: 'preview' | 'export';
};

export const dynamic = "force-dynamic";


export default function ModernTemplate({ data, context = 'export' }: Props) {
  const {
    name = "Your Name",
    title = "",
    photoUrl = "",
    contact = { phone: "", email: "", address: "", linkedin: "" },
    summary = "",
    experience = [] as ExpItem[],
    education = [] as EduItem[],
    certifications = [] as any[],
    skills = [] as string[],
    achivements = [] as string[],
    volunteer = [] as any[],
    softSkills = [] as string[],
    languages = [] as string[],
    interests = [] as string[],
  } = data as any;

  // Use new layout optimizer
  const layoutConfig = (data as any)._layoutConfig || optimizeLayout(data, 'modern');
  const printStyles = getPrintStyles(layoutConfig);
  
  // Legacy layout support for backward compatibility
  const layout = data._layout ?? {};
  const fs = layout.sectionFontSizes ?? {};
  
  // Use optimized values with fallbacks
  const nameFont = layoutConfig.nameFontSize;
  const sectionTitleFont = layoutConfig.sectionTitleFontSize;
  const bodyFont = layoutConfig.bodyFontSize;
  const sidebarTitleFont = layoutConfig.bodyFontSize;
  const sidebarBodyFont = layoutConfig.smallFontSize;
  const durationFont = layoutConfig.smallFontSize;

  const maxBullets = layoutConfig.maxBulletsPerExp;
  const maxExperienceItems = layoutConfig.maxExperienceItems;
  const maxEducationItems = layoutConfig.maxEducationItems;
  const truncateChars = layoutConfig.compactMode ? 180 : 220;
  const sidebarWidth = layoutConfig.sidebarWidth || 220;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const MIN_SCALE = 0.65;
  const INNER_WIDTH = 760;

  useEffect(() => {
    const fitToPage = () => {
      if (!containerRef.current || !contentRef.current) return;

      const container = containerRef.current;
      const content = contentRef.current;

      content.style.transform = "scale(1)";
      content.style.transformOrigin = "top left";

      requestAnimationFrame(() => {
        const containerW = container.clientWidth;
        const contentW = content.scrollWidth;

        let s = Math.min(1, (containerW - 28) / Math.max(contentW, INNER_WIDTH));
        if (s < MIN_SCALE) s = MIN_SCALE;
        setScale(s);
      });
    };

    fitToPage();
    window.addEventListener("resize", fitToPage);
    return () => window.removeEventListener("resize", fitToPage);
  }, [data]);

  const truncate = (s: string, n = truncateChars) =>
    s && s.length > n ? s.slice(0, n - 1).trim() + "…" : s;

   // Dynamic padding based on content density
  // Use optimized print styles with better space utilization
  const containerPadding = layoutConfig.compactMode ? 'p-4' : 'p-6';
  const printPadding = 'print:p-4';

 return (
    <>
  <div className="py-6">
    <div
      ref={containerRef}
          className={`resume-container relative max-w-3xl mx-auto bg-white rounded-lg border border-gray-200 ${containerPadding} ${printPadding} box-border`}
      aria-label="resume page"
          style={printStyles.container}
    >
      <div
        ref={contentRef}
        className="w-full"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
  {/* Left side: Name + Contact Info */}
  <div className="flex-1 text-left">
    <h1
      className="font-bold text-gray-900"
      style={{ fontSize: `${nameFont}px`, lineHeight: 1.1 }}
    >
      {name}
    </h1>
    {title && (
      <div className="text-gray-700 font-medium">{title}</div>
    )}
    <div className="text-sm text-gray-600 mt-1">
      {contact.email && <span>{contact.email}</span>}
      {contact.email && contact.phone && <span className="mx-2">|</span>}
      {contact.phone && <span>{contact.phone}</span>}
      {contact.linkedin && (contact.phone || contact.email) && (
        <span className="mx-2">|</span>
      )}
      {contact.linkedin && (
        <a
          className="text-blue-700 underline"
          href={contact.linkedin}
        >
          {contact.linkedin.replace(/^https?:\/\//, "")}
        </a>
      )}
    </div>
  </div>

  {/* Profile Image - Rounded Rectangle for Modern Template */}
  {(context === 'preview' || data.photoUrl) && (
    <div className="w-32 h-40 sm:w-36 sm:h-44 lg:w-40 lg:h-48 rounded-lg border-2 border-gray-300 flex items-center justify-center overflow-hidden bg-gray-100 flex-shrink-0 print:w-32 print:h-40">
  {data.photoUrl ? (
    <img
      src={data.photoUrl}
      alt="Profile"
      className="w-full h-full object-cover"
    />
  ) : (
        <div className="text-gray-400 text-center px-2">
          <svg className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-2 print:w-12 print:h-12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <div className="text-xs font-medium">Photo</div>
        </div>
  )}
</div>
  )}


</header>


        {summary && (
          <section className={(layout as any).compactMode ? "mb-4" : "mb-6"}>
            <p
              className="text-gray-800"
              style={{ fontSize: `${bodyFont}px`, lineHeight: 1.4 }}
            >
              {truncate(summary)}
            </p>
          </section>
        )}
    



          <div className="grid grid-cols-3 gap-4 items-start">
            {/* Main content */}
            <main className="col-span-2 space-y-3">
              {/* Experience */}
              {experience.length > 0 && (
                <section style={printStyles.section}>
                  <h2
                    className="font-semibold text-gray-900 mb-2 tracking-wide"
                    style={printStyles.sectionTitle}
                  >
                    EXPERIENCE
                  </h2>
                  <div className={layoutConfig.compactMode ? "space-y-2" : "space-y-4"}>
                    {limitContent(experience, maxExperienceItems).map((exp: any, idx: number) => (
                      <div key={idx} style={printStyles.item}>
                        <div className="flex justify-between items-baseline">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {exp.company}
                            </div>
                            <div className="text-gray-700">{exp.role}</div>
                          </div>
                          <div
                            className="text-xs text-gray-600"
                            style={{ fontSize: `${durationFont}px` }}
                          >
                            {exp.duration}
                          </div>
                        </div>
                        <ul
                          className="list-disc ml-5 mt-2 text-gray-800"
                          style={{ fontSize: `${bodyFont}px`, lineHeight: layoutConfig.lineHeight }}
                        >
                          {limitBulletPoints(exp.description || [], maxBullets)
                            .map((d: string, j: number) => (
                              <li key={j}>{truncate(d)}</li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Achievements */}
              {achivements && achivements.length > 0 && (
                <section className="mb-5">
                  <h2
                    className="font-semibold text-gray-900 mb-2 tracking-wide"
                    style={{ fontSize: `${sectionTitleFont}px` }}
                  >
                    ACHIEVEMENTS
                  </h2>
                  <ul
                    className="list-disc ml-5 text-gray-800"
                    style={{ fontSize: `${bodyFont}px` }}
                  >
                    {achivements.map((a: string, i: number) => (
                      <li key={i}>{truncate(a)}</li>
                    ))}
                  </ul>
                </section>
              )}
            </main>

            {/* Sidebar */}
            <aside
              className="col-span-1 border-l border-gray-200 pl-3 space-y-3"
              style={{ width: sidebarWidth }}
            >
              {/* Education */}
              {education.length > 0 && (
                <section className="mb-3">
                  <h3
                    className="font-semibold text-gray-900 mb-2"
                    style={{ fontSize: `${sidebarTitleFont}px` }}
                  >
                    EDUCATION
                  </h3>
                  <div
                    className="space-y-2 text-gray-800"
                    style={{ fontSize: `${sidebarBodyFont}px` }}
                  >
                    {education.map((edu: EduItem, i: number) => (
                      <div key={i}>
                        <div className="font-medium">{edu.degree}</div>
                        <div className="text-xs text-gray-600">
                          {edu.school} {edu.year && `• ${edu.year}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Skills */}
              {skills && skills.length > 0 && (
                <section className="section mb-3">
                  <h3
                    className="font-semibold text-gray-900 mb-2"
                    style={{ fontSize: `${sidebarTitleFont}px` }}
                  >
                    SKILLS
                  </h3>
                  <ul
                    className="flex flex-wrap gap-1 text-gray-800"
                    style={{ fontSize: `${sidebarBodyFont}px` }}
                  >
                    {skills.map((s: string, i: number) => (
                      <li
                        key={i}
                        className="px-2 py-0.5 bg-gray-100 rounded"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Soft Skills */}
              {softSkills && softSkills.length > 0 && (
                <section className="section mb-3">
                  <h3
                    className="font-semibold text-gray-900 mb-2"
                    style={{ fontSize: `${sidebarTitleFont}px` }}
                  >
                    SOFT SKILLS
                  </h3>
                  <div
                    className="text-gray-800"
                    style={{ fontSize: `${sidebarBodyFont}px` }}
                  >
                    {softSkills.join(" • ")}
                  </div>
                </section>
              )}

              {/* Languages */}
              {languages && languages.length > 0 && (
                <section className="section mb-3">
                  <h3
                    className="font-semibold text-gray-900 mb-2"
                    style={{ fontSize: `${sidebarTitleFont}px` }}
                  >
                    LANGUAGES
                  </h3>
                  <div
                    className="text-gray-800"
                    style={{ fontSize: `${sidebarBodyFont}px` }}
                  >
                    {languages.join(" • ")}
                  </div>
                </section>
              )}

              {/* Volunteer Experience */}
              {volunteer && volunteer.length > 0 && (
                <section className="section mb-3">
                  <h3
                    className="font-semibold text-gray-900 mb-2"
                    style={{ fontSize: `${sidebarTitleFont}px` }}
                  >
                    VOLUNTEER
                  </h3>
                  <div
                    className="space-y-2 text-gray-800"
                    style={{ fontSize: `${sidebarBodyFont}px` }}
                  >
                    {volunteer.map((vol: any, i: number) => (
                      <div key={i}>
                        <div className="font-medium">{vol.role}</div>
                        <div className="text-gray-600">{vol.org}</div>
                        {vol.duration && (
                          <div className="text-xs text-gray-500">{vol.duration}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Certifications */}
              {certifications && certifications.length > 0 && (
                <section className="section mb-3">
                  <h3
                    className="font-semibold text-gray-900 mb-2"
                    style={{ fontSize: `${sidebarTitleFont}px` }}
                  >
                    CERTIFICATIONS
                  </h3>
                  <div
                    className="space-y-2 text-gray-800"
                    style={{ fontSize: `${sidebarBodyFont}px` }}
                  >
                    {certifications.map((cert: any, i: number) => (
                      <div key={i}>
                        <div className="font-medium">{cert.name}</div>
                        {cert.year && (
                          <div className="text-xs text-gray-500">{cert.year}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Interests */}
              {interests && interests.length > 0 && (
                <section className="section mb-3">
                  <h3
                    className="font-semibold text-gray-900 mb-2"
                    style={{ fontSize: `${sidebarTitleFont}px` }}
                  >
                    INTERESTS
                  </h3>
                  <div
                    className="text-gray-800"
                    style={{ fontSize: `${sidebarBodyFont}px` }}
                  >
                    {interests.join(" • ")}
                  </div>
                </section>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
