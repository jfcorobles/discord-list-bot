# Discord List Bot

Este es un bot para Discord que permite a los usuarios crear, editar, eliminar listas y gestionar los elementos dentro de ellas. El bot utiliza **SQLite** para almacenar los datos de las listas y los elementos. Los usuarios pueden interactuar con el bot a través de comandos Slash, y el bot responde con opciones autocompletadas para facilitar la experiencia de usuario.

## Características

- **Crear Listas**: Los usuarios pueden crear listas con títulos personalizados.
- **Ver Listas**: Los usuarios pueden ver sus listas.
- **Agregar Items**: Los usuarios pueden agregar elementos a sus listas.
- **Eliminar Items**: Los usuarios pueden eliminar elementos de sus listas.
- **Eliminar Listas**: Los usuarios pueden eliminar listas.
- **Autocompletado**: Todos los comandos que involucran listas y elementos soportan autocompletado para facilitar la selección.

## Comandos

### `/addlist`

Crea una nueva lista con un título personalizado.

- **Opciones**:
  - `title`: El título de la lista (obligatorio).

### `/showlists`

Muestra todas las listas de un usuario.

### `/additem`

Agrega un nuevo item a una lista.

- **Opciones**:
  - `list`: La lista en la que agregar el item (obligatorio, autocompletado).
  - `content`: El contenido del item (obligatorio).

### `/deleteitem`

Elimina un item de una lista.

- **Opciones**:
  - `list`: La lista de la que eliminar el item (obligatorio, autocompletado).
  - `item`: El item a eliminar (obligatorio, autocompletado basado en la lista seleccionada).

### `/deletelist`

Elimina una lista.

- **Opciones**:
  - `list`: La lista a eliminar (obligatorio, autocompletado).

## Instalación

1. Clona este repositorio en tu máquina local:
   ```bash
   git clone https://github.com/jfcorobles/discord-list-bot.git
   ```
2. Accede a la carpeta del proyecto:
   ```bash
   cd discord-list-bot
   ```
3. Instala las dependencias:
    ```bash
   npm install
   ```
4. Crea un archivo .env en la raíz del proyecto con las siguientes variables:
    ```bash
    DISCORD_TOKEN=tu_token_de_discord
    CLIENT_ID=tu_client_id_de_discord
    GUILD_ID=tu_guild_id_de_discord
   ```
5. Ejecuta el bot:
    ```bash
    node deploy-commands.js
    node index.js
   ```
