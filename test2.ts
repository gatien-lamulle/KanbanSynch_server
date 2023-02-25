import { Model, DataTypes, Relationships, Database, PostgresConnector } from "https://deno.land/x/denodb/mod.ts"
import * as date from 'https://deno.land/std@0.93.0/datetime/mod.ts';

const connector = new PostgresConnector({
  database: 'gatienlamulle',
  host: 'localhost',
  username: 'gatienlamulle',
  password: '',
  port: 5432, // optional
});

const db = new Database(connector);

class User extends Model {
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

class Kanban extends Model {
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

class Task extends Model {
  static table = 'task';
  static timestamps = true;

  static fields = {
      idTask: {
          primaryKey: true,
          type: DataTypes.STRING,
          allowNull: false
      },
      title: {
          type: DataTypes.STRING,
          length: 30,
          allowNull: false,
          unique: true
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


Relationships.belongsTo(Task, Kanban)
Relationships.belongsTo(Kanban, User)

const UserKanban = Relationships.manyToMany(Kanban, User);
const UserTask = Relationships.manyToMany(Task, User);

db.link([ UserKanban, UserTask, User, Kanban, Task]);
// db.link([User, Kanban, Task]);

await db.sync({drop: true});

await Kanban.create({
  idKanban: "3423255042138112",
  public: false,
  userId: null
});

await Task.create({
  idTask: "3423255042138222",
  title: "test", description: "test", endDate: date.parse("18/01/2022 19:23", 'dd/MM/yyyy HH:mm'), status: "TODO", 
  kanbanId: "3423255042138112",
});

await Task.create({
  idTask: "3423255042134222",
  title: "test2", description: "test2", endDate: date.parse("18/01/2022 19:23", 'dd/MM/yyyy HH:mm'), status: "TODO", 
  kanbanId: "3423255042138112",
});


const a = await Kanban.where('idKanban', "3423255042138112").tasks();
const b = await Task.where('idTask', "3423255042138222").kanban();
const c = await Task.where('idTask', "3423255042134222").kanban();

console.log(a);
console.log(b);
console.log(c);

await db.close();
