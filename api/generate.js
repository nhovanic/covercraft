export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobDesc, experience, userName, tone } = req.body;

  if (!jobDesc || !experience) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const systemPrompt = `You are an expert cover letter writer. Write compelling, personalized cover letters that match the candidate's experience to the job requirements. Write in a ${tone} tone. Do not use placeholder text like [Company Name] — if the company name isn't provided, write around it naturally. Output only the cover letter text, no commentary.`;

  const userPrompt = `Write a cover letter for this job application.

JOB DESCRIPTION:
${jobDesc}

CANDIDATE EXPERIENCE & HIGHLIGHTS:
${experience}

CANDIDATE NAME: ${userName || 'the applicant'}

Write a complete, ready-to-send cover letter. Make it feel personal and specific to this role — not generic. 3-4 paragraphs. Tone: ${tone}.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });
    }

    const letter = data.content?.[0]?.text || '';
    return res.status(200).json({ letter });

  } catch (err) {
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
