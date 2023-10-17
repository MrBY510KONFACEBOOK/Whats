const { Client } = require('whatsapp-web.js');
const axios = require('axios');
const fs = require('fs');
const qrCodeTerminal = require('qrcode-terminal');

const client = new Client();

// Event handler for incoming messages
client.on('message', async (message) => {
  if (message.body === '!getgroups') {
    // Retrieve group information
    const groups = await client.getChats();

    let response = 'Groups Information:\n';

    groups.forEach((group) => {
      // Add group information to the response
      response += `${group.name}\n${group.id._serialized}\n\n`;
    });

    message.reply(response);
  } else if (message.body.startsWith('!sendmedia')) {
    const args = message.body.split(' ');
    const mediaUrl = args[1];
    const targetGroupId = args[2]; // Add group ID as the third argument

    // Download the file
    const response = await axios({
      method: 'GET',
      url: mediaUrl,
      responseType: 'stream',
    });

    // Save the file locally
    const filePath = 'downloaded_file';
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    // Wait for the file to be saved
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Send the saved file as a document to the specified group
    const groupChat = client.getChatById(targetGroupId);

    if (groupChat) {
      groupChat.sendDocument(fs.createReadStream(filePath), { filename: 'sent_document' })
        .then(() => {
          message.reply('Document sent successfully to the specified group.');
        })
        .catch((error) => {
          message.reply(`Error sending document: ${error}`);
        })
        .finally(() => {
          // Delete the temporary file after sending
          fs.unlinkSync(filePath);
        });
    } else {
      message.reply('Invalid group ID. Please check and try again.');
    }
  }
});

// Event handler for QR code generation
client.on('qr', (qrCode) => {
  // Display QR code in the console
  console.log(qrCode);

  // Display QR code in the terminal
  qrCodeTerminal.generate(qrCode, { small: true });
});

// Event handler for successful authentication
client.on('authenticated', (session) => {
  console.log('Authentication successful!');
  console.log('Session information:', session);

  // You can save session information for future use to avoid scanning the QR code again
});

// Initialize the WhatsApp client
client.initialize();
