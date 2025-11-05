import type { NextApiRequest, NextApiResponse } from "next";
import { modelSelector } from "../../lib/geminiModelSelector";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = modelSelector.getUsageStats();
    
    // Add summary information
    const summary = {
      totalModels: Object.keys(stats).length,
      availableModels: Object.values(stats).filter((model: any) => model.current.available).length,
      recommendedModel: modelSelector.selectForUseCase('resume-generation'),
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      summary,
      models: stats
    });
  } catch (error) {
    console.error('Error fetching Gemini stats:', error);
    res.status(500).json({ error: 'Failed to fetch model statistics' });
  }
} 