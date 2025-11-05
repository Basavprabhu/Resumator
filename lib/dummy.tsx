import { ResumeData } from "../types/resume";

export const dummyData: ResumeData = {
  name: "John Doe",
  title: "Senior Software Engineer",
  // photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
  contact: {
    phone: "+1 234 567 890",
    email: "john.doe@example.com",
    address: "123 Main St, Apt 4B\nSpringfield, IL 62704, USA",
    linkedin: "https://linkedin.com/in/johndoe",
    github: "https://github.com/johndoe",
    // website: "https://johndoe.dev",
  },
  summary:
    "Results-driven Senior Software Engineer with 8+ years of experience building web applications and developer tools. Deep expertise in React, TypeScript, Next.js and backend APIs. Passionate about building scalable systems, mentoring teams, and improving developer experience.",
  // layout hints used by templates to showcase dynamic font sizing and truncation behavior
  // _layout: {
  //   compactMode: false,
  //   nameFontSize: 36,
  //   sectionFontSizes: {
  //     name: 36,
  //     sectionTitle: 14,
  //     body: 12,
  //     sidebarTitle: 12,
  //     sidebarBody: 11,
  //     duration: 10,
  //   },
  //   sidebarWidthPx: 200,
  //   maxBulletsPerExp: 3,
  //   maxExperienceItems: 4,
  //   maxEducationItems: 3,
  //   truncateCharPerLine: 220,
  // },

  // EXPERIENCE - multiple entries and long descriptions to trigger "+n more"
  experience: [
    {
      role: "Senior Frontend Engineer",
      company: "Atlas Tech (Remote)",
      duration: "2022 - Present",
      description: [
        "Led a 6-person frontend team to migrate a legacy codebase into a design-system-first Next.js monorepo.",
        "Designed and implemented a TypeScript-first component library (Storybook + automated visual tests) used across 8 apps.",
        "Reduced bundle size by 28% and improved Lighthouse performance scores by auditing and lazy-loading heavy modules.",
        "Introduced a cross-team RFC process and mentoring program for junior engineers.",
      ],
    },
    {
      role: "Frontend Engineer",
      company: "BrightApps Inc.",
      duration: "2019 - 2022",
      description: [
        "Built responsive, accessible SPA features with React and Redux; collaborated with product and design to ship bi-weekly.",
        "Implemented server-side rendering and incremental static regeneration using Next.js for marketing pages and product docs.",
        "Improved E2E test coverage using Playwright and stabilized CI builds.",
      ],
    },
    {
      role: "Software Engineer",
      company: "Startup Hub",
      duration: "2016 - 2019",
      description: [
        "Implemented core features and payment integrations for B2C web app using Node.js and Express.",
        "Led performance tuning initiatives, cutting API latency by 40% with caching and database optimizations.",
      ],
    },
    {
      role: "Junior Developer",
      company: "Local Solutions",
      duration: "2014 - 2016",
      description: [
        "Worked on small-team product features and maintenance tasks using jQuery and vanilla JS.",
      ],
    },
    // extra experiences to trigger truncation / +n more in templates that slice
    {
      role: "Intern",
      company: "Campus Labs",
      duration: "2013",
      description: ["Assisted in internal tooling and automation scripts."],
    },
  ],

  // EDUCATION - multiple items
  education: [
    { degree: "M.Sc. Computer Science", school: "State University", year: "2014 - 2016" },
    { degree: "B.Sc. Computer Science", school: "State University", year: "2010 - 2014" },
    { degree: "High School Diploma", school: "Central High School", year: "2010" },
  ],

  // CERTIFICATIONS & AWARDS
  certifications: [
    { name: "AWS Certified Developer – Associate", year: "2020" },
    { name: "Google Cloud Professional – Cloud Developer", year: "2021" },
  ],
  // awards: [
  //   { title: "Hackathon Winner", org: "Global Hack 2018", year: "2018", details: "1st place for building an accessibility tool." },
  // ],

  // ACHIEVEMENTS (and typo variant)
  achivements: [
    "Secured 1st place in regional hackathon for accessibility tooling.",
    "Published an open-source accessibility library used by 500+ projects.",
  ],
  // achivements: [
  //   "Authored a popular blog series on performance optimization (100k+ readers).",
  // ],

  // VOLUNTEER
  volunteer: [
    {
      role: "Tech Mentor",
      org: "Code for Good",
      duration: "2017 - Present",
      description: ["Mentored 50+ students in web development bootcamps.", "Organized quarterly hackathons."],
    },
  ],

  // SKILLS / SOFT SKILLS / LANGUAGES
  skills: [
    "React",
    "TypeScript",
    "Next.js",
    "Tailwind CSS",
    "Node.js",
    "GraphQL",
    "Postgres",
    "Docker",
    "CI/CD",
  ],
  softSkills: ["Mentoring", "System Design", "Communication", "Ownership"],
  languages: ["English", "Spanish"],

  // PROJECTS & PUBLICATIONS
  // projects: [
  //   {
  //     name: "OpenCV Web Helper",
  //     desc: "A small utility to process images in-browser using WebAssembly and OpenCV.",
  //     url: "https://github.com/johndoe/opencv-web-helper",
  //   },
  //   {
  //     name: "Design System Starter",
  //     desc: "A starter kit for teams to kickstart a TypeScript + Tailwind design system with Storybook.",
  //     url: "https://github.com/johndoe/design-system-starter",
  //   },
  // ],
  // publications: [
  //   { title: "Front-end Performance Patterns", outlet: "Dev.to", year: 2021, url: "https://dev.to/johndoe/perf-patterns" },
  // ],

  // SOCIAL / EXTRA LINKS
  // // github: "https://github.com/johndoe",
  // twitter: "https://twitter.com/johndoe",
  // portfolio: "https://johndoe.dev",

  // // small metadata to show template behaviors
  // dateUpdated: "2024-07-01",
};
