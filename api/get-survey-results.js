// Use same memory storage
let surveyData = {
  responses: [],
  totalResponses: 0
};
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false });
  }

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = 'BallDevTools'; // เปลี่ยนเป็นชื่อ GitHub ของคุณ
    const REPO_NAME = 'question_tamrai'; // ชื่อ repo
    const FILE_PATH = 'data/survey-responses.json';

    const getFileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    const response = await fetch(getFileUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return res.status(200).json({
        success: true,
        results: {
          totalResponses: 0,
          overallAverage: 0,
          lastUpdate: null,
          questions: []
        }
      });
    }

    const fileData = await response.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    const data = JSON.parse(content);

    if (!data.responses || data.responses.length === 0) {
      return res.status(200).json({
        success: true,
        results: {
          totalResponses: 0,
          overallAverage: 0,
          lastUpdate: null,
          questions: []
        }
      });
    }

    const questions = [];
    let totalAverage = 0;
    
    for (let i = 1; i <= 10; i++) {
      const questionKey = `q${i}`;
      const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      data.responses.forEach(response => {
        const rating = response.answers[questionKey];
        if (rating >= 1 && rating <= 5) {
          ratings[rating]++;
        }
      });

      let totalStars = 0;
      let totalVotes = 0;
      
      for (let star = 1; star <= 5; star++) {
        totalStars += star * ratings[star];
        totalVotes += ratings[star];
      }

      const average = totalVotes > 0 ? totalStars / totalVotes : 0;
      totalAverage += average;

      const allRatings = [];
      for (let star = 1; star <= 5; star++) {
        for (let j = 0; j < ratings[star]; j++) {
          allRatings.push(star);
        }
      }
      allRatings.sort((a, b) => a - b);
      const median = allRatings.length > 0 ? allRatings[Math.floor(allRatings.length / 2)] : 0;

      questions.push({
        questionNumber: i,
        ratings: ratings,
        average: parseFloat(average.toFixed(2)),
        median: median,
        totalVotes: totalVotes
      });
    }

    return res.status(200).json({
      success: true,
      results: {
        totalResponses: data.totalResponses,
        overallAverage: parseFloat((totalAverage / 10).toFixed(2)),
        lastUpdate: data.responses[data.responses.length - 1].timestamp,
        questions: questions
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาด: ' + error.message
    });
  }
};