/*
 *  Nome:					falastrao_bot
 *  Descrição:				Simples chatbot pro Discord usando GPT-3
 *  Autor:					Vico
 *  Versão:					1.0
 *  Dependências:			discord.js e openai
*/

/* ---------------- DECLARAÇÕES ---------------- */
const { Client, GatewayIntentBits, Collection } = require('discord.js');
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
// Armazenará a última resposta do bot para cada usuário (independentemente do canal)
const last_messages = new Collection();

/* ------------------ FUNÇÕES ------------------ */
// Função para enviar uma pergunta ao GPTGPT e obter uma resposta
async function openai_reply(user_id, username, message) {
	let last_message = "";
	if (last_messages.has(user_id))
	{
		last_message = last_messages.get(user_id)
	}
	else
	{
		last_message = "Esta é a primeira conversa com " + username;
	}
	let username_fixed = username.replace(/ /g,"_");
	const completion = await openai.createChatCompletion({
	  model: "gpt-3.5-turbo-0301", // ALTERAR NO FIM DE MAIO!!!
	  messages: [
		{role: "assistant", content: last_message},
		{role: "system", content: config.openai.context},
		{role: "user", name: username_fixed, content: message}
	],
	});
	last_messages.set(user_id, completion.data.choices[0].message.content);
	// console.log(last_messages);
	return completion.data.choices[0].message;
}

/* ----------------- CALLBACKS ----------------- */
client.on('ready', () => {
	console.log(`Conectado como ${client.user.tag}!`);
});

client.on('messageCreate', async (msg) => {
	// Caso o autor seja um bot (ele mesmo incluído) EXCETO o quebra-gelo não faz nada
	if (msg.author.bot && msg.author.id !== config.discord.bot_ignore) return;
	
	// Caso a mensagem venha por DM (IMPLEMENTAR POSTERIORMENTE ALGUMA ROTINA SOBRE ISSO)
	if (!msg.guild) return;
	
	// Responde a mensagem se ele for mencionado (e se for uma resposta com ping?)
	if (msg.mentions.has(client.user.id))
	{
		msg.channel.sendTyping(); // Inicie a simulação de digitação
		let response = "";
		response = await openai_reply(msg.author.id, msg.author.username, msg.cleanContent.replace('@everyone', '').replace('@here', '').replace(/@/g, ""));
		msg.reply(response);
	}
});

/* -------------- FLUXO PRINCIPAL -------------- */
// Loga no Discord
client.login(config.discord.bot_token);