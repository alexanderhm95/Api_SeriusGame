const nodemailer = require('nodemailer');

async function sendRecoveryCodeEmail(email, code) {
    try {
        let transporter = null; 
        try {
             transporter = nodemailer.createTransport({
              host: process.env.MAIL_HOST,
              port: process.env.MAIL_PORT,
              secure: true,
              auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
              }
            });
          
            console.log('Connected to email server');
          } catch (error) {
            console.log('Failed to connect to email server:', error);
          }

        if (transporter==null) {
            console.log('No se pudo conectar al servidor de correo');
            return false;
        }

        await transporter.sendMail({
            from: '"SeriusGame" <' + process.env.MAIL_USER + '>',
            to: email,
            subject: 'SeriusGame - Password recovery',
            text: 'Your recovery code is: ' + code,
            html: '<b>Your recovery code is: ' + code + '</b>'
        });

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

module.exports = { sendRecoveryCodeEmail };
