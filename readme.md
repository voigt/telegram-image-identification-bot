# Installation

## Clone Repo

```
$ git clone git@github.com:voigt/telegram-image-identification-bot.git
```

## Install Apex

## Add S3 configuration

```
$ cat <<EOT >> ./functions/post_txt/s3_config.json
{
  "accessKeyId":"key",
  "secretAccessKey":"secret",
  "region":"region"
}
EOT
```

## Bot Configuration

### Create Bot with [@botfather](https://telegram.me/botfather)

### Add bot token to `function.json`

```
$ sed -i -- 's/<BOT_TOKEN>/<INSERT_TOKEN_HERE/g' ./functions/post_txt/function.json
```

### Set Webhook

```
curl -XPOST https://api.telegram.org/bot<BOT_TOKEN>/setWebhook\?url\=<URL_ENCODED_ENDPOINT>
{"ok":true,"result":true,"description":"Webhook was set"}%
```

## Deploy Lambda

```
$ apex deploy
```

# Development

## Get info about Webhook

```
##curl -XGET https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo
```

## Get file Path

```
curl -XGET https://api.telegram.org/bot<BOT_TOKEN>/getFile?file_id=<file_id>
```

## Get File URL

```
curl -XGET https://api.telegram.org/file/bot<BOT_TOKEN>/<file_path>
```


### Save for later

Upload image directly via API Gateway

```
curl --request POST -H "Accept: image/png" -H "Content-Type: image/png" --data-binary "@test.png" https://ikeozgv1ck.execute-api.eu-central-1.amazonaws.com/prod/telegram/img/upload > test-thumb.png
```