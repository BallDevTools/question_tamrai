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
    return res.status(405).send('Method not allowed');
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
      return res.status(404).send('ไม่พบข้อมูล');
    }

    const fileData = await response.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    const data = JSON.parse(content);
    
    if (!data.responses || data.responses.length === 0) {
      return res.status(404).send('ไม่พบข้อมูล');
    }

    // Create CSV content
    let csv = 'ID,Timestamp,Q1,Q2,Q3,Q4,Q5,Q6,Q7,Q8,Q9,Q10\n';
    
    data.responses.forEach(response => {
      const row = [
        response.id,
        response.timestamp,
        response.answers.q1,
        response.answers.q2,
        response.answers.q3,
        response.answers.q4,
        response.answers.q5,
        response.answers.q6,
        response.answers.q7,
        response.answers.q8,
        response.answers.q9,
        response.answers.q10
      ].join(',');
      
      csv += row + '\n';
    });

    // Add UTF-8 BOM for Thai language support in Excel
    const csvWithBOM = '\uFEFF' + csv;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="survey-results-${Date.now()}.csv"`);
    
    return res.status(200).send(csvWithBOM);

  } catch (error) {
    console.error('Error exporting CSV:', error);
    return res.status(500).send('เกิดข้อผิดพลาดในการ Export ข้อมูล: ' + error.message);
  }
};