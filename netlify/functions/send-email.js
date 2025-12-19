const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { to, subject, html, type } = JSON.parse(event.body);

    const transporter = nodemailer.createTransporter({
      host: 'smtp.hmailplus.com',
      port: 465,
      secure: true,
      auth: {
        user: 'support@bpayapp.co.ke',
        pass: 'gT?3!NWLtm!a'
      }
    });

    const result = await transporter.sendMail({
      from: 'BPay Support <support@bpayapp.co.ke>',
      to,
      subject,
      html
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST'
      },
      body: JSON.stringify({ 
        success: true, 
        messageId: result.messageId,
        provider: 'Netlify-hMailPlus'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};