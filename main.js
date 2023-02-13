/*
 *  Nome:					falastrao_bot
 *  Descrição:				Simples chatbot pro Discord usando GPT-3
 *  Autor:					Vico
 *  Versão:					1.0
 *  Dependências:			discord.js e openai
*/

/* ---------------- DECLARAÇÕES ---------------- */
const { Client, GatewayIntentBits } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");

/* ----------------- VARIÁVEIS ----------------- */
const config = require('./config.json');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	]
});
const configuration = new Configuration({
	apiKey: config.openai.api_key,
});
const openai = new OpenAIApi(configuration);

/* ------------------ FUNÇÕES ------------------ */
// Função para enviar uma pergunta ao GPT-3 e obter uma resposta
async function openai_reply(message) {
	const completion = await openai.createCompletion({
		model: "text-davinci-003",
		prompt: message,
		temperature: 0.7,
		max_tokens: 256,
		top_p: 1,
		frequency_penalty: 0.0,
		presence_penalty: 0.0,
	});
  return completion.data.choices[0].text;
}

/* ----------------- CALLBACKS ----------------- */
client.on('ready', () => {
	console.log(`Conectado como ${client.user.tag}!`);
});

client.on('messageCreate', async (msg) => {
	// Caso o autor seja um bot (ele mesmo incluído) não faz nada
	if (msg.author.bot) return;
	
	// Responde a mensagem se ele for mencionado (e se for uma resposta com ping?)
	if (msg.mentions.has(client.user.id))
	{
		msg.channel.sendTyping(); // Inicie a simulação de digitação
		let response = "";
		response = await openai_reply(msg.author.username + ": " + msg.cleanContent.replace(/@/g, ""));
		msg.reply(response);
	}
});

/* -------------- FLUXO PRINCIPAL -------------- */
// Loga no Discord
client.login(config.discord.bot_token);