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
    const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
    const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;

    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': JSONBIN_API_KEY
      }
    });

    const { record: data } = await response.json();

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