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

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = 'BallDevTools'; // เปลี่ยนเป็นชื่อ GitHub ของคุณ
    const REPO_NAME = 'question_tamrai'; // ชื่อ repo
    const FILE_PATH = 'data/survey-responses.json';

    // Get current file
    const getFileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    let currentData = { responses: [], totalResponses: 0 };
    let fileSha = null;

    try {
      const getResponse = await fetch(getFileUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (getResponse.ok) {
        const fileData = await getResponse.json();
        fileSha = fileData.sha;
        const content = Buffer.from(fileData.content, 'base64').toString('utf8');
        currentData = JSON.parse(content);
      }
    } catch (error) {
      console.log('File not found, will create new one');
    }

    // Add new response
    const newResponse = {
      id: currentData.totalResponses + 1,
      timestamp: new Date().toISOString(),
      answers: answers
    };

    currentData.responses.push(newResponse);
    currentData.totalResponses = currentData.responses.length;

    // Update file on GitHub
    const content = Buffer.from(JSON.stringify(currentData, null, 2)).toString('base64');
    
    const updateUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add survey response #${newResponse.id}`,
        content: content,
        sha: fileSha,
        branch: 'main'
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error('Failed to update file: ' + JSON.stringify(errorData));
    }

    return res.status(200).json({ 
      success: true, 
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      responseId: newResponse.id
    });

  } catch (error) {
    console.error('Error saving survey:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message
    });
  }
};