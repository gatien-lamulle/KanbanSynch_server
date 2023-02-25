import "https://deno.land/std@0.177.0/dotenv/load.ts";
import { Application, Router, RouterContext } from 'https://deno.land/x/oak@v9.0.1/mod.ts';
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { applyGraphQL, gql, GQLError } from "https://deno.land/x/oak_graphql/mod.ts";
import { Database, PostgresConnector, Relationships } from "./denodb-local-fix/mod.ts";
import { User, Kanban, Task, UserKanban, UserTask } from './tables.ts';

const connector = new PostgresConnector({
  database: Deno.env.get("DATABASE_NAME") as string,
  host: Deno.env.get("DATABASE_HOST") as string,
  username: Deno.env.get("DATABASE_USERNAME") as string,
  password: Deno.env.get("DATABASE_PASSWORD") as string,
  port: Number(Deno.env.get("DATABASE_PORT") as string), // optional
});

const db = new Database(connector);
Relationships.belongsTo(Task, Kanban)
Relationships.belongsTo(Kanban, User)
db.link([User, Kanban, Task, UserTask, UserKanban]);
// await db.sync();
console.log(db);


const app = new Application();
const port = 8000;


const types = await Deno.readTextFile("schema.graphql");
import resolvers from './resolvers.ts';

const GraphQLService = await applyGraphQL<Router>({
  Router,
  typeDefs: types,
  resolvers: resolvers,
  context: (ctx: RouterContext,) => {
    return { token: ctx.request.headers.get('authorization') };
  }
})

app.use(oakCors());

app.use(GraphQLService.routes(), GraphQLService.allowedMethods());

app.addEventListener('listen', () => {
  console.log(`Listening on localhost:${port}`);
});

await app.listen({ port });
