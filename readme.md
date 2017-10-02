
##Set Webhook
```
curl -XPOST https://api.telegram.org/bot<token>/setWebhook\?url\=https%3A%2F%2Fikeozgv1ck.execute-api.eu-central-1.amazonaws.com%2Fprod%2Ftelegram%2Fbot%2F
{"ok":true,"result":true,"description":"Webhook was set"}%
```

##Get info about Webhook
```
##curl -XGET https://api.telegram.org/bot<token>/getWebhookInfo
```

##Get file Path

```
curl -XGET https://api.telegram.org/bot<token>/getFile?file_id=BQADAgADdQAD--xoSjeSsWKaz9ygAg
```

##Get File URL
```
curl -XGET https://api.telegram.org/file/bot<token>/<filePath
```



###Save for later
Upload image directly via API Gateway
```
curl --request POST -H "Accept: image/png" -H "Content-Type: image/png" --data-binary "@test.png" https://ikeozgv1ck.execute-api.eu-central-1.amazonaws.com/prod/telegram/img/upload > test-thumb.png
```