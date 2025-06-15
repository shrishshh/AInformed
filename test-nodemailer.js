const nodemailer = require('nodemailer');

// Step 1: Test with different configurations
const configs = [
  {
    name: 'Gmail with service',
    config: {
      service: 'gmail',
      auth: {
        user: 'sidemindlabs@gmail.com',
        pass: 'kgwqobwaspfouwwr'
      }
    }
  },
  {
    name: 'Gmail explicit SMTP',
    config: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'sidemindlabs@gmail.com',
        pass: 'kgwqobwaspfouwwr'
      }
    }
  },
  {
    name: 'Gmail SSL',
    config: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'sidemindlabs@gmail.com',
        pass: 'kgwqobwaspfouwwr'
      }
    }
  }
];

async function testAllConfigs() {
  for (const { name, config } of configs) {
    console.log(`\n🔍 Testing: ${name}`);
    const transporter = nodemailer.createTransport(config);
    
    try {
      await transporter.verify();
      console.log(`✅ ${name} - Connection successful!`);
      // Attempt to send a test email if verification is successful
      await transporter.sendMail({
        from: 'sidemindlabs@gmail.com',
        to: 'sidemindlabs@gmail.com',
        subject: `Test from ${name}`,
        text: `This is a test email from the ${name} configuration.`
      });
      console.log(`📧 ${name} - Test email sent!`);
      return transporter; // Return first working config
    } catch (error) {
      console.log(`❌ ${name} - Failed:`, error.message);
    }
  }
  
  console.log('\n❌ All configurations failed. Trying alternative email service (Ethereal Email):');
  
  // Fallback: Ethereal Email (for testing)
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log('\n🔧 Generated test account:');
    console.log('Email:', testAccount.user);
    console.log('Password:', testAccount.pass);
    console.log('SMTP Server:', testAccount.smtp.host);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(testAccount));

    const testTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    await testTransporter.verify();
    console.log('✅ Test email service working!');
    // Send a test email using Ethereal
    await testTransporter.sendMail({
      from: testAccount.user,
      to: 'sidemindlabs@gmail.com',
      subject: 'Test Email from Ethereal',
      text: 'This is a test email sent from Ethereal. Check the preview URL for details.'
    });
    console.log('📧 Ethereal Test email sent!');
    return testTransporter;
    
  } catch (error) {
    console.error('❌ Even test service failed:', error.message);
  }
}

// Run the test
testAllConfigs(); 