/**
 * BlockStop Gmail Add-on
 * Scans email attachments for malware and threats
 */

const BLOCKSTOP_API_URL = 'https://your-blockstop-instance.com/api';
const BLOCKSTOP_API_KEY = 'YOUR_API_KEY_HERE';

/**
 * Handle Gmail message context
 */
function onGmailMessage(e) {
  const accessToken = e.gmail.accessToken;
  const messageId = e.gmail.messageId;

  try {
    const message = GmailApp.getMessageById(messageId);
    const attachments = message.getAttachments();

    if (attachments.length === 0) {
      return buildCard('No Attachments', 'This message has no attachments to scan.');
    }

    return buildAttachmentCard(messageId, attachments, accessToken);
  } catch (error) {
    Logger.log('Error: ' + error);
    return buildCard('Error', 'Failed to process message: ' + error.toString());
  }
}

/**
 * Build card showing attachments
 */
function buildAttachmentCard(messageId, attachments, accessToken) {
  const sections = [];

  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i];
    const fileName = attachment.getName();
    const fileSize = attachment.getSize();

    sections.push(
      CardService.newSection()
        .setHeader('Attachment: ' + fileName)
        .addWidget(
          CardService.newKeyValue()
            .setTopLabel('Size')
            .setContent((fileSize / 1024).toFixed(2) + ' KB')
        )
        .addWidget(
          CardService.newButtonSet()
            .addButton(
              CardService.newTextButton()
                .setText('Scan')
                .setOnClickAction(
                  CardService.newAction()
                    .setFunctionName('scanAttachment')
                    .setParameters({
                      messageId: messageId,
                      attachmentIndex: i.toString(),
                      fileName: fileName
                    })
                )
            )
            .addButton(
              CardService.newTextButton()
                .setText('Delete')
                .setOnClickAction(
                  CardService.newAction()
                    .setFunctionName('deleteAttachment')
                    .setParameters({
                      messageId: messageId,
                      attachmentIndex: i.toString()
                    })
                )
            )
        )
    );
  }

  return CardService.newCardBuilder()
    .setName('BlockStop Security Scanner')
    .addSection(
      CardService.newSection()
        .setHeader('Attachments Found: ' + attachments.length)
    )
    .setSections(sections)
    .build();
}

/**
 * Scan a single attachment
 */
function scanAttachment(e) {
  const parameters = e.parameters;
  const messageId = parameters.messageId;
  const attachmentIndex = parseInt(parameters.attachmentIndex);
  const fileName = parameters.fileName;

  try {
    const message = GmailApp.getMessageById(messageId);
    const attachments = message.getAttachments();
    const attachment = attachments[attachmentIndex];

    if (!attachment) {
      return CardService.newNavigation()
        .popCard()
        .updateCard(buildCard('Error', 'Attachment not found'));
    }

    // Get attachment data
    const blob = attachment.copyBlob();
    const fileData = blob.getBytes();
    const hashValue = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, fileData);
    const hash = hashValue
      .map((byte) => ('0' + (byte & 0xff).toString(16)).slice(-2))
      .join('');

    // Call BlockStop API
    const scanResult = scanWithBlockStop(fileName, hash, fileData);

    if (scanResult.malwareDetected) {
      return CardService.newNavigation()
        .popCard()
        .updateCard(buildThreatCard(fileName, scanResult));
    } else {
      return CardService.newNavigation()
        .popCard()
        .updateCard(buildCard('Safe', fileName + ' passed security scan.'));
    }
  } catch (error) {
    Logger.log('Scan error: ' + error);
    return CardService.newNavigation()
      .popCard()
      .updateCard(buildCard('Scan Failed', error.toString()));
  }
}

/**
 * Call BlockStop API to scan attachment
 */
function scanWithBlockStop(fileName, hash, fileData) {
  const payload = {
    fileName: fileName,
    fileHash: hash,
    fileSize: fileData.length,
    source: 'gmail-addon'
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + BLOCKSTOP_API_KEY,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(BLOCKSTOP_API_URL + '/scan', options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200) {
      return result;
    } else {
      throw new Error('API error: ' + response.getResponseCode());
    }
  } catch (error) {
    Logger.log('BlockStop API error: ' + error);
    throw error;
  }
}

/**
 * Build threat card
 */
function buildThreatCard(fileName, scanResult) {
  let sections = [
    CardService.newSection()
      .setHeader('THREAT DETECTED')
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('File')
          .setContent(fileName)
      )
      .addWidget(
        CardService.newKeyValue()
          .setTopLabel('Risk Score')
          .setContent(scanResult.riskScore.toString())
      )
  ];

  if (scanResult.threats && scanResult.threats.length > 0) {
    const threatList = scanResult.threats
      .map((t) => '• ' + t.type + ': ' + t.description)
      .join('\n');

    sections.push(
      CardService.newSection()
        .setHeader('Detected Threats')
        .addWidget(
          CardService.newTextParagraph()
            .setText(threatList)
        )
    );
  }

  sections.push(
    CardService.newSection()
      .addWidget(
        CardService.newButtonSet()
          .addButton(
            CardService.newTextButton()
              .setText('Quarantine')
              .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          )
          .addButton(
            CardService.newTextButton()
              .setText('Delete')
              .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
          )
      )
  );

  return CardService.newCardBuilder()
    .setName('Security Alert')
    .setSections(sections)
    .build();
}

/**
 * Delete attachment
 */
function deleteAttachment(e) {
  const parameters = e.parameters;
  const messageId = parameters.messageId;
  const attachmentIndex = parseInt(parameters.attachmentIndex);

  try {
    const message = GmailApp.getMessageById(messageId);
    message.moveToTrash();

    return CardService.newNavigation()
      .popCard()
      .updateCard(buildCard('Deleted', 'Attachment has been moved to trash.'));
  } catch (error) {
    return CardService.newNavigation()
      .popCard()
      .updateCard(buildCard('Error', 'Failed to delete: ' + error.toString()));
  }
}

/**
 * Build basic card
 */
function buildCard(title, message) {
  return CardService.newCardBuilder()
    .setName(title)
    .addSection(
      CardService.newSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText(message)
        )
    )
    .build();
}
