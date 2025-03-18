/*
 *  Nome:					falastrao_bot
 *  Descrição:				Simples chatbot pro Discord usando GPT-3
 *  Autor:					Vico
 *  Versão:					1.0
 *  Dependências:			discord.js e openai
*/

/* ---------------- DECLARAÇÕES ---------------- */
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import OpenAI from 'openai';

/* ----------------- VARIÁVEIS ----------------- */
import config from './config.json' with { type: 'json' };
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	]
});
const openai = new OpenAI({
	apiKey: config.openai.api_key,
	baseURL: config.openai.base_url,
});

// Armazenará a última resposta do bot para cada usuário (independentemente do canal)
const last_messages = new Collection();

/* ----------------- FUNÇÕES AUXILIARES ----------------- */
// Função para dividir mensagens longas em partes de no máximo 2000 caracteres
function splitMessage(message, maxLength = 2000) {
	const parts = [];
	for (let i = 0; i < message.length; i += maxLength) {
		parts.push(message.substring(i, i + maxLength));
	}
	return parts;
}

/* ------------------ FUNÇÕES ------------------ */
// Função para enviar uma pergunta ao GPTGPT e obter uma resposta usando a Responses API
async function openai_reply(user_id, username, message) {
    // Recupera o response_id anterior do usuário, se existir (caso contrário, null para a primeira interação)
    let previous_response_id = last_messages.get(user_id) || null;
    let username_fixed = username.replace(/ /g, "_");

    try {
        const response = await openai.responses.create({
            model: config.openai.model,
            input: message,
            previous_response_id: previous_response_id,
        });

        // Verifica se a resposta contém os dados esperados
        if (!response || !response.output || response.output.length === 0) {
            console.error("Resposta inesperada da API OpenAI (ou compatível):", response);
            return "Erro ao processar resposta da API OpenAI (ou compatível).";
        }

        // Armazena o novo response_id para manter o contexto da conversa
        last_messages.set(user_id, response.id);
        return response.output[0].content[0].text;

    } catch (error) {
        console.error("Erro na requisição para API OpenAI (ou compatível):", error);
        return "Ocorreu um erro ao se comunicar com a API OpenAI (ou compatível).";
    }
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
		// Verifica se a menção não inclui somente ou @everyone ou @here
		if (!(msg.mentions.everyone && !msg.mentions.users.size && !msg.mentions.roles.size))
		{
			msg.channel.sendTyping(); // Inicie a simulação de digitação
			let response = await openai_reply(msg.author.id, msg.member.displayName, msg.cleanContent.replace(/@/g, ""));
			
			// Verifica se a resposta ultrapassa o limite de 2000 caracteres
			if (response.length > 2000) {
				const parts = splitMessage(response);
				// Envia a primeira parte como resposta e as demais como mensagens adicionais
				await msg.reply(parts[0]);
				for (let i = 1; i < parts.length; i++) {
					await msg.channel.send(parts[i]);
				}
			} else {
				await msg.reply(response);
			}
		}
	}
});

/* -------------- FLUXO PRINCIPAL -------------- */
// Loga no Discord
client.login(config.discord.bot_token);