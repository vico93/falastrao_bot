﻿/**
  *	FALASTRÃO BOT
  * by VICO
  *
  */

/* Biblotecas */
const fs = require('fs');						// Filesystem
const toml = require('toml');					// Ler arquivos TOML
const discord_api = require('discord.js');		// Discord API
const markov = require('markov');				// Markov Chain

/* Config Global */
const config = toml.parse(fs.readFileSync('./config.toml', 'utf-8'));

/* Objeto principal do bot */
const bot = new discord_api.Client();

/* Objeto principal do Markov Chain */
var chain_principal = markov(config.markov.markov_order);				// Cadeia com a ordem definida pelo usuário (padrão é 2)

/* FUNÇÕES ÚTEIS */
// Função de gerar número aleatório
function gerar_aleatorio(min, max) {
	return Math.floor(Math.random() * (max - min) ) + min;
}

// Remove mentions da mensagem
function remover_mentions(msg) {
	return msg.replace(/<@(.*?)>/, ""); // Remove QUALQUER mention
}
// Remove a quote de uma resposta (para uma réplica)
function remover_quote(msg) {
	return msg.replace(/>(.*?)\n</, "<"); // Remove tudo o que começa com '>', quebra a linha e vai começar com uma mention
}

/* "INSEMINAÇÃO" DA CADEIA */
// LÊ o arquivo-fonte, e alimenta cada linha no objeto da cadeia
fs.readFileSync(__dirname + '/fonte.txt').toString().split("\n").forEach(function(line, index, arr) {
	if (index === arr.length - 1 && line === "") { return; }
	chain_principal.seed(line);
});

/* EVENTOS */
// Evento que é executado quando o script é iniciado
bot.once('ready', () => {
	console.log('[INFO] Bot iniciado!');
	console.log('[INFO] Bot usando cadeia de ordem ' + config.markov.markov_order + "!");
});

// Quando alguém manda uma mensagem
bot.on('message', message => {
	// DEBUG
	// console.log(message.content);
	// Caso o autor seja um bot (ele mesmo incluído) não faz nada
	if(message.author.bot) return;
	// Caso seja pingado
	if (message.mentions.has(bot.user)) {
		// Responde a mensagem (na verdade envia a mensagem quotando a original e citando a mensagem original)
		message.channel.send('> ' + remover_quote(message.content) + '\n' + "<@" + message.author.id + "> " + chain_principal.respond(remover_mentions(remover_quote(message.content))).join(' '));
	}
});

/* CONEXÃO */
// Loga no Discord com o token presente na config
bot.login(config.discord.bot_token);