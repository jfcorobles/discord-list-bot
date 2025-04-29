const { SlashCommandBuilder,MessageFlags } = require('discord.js');
const { createList } = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addlist')
    .setDescription('Crea una nueva lista')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Título de la lista')
        .setRequired(true)
    ),

  async execute(interaction) {
    const title = interaction.options.getString('title');
    const userId = interaction.user.id;
    const guildId = interaction.guildId || null;

    try {
      await createList(userId, guildId, title);

      return interaction.reply({
        content: `✅ Lista creada con el título: **${title}**`,
        flags: [MessageFlags.Ephemeral]
      });
    } catch (error) {
      console.error('Error al crear lista:', error);
      return interaction.reply({
        content: '❌ Ocurrió un error al crear la lista.',
        flags: [MessageFlags.Ephemeral]
      });
    }
  }
};
