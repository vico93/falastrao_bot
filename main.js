/**
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
var chain_principal = markov();				// Objeto de ordem 2

/* FUNÇÕES ÚTEIS */
// Função de gerar número aleatório
function gerar_aleatorio(min, max) {
	return Math.floor(Math.random() * (max - min) ) + min;
}
// Remove mentions e etc de uma string
function tratar_mensagem(msg) {
	return msg.replace(/<@(.*?)>/, ""); // Remove QUALQUER mention
}

/* "INSEMINAÇÃO" DA CADEIA */
// LÊ o arquivo-fonte, e alimenta cada linha no objeto da cadeia
fs.readFileSync(__dirname + '/frases.txt').toString().split("\n").forEach(function(line, index, arr) {
	if (index === arr.length - 1 && line === "") { return; }
	chain_principal.seed(line);
});

/* EVENTOS */
// Evento que é executado quando o script é iniciado
bot.once('ready', () => {
	console.log('[INFO] Bot iniciado!');
});

// Quando alguém manda uma mensagem
client.on('message', message => {
	// Caso seja pingado E caso não tenha sido ele mesmo que se mencionou
	if ((message.mentions.has(bot.user)) && (message.author !== bot.user)) {
		// Responde a mensagem (na verdade envia a mensagem quotando a original e citando a mensagem original)
		message.channel.send('> ' + message.content + '\n' + "<@" + message.author.id + ">" + chain_principal.respond(message.content).join(' '));
	}
});

/* CONEXÃO */
// Loga no Discord com o token presente na config
bot.login(config.discord.bot_token);