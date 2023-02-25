# KanbanSynch

A simple Kanban app with login and posiblities to guest user in your kanban.

This is the server part make with [Deno](https://deno.land/), PostgreSQL for Database and GraphQL API.

The client part make with [Angular](https://angular.io/) is [Here](https://github.com/gatien-lamulle/KanbanSynch_Client)

## To run locally

You need to install deno on your computer, then :
```bash
git clone https://github.com/gatien-lamulle/KanbanSynch_server.git
cd KanbanSynch_server
deno run --allow-net --allow-read --allow-env server.ts
```

## Website Url
Hosted on Vercel : https://kanban-synch.vercel.app