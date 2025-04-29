require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
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
      console.error(error);
      await interaction.reply({ content: 'Ocurrió un error al ejecutar el comando.', ephemeral: true });
    }
  });

// Iniciar
client.once(Events.ClientReady, () => {
  console.log(`Bot iniciado como ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
