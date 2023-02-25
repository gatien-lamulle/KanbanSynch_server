// deno-lint-ignore-file no-explicit-any
import * as date from 'https://deno.land/std@0.93.0/datetime/mod.ts';
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";
import * as jwt from "https://deno.land/x/djwt@v2.3/mod.ts"

import { User, Kanban, Task, UserKanban, UserTask } from './tables.ts';


const JWT_SECRET = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-512" },
    true,
    ["sign", "verify"],
  );

const verifyJwt = async (token: string) => {
    try {
        const payload = await jwt.verify(token, JWT_SECRET);
        console.log("paysload",payload);
        
        if (!payload || !payload.username) return null;
        return payload;
    } catch(e) {
        console.error("error",e);
        return null;
    }
}

export default {
    Query: {
        token: async (_: any, _data: any , context: any) => {
            const token: string = context.token.replace('Bearer', '').trim();
            console.log(token);
            
            const user = await verifyJwt(token);
            console.log(user);
            
            if (!user) {
                console.log('no exist');
                
                return {exist: false, error: "Token no recognise"};
            }
            console.log(' exist');

            return {exist: true, ...user};
        },

        username: async (_: any, { username }: any, context: any) => {
            console.log('ici');
            const token: string = context.token.replace('Bearer', '').trim();
            if (!await verifyJwt(token)) {
                return null;
            }
            console.log(username);
            let usernames: any[] = [];
            if (username) {
                usernames = await User.where('username', 'like' , username + '%').all();
            }
            return usernames.map(e => e.username);
        },

        user: async (_: any, { username, email, kanban }: any, context: any) => {
            const token: string = context.token.replace('Bearer', '').trim();
            if (!await verifyJwt(token)) {
                return null;
            }
            let user = undefined;
            if (username) {
                user = await User.find(username);
            } else if (email) {
                user = await User.where('email', email).first();
            } else if (kanban && kanban.id) {
                const kanbanUser = await Kanban.where('idKanban', kanban.id);
                user = await kanbanUser.first() ? kanbanUser.creator() : null;
            }
            return user;
        },
        users: async (_: any, { kanban }: any, context: any) => {
            const token: string = context.token.replace('Bearer', '').trim();
            if (!await verifyJwt(token)) {
                return null;
            }
            let users = undefined;
            if (kanban && kanban.id) {
                const kanbanUser = await Kanban.where('idKanban', kanban.id);
                users = await kanbanUser.first() ? kanbanUser.guests() : [];
            }
            return users;
        },
        checkKanban: async (_: any, { id }: any, context: any) => {
            let kanban = undefined;
            if (id) {
                kanban = await Kanban.find(id);
            }
            return (kanban !== undefined);
        },
        kanban: async (_: any, { id, task }: any, context: any) => {
            let kanban = undefined;
            if (id) {
                kanban = await Kanban.find(id);
                if (!kanban) {
                    return null;
                }
                console.log("Kanban",kanban);
                (kanban as any).creator =  kanban.userId ? {username: kanban.userId} : null;
                const tasks = await Task.where('kanbanId', id).get();
                const guests = await UserKanban.where('kanbanId', id).get();
                (kanban as any).tasks = tasks;
                (kanban as any).guests = (guests as any).map((e: any) => {e.username = e.userId; return e;});
            } else if (task && task.id) {
                const taskKanban = await Task.where('idTask', task.id);
                kanban = await taskKanban.first() ? taskKanban.kanban() : null;
            }
            console.log("Kanban ret",kanban);
            return kanban;
        },
        kanbans: async (_: any, { creator, guest }: any, context: any) => {
            const token: string = context.token.replace('Bearer', '').trim();
            if (!await verifyJwt(token)) {
                return null;
            }
            
            // ADD creator === jwt.username ??? 
            let kanbans = undefined;
            console.log("creator", creator, guest);
            
            if (creator && creator.username) {
                // const creatorKanban = await User.where("username", creator.username);
                // kanbans = await creatorKanban.first() ? creatorKanban.createdKanbans() : [];
                kanbans = await Kanban.where('userId', creator.username).get() as any[];
                console.log('kanabans',kanbans);
                
                // kanbans = kanbansIds ? kanbansIds.map(async (e: any) => {
                //     const kanban = await Kanban.find(e.kanbanId);
                //     console.log(kanban);
                //     return {idKanban: e.kanbanId, name: kanban.name, creator: {username: kanban.userId}}
                // }) : [];
            } else if (guest && guest.username) {
                const kanbansIds: any[] = await UserKanban.where('userId', guest.username).get() as any[];
                kanbans = kanbansIds ? kanbansIds.map(async (e: any) => {
                    const kanban = await Kanban.find(e.kanbanId);
                    console.log(kanban);
                    return {idKanban: e.kanbanId, name: kanban.name, creator: {username: kanban.userId}}
                }) : [];
            }
            return kanbans;
        },
        task: async (_: any, { id, title }: any, context: any) => {
            let task = undefined;
            if (id) {
                task = await Task.find(id);
            } else if (title) {
                task = await Task.where('title', title).first();
            }
            return task;
        },
        tasks: async (_: any, { holder, status, kanban }: any, context: any) => {
            let tasks = undefined;
            if (holder && holder.username) {
                const holderTask = await User.where('username', holder.username);
                tasks = await holderTask.first() ? holderTask.tasks() : [];
            } else if (status && kanban) {
                tasks = await Task.where('kanbanId', kanban).where('status', status).get();
                tasks = (tasks as Array<Task>).map(async (e: Task) => {
                    const holders : any | any[] = await UserTask.where('taskId', (e as any).idTask).get();
                    console.log(holders, status, (e as any).idTask);
                    (e as any).holder = holders.map((h: any) => {h.username = h.userId; return h;});
                    return e;
                });
            } else if (status) {
                tasks = await Task.where('status', status).all();
                tasks = (tasks as Array<Task>).map(async (e: Task) => {
                    const holders: any | any[] = await UserTask.where('taskId', (e as any).id).get();
                    (e as any).holder = holders.map((h: any) => {h.username = h.userId; return h;});
                    return e;
                });
            } else if (kanban) {
                tasks = await Task.where('kanbanId', kanban).get();
                tasks = (tasks as Array<Task>).map(async (e: Task) => {
                    const holders: any | any[] = await UserTask.where('taskId', (e as any).id).get();
                    (e as any).holder = holders.map((h: any) => {h.username = h.userId; return h;});
                    return e;
                });
                // tasks = await kanbanTask.first() ? kanbanTask.tasks() : [];
            }
            console.log(status, 'tasks : ', tasks);
            return tasks;
        }
    },
    Mutation: {
        addKanban: async (_: any, {id, isPublic, creatorId, name}: any, context: any) => {
            const kanban = await Kanban.create({
                idKanban: id,
                public: isPublic,
                userId: creatorId,
                name
            });
            console.log(kanban);
            console.log(kanban.public);
            // return {idKanban: kanban.idKanban, public: kanban.public, creator: kanban.userId};
            return kanban;
        },
        removeKanban: async (_: any, {id}: any, context: any) => {
            // await UserKanban.where('kanbanId', id).delete();
            const kanban = await Kanban.deleteById(id);
            return kanban;
        },
        addTask: async (_: any, {id, title, description, endDate, holders, status, kanbanId}: any, context: any) => {
            console.log(id, title, description, endDate, status, kanbanId);
            let task = undefined;
            if (await Task.find(id)) {
                task = await Task.where('idTask', id).update({ title, description, endDate: endDate ? date.parse(endDate, 'dd/MM/yyyy HH:mm') : null });
                holders.forEach(async (e: any) => {
                    const t = await UserTask.where('taskId', id).where('userId', e.username).get();
                    if (!t || t.length === 0) {
                        await UserTask.create({id: Math.floor(Math.random() * (2147483648 - 1)), userId: e.username, taskId: id});
                    }
                });
                let tasks: Array<any> | any = [];
                tasks = await UserTask.where('taskId', id).get();
                tasks.forEach((e: any) => {
                    console.log('for', e, holders);
                    if (!holders.some((h: any) => h.username === e.userId)) {
                        e.delete();
                    }
                });
                (task as any).idTask = id;
            } else {
                task = await Task.create({
                    idTask: id,
                    title,
                    description,
                    endDate: endDate ? date.parse(endDate, 'dd/MM/yyyy HH:mm') : null,
                    status,
                    kanbanId
                });
                holders.forEach(async (e: any) => {
                    await UserTask.create({id: Math.floor(Math.random() * (2147483648 - 1)), userId: e.username, taskId: id});
                });
            }
            return task;
        },
        removeTask: async (_: any, {id}: any, context: any) => {
            const task = await Task.deleteById(id);
            (task as any).idTask = id;
            return task;
        },
        setCreator: async (_: any, {kanbanId}: any, context: any) => {
            const token: string = context.token.replace('Bearer', '').trim();
            const info: any = await verifyJwt(token);
            if (!info) {
                return null;
            }
            const kanban = await Kanban.where('idKanban', kanbanId).update('userId', info.username);
            return kanban;
        },
        setName: async (_: any, {kanbanId, name}: any, context: any) => {
            // const token: string = context.token.replace('Bearer', '').trim();
            // const info: any = await verifyJwt(token);
            // if (!info) {
            //     return null;
            // }
            console.log(kanbanId, name);
            
            const kanban = await Kanban.where('idKanban', kanbanId).update('name', name);
            return kanban;
        },
        setPublic: async (_: any, {kanbanId, isPublic}: any, context: any) => {
            const token: string = context.token.replace('Bearer', '').trim();
            if (!await verifyJwt(token)) {
                return null;
            }
            await Kanban.where('idKanban', kanbanId).update('public', isPublic);
            const kanban = await Kanban.find(kanbanId);
            console.log('isPublic', kanban);
            
            return kanban;
        },
        setStatus: async (_: any, {taskId, status}: any, context: any) => {
            const task = await Task.where('idTask', taskId).update('status', status);
            console.log(task);
            
            return (task as any)[0];
        },
        addGuest: async (_: any, {kanbanId, userId}: any, context: any) => {
            const token: string = context.token.replace('Bearer', '').trim();
            if (!await verifyJwt(token)) {
                return null;
            }
            await UserKanban.create({
                kanbanId,
                userId
            });
            return await User.find(userId);
        },
        removeGuest: async (_: any, {kanbanId, userId}: any, context: any) => {
            const token: string = context.token.replace('Bearer', '').trim();
            if (!await verifyJwt(token)) {
                return null;
            }
            let tasks: Array<any> | any = [];
            tasks = await Task.where("kanbanId", kanbanId).get();
            for (let task of tasks) {
                await UserTask.where({taskId: task.idTask, userId}).delete();
            }
            await UserKanban.where({ kanbanId, userId }).delete();
            return await User.find(userId);
        },
        addHolder: async (_: any, {taskId, userId}: any, context: any) => {
            const token: string = context.token.replace('Bearer', '').trim();
            if (!await verifyJwt(token)) {
                return null;
            }
            await UserTask.create({
                taskId,
                userId
            });
            return await User.find(userId);
        },
        removeHolder: async (_: any, {taskId, userId}: any, context: any) => {
            const token: string = context.token.replace('Bearer', '').trim();
            if (!await verifyJwt(token)) {
                return null;
            }
            await UserTask.where({ taskId, userId }).delete();
            return await User.find(userId);
        },
        signup: async (_: any, {username, email, password}: any, context: any) => {
            const passhash = await bcrypt.hash(password);
            const user = await User.create({
                username,
                email,
                passhash
            });
            if (user) {
                return await jwt.create({ alg: "HS512", typ: "JWT" }, { username, exp: jwt.getNumericDate(60 * 60 * 24)}, JWT_SECRET);
            }
            return "Error during creating user";
        },
        login: async (_: any, {username, password}: any, context: any) => {
            console.log("login");
            const userPasshash = await User.select('passhash').find(username);
            if (userPasshash) {
                console.log(userPasshash.passhash, password);
                const result = await bcrypt.compare(password, userPasshash.passhash as string);
                console.log("apres");
                
                if (result) {
                    const kanban: any | any[] = await Kanban.where('user_id', username).get();
                    console.log("Login...", kanban);
                    // console.log(kanban[0].idKanban);
                    const kanbans: [any] = kanban.map((e: any) => e.idKanban)
                    const token = await jwt.create({ alg: "HS512", typ: "JWT" }, { username, exp: jwt.getNumericDate(60 * 60 * 24)}, JWT_SECRET);
                    return JSON.stringify({token, kanban: kanbans});
                }
            }
            return JSON.stringify({err: "Wrong username / password combination."});
        },
        logout: async (_: any, {username}: any, context: any) => {
            // ADD JWT VERIF and remove username arg
            // PEUT ETRE SEULEMNT COTE CLIENT ???
        },
        changeEmail: async (_: any, {email}: any, context: any) => {
            const token: string = context.token.replace('Bearer', '').trim();
            const user = await verifyJwt(token);
            if (!user) {
                return "Error, token no recognise";
            }
            console.log(user.username, email);
            try {
                let updatedUser = await User.where('username', user.username as string).update('email', email);
                return "Email successly updated"
            } catch(e) {
                return e.message;
            }

            

        },

        changePassword: async (_: any, {oldPassword, newPassword}: any, context: any) => {
            const token: string = context.token.replace('Bearer', '').trim();
            const user = await verifyJwt(token);
            if (!user) {
                return "Token no recognise";
            }
            console.log(user);
            const username: string = user.username as string;
            try {
                const userPasshash = await User.select('passhash').find(username);      
                if (!userPasshash) return "Error, bad current password";
                const result = await bcrypt.compare(oldPassword, userPasshash.passhash as string);
                if (!result) return "Error, bad current password";
                let password = await bcrypt.hash(newPassword);
                let updatedUser = await User.where('username', user.username as string).update('passhash', password);
                return "Password successly updated"
            } catch(e) {
                return e.message;
            }

        }


    }
}