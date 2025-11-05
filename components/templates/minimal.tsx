// pages/components/templates/minimal.tsx
import React, { useEffect, useRef, useState } from "react";
import { ResumeData } from "../../types/resume";
import { getPDFSafeStyles } from "../../lib/universalTemplateHelpers";
import { optimizeLayout, getPrintStyles, limitContent, limitBulletPoints } from "../../lib/layoutOptimizer";

type ExpItem = {
  role?: string;
  company?: string;
  duration?: string;
  location?: string;
  description?: string[];
};

type EduItem = {
  degree?: string;
  school?: string;
  year?: string;
  details?: string;
};

type Publication = {
  title?: string;
  journal?: string;
  year?: string;
  doi?: string;
  url?: string;
};

type Props = {
  data: ResumeData & {
    _layout?: {
      nameFontSize?: number;
      sectionFontSizes?: {
        name?: number;
        sectionTitle?: number;
        body?: number;
        duration?: number;
      };
      truncateCharPerLine?: number;
    };
  };
  context?: 'preview' | 'export';
};

export const dynamic = "force-dynamic";

export default function MinimalTemplate({ data, context = 'export' }: Props) {
  const {
    name = "John Doe",
    title = "",
    photoUrl = "",
    contact = { phone: "", email: "", address: "", linkedin: "" },
    summary = "",
    experience = [] as ExpItem[],
    education = [] as EduItem[],
    publications = [] as Publication[],
    achivements = [] as string[],
    volunteer = [] as any[],
    skills = [] as string[],
    softSkills = [] as string[],
    languages = [] as string[],
    interests = [] as string[],
    certifications = [] as any[],
    dateUpdated,
  } = (data as any);

  const layout = data._layout ?? {};
  const fs = layout.sectionFontSizes ?? {};
  const nameFont = fs.name ?? layout.nameFontSize ?? 36;
  const sectionTitleFont = fs.sectionTitle ?? 14;
  const bodyFont = fs.body ?? 12;
  const durationFont = fs.duration ?? 10;
  const truncateChars = layout.truncateCharPerLine ?? 300;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const adjustScale = () => {
      if (!containerRef.current || !contentRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const contentWidth = contentRef.current.scrollWidth;
      if (contentWidth > containerWidth) {
        const newScale = Math.max(0.7, containerWidth / contentWidth);
        setScale(newScale);
      } else {
        setScale(1);
      }
    };

    adjustScale();
    window.addEventListener("resize", adjustScale);
    return () => window.removeEventListener("resize", adjustScale);
  }, []);

  const truncate = (s = "", n = truncateChars) =>
    s && s.length > n ? s.slice(0, n - 1).trim() + "…" : s;
  const safeArr = <T,>(a: any): T[] => (Array.isArray(a) ? a : []);

  // Get PDF-safe styles
  const pdfStyles = getPDFSafeStyles((layout as any).compactMode || false);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pdfStyles.printStyles }} />
    <div className="py-8">
      <div
        ref={containerRef}
          className="resume-container relative max-w-3xl mx-auto p-8 print:p-4 box-border"
          style={{ 
            WebkitPrintColorAdjust: "exact",
            ...(pdfStyles.container as any)
          }}
      >
        {dateUpdated && (
          <div className="absolute right-4 top-3 text-xs text-gray-500 print:hidden">
            Last updated: {dateUpdated}
          </div>
        )}

        <div
          ref={contentRef}
          className="w-full"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
            {/* HEADER */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1
                  className="font-bold text-gray-900"
                  style={{
                    fontSize: `${nameFont}px`,
                    lineHeight: 1.1,
                    marginBottom: 8,
                  }}
                >
                  {name}
                </h1>
                {title && (
                  <div className="text-gray-700 font-medium mb-3">{title}</div>
                )}
                <div className="mt-2 text-sm text-gray-600 flex flex-wrap items-center gap-2">
                  {contact.address && (
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden>📍</span>
                      <span>{contact.address}</span>
                    </span>
                  )}

                  {contact.email && (
                    <>
                      <span className="mx-1 text-gray-300">|</span>
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden>✉️</span>
                        <span>{contact.email}</span>
                      </span>
                    </>
                  )}

                  {contact.phone && (
                    <>
                      <span className="mx-1 text-gray-300">|</span>
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden>📞</span>
                        <span>{contact.phone}</span>
                      </span>
                    </>
                  )}

                  {contact.linkedin && (
                    <>
                      <span className="mx-1 text-gray-300">|</span>
                      <a
                        className="inline-flex items-center gap-2 text-blue-700 underline"
                        href={contact.linkedin}
                      >
                        <span aria-hidden>🔗</span>
                        <span>
                          {contact.linkedin.replace(/^https?:\/\//, "")}
                        </span>
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Profile Image - Rectangle for Minimal Template */}
              {(context === 'preview' || data.photoUrl) && (
                <div className="w-32 h-40 sm:w-36 sm:h-44 lg:w-40 lg:h-48 ml-4 sm:ml-6 flex-shrink-0 print:w-32 print:h-40 print:ml-4">
                  {data.photoUrl ? (
                  <img
                      src={data.photoUrl}
                    alt="Profile"
                      className="w-full h-full object-cover border border-gray-300"
                  />
                ) : (
                    <div className="w-full h-full border border-gray-300 bg-gray-100 flex items-center justify-center">
                      <div className="text-gray-400 text-center px-2">
                        <svg className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-2 print:w-12 print:h-12" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <div className="text-xs sm:text-sm font-medium print:text-xs">Photo</div>
                      </div>
                  </div>
                )}
              </div>
              )}
            </div>

          {/* SUMMARY */}
          {summary && (
              <section className="section mt-6 mb-6">
              <p
                  className="text-gray-800 leading-relaxed"
                  style={{ fontSize: `${bodyFont}px` }}
              >
                {truncate(summary)}
              </p>
            </section>
          )}

          {/* EDUCATION */}
          {safeArr<EduItem>(education).length > 0 && (
              <section className="section mb-6">
              <h2
                className="text-gray-900 font-semibold mb-2"
                style={{ fontSize: `${sectionTitleFont}px` }}
              >
                EDUCATION
              </h2>
              <div
                className="space-y-3 text-gray-800"
                style={{ fontSize: `${bodyFont}px` }}
              >
                {safeArr<EduItem>(education).map((edu, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {edu.degree}
                        </div>
                        <div className="text-sm text-gray-700">
                          {edu.school}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">{edu.year}</div>
                    </div>
                    {edu.details && (
                      <div className="text-sm text-gray-700 mt-1">
                        {truncate(edu.details, 220)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* EXPERIENCE */}
          {safeArr<ExpItem>(experience).length > 0 && (
              <section className="section mb-6">
              <h2
                className="text-gray-900 font-semibold mb-3"
                style={{ fontSize: `${sectionTitleFont}px` }}
              >
                EXPERIENCE
              </h2>
              <div className="space-y-5">
                {safeArr<ExpItem>(experience).map((exp, idx) => {
                    const bullets = safeArr<string>(exp.description);
                    const maxBullets = 4;
                    const displayBullets = bullets.slice(0, maxBullets);
                    
                  return (
                    <div key={idx}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900">
                            {exp.role}
                          </div>
                          <div className="text-sm text-gray-700">
                            {exp.company}
                          </div>
                            {displayBullets.length > 0 && (
                            <ul
                                className="list-disc ml-5 mt-2 space-y-1 text-gray-800"
                                style={{ fontSize: `${bodyFont}px` }}
                            >
                                {displayBullets.map((bullet, i) => (
                                  <li key={i}>{truncate(bullet, 180)}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div
                            className="text-xs text-gray-600 flex-shrink-0 text-right"
                            style={{ fontSize: `${durationFont}px` }}
                        >
                          <div>{exp.location}</div>
                          <div>{exp.duration}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* PUBLICATIONS */}
          {safeArr<Publication>(publications).length > 0 && (
              <section className="section mb-6">
              <h2
                className="text-gray-900 font-semibold mb-2"
                style={{ fontSize: `${sectionTitleFont}px` }}
              >
                PUBLICATIONS
              </h2>
              <div
                  className="space-y-2 text-gray-800"
                style={{ fontSize: `${bodyFont}px` }}
              >
                {safeArr<Publication>(publications).map((p, i) => (
                  <div key={i}>
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-xs text-gray-600">
                        {p.journal} {p.year && `(${p.year})`}
                        {p.doi && (
                          <span>
                            {" "}
                            | DOI: {p.doi}
                          </span>
                    )}
                      </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ACHIEVEMENTS */}
            {safeArr<string>(achivements).length > 0 && (
              <section className="section mb-6">
                <h2
                className="text-gray-900 font-semibold mb-2"
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

            {/* SKILLS */}
            {safeArr<string>(skills).length > 0 && (
              <section className="section mb-6">
                <h2
                  className="text-gray-900 font-semibold mb-2"
                  style={{ fontSize: `${sectionTitleFont}px` }}
                >
                  TECHNICAL SKILLS
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, i: number) => (
                    <span 
                      key={i} 
                      className="px-2 py-1 bg-gray-100 rounded text-gray-800"
                      style={{ fontSize: `${bodyFont}px` }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* SOFT SKILLS */}
            {safeArr<string>(softSkills).length > 0 && (
              <section className="section mb-6">
                <h2
                  className="text-gray-900 font-semibold mb-2"
                  style={{ fontSize: `${sectionTitleFont}px` }}
                >
                  SOFT SKILLS
                </h2>
                <p className="text-gray-800" style={{ fontSize: `${bodyFont}px` }}>
                  {softSkills.join(" • ")}
                </p>
              </section>
            )}

            {/* VOLUNTEER EXPERIENCE */}
            {safeArr<any>(volunteer).length > 0 && (
              <section className="section mb-6">
                <h2
                  className="text-gray-900 font-semibold mb-2"
                  style={{ fontSize: `${sectionTitleFont}px` }}
                >
                  VOLUNTEER EXPERIENCE
                </h2>
                <div className="space-y-4">
                  {volunteer.map((vol: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900" style={{ fontSize: `${bodyFont + 1}px` }}>
                            {vol.role}
                          </h4>
                          <p className="text-gray-700" style={{ fontSize: `${bodyFont}px` }}>
                            {vol.org}
                          </p>
                        </div>
                        {vol.duration && (
                          <span className="text-gray-600" style={{ fontSize: `${bodyFont - 1}px` }}>
                            {vol.duration}
                          </span>
                        )}
                      </div>
                      {vol.description && vol.description.length > 0 && (
                        <ul className="list-disc ml-5 mt-2" style={{ fontSize: `${bodyFont}px` }}>
                          {vol.description.map((desc: string, di: number) => (
                            <li key={di} className="text-gray-800">{truncate(desc)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CERTIFICATIONS */}
            {safeArr<any>(certifications).length > 0 && (
              <section className="section mb-6">
                <h2
                  className="text-gray-900 font-semibold mb-2"
                  style={{ fontSize: `${sectionTitleFont}px` }}
                >
                  CERTIFICATIONS
                </h2>
                <div className="space-y-2">
                  {certifications.map((cert: any, i: number) => (
                    <div key={i} className="text-gray-800" style={{ fontSize: `${bodyFont}px` }}>
                      {cert.name} {cert.year && <span className="text-gray-600">({cert.year})</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* LANGUAGES */}
            {safeArr<string>(languages).length > 0 && (
              <section className="section mb-6">
                <h2
                  className="text-gray-900 font-semibold mb-2"
                  style={{ fontSize: `${sectionTitleFont}px` }}
                >
                  LANGUAGES
                </h2>
                <p className="text-gray-800" style={{ fontSize: `${bodyFont}px` }}>
                  {languages.join(" • ")}
                </p>
              </section>
            )}

            {/* INTERESTS */}
            {safeArr<string>(interests).length > 0 && (
              <section className="section mb-6">
                <h2
                  className="text-gray-900 font-semibold mb-2"
                  style={{ fontSize: `${sectionTitleFont}px` }}
                >
                  INTERESTS
                </h2>
                <p className="text-gray-800" style={{ fontSize: `${bodyFont}px` }}>
                  {interests.join(" • ")}
                </p>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
