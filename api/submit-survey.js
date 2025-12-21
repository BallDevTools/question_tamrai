const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Set CORS headers
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

    // Validate that all answers are between 1-5
    for (let i = 1; i <= 10; i++) {
      const answer = answers[`q${i}`];
      if (!answer || answer < 1 || answer > 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'กรุณาให้คะแนนระหว่าง 1-5 ดาว' 
        });
      }
    }

    // Read existing data
    const dataPath = path.join(process.cwd(), 'data', 'survey-responses.json');
    let data = { responses: [], totalResponses: 0 };
    
    if (fs.existsSync(dataPath)) {
      const fileContent = fs.readFileSync(dataPath, 'utf8');
      if (fileContent) {
        data = JSON.parse(fileContent);
      }
    }

    // Add new response
    const newResponse = {
      id: data.totalResponses + 1,
      timestamp: new Date().toISOString(),
      answers: answers
    };

    data.responses.push(newResponse);
    data.totalResponses = data.responses.length;

    // Save data
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

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