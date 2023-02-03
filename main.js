/*
 *  Nome:					falastrao_bot
 *  Descrição:				Simples chatbot pro Discord usando markov chain
 *  Autor:					Vico
 *  Versão:					0.0.1
 *  Dependências:			discord.js e makrov
*/

/* ---------------- DECLARAÇÕES ---------------- */
const util = require('util');
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const markov = require('markov');

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
const dados = markov(config.markov.ordem);

/* ------------------ FUNÇÕES ------------------ */
// Remove mentions da mensagem
function remover_mentions(msg)
{
	return msg.replace(/<@(.*?)>/, ""); // Remove QUALQUER mention
}

// Substitui as mentions de uma mensagem pelo apelido de cada user mencionado
function replaceMentionsWithNicknames(message)
{
	if (message.mentions.users.size)
	{
		let content = message.content;
		// Replace each mention with its respective user name/nickname
		message.mentions.users.forEach(user => {
			const replace = user.username + (user.nickname ? ` (${user.nickname})` : '');
			content = content.replace(new RegExp(`<@!?${user.id}>`, 'g'), replace);
		});
		// Return the content of the message with the replaced mentions
		return content;
	}
	else
	{
		return message.content;
	}
}

/* ----------------- CALLBACKS ----------------- */
client.on('ready', () => {
	console.log(`Conectado como ${client.user.tag}!`);
});

client.on('messageCreate', msg => {
	// Caso o autor seja um bot (ele mesmo incluído) não faz nada
	if (msg.author.bot) return;
	
	// Responde a mensagem se ele for mencionado (e se for uma resposta com ping?)
	if (msg.mentions.has(client.user.id)) {
		msg.reply(dados.respond(replaceMentionsWithNicknames(msg)).join(' '));
	}
});

/* -------------- FLUXO PRINCIPAL -------------- */
// LÊ o arquivo-fonte, e alimenta cada linha no objeto da cadeia
fs.readFileSync(__dirname + '/fonte.txt').toString().split("\n").forEach(function(line, index, arr) {
	if (index === arr.length - 1 && line === "") { return; }
	dados.seed(line);
	console.log("Dados carregados!");
});

// Loga no Discord
client.login(config.discord.bot_token);