// Use same memory storage
let surveyData = {
  responses: [],
  totalResponses: 0
};

module.exports = async (req, res) => {
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
    const questions = [];
    let totalAverage = 0;
    
    for (let i = 1; i <= 10; i++) {
      const questionKey = `q${i}`;
      const ratings = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      surveyData.responses.forEach(response => {
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

      // Calculate median
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
        totalResponses: surveyData.totalResponses,
        overallAverage: totalAverage / 10,
        lastUpdate: surveyData.responses.length > 0 ? surveyData.responses[surveyData.responses.length - 1].timestamp : null,
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