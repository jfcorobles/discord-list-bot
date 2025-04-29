const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserLists, deleteList, getListDetails } = require('../db/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletelist')
        .setDescription('Elimina una lista existente.')
        .addStringOption(option =>
            option.setName('list')
                .setDescription('Selecciona la lista que quieres eliminar.')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        try {
            const userLists = await getUserLists(userId, guildId);
            if (userLists && userLists.length > 0) {
                const options = userLists.map(list => ({
                    name: `${list.title} (ID: ${list.id})`,
                    value: list.id.toString(),
                }));
                await interaction.respond(options.slice(0, 25));
            } else {
                await interaction.respond([]);
            }
        } catch (error) {
            console.error('Error en autocomplete:', error);
            await interaction.respond([]);
        }
    },

    async execute(interaction) {
        const listId = interaction.options.getString('list');
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        try {
            // Validar que la lista pertenezca al usuario antes de eliminarla
            const userLists = await getUserLists(userId, guildId);
            const list = userLists.find(l => l.id.toString() === listId);

            if (!list) {
                return interaction.reply({
                    content: '❌ No se encontró la lista o no tienes permisos para eliminarla.',
                    flags: [MessageFlags.Ephemeral],
                });
            }

            const rowsAffected = await deleteList(listId);
            if (rowsAffected > 0) {
                await interaction.reply({
                    content: `✅ Lista **${list.title}** eliminada exitosamente.`,
                    flags: [MessageFlags.Ephemeral],
                });
            } else {
                await interaction.reply({
                    content: '❌ No se pudo eliminar la lista.',
                    flags: [MessageFlags.Ephemeral],
                });
            }
        } catch (error) {
            console.error('Error al ejecutar el comando:', error);
            await interaction.reply({
                content: '❌ Ocurrió un error inesperado al eliminar la lista.',
                flags: [MessageFlags.Ephemeral],
            });
        }
    }
};
