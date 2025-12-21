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
      return res.status(404).send('ไม่พบข้อมูล');
    }

    // Read data
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContent);

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
    return res.status(500).send('เกิดข้อผิดพลาดในการ Export ข้อมูล');
  }
};