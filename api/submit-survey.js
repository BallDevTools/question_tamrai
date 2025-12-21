// Store in memory (temporary solution)
let surveyData = {
  responses: [],
  totalResponses: 0
};
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }

  try {
    const { answers } = req.body;

    if (!answers || Object.keys(answers).length !== 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณาตอบคำถามให้ครบทุกข้อ' 
      });
    }

    const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
    const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;

    // Get current data
    const getResponse = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': JSONBIN_API_KEY
      }
    });

    const { record: currentData } = await getResponse.json();

    // Add new response
    const newResponse = {
      id: currentData.totalResponses + 1,
      timestamp: new Date().toISOString(),
      answers: answers
    };

    currentData.responses.push(newResponse);
    currentData.totalResponses = currentData.responses.length;

    // Update data
    await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_API_KEY
      },
      body: JSON.stringify(currentData)
    });

    return res.status(200).json({ 
      success: true, 
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      responseId: newResponse.id
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาด: ' + error.message
    });
  }
};