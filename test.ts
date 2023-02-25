import { Model, DataTypes, Relationships, Database, PostgresConnector } from "https://deno.land/x/denodb/mod.ts"

const connector = new PostgresConnector({
  database: 'kanbansynch',
  host: 'localhost',
  username: 'gatienlamulle',
  password: '',
  port: 5432, // optional
});

const db = new Database(connector);

class Owner extends Model {
  static table = 'owners';

  static fields = {
    idOwner: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: DataTypes.STRING,
  };

  static businesses() {
    return this.hasMany(Business);
  }
}

class Business extends Model {
  static table = 'businesses';

  static fields = {
    idBuisness: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: DataTypes.STRING,
  };

  static owner() {
    return this.hasOne(Owner);
  }
}

Relationships.belongsTo(Business, Owner);

db.link([Owner, Business]);

// await db.sync({drop: true});

// await Owner.create({
//   idOwner: "3423255042138112",
//   name: 'John',
// });

// await Business.create({
//   idBuisness: "3423255042138222",
//   name: 'Parisian Café',
//   ownerId: "3423255042138112",
// });

// await Business.create({
//   idBuisness: "3423255042138444",
//   name: 'Something About Us',
//   ownerId: "3423255042138112",
// });

const a = await Owner.where('idOwner', "3423255042138112").businesses();
const b = await Business.where('idBuisness', "3423255042138444").owner();
// const c = await Business.where('idBuisness', 3423255042138444).owner();

console.log(a);
console.log(b);
// console.log(c);

await db.close();
