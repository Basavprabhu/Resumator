// pages/api/generateResume.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { logInfo, logError } from "../../lib/logger";
import { ResumeData } from "../../types/resume";
import { jsonrepair } from "jsonrepair"; 
import { isValidTemplateId, getTemplateIds } from "../../lib/templateRegistry";
import { modelSelector } from "../../lib/geminiModelSelector";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("GEMINI_API_KEY is not set — server route will fail without it.");
}

type Payload = {
  rawText: string;
  targetRole: string;
  templateId: string;
  profileImage?: string;
};

/** Extract JSON from a code block or first {...} object found */
// <-- add at the top

/** Extract JSON from code fences or raw text and repair if broken */
function extractJsonFromText(text: string | null) {
  if (!text) return null;

  try {
    // Remove markdown code fences
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Try direct parse
    return JSON.parse(cleaned);
  } catch {
    try {
      // Try repairing malformed JSON (trailing commas, etc.)
      const repaired = jsonrepair(text);
      return JSON.parse(repaired);
    } catch (err) {
      console.error("[extractJsonFromText] Failed to parse or repair JSON:", err);
      return null;
    }
  }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { rawText, targetRole, templateId, profileImage } = req.body as Payload;
    if (!rawText || !targetRole || !templateId) {
      return res.status(400).json({ 
        error: "rawText, targetRole and templateId are required",
        availableTemplates: getTemplateIds()
      });
    }

    // Validate template ID
    if (!isValidTemplateId(templateId)) {
      return res.status(400).json({ 
        error: `Invalid template ID: ${templateId}`,
        availableTemplates: getTemplateIds()
      });
    }

    logInfo("Received generate request", { templateId });

    const prompt = `
You are a professional resume writer and resume parser. Your job: take RAW resume text and a TARGET ROLE, and produce ONE polished, recruiter-ready resume JSON object that follows the schema exactly.

Schema (required):
{
  "name": string,
  "title": string,
  "photoUrl": string,
  "contact": { "phone": string, "email": string, "address": string, "linkedin": string , "github": string},
  "summary": string, #short and crisp at max 2 lines
  "experience": [ { "role": string, "company": string, "duration": string, "description": [string] at max 1 point  } ],
  "education": [ { "degree": string, "school": string, "year": string } ], #make sure all education history is included at all cost
  "certifications": [ { "name": string, "year": string } ],
  "volunteer": [ { "role": string, "org": string, "duration": string, "description": [string] } ],
  "skills": [string] #not more then five,
  "achivements": [string] #not more then 2,
  "languages:[string] #not more then 5",
  "softskills":[string] #not more then 5",
  "interests":[string] #not more then 5",
}

Instructions (strict):
1) **Return ONLY valid JSON** inside a triple-backtick json block: 
\`\`\`json
{ ... }
\`\`\`
Return nothing else outside the block.
2) Produce a **professional summary (3-5 sentences)** tailored to the Target Role; highlight relevant skills and measurable outcomes when possible.
3) Convert any "Projects" section into concrete Experience or Projects entries with bullets.
4) Extract Education entries and normalize years where possible.
5) **Map and prioritize skills** so the most relevant to Target Role appear first.
6) Do NOT hallucinate employers, dates, degrees, or certifications. If uncertain, leave blank ("").
7) Use clean, short bullets for descriptions.
8) If any field is missing, use "" or [].

RESUME LANGUAGE SHOULD BE:
Specific rather than general
Active rather than passive
Written to express not impress
Articulate rather than "flowery"
Fact-based (quantify and qualify)
Written for people who / systems that scan quickly
TOP FIVE RESUME MISTAKES:
Spelling and grammar errors
Missing email and phone information
Using passive language instead of "action" words
Not well organized, concise, or easy to skim
Not demonstrating results
DON'T:
Use personal pronouns (such as I or We)
Abbreviate
Use a narrative style
Use slang or colloquialisms
Include a picture
Include age or gender
List references
Start each line with a date
DO:
Be consistent in format and content
Make it easy to read and follow, balancing white space
Use consistent spacing, underlining, italics, bold, and capitalization for emphasis
List headings (such as Experience) in order of importance
Within headings, list information in reverse chronological order (most recent first)
Avoid information gaps such as a missing summer
Be sure that your formatting will translate properly if converted to a .pdf

Sample Resume Formats
Step 1: Header
Your name should be bold and in a larger font than the rest of the resume.
Below your name, list your current mailing address, phone number, and the email address you most frequently use. You may use your permanent mailing address if you wish.
Step 2: Education
List your most recent education first. Indicate your university, school (e.g., Georgetown University College of Arts & Sciences), major, minor(s), and graduation month and year.
Include your GPA on your resume. You may also include the GPA for your major and minor, especially if they are higher than your cumulative GPA. If you are hesitating to include GPA, connect with a member of our staff.
Step 3: Experience
The experience section of your resume is where you list and describe your experiences that are most relevant to the position you're applying for. Often, those experiences will be jobs and internships. But they don't need to be. They might also be coursework or extra-curricular activities. 

List and describe your experiences in reverse chronological order (most recent first).

You might divide your experiences into two categories if doing so helps you make a stronger case for your candidacy.

For instance, you might devote a section of your resume to your experiences in a particular industry. Instead of one "Experiences" section, you could create a section called "Relevant Experience" and another "Additional Experience." Or you might get even more specific and call a section something like "International Relations Experience" and another "Additional Experience." This can help direct an employer's attention to the experiences you most want them to pay attention to.

If you create multiple experience sections on your resume, list the entries in each section in reverse chronological order (most recent first).

For each entry in your experiences section: 

Create a header that includes the name of the organization, the location of the experience, dates, and your position title.
Write three or four sentences describing the work you did. Think about what you accomplished or contributed during the experience. Avoid weak verbs such as "did" or "worked." Avoid passive constructions, such as "responsibilities include." If you want help finding strong action verbs to improve the writing in your resume, see our action verbs page.
   
Step 4: Activities
This is the place to list your extra-curricular activities, such as sports, on-campus involvement, or volunteer experience. You may provide a brief description of accomplishments and responsibilities for each experience.

Step 5: Skills
Important skills to include are:

Languages–be sure not to overstate (basic, intermediate, advanced or fluent).
Technical skills–list specific and relevant software with which you are familiar (e.g., MS Word, Excel, PowerPoint, WordPerfect, Adobe Photoshop, SPSS).
Any training or certification programs you completed that would be relevant to the job.
Social media and web technologies, if applicable (e.g., Facebook, X, WordPress, Pinterest).
You may list the headings under two separate subtitles ("Extracurricular Activities" and "Skills") or one ("Skills & Activities") if you need to save space.

Target Role: "${targetRole}"
Template: "${templateId}"

RAW TEXT:
"""
${rawText}
"""

Return the JSON exactly as requested now.
`;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    // Select the best available Gemini model
    const selectedModel = modelSelector.selectForUseCase('resume-generation');
    if (!selectedModel) {
      throw new Error("No Service available due to rate limits. Please try again later.");
    }

    logInfo(`Using Gemini model: ${selectedModel}`);
    const geminiUrl = `${GEMINI_BASE_URL}/${selectedModel}:generateContent`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let response;
    let actualTokensUsed = 0;

    try {
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY || "",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      // Record successful usage (estimate tokens based on response)
      if (response.ok) {
        const responseText = await response.text();
        actualTokensUsed = Math.ceil(responseText.length / 4); // Rough token estimation
        modelSelector.recordUsage(selectedModel, actualTokensUsed);
        
        // Parse response back to JSON for further processing
        response = new Response(responseText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }
    } catch (err) {
      if ((err as any).name === "AbortError") {
        throw new Error("Request to Gemini timed out");
      }
      
      // Try fallback model if available
      const fallbackModel = modelSelector.getNextBestModel(selectedModel);
      if (fallbackModel) {
        logInfo(`Retrying with fallback model: ${fallbackModel}`);
        const fallbackUrl = `${GEMINI_BASE_URL}/${fallbackModel}:generateContent`;
        
        response = await fetch(fallbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY || "",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (response.ok) {
          const responseText = await response.text();
          actualTokensUsed = Math.ceil(responseText.length / 4);
          modelSelector.recordUsage(fallbackModel, actualTokensUsed);
          
          response = new Response(responseText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }
      } else {
        throw err;
      }
    }

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      logError("Gemini API returned non-200", { status: response.status, body: text });
      return res.status(502).json({ error: "Failed to call Gemini API", detail: text });
    }

    const json = await response.json().catch((err) => {
      logError("Failed to parse Gemini JSON response", err);
      return null;
    });

    logInfo("Raw Gemini response", { json });

    let rawTextOut: string | null = null;
    try {
      if (Array.isArray(json?.candidates) && json.candidates.length > 0) {
  const candidate = json.candidates[0];

  // New handling: Gemini returns { content: { parts: [{ text: "..." }] } }
  if (candidate?.content?.parts) {
    rawTextOut = candidate.content.parts.map((p: any) => p.text ?? "").join("\n");
  } else if (typeof candidate?.output === "string") {
    rawTextOut = candidate.output;
  }
}

    } catch (e) {
      logError("Error extracting candidate text", e);
    }

    if (!rawTextOut && typeof json?.output?.text === "string") rawTextOut = json.output.text;
    if (!rawTextOut && typeof json?.text === "string") rawTextOut = json.text;
    if (!rawTextOut) rawTextOut = JSON.stringify(json);

    logInfo("Model textual output (snippet)", { snippet: rawTextOut.slice(0, 1000) });

    const parsed = extractJsonFromText(rawTextOut);
    if (!parsed) {
      logError("Could not extract JSON from model output", { rawTextOut });
      return res.status(500).json({ error: "Model output not parseable." });
    }

   const normalized: ResumeData = {
  name: (parsed.name ?? "").toString(),
  title: (parsed.title ?? "").toString(),
  photoUrl: profileImage || (parsed.photoUrl ?? "").toString(),
  contact: {
    phone: (parsed.contact?.phone ?? "").toString(),
    email: (parsed.contact?.email ?? "").toString(),
    address: (parsed.contact?.address ?? "").toString(),
    linkedin: (parsed.contact?.linkedin ?? "").toString(),
    github: (parsed.contact?.github ?? "").toString(),
  },
  summary: (parsed.summary ?? "").toString(),

  // Work experience
  experience: Array.isArray(parsed.experience)
    ? parsed.experience.map((e: any) => ({
        role: (e.role ?? "").toString(),
        company: (e.company ?? "").toString(),
        duration: (e.duration ?? "").toString(),
        description: Array.isArray(e.description) ? e.description.map(String) : [],
      }))
    : [],

  // Education
  education: Array.isArray(parsed.education)
    ? parsed.education.map((e: any) => ({
        degree: (e.degree ?? "").toString(),
        school: (e.school ?? "").toString(),
        year: (e.year ?? "").toString(),
      }))
    : [],

  // Certifications
  certifications: Array.isArray(parsed.certifications)
    ? parsed.certifications.map((c: any) => ({
        name: (c.name ?? "").toString(),
        year: (c.year ?? "").toString(),
      }))
    : [],

  // Achievements
  achivements: Array.isArray(parsed.achivements)
    ? parsed.achivements.map(String)
    : [],

  // Volunteer
  volunteer: Array.isArray(parsed.volunteer)
    ? parsed.volunteer.map((v: any) => ({
        role: (v.role ?? "").toString(),
        org: (v.org ?? "").toString(),
        duration: (v.duration ?? "").toString(),
        description: Array.isArray(v.description) ? v.description.map(String) : [],
      }))
    : [],

  // Skills
  skills: Array.isArray(parsed.skills) ? parsed.skills.map(String) : [],

  // Soft skills
  softSkills: Array.isArray(parsed.softSkills) ? parsed.softSkills.map(String) : [],

  // Languages
  languages: Array.isArray(parsed.languages) ? parsed.languages.map(String) : [],

  // Interests
  interests: Array.isArray(parsed.interests) ? parsed.interests.map(String) : [],
};


    logInfo("Normalized resume data ready", { name: normalized.name, templateId });
    return res.status(200).json({ data: normalized });
  } catch (err: any) {
    logError("Server error in /api/generateResume", err);
    return res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}
