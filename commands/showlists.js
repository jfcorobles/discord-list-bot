const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserLists, getListDetails, getListItems } = require('../db/database'); // Funciones de la base de datos

module.exports = {
    data: new SlashCommandBuilder()
        .setName('showlists')
        .setDescription('Lee las listas de tareas.')
        .addStringOption(option =>
            option.setName('list')
                .setDescription('Selecciona la lista que quieres ver.')
                .setRequired(false)
                .setAutocomplete(true)), // Habilitar autocompletado (dropdown)

    async autocomplete(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        try {
            const userLists = await getUserLists(userId, guildId);

            if (userLists && userLists.length > 0) {
                // Limitar el número de opciones mostradas en el autocompletado
                const options = userLists.map(list => ({
                    name: `${list.title} (ID: ${list.id})`, // Mostrar el título de la lista
                    value: list.id.toString(), // Usar el ID de la lista
                }));

                await interaction.respond(options);
            }
        } catch (error) {
            console.error('Error al autocompletar listas:', error);
            await interaction.respond([]);
        }
    },

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const listId = interaction.options.getString('list'); // Obtener el ID de la lista si es proporcionado

        try {
            // Si se especifica el ID de la lista, mostrar los detalles de esa lista
            if (listId) {
                const listDetails = await getListDetails(userId, guildId, listId);
                if (listDetails) {
                    const listItems = await getListItems(listId);
                    const itemsContent = listItems.map(item => item.content).join('\n') || 'No hay items en esta lista.';

                    await interaction.reply({
                        content: `Detalles de la lista **${listDetails.title}**:\n${itemsContent}`,
                        flags: [MessageFlags.Ephemeral],
                    });
                } else {
                    await interaction.reply({
                        content: `❌ No se encontró la lista con el ID **${listId}**.`,
                        flags: [MessageFlags.Ephemeral],
                    });
                }
            } else {
                // Si no se especifica un ID de lista, mostrar todas las listas del usuario
                const userLists = await getUserLists(userId, guildId);
                if (userLists && userLists.length > 0) {
                    const listTitles = userLists.map(list => `**${list.title}** (ID: ${list.id})`).join('\n');
                    await interaction.reply({
                        content: `Tus listas:\n${listTitles}`,
                        flags: [MessageFlags.Ephemeral],
                    });
                } else {
                    await interaction.reply({
                        content: '❌ No tienes listas disponibles.',
                        flags: [MessageFlags.Ephemeral],
                    });
                }
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: '❌ Ocurrió un error al intentar leer las listas.',
                flags: [MessageFlags.Ephemeral],
            });
        }
    },
};
