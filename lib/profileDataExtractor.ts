import { logInfo, logError } from './logger';

export interface GitHubProfile {
  name: string;
  bio: string;
  location: string;
  company: string;
  email: string;
  blog: string;
  publicRepos: number;
  followers: number;
  following: number;
  languages: string[];
  topRepositories: {
    name: string;
    description: string;
    language: string;
    stars: number;
  }[];
}

export interface LinkedInData {
  profileUrl: string;
  // We'll store the URL and let users manually input key info
  // since LinkedIn API is very restrictive
}

export interface SocialProfileData {
  github?: GitHubProfile;
  linkedin?: LinkedInData;
}

class ProfileDataExtractor {
  private static readonly GITHUB_API_BASE = 'https://api.github.com';

  // Extract GitHub profile data
  static async extractGitHubData(githubUrl: string): Promise<GitHubProfile | null> {
    try {
      // Extract username from GitHub URL
      const username = this.extractGitHubUsername(githubUrl);
      if (!username) {
        throw new Error('Invalid GitHub URL format');
      }

      logInfo('Extracting GitHub data', { username });

      // Fetch basic profile data
      const profileResponse = await fetch(`${this.GITHUB_API_BASE}/users/${username}`);
      if (!profileResponse.ok) {
        throw new Error(`GitHub API error: ${profileResponse.status}`);
      }
      const profile = await profileResponse.json();

      // Fetch repositories to get language data
      const reposResponse = await fetch(`${this.GITHUB_API_BASE}/users/${username}/repos?sort=stars&direction=desc&per_page=10`);
      const repositories = reposResponse.ok ? await reposResponse.json() : [];

      // Extract languages from repositories
      const languages = new Set<string>();
      const topRepositories = repositories.slice(0, 5).map((repo: any) => {
        if (repo.language) {
          languages.add(repo.language);
        }
        return {
          name: repo.name,
          description: repo.description || '',
          language: repo.language || 'Unknown',
          stars: repo.stargazers_count || 0
        };
      });

      const githubProfile: GitHubProfile = {
        name: profile.name || profile.login,
        bio: profile.bio || '',
        location: profile.location || '',
        company: profile.company || '',
        email: profile.email || '',
        blog: profile.blog || '',
        publicRepos: profile.public_repos || 0,
        followers: profile.followers || 0,
        following: profile.following || 0,
        languages: Array.from(languages),
        topRepositories
      };

      logInfo('GitHub data extracted successfully', { 
        username, 
        languageCount: languages.size,
        repoCount: topRepositories.length 
      });

      return githubProfile;
    } catch (error) {
      logError('Failed to extract GitHub data', error);
      return null;
    }
  }

  // Extract GitHub username from various URL formats
  private static extractGitHubUsername(url: string): string | null {
    try {
      // Handle various GitHub URL formats
      const patterns = [
        /github\.com\/([^\/\?]+)/i,
        /^([^\/\?]+)$/ // Just username
      ];

      const cleanUrl = url.trim().replace(/\/$/, ''); // Remove trailing slash

      for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match && match[1]) {
          const username = match[1];
          // Validate username format
          if (/^[a-zA-Z0-9-]+$/.test(username) && username.length > 0) {
            return username;
          }
        }
      }

      return null;
    } catch (error) {
      logError('Error extracting GitHub username', error);
      return null;
    }
  }

  // Validate and process LinkedIn URL
  static processLinkedInUrl(linkedinUrl: string): LinkedInData | null {
    try {
      const cleanUrl = linkedinUrl.trim();
      
      // Validate LinkedIn URL format
      const linkedinPattern = /linkedin\.com\/in\/[^\/\?]+/i;
      
      if (!linkedinPattern.test(cleanUrl)) {
        return null;
      }

      // Ensure URL has protocol
      const profileUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;

      return {
        profileUrl
      };
    } catch (error) {
      logError('Error processing LinkedIn URL', error);
      return null;
    }
  }

  // Generate AI prompt enhancement from social profile data
  static generatePromptEnhancement(socialData: SocialProfileData): string {
    const enhancements: string[] = [];

    if (socialData.github) {
      const github = socialData.github;
      
      enhancements.push(`GitHub Profile Information:
- Name: ${github.name}
- Bio: ${github.bio}
- Location: ${github.location}
- Company: ${github.company}
- Programming Languages: ${github.languages.join(', ')}
- Public Repositories: ${github.publicRepos}
- Top Projects: ${github.topRepositories.map(repo => 
  `${repo.name} (${repo.language}, ${repo.stars} stars): ${repo.description}`
).join('; ')}`);
    }

    if (socialData.linkedin) {
      enhancements.push(`LinkedIn Profile: ${socialData.linkedin.profileUrl}`);
    }

    if (enhancements.length === 0) {
      return '';
    }

    return `\n\nAdditional Profile Information:\n${enhancements.join('\n\n')}`;
  }

  // Validate image file
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please upload a JPEG, PNG, or WebP image file'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image size must be less than 5MB'
      };
    }

    return { isValid: true };
  }

  // Convert image file to data URL
  static async convertImageToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }
}

export default ProfileDataExtractor; 