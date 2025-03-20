/*
 *  Nome:                    falastrao_bot
 *  Descrição:               Chatbot para Discord usando GPT-3 (versão aprimorada)
 *  Autor:                   Vico
 *  Versão:                  1.3 - tratamento consistente de menções
 *  Dependências:            discord.js e openai
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

// Armazenará a referência (canal e ID da mensagem) da última resposta do bot para cada usuário
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

// Função auxiliar para buscar o conteúdo da última mensagem do bot via ID armazenado
async function getLastMessageContent(lastMessageRef) {
	try {
		let channel = client.channels.cache.get(lastMessageRef.channelId);
		if (!channel) channel = await client.channels.fetch(lastMessageRef.channelId);
		const lastMsg = await channel.messages.fetch(lastMessageRef.messageId);
		// O cleanContent já converte as menções em nomes legíveis
		return lastMsg.cleanContent;
	} catch (error) {
		console.error('Erro ao buscar a última interação:', error);
		return null;
	}
}

/* ------------------ FUNÇÕES ------------------ */
// Função para enviar uma pergunta ao GPT (ou API compatível) e obter uma resposta
async function openai_reply(user_id, username, message, attached_image, systemContext) {
	// Usamos displayName para o contexto enviado à API
	let username_fixed = username.replace(/ /g, "_");

    try {
        const completion = await openai.chat.completions.create({
            model: config.openai.model,
            messages: [
                { role: 'system', content: systemContext },
                attached_image ? 
				{
					role: "user",
					name: username_fixed,
					content: [
						{ type: "text", text: message },
						{
							type: "image_url",
							image_url: { url: attached_image },
						},
					],
				} : 
				{ 
					role: 'user', 
					name: username_fixed, 
					content: message 
				}
            ],
        });

        if (!completion || !completion.choices || completion.choices.length === 0) {
            console.error("Resposta inesperada da API OpenAI (ou compatível):", completion);
            return "Erro ao processar resposta da API OpenAI (ou compatível).";
        }
        return completion.choices[0].message.content;

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
	// Ignora mensagens de bots e DMs
	if (msg.author.bot || !msg.guild) return;

	// Responde se o bot for mencionado
	if (msg.mentions.has(client.user.id)) {
		msg.channel.sendTyping(); // Simula digitação
		let systemContext = config.openai.context; // Contexto base
		let extraContext = "";
		let replyPrefix = ""; // Para menção caso a resposta seja direcionada a outro usuário

		if (msg.reference) {
			try {
				const referencedMessage = await msg.channel.messages.fetch(msg.reference.messageId);
				// Utiliza toString() para obter a menção completa do autor
				const referencedMention = referencedMessage.author.toString();
				if (referencedMessage.author.id === client.user.id) {
					extraContext = ` ${msg.member.displayName} está respondendo à mensagem anterior do bot: "${referencedMessage.cleanContent}".`;
				} else {
					extraContext = ` ${msg.member.displayName} está respondendo à mensagem de ${referencedMention}: "${referencedMessage.cleanContent}".`;
					replyPrefix = `${referencedMention} `;
				}
			} catch (error) {
				console.error('Erro ao buscar a mensagem referenciada:', error);
			}
			systemContext += extraContext;
		} else {
			// Se não for resposta, verifica a última interação registrada
			const lastMessageRef = last_messages.get(msg.author.id);
			if (lastMessageRef) {
				const lastContent = await getLastMessageContent(lastMessageRef);
				if (lastContent)
					systemContext += ` Última interação: "${lastContent}".`;
				else
					systemContext += ` (Não foi possível recuperar a última interação.)`;
			} else {
				systemContext += ` Esta é a primeira conversa com ${msg.member.displayName}.`;
			}
		}

		// Ao enviar para a API, usamos o conteúdo original sem remover os códigos de menção,
		// pois o displayName já é extraído e utilizado para contextualização
		const userMessage = msg.cleanContent.trim();
		let response;
		if (msg.attachments.size > 0) {
			const attachment = msg.attachments.first();
			if (attachment.contentType && attachment.contentType.startsWith('image/')) {
				response = await openai_reply(msg.author.id, msg.member.displayName, userMessage, attachment.url, systemContext);
			}
		} else {
			response = await openai_reply(msg.author.id, msg.member.displayName, userMessage, "", systemContext);
		}

		// Envia a resposta, dividindo se necessário
		let sentMessage;
		if (response.length > 2000) {
			const parts = splitMessage(response);
			sentMessage = await msg.reply(replyPrefix + parts[0]);
			for (let i = 1; i < parts.length; i++) {
				await msg.channel.send(parts[i]);
			}
		} else {
			sentMessage = await msg.reply(replyPrefix + response);
		}

		// Armazena a referência da mensagem do bot para futuras interações
		last_messages.set(msg.author.id, { channelId: msg.channel.id, messageId: sentMessage.id });
	}
});

/* -------------- FLUXO PRINCIPAL -------------- */
client.login(config.discord.bot_token);
