// Store in memory (temporary solution)
let surveyData = {
  responses: [],
  totalResponses: 0
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { answers } = req.body;

    if (!answers || Object.keys(answers).length !== 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณาตอบคำถามให้ครบทุกข้อ' 
      });
    }

    // Validate answers
    for (let i = 1; i <= 10; i++) {
      const answer = answers[`q${i}`];
      if (!answer || answer < 1 || answer > 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'กรุณาให้คะแนนระหว่าง 1-5 ดาว' 
        });
      }
    }

    // Add new response (in memory)
    const newResponse = {
      id: surveyData.totalResponses + 1,
      timestamp: new Date().toISOString(),
      answers: answers
    };

    surveyData.responses.push(newResponse);
    surveyData.totalResponses = surveyData.responses.length;

    return res.status(200).json({ 
      success: true, 
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      responseId: newResponse.id
    });

  } catch (error) {
    console.error('Error saving survey:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' 
    });
  }
};