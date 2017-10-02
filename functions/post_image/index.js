'use strict';

const AWS = require('aws-sdk');
AWS.config.loadFromPath('./s3_config.json');
const s3Bucket = 'hannoverjs-image-bot-2017-09-28' // new AWS.S3( { params: {Bucket: 'hannoverjs-image-bot-2017-09-28'} } );

const putObjectToS3 = (data) => {
    const s3 = new AWS.S3();
        let params = {
            Bucket : data.Bucket,
            Key : data.Key,
            Body : data.Body
        }
        s3.putObject(params, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else     console.log(data);           // successful response
        });
}

const upload = (req, callback) => {

  if (!req.base64Image) {
      const msg = 'Invalid request: no "base64Image" field supplied';
      console.log(msg);
      return callback(msg);
  }

  const buf = new Buffer(req.base64Image.replace(/^data:image\/\w+;base64,/, ""),'base64')

  let data = {
    Bucket: s3Bucket,
    Key: "data.key",
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: 'image/png'
  };

  try {
    putObjectToS3(data)
  } catch (err) {
    console.log('Upload to S3 failed:', err);
    callback(err);
  }
};

exports.handle = (event, context, callback) => {
    const req = event;
    const operation = req.operation;
    delete req.operation;
    if (operation) {
        console.log(`Operation ${operation} 'requested`);
    }

    switch (operation) {
        case 'upload':
          upload(req, callback);
        break;
        default:
            callback(new Error(`Unrecognized operation "${operation}"`));
    }
};
