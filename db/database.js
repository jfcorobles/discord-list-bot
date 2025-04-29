const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.sqlite');

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        guild_id TEXT,           -- Puede ser NULL si fue en DM
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
    db.run(`
    CREATE TABLE IF NOT EXISTS list_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        list_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );
  `);
});

function createList(userId, guildId, title) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO lists (user_id, guild_id, title) VALUES (?, ?, ?)`,
            [userId, guildId, title],
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID); // Devuelve el ID de la nueva lista
                }
            }
        );
    });
}

// Obtener todas las listas de un usuario en un servidor (ahora con el id de la lista)
function getUserLists(userId, guildId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM lists WHERE user_id = ? AND guild_id = ?`,
            [userId, guildId],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows); // Regresa todas las listas con su id y detalles
                }
            }
        );
    });
}

// Obtener los detalles de una lista específica por id
function getListDetails(userId, guildId, listId) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM lists WHERE user_id = ? AND guild_id = ? AND id = ?`,
            [userId, guildId, listId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    resolve(row); // Regresa los detalles de la lista
                } else {
                    resolve(null); // Si no se encuentra la lista
                }
            }
        );
    });
}

// Obtener todos los items de una lista
function getListItems(listId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM list_items WHERE list_id = ?`,
            [listId],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows); // Regresa todos los items de la lista
                }
            }
        );
    });
}

// Agregar un nuevo item a una lista
function addListItem(listId, content) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO list_items (list_id, content) VALUES (?, ?)`,
            [listId, content],
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID); // Devuelve el ID del nuevo item
                }
            }
        );
    });
}

// Eliminar un item de una lista
function deleteListItem(itemId) {
    return new Promise((resolve, reject) => {
        db.run(
            `DELETE FROM list_items WHERE id = ?`,
            [itemId],
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes); // Devuelve el número de filas afectadas
                }
            }
        );
    });
}

// Eliminar una lista
function deleteList(listId) {
    return new Promise((resolve, reject) => {
        db.run(
            `DELETE FROM lists WHERE id = ?`,
            [listId],
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes); // Devuelve el número de filas afectadas
                }
            }
        );
    });
}

module.exports = {
    db,
    createList,
    getUserLists,
    getListDetails,
    getListItems,
    addListItem,
    deleteListItem,
    deleteList
};
