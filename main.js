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
// Função para coletar a última mensagem enviada pelo BOT à certa pessoa
function get_last_reply(guild, channel, username)
{
	// Get the guild and channel objects
	// let guild = client.guilds.cache.get(guild_id);
	// let channel = guild.channels.cache.get(channel_id);
	// Get the ID of an user based on his nickname
	let user_id = guild.members.cache.find(user_id => user_id.nickname === username);

	// Fetch the last 10 messages in the channel
	channel.messages.fetch({ limit: 10 }).then(messages => {
		// Find the last message sent by the bot that mentions the specified user
		let botMessage = messages.filter(m => m.author.bot && m.mentions.users.has(user_id)).first();

		// Do something with the bot message
		console.log(botMessage);
		//console.log(`Last message sent by bot to user ${user_id}: ${botMessage.content}`);
		// return botMessage.content;
		return 0;
	});
}

// Função para enviar uma pergunta ao GPTGPT e obter uma resposta
async function openai_reply(guild, channel, username, message) {
	let last_reply = get_last_reply(guild, channel, username);
	const completion = await openai.createChatCompletion({
	  model: "gpt-3.5-turbo",
	  messages: [
		{role: "assistant", content: last_reply},
		{role: "system", name: username, content: config.openai.context},
		{role: "user", content: message}
	],
	});
	return completion.data.choices[0].message;
}

/* ----------------- CALLBACKS ----------------- */
client.on('ready', () => {
	console.log(`Conectado como ${client.user.tag}!`);
});

client.on('messageCreate', async (msg) => {
	// Caso o autor seja um bot (ele mesmo incluído) não faz nada
	if (msg.author.bot) return;
	
	// Caso a mensagem venha por DM (IMPLEMENTAR POSTERIORMENTE ALGUMA ROTINA SOBRE ISSO)
	if (!msg.guild) return;
	
	// Responde a mensagem se ele for mencionado (e se for uma resposta com ping?)
	if (msg.mentions.has(client.user.id))
	{
		msg.channel.sendTyping(); // Inicie a simulação de digitação
		let response = "";
		response = await openai_reply(msg.guild, msg.channel, msg.author.username, msg.cleanContent.replace(/@/g, ""));
		msg.reply(response);
	}
});

/* -------------- FLUXO PRINCIPAL -------------- */
// Loga no Discord
client.login(config.discord.bot_token);