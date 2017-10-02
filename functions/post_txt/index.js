const Telegraf = require('telegraf');
const request = require('request-promise-native');
const uuidv1 = require('uuid/v1');
const AWS = require('aws-sdk');

AWS.config.loadFromPath('./s3_config.json');
const bot = new Telegraf(process.env.BOT_TOKEN);
const s3 = new AWS.S3({apiVersion: '2006-03-01', region: 'eu-central-1'});
const rekognition = new AWS.Rekognition({apiVersion: '2016-06-27', region: 'eu-west-1'});

const downloadFileMiddleware = (ctx, next) => {
  return bot.telegram.getFileLink(ctx.message.document)
    .then((link) => {
      ctx.state.fileLink = link
      return next()
    })
}

const downloadPhotoMiddleware = (ctx, next) => {
  let photoCount = ctx.message.photo.length
  return bot.telegram.getFileLink(ctx.message.photo[photoCount-1])
    .then((link) => {
      ctx.state.fileLink = link
      return next()
    })
}

exports.handle = function(event, context, callback) {
  console.log("Request received:\n", JSON.stringify(event));

  bot.on('document', downloadFileMiddleware, (ctx, next) => {
    let fileUrl = ctx.state.fileLink;
    console.log('File url: ', fileUrl);

    const fileName = uuidv1() + '.jpg'
    const user = event.message.from.id
    const path = 'bot/' + user + '/'
    const key = path + fileName

    let s3Params = {
      Bucket: 'hannoverjs-image-bot-2017-09-28',
      Key: key,
      ContentType: '',
      ContentLength: '',
      Body: '' // buffer
    }

    let recognitionParams = {
      MaxLabels: 15,
      MinConfidence: 75
    };

    const options = {
      url: fileUrl,
      encoding: null,
      resolveWithFullResponse: true
    };

    request(options)
      .then((res) => {

        // console.log("Response headers/Length: " + res.headers['content-type'] + ' - ' + res.headers['content-length'])
        // console.log("Res received:\n", JSON.stringify(res))
        // ctx.reply('Yo got your pic! Its at \n!' + ctx.state.fileLink)

        s3Params.ContentType   = res.headers['content-type'],
        s3Params.ContentLength = res.headers['content-length'],
        s3Params.Body          = res.body // buffer

        console.log('res.body: ' + res.buffer)
        console.log('s3Params.Body' + s3Params.Body)

        return s3.putObject(s3Params).promise()
      })
      .then((data) => {
        console.log('S3 Upload successful! Data:');
        console.log(data);
        ctx.reply('I uploaded your file to S3. Your welcome!')

        recognitionParams.Image = {
            Bytes: new Buffer(s3Params.Body)
        }

        console.log('recognitionParams: ' + JSON.stringify(recognitionParams))

        return rekognition.detectLabels(recognitionParams).promise()
      })
      .then((data) => {
        console.log('Recognition is happening... Data:');
        console.log(data);

        let labelNames = []

        data.Labels.map((label) => {
          labelNames.push(label.Name)
        })

        ctx.reply("Things coming into my mind when I see this...\n\n" + labelNames.join(', ').replace(/,\s*$/, ""))
      })
      .catch((err) => {
        console.log("Request did not work: " + err)
        ctx.reply('Uh, something went wrong :(')
    });
  })

  bot.on('photo', downloadPhotoMiddleware, (ctx, next) => {
    let fileUrl = ctx.state.fileLink;
    console.log('File url: ', fileUrl);

    let recognitionParams = {
      MaxLabels: 15,
      MinConfidence: 75
    };

    const options = {
      url: fileUrl,
      encoding: null,
      resolveWithFullResponse: true
    };

    request(options)
      .then((res) => {
        console.log('Okay, got the result, starting rekognition:')
        console.log(res)

        recognitionParams.Image = {
          Bytes: new Buffer(res.body)
        }

        console.log('recognitionParams: ' + JSON.stringify(recognitionParams))

        return rekognition.detectLabels(recognitionParams).promise()
      })
      .then((data) => {
        console.log('Recognition is happening... Data:');
        console.log(data);

        let labelNames = []

        data.Labels.map((label) => {
          labelNames.push(label.Name)
        })

        ctx.reply("Things coming into my mind when I see this...\n\n" + labelNames.join(', ').replace(/,\s*$/, ""))
      })
      .catch((err) => {
        console.log("Request did not work: " + err)
        ctx.reply('Uh, something went wrong :(')
    });
  })

  const tmp = event
  bot.handleUpdate(tmp); // make Telegraf process that data

  return callback(null, { // return something for webhook, so it doesn't try to send same stuff again
    statusCode: 200,
    body: '',
  });
}
