import { Model, DataTypes, Relationships } from "https://deno.land/x/denodb/mod.ts";


export class User extends Model {
    static table = 'user';
    static timestamps = true;

    static fields = {
        username: {
            primaryKey: true,
            type: DataTypes.STRING,
            length: 50,
            allowNull: false
        },
        passhash: {
            type: DataTypes.STRING,
            length: 100,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            length: 50,
            unique: true,
            allowNull: false
        }
    };

    static createdKanbans() {
        return this.hasMany(Kanban);
    }

    static guestedKanbans() {
        return this.hasMany(Kanban);
    }

    static tasks() {
        return this.hasMany(Task);
    }
}

export class Kanban extends Model {
    static table = 'kanban';
    static timestamps = true;

    static fields = {
        idKanban: {
            primaryKey: true,
            type: DataTypes.STRING,
            allowNull: false
        },
        public: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    };

    static defaults = {
        public: false,
    };

    static creator() {
        return this.hasOne(User);
    }

    static tasks() {
        return this.hasMany(Task);
    }

    static guests() {
        return this.hasMany(User);
    }
}

export class Task extends Model {
    static table = 'task';
    static timestamps = true;

    static fields = {
        idTask: {
            primaryKey: true,
            type: DataTypes.STRING,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            length: 30,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            length: 200,
            allowNull: true
        },
        endDate: {
            type: DataTypes.DATETIME,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM,
            values: ['TODO', 'INPROGRESS', 'DONE'],
            allowNull: false
        },
    };

    static defaults = {
        status: "TODO"
    }

    static kanban() {
        return this.hasOne(Kanban)
    }

    static holders() {
        return this.hasMany(User);
    }
}

export const UserKanban = Relationships.manyToMany(User, Kanban);
export const UserTask = Relationships.manyToMany(User, Task);