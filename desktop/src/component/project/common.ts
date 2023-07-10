import { Updater } from "use-immer";
import { ChangeEvent, ChangeEventHandler } from "react";
import { Draft } from "@reduxjs/toolkit";

type StringProperties<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
};

type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

type NumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

export function register<T>(
  model: T,
  name: StringKeys<T>,
  updater: Updater<T>
) {
  return {
    onChange: (event: ChangeEvent<{ value: string }>) => {
      updater((draft: Draft<T>) => {
        // @ts-ignore;
        draft[name] = event.target.value;
      });
    },
    value: model[name],
  };
}

export function registerNumber<T>(
  model: T,
  name: StringKeys<T>,
  updater: Updater<T>
) {
  return {
    onChange: (value: (number | string) | null) => {
      updater((draft: Draft<T>) => {
        if (typeof value === "string") {
          // @ts-ignore
          draft[name] = parseInt(value);
        } else if (typeof value === "number") {
          // @ts-ignore
          draft[name] = value;
        }
      });
    },
    value: model[name],
  };
}
