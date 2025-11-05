// pages/components/templates/creative.tsx
import React, { useEffect, useRef, useState } from "react";
import { ResumeData } from "../../types/resume";
import { getPDFSafeStyles } from "../../lib/universalTemplateHelpers";
import { optimizeLayout, getPrintStyles, limitContent, limitBulletPoints } from "../../lib/layoutOptimizer";

type Props = {
  data: ResumeData & {
    _layout?: {
      compactMode?: boolean;
      nameFontSize?: number;
      maxBulletsPerExp?: number;
      maxExperienceItems?: number;
      maxEducationItems?: number;
      truncateCharPerLine?: number;
      sectionFontSizes?: {
        name?: number;
        sectionTitle?: number;
        body?: number;
        sidebarTitle?: number;
        sidebarBody?: number;
        duration?: number;
      };
      sidebarWidthPx?: number;
    };
  };
  context?: 'preview' | 'export';
};

export const dynamic = "force-dynamic";

export default function CreativeTemplate({ data, context = 'export' }: Props) {
  const {
    name = "",
    title = "",
    photoUrl = "",
    contact = { phone: "", email: "", address: "", linkedin: "" },
    summary = "",
    experience = [],
    education = [],
    certifications = [],
    volunteer = [],
    skills = [],
    achivements = [],
    softSkills = [],
    languages = [],
    interests = [],
  } = data;

  const layout = data._layout ?? {};
  const fs = layout.sectionFontSizes ?? {};
  const nameFont = fs.name ?? layout.nameFontSize ?? 40;
  const sectionTitleFont = fs.sectionTitle ?? 14;
  const bodyFont = fs.body ?? 12;
  const sidebarTitleFont = fs.sidebarTitle ?? 12;
  const sidebarBodyFont = fs.sidebarBody ?? 11;
  const durationFont = fs.duration ?? 10;

  const maxBullets = layout.maxBulletsPerExp ?? 4;
  const maxExperienceItems = layout.maxExperienceItems ?? 6;
  const maxEducationItems = layout.maxEducationItems ?? 6;
  const truncateChars = layout.truncateCharPerLine ?? 220;
  const sidebarWidth = layout.sidebarWidthPx ?? 200;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);

  const compact = layout.compactMode ?? false;
  const smallGap = compact ? "gap-3" : "gap-4";
  const mediumGap = compact ? "gap-4" : "gap-6";
  const largeGap = compact ? "gap-6" : "gap-8";

  useEffect(() => {
    const adjustScale = () => {
      if (!containerRef.current || !contentRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const contentWidth = contentRef.current.scrollWidth;
      if (contentWidth > containerWidth) {
        const newScale = Math.max(0.6, containerWidth / contentWidth);
        setScale(newScale);
      } else {
        setScale(1);
      }
    };

    adjustScale();
    window.addEventListener("resize", adjustScale);
    return () => window.removeEventListener("resize", adjustScale);
  }, []);

  // Helper functions
  const safeArr = <T,>(arr: any): T[] => (Array.isArray(arr) ? arr : []);
  const limitedExperience = safeArr(experience).slice(0, maxExperienceItems);
  const limitedEducation = safeArr(education).slice(0, maxEducationItems);

  // Content processing
  const processedExp = limitedExperience.map((exp: any) => ({
    ...exp,
    description: safeArr<string>(exp.description).slice(0, maxBullets),
  }));

  const processedEdu = limitedEducation.map((edu: any) => ({
    ...edu,
    degree: edu.degree || "",
    school: edu.school || "",
    year: edu.year || "",
  }));

  const processedCerts = safeArr(certifications).slice(0, compact ? 8 : 15);
  const processedSkills = safeArr(skills).slice(0, compact ? 12 : 25);
  const processedAchievements = safeArr(achivements).slice(0, compact ? 6 : 12);
  const processedVolunteer = safeArr(volunteer).slice(0, compact ? 3 : 6);
  const processedSoftSkills = safeArr(softSkills).slice(0, compact ? 6 : 12);
  const processedLanguages = safeArr(languages).slice(0, compact ? 4 : 8);
  const processedInterests = safeArr(interests).slice(0, compact ? 6 : 12);

  const truncate = (s: string, n = layout.truncateCharPerLine ?? 220) =>
    s && s.length > n ? s.slice(0, n - 1).trim() + "…" : s;

  // Get PDF-safe styles
  const pdfStyles = getPDFSafeStyles(compact);

  // Dynamic padding based on content density
  const containerPadding = compact ? 'p-6' : 'p-8';
  const printPadding = compact ? 'print:p-3' : 'print:p-4';

return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pdfStyles.printStyles }} />
      <div className="py-6">
    <div
      ref={containerRef}
      data-resume-container
          className={`resume-container relative max-w-3xl mx-auto bg-white ${containerPadding} ${printPadding} box-border rounded-lg border border-gray-200 print:rounded-none print:border-0`}
          style={{ 
            WebkitPrintColorAdjust: "exact",
            ...(pdfStyles.container as any)
          }}
    >
      <div
        ref={contentRef}
        className="w-full"
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {/* HEADER */}
        <div className={`flex items-start justify-between ${smallGap} mb-10`}>
          <div className="flex-1 pr-8 min-w-0">
            <h1
              className="font-extrabold leading-tight text-gray-900"
              style={{
                fontSize: `${nameFont}px`,
                lineHeight: 1.05,
                marginBottom: 12,
                wordBreak: "break-word",
              }}
            >
              {name || "Your Name"}
            </h1>

            {title && (
              <div
                className="font-medium text-gray-800 mb-4"
                style={{
                  fontSize: `${Math.max(10, Math.round(nameFont * 0.45))}px`,
                }}
              >
                {title}
              </div>
            )}

            <div
              style={{ fontSize: `${bodyFont}px` }}
                  className="text-gray-600 space-y-1"
            >
                  {contact.phone && <div>📱 {contact.phone}</div>}
              {contact.email && <div>✉️ {contact.email}</div>}
                  {contact.address && <div>📍 {contact.address}</div>}
              {contact.linkedin && (
                <div>
                      💼{" "}
                      <a href={contact.linkedin} className="text-blue-600 underline">
                        {contact.linkedin.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          </div>

              {/* Profile Image - Circle for Creative Template */}
              {(context === 'preview' || data.photoUrl) && (
                <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full border-4 border-gray-300 flex items-center justify-center overflow-hidden bg-gray-100 flex-shrink-0 print:w-28 print:h-28">
                  {data.photoUrl ? (
              <img
                      src={data.photoUrl}
                      alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
                    <div className="text-gray-400 text-center px-2">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 mx-auto mb-1 print:w-10 print:h-10" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <div className="text-xs font-medium">Photo</div>
              </div>
            )}
          </div>
              )}
        </div>

            {/* MAIN CONTENT */}
            <div className="flex gap-8">
              {/* LEFT COLUMN */}
              <div className="flex-1 min-w-0">
        {/* SUMMARY */}
        {summary && (
                  <section className="section mb-8">
            <h2
                      className="font-semibold text-gray-900 mb-3 tracking-wide"
              style={{ fontSize: `${sectionTitleFont}px` }}
            >
                      PROFESSIONAL SUMMARY
            </h2>
            <p
                      className="text-gray-800 leading-relaxed"
                      style={{ fontSize: `${bodyFont}px` }}
            >
                      {truncate(summary)}
            </p>
          </section>
        )}
     
              {/* EXPERIENCE */}
                {processedExp.length > 0 && (
                  <section className="section mb-8">
                    <h2
                      className="font-semibold text-gray-900 mb-4 tracking-wide"
                      style={{ fontSize: `${sectionTitleFont}px` }}
                    >
                      EXPERIENCE
                  </h2>
                    <div className="space-y-6">
                      {processedExp.map((exp: any, i: number) => (
                      <div key={i}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1 min-w-0">
                              <h3
                                className="font-semibold text-gray-900"
                                style={{ fontSize: `${bodyFont + 2}px` }}
                              >
                                {exp.role || "Role"}
                          </h3>
                              <div
                                className="text-gray-700 font-medium"
                                style={{ fontSize: `${bodyFont + 1}px` }}
                              >
                                {exp.company || "Company"}
                              </div>
                            </div>
                            <div
                              className="text-gray-600 font-medium flex-shrink-0 ml-4"
                              style={{ fontSize: `${durationFont}px` }}
                            >
                              {exp.duration || "Duration"}
                            </div>
                        </div>
                          {exp.description && exp.description.length > 0 && (
                            <ul
                              className="list-disc list-inside text-gray-800 space-y-1 ml-2"
                              style={{ fontSize: `${bodyFont}px` }}
                            >
                              {exp.description.map((desc: string, di: number) => (
                                <li key={di}>{truncate(desc)}</li>
                          ))}
                            </ul>
                          )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* EDUCATION */}
                {processedEdu.length > 0 && (
                  <section className="section mb-8">
                    <h2
                      className="font-semibold text-gray-900 mb-4 tracking-wide"
                      style={{ fontSize: `${sectionTitleFont}px` }}
                    >
                      EDUCATION
                  </h2>
                    <div className="space-y-4">
                      {processedEdu.map((edu: any, i: number) => (
                      <div key={i}>
                          <h3
                            className="font-semibold text-gray-900"
                            style={{ fontSize: `${bodyFont + 1}px` }}
                          >
                            {edu.degree}
                          </h3>
                          <div className="flex justify-between items-center">
                            <div
                              className="text-gray-700"
                              style={{ fontSize: `${bodyFont}px` }}
                            >
                              {edu.school}
                            </div>
                            {edu.year && (
                              <div
                                className="text-gray-600"
                                style={{ fontSize: `${durationFont}px` }}
                              >
                                {edu.year}
                              </div>
                            )}
                          </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

                {/* ACHIEVEMENTS */}
                {processedAchievements.length > 0 && (
                  <section className="section mb-8">
                    <h2
                      className="font-semibold text-gray-900 mb-3 tracking-wide"
                      style={{ fontSize: `${sectionTitleFont}px` }}
                    >
                      ACHIEVEMENTS
                    </h2>
                    <ul
                      className="list-disc list-inside text-gray-800 space-y-1"
                      style={{ fontSize: `${bodyFont}px` }}
                    >
                      {processedAchievements.map((achievement, i) => (
                        <li key={i}>{truncate(achievement as string)}</li>
                      ))}
                    </ul>
                  </section>
                )}
            </div>

            {/* SIDEBAR */}
            <aside style={{ width: sidebarWidth }} className="flex-shrink-0">
              {skills && skills.length > 0 && (
                  <section className="section mb-4">
                  <h3 style={{ fontSize: `${sidebarTitleFont}px` }} className="font-semibold text-gray-900 mb-2">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {skills.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 rounded">{s}</span>
                    ))}
                  </div>
                </section>
              )}

              {languages && languages.length > 0 && (
                  <section className="section mb-4">
                  <h3 style={{ fontSize: `${sidebarTitleFont}px` }} className="font-semibold text-gray-900 mb-2">
                    Languages
                  </h3>
                  <p className="text-gray-800 text-sm">{languages.join(", ")}</p>
                </section>
              )}

              {certifications && certifications.length > 0 && (
                  <section className="section mb-4">
                  <h3 style={{ fontSize: `${sidebarTitleFont}px` }} className="font-semibold text-gray-900 mb-2">
                    Certifications
                  </h3>
                  <ul className="text-gray-800 text-sm space-y-1">
                    {certifications.map((c, i) => (
                      <li key={i}>
                        {c.name} {c.year && <span className="text-gray-600">({c.year})</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

                {/* Soft Skills */}
                {softSkills && softSkills.length > 0 && (
                  <section className="section mb-4">
                    <h3 style={{ fontSize: `${sidebarTitleFont}px` }} className="font-semibold text-gray-900 mb-2">
                      Soft Skills
                    </h3>
                    <p className="text-gray-800 text-sm">{softSkills.join(" • ")}</p>
                  </section>
                )}

                {/* Volunteer Experience */}
                {volunteer && volunteer.length > 0 && (
                  <section className="section mb-4">
                    <h3 style={{ fontSize: `${sidebarTitleFont}px` }} className="font-semibold text-gray-900 mb-2">
                      Volunteer
                    </h3>
                    <div className="text-gray-800 text-sm space-y-2">
                      {volunteer.map((vol, i) => (
                        <div key={i}>
                          <div className="font-medium">{vol.role}</div>
                          <div className="text-gray-600">{vol.org}</div>
                          {vol.duration && <div className="text-xs text-gray-500">{vol.duration}</div>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Interests */}
                {interests && interests.length > 0 && (
                  <section className="section mb-4">
                    <h3 style={{ fontSize: `${sidebarTitleFont}px` }} className="font-semibold text-gray-900 mb-2">
                      Interests
                    </h3>
                    <p className="text-gray-800 text-sm">{interests.join(" • ")}</p>
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
