const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { getUserLists, addListItem } = require('../db/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('save-msg')
        .setDescription('Escanea mensajes recientes y guarda los links en la lista "zelda".')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Número de mensajes a revisar (máximo 100).')
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addStringOption(option =>
            option.setName('filter')
                .setDescription('Palabra clave que debe contener el mensaje.')
        )
        .addBooleanOption(option =>
            option.setName('only-me')
                .setDescription('¿Solo guardar tus propios mensajes?')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ReadMessageHistory),

    async autocomplete(interaction) {
        // Autocomplete ya no es necesario si eliminamos el parámetro list
        await interaction.respond([]);
    },

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const amount = interaction.options.getInteger('amount') || 50;
        const filter = interaction.options.getString('filter');
        const onlyMe = interaction.options.getBoolean('only-me') || false;

        try {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        } catch (error) {
            if (error.code === 10062) {
                console.error('La interacción expiró antes de poder responder (Unknown Interaction).');
                return;
            }
            throw error;
        }

        try {
            const userLists = await getUserLists(userId, guildId);

            // Buscar las listas destino
            const zeldaList = userLists.find(l => l.title.toLowerCase() === 'zelda');
            const javList = userLists.find(l => l.title.toLowerCase() === 'javs');
            const nhList = userLists.find(l => l.title.toLowerCase() === 'nh');
            const chiksList = userLists.find(l => l.title.toLowerCase() === 'chiks');

            if (!zeldaList && !javList && !nhList && !chiksList) {
                return interaction.editReply({
                    content: '❌ No se encontraron las listas "zelda", "JAVS", "nH" ni "Chiks". Por favor, crea al menos una.',
                });
            }

            // Obtener mensajes
            const messages = await interaction.channel.messages.fetch({ limit: amount });

            let zeldaCount = 0;
            let javCount = 0;
            let nhCount = 0;
            let chiksCount = 0;

            const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
            const javRegex = /\b[a-zA-Z0-9]+-[0-9]+\b/i;
            const nhRegex = /(\b\d{5,6}\b|#\d{5,6}|\(\d{5,6}\))/;
            const cosRegex = /\bcos\b/i;

            for (const msg of messages.values()) {
                try {
                    if (msg.author.bot || msg.content.startsWith('/')) continue;
                    if (onlyMe && msg.author.id !== userId) continue;
                    if (filter && !msg.content.toLowerCase().includes(filter.toLowerCase())) continue;

                    const content = msg.content.trim();
                    if (!content) continue;

                    // 1. Prioridad Links (Zelda)
                    if (urlRegex.test(content)) {
                        if (zeldaList) {
                            try {
                                await addListItem(zeldaList.id, content);
                                zeldaCount++;
                                try { await msg.delete(); } catch (e) { console.error(`Error al borrar link (${msg.id}):`, e.message); }
                            } catch (err) { console.error('Error al guardar link en DB:', err.message); }
                        }
                        continue;
                    }

                    // 2. Prioridad Códigos JAVS
                    if (javRegex.test(content)) {
                        if (javList) {
                            try {
                                await addListItem(javList.id, content);
                                javCount++;
                                try { await msg.delete(); } catch (e) { console.error(`Error al borrar JAVS (${msg.id}):`, e.message); }
                            } catch (err) { console.error('Error al guardar JAVS en DB:', err.message); }
                        }
                        continue;
                    }

                    // 3. Prioridad Códigos nH
                    if (nhRegex.test(content)) {
                        if (nhList) {
                            try {
                                const cleanMatch = content.match(/\d+/);
                                if (cleanMatch) {
                                    await addListItem(nhList.id, cleanMatch[0]);
                                    nhCount++;
                                    try { await msg.delete(); } catch (e) { console.error(`Error al borrar nH (${msg.id}):`, e.message); }
                                }
                            } catch (err) { console.error('Error al guardar nH en DB:', err.message); }
                        }
                        continue;
                    }

                    // 4. Prioridad Chiks
                    const wordCount = content.split(/\s+/).length;
                    if (cosRegex.test(content) || wordCount === 1 || wordCount === 2) {
                        if (chiksList) {
                            try {
                                await addListItem(chiksList.id, content);
                                chiksCount++;
                                try { await msg.delete(); } catch (e) { console.error(`Error al borrar Chiks (${msg.id}):`, e.message); }
                            } catch (err) { console.error('Error al guardar Chiks en DB:', err.message); }
                        }
                        continue;
                    }
                } catch (msgError) {
                    console.error(`Error fatal procesando mensaje ${msg.id}:`, msgError.message);
                    // El ciclo continúa con el siguiente mensaje
                }
            }

            let responseParts = [];
            if (zeldaCount > 0) responseParts.push(`🔗 **${zeldaCount}** links en **Zelda**`);
            if (javCount > 0) responseParts.push(`🏷️ **${javCount}** códigos en **JAVS**`);
            if (nhCount > 0) responseParts.push(`📖 **${nhCount}** códigos en **nH**`);
            if (chiksCount > 0) responseParts.push(`👗 **${chiksCount}** en **Chiks**`);

            if (responseParts.length > 0) {
                const finalMsg = `✅ Proceso completado: ${responseParts.join(', ')}.`;
                try {
                    await interaction.editReply(finalMsg);
                } catch (editError) {
                    console.error('No se pudo enviar la confirmación final:', editError.message);
                }
            } else {
                try {
                    await interaction.editReply('ℹ️ No se detectó ningún link, código ni nombre válido en los mensajes revisados.');
                } catch (editError) {
                    console.error('No se pudo enviar el aviso de "nada encontrado":', editError.message);
                }
            }

        } catch (error) {
            console.error('Error crítico en save-msg:', error);
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: '❌ Ocurrió un error crítico al procesar el comando.', flags: [MessageFlags.Ephemeral] });
                } else {
                    await interaction.editReply('❌ Ocurrió un error crítico. Revisa la consola para más detalles.');
                }
            } catch (replyError) {
                console.error('Error al intentar informar el fallo crítico:', replyError.message);
            }
        }
    }
};
