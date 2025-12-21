const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const dataPath = path.join(process.cwd(), 'data', 'survey-responses.json');
    
    // Check if file exists
    if (!fs.existsSync(dataPath)) {
      return res.status(200).json({
        success: true,
        results: {
          totalResponses: 0,
          questions: []
        }
      });
    }

    // Read data
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContent);

    // Calculate statistics for each question
    const questions = [];
    
    for (let i = 1; i <= 10; i++) {
      const questionKey = `q${i}`;
      const starCounts = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };

      // Count stars for this question
      data.responses.forEach(response => {
        const rating = response.answers[questionKey];
        if (rating >= 1 && rating <= 5) {
          starCounts[rating]++;
        }
      });

      // Calculate average
      let totalStars = 0;
      let totalVotes = 0;
      
      for (let star = 1; star <= 5; star++) {
        totalStars += star * starCounts[star];
        totalVotes += starCounts[star];
      }

      const average = totalVotes > 0 ? (totalStars / totalVotes).toFixed(2) : 0;

      questions.push({
        questionNumber: i,
        starCounts: starCounts,
        average: parseFloat(average),
        totalVotes: totalVotes
      });
    }

    return res.status(200).json({
      success: true,
      results: {
        totalResponses: data.totalResponses,
        lastUpdate: data.responses.length > 0 ? data.responses[data.responses.length - 1].timestamp : null,
        questions: questions
      }
    });

  } catch (error) {
    console.error('Error reading survey results:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
};