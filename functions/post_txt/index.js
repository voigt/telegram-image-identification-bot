const Telegraf = require('telegraf');
const request = require('request-promise-native');
const uuidv1 = require('uuid/v1');
const AWS = require('aws-sdk');

AWS.config.loadFromPath('./s3_config.json');
const bot = new Telegraf(process.env.BOT_TOKEN);
const s3 = new AWS.S3({apiVersion: '2006-03-01', region: 'eu-central-1'});
const rekognition = new AWS.Rekognition({apiVersion: '2016-06-27', region: 'eu-west-1'});


const downloadFileMiddleware = (ctx, next) => {
  return bot.telegram.getFileLink(ctx.message.document) // message.document.file_id
    .then((link) => {
      ctx.state.fileLink = link
      return next()
    })
}

const downloadPhotoMiddleware = (ctx, next) => {
  return bot.telegram.getFileLink(ctx.message.photo[0])
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

    const s3Bucket = 'hannoverjs-image-bot-2017-09-28'
    const fileName = uuidv1() + '.jpg'
    const user = event.message.from.id
    const path = 'bot/' + user + '/'
    const key = path + fileName

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

      const s3Params = {
        Bucket: s3Bucket,
        Key: key,
        ContentType: res.headers['content-type'],
        ContentLength: res.headers['content-length'],
        Body: res.body // buffer
      }

      s3.putObject(s3Params).promise()
        .then((data) => {
          console.log('S3 Upload successful!');
          ctx.reply('I uploaded your file to S3. Your welcome!')

          const recognitionParams = {
            Image: {
              Bytes: new Buffer(s3Params.Body)
                // S3Object: {
                //   Bucket: s3Bucket,
                //   Name: key
                // }
            },
            MaxLabels: 15,
            MinConfidence: 75
          };

          console.log('recognitionParams: ' + JSON.stringify(recognitionParams))

          rekognition.detectLabels(recognitionParams).promise()
            .then((data) => {
              console.log('Recognition is happening');
              console.log(JSON.stringify(data));

              let labelNames = []

              data.Labels.map((label) => {
                labelNames.push(label.Name)
              })

              ctx.reply("Things coming into my mind when I see this...\n" + labelNames.join(', ').replace(/,\s*$/, ""))
            })
            .catch((err) => {
              console.log('Recognition makes trouble!' + err);
              ctx.reply('Can not recognize anything! :/')
            });

        })
        .catch((err) => {
          console.log(err);
          ctx.reply('But S3 Upload failed :(')
        });

    })
    .catch((err) => {
        console.log("Request did not work: " + err)
    });
  })

  bot.on('photo', downloadPhotoMiddleware, (ctx, next) => {
    let fileUrl = ctx.state.fileLink;
    console.log('File url: ', fileUrl);

    const options = {
      url: fileUrl,
      encoding: null,
      resolveWithFullResponse: true
    };

    request(options)
    .then((res) => {

      // console.log("Response headers/Length: " + res.headers['content-type'] + ' - ' + res.headers['content-length'])
      //console.log("Res received:\n", JSON.stringify(res))
      // ctx.reply('Yo got your pic! Its at \n!' + ctx.state.fileLink)

      const s3Params = {
        ContentType: res.headers['content-type'],
        ContentLength: res.headers['content-length'],
        Body: res.body // buffer
      }

      const recognitionParams = {
        Image: {
          Bytes: new Buffer(JSON.stringify(s3Params.Body))
            // S3Object: {
            //   Bucket: s3Bucket,
            //   Name: key
            // }
        },
        MaxLabels: 15,
        MinConfidence: 75
      };
      
      console.log('recognitionParams: ' + JSON.stringify(recognitionParams))

      rekognition.detectLabels(recognitionParams).promise()
        .then((data) => {
          console.log('Recognition is happening');
          console.log(JSON.stringify(data));

          let labelNames = []

          data.Labels.map((label) => {
            labelNames.push(label.Name)
          })

          ctx.reply("Things coming into my mind when I see this...\n" + labelNames.join(', ').replace(/,\s*$/, ""))
        })
        .catch((err) => {
          console.log('Recognition makes trouble!' + err);
          ctx.reply('Can not recognize anything! :/')
        });

    })
    .catch((err) => {
        console.log("Request did not work: " + err)
    });
  })

  const tmp = event
  bot.handleUpdate(tmp); // make Telegraf process that data

  return callback(null, { // return something for webhook, so it doesn't try to send same stuff again
    statusCode: 200,
    body: '',
  });
}
