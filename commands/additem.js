const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserLists, addListItem } = require('../db/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('additem')
        .setDescription('Agrega un item a una lista existente.')
        .addStringOption(option =>
            option.setName('list')
                .setDescription('Selecciona la lista a la que quieres agregar el item.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('content')
                .setDescription('Contenido del item.')
                .setRequired(true)
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
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const listId = interaction.options.getString('list');
        const content = interaction.options.getString('content');

        try {
            // Validar que la lista pertenezca al usuario
            const userLists = await getUserLists(userId, guildId);
            const list = userLists.find(l => l.id.toString() === listId);

            if (!list) {
                return interaction.reply({
                    content: '❌ No se encontró la lista o no tienes permisos para editarla.',
                    flags: [MessageFlags.Ephemeral],
                });
            }

            await addListItem(listId, content);

            await interaction.reply({
                content: `✅ Item agregado a la lista **${list.title}**: ${content}`,
                flags: [MessageFlags.Ephemeral],
            });
        } catch (error) {
            console.error('Error al agregar item:', error);
            await interaction.reply({
                content: '❌ Ocurrió un error al intentar agregar el item.',
                flags: [MessageFlags.Ephemeral],
            });
        }
    }
};
