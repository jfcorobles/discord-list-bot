require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, MessageFlags } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();

// Cargar comandos
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Manejar comandos
client.on(Events.InteractionCreate, async interaction => {
  // Autocompletado
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command || !command.autocomplete) return;

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error('Error en autocompletado:', error);
    }
    return; // Evita seguir con el comando normal
  }

  // Comandos de texto
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('Error al ejecutar comando:', error);

    // Si la interacción ya expiró (Unknown Interaction), no intentamos responder
    if (error.code === 10062) return;

    const errorMessage = { content: 'Ocurrió un error al ejecutar el comando.', flags: [MessageFlags.Ephemeral] };

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    } catch (replyError) {
      console.error('No se pudo enviar el mensaje de error:', replyError.message);
    }
  }
});

// Manejo de errores global del cliente
client.on(Events.Error, error => {
  console.error('Error en el cliente de Discord:', error);
});

// Manejo de rechazos de promesas no capturados (evita cierres por red)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Rechazo no capturado en:', promise, 'razón:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
});

// Iniciar
client.once(Events.ClientReady, () => {
  console.log(`Bot iniciado como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
