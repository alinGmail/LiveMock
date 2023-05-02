import { Updater } from "use-immer";

export function register<T>(name: keyof T, updater: Updater<T>,model:T) {
    return{
        onChange:(value:string)=>{
            updater(draft => {
                // @ts-ignore
                draft[name] = value as T[keyof T];
            })
        },
        value:model[name]
    }
}
