const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserLists, getListItems, deleteListItem } = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deleteitem')
    .setDescription('Elimina un item de una lista')
    .addStringOption(option =>
      option.setName('list')
        .setDescription('Selecciona la lista')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Selecciona el item que deseas eliminar')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    if (focusedOption.name === 'list') {
      const userLists = await getUserLists(userId, guildId);
      const options = userLists.map(list => ({
        name: `${list.title} (ID: ${list.id})`,
        value: list.id.toString(),
      }));
      await interaction.respond(options.slice(0, 25));
    }

    if (focusedOption.name === 'item') {
      const listId = interaction.options.getString('list');
      if (!listId) return await interaction.respond([]);

      const items = await getListItems(listId);
      const options = items.map(item => ({
        name: `${item.content} (ID: ${item.id})`,
        value: item.id.toString(),
      }));
      await interaction.respond(options.slice(0, 25));
    }
  },

  async execute(interaction) {
    const listId = interaction.options.getString('list');
    const itemId = interaction.options.getString('item');

    try {
      const items = await getListItems(listId);
      const itemExists = items.find(item => item.id.toString() === itemId);

      if (!itemExists) {
        return await interaction.reply({
          content: '❌ El item no pertenece a la lista seleccionada.',
          flags: [MessageFlags.Ephemeral],
        });
      }

      const deleted = await deleteListItem(itemId);
      if (deleted > 0) {
        await interaction.reply({
          content: `✅ Item eliminado correctamente.`,
          flags: [MessageFlags.Ephemeral],
        });
      } else {
        await interaction.reply({
          content: '❌ No se encontró el item a eliminar.',
          flags: [MessageFlags.Ephemeral],
        });
      }
    } catch (error) {
      console.error('Error al eliminar el item:', error);
      await interaction.reply({
        content: '❌ Ocurrió un error al intentar eliminar el item.',
        flags: [MessageFlags.Ephemeral],
      });
    }
  },
};
