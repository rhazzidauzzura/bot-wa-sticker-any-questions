const qrcode = require("qrcode-terminal");
const fs = require("fs");
const { Client, LegacySessionAuth, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const { getSystemErrorMap } = require("util");
const { Configuration, OpenAIApi } = require("openai");
const { url } = require("inspector");

const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);
const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "client-one", //Un identificador(Sugiero que no lo modifiques)
  }),
});

// Save session values to the file upon successful auth
client.on("authenticated", (session) => {
  console.log(session);
});

client.initialize();
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("ready to message");
});

function man() {
  client.on("message", async (message) => {
    // console.log(message);
    // console.log(message._data.isGif === true);

    if (message.body.startsWith("!sticker") || (message.body.startsWith("/sticker") && message.type === "image") || message.type === "video") {
      const media = await message.downloadMedia();

      await client.sendMessage(message.from, media, {
        sendMediaAsSticker: true,
      });
    } else if (message.body.includes("/draw")) {
      let text = message.body.split("/draw")[1];
      let qst = `Q: ${text}\nA:`;
      const response = await openai.createImage({
        prompt: text,
        n: 1,
        size: "512x512",
      });
      let imgUrl = response.data.data[0].url;
      const media = await MessageMedia.fromUrl(imgUrl);
      await client.sendMessage(message.from, media, { caption: "your image" });
    } else {
      let qst = `Q: ${message.body}\nA:`;
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: qst,
        temperature: 0,
        max_tokens: 300,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });
      message.reply(response.data.choices[0].text);
    }
  });
}

man();
