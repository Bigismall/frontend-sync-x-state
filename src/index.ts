import { assign, createMachine, interpret } from "xstate";
import "./styles.css";
// @ts-ignore
import placeholder from "./img/start-using-x-state.png";

interface ToggleContext {
  isLoading: boolean;
  uri: string;
  allowFetch: boolean;
}

type ToggleEvent =
  | { type: "FETCH_START" }
  | { type: "TOGGLE" }
  | { type: "FETCH_END"; data: { image: string } };

const States = {
  enabled: "enabled",
  disabled: "disabled",
  loading: "loading",
} as const;

const machine = createMachine<ToggleContext, ToggleEvent>({
  id: "machine",
  initial: States.disabled,
  context: {
    uri: placeholder,
    isLoading: false,
    allowFetch: false,
  },
  states: {
    [States.enabled]: {
      on: {
        FETCH_START: {
          actions: assign((context) => ({
            ...context,
            isLoading: true,
            uri: "",
          })),
          target: States.loading,
        },
        TOGGLE: {
          actions: assign((context) => ({
            ...context,
            allowFetch: !context.allowFetch,
          })),
          target: States.disabled,
        },
      },
    },
    [States.disabled]: {
      on: {
        TOGGLE: {
          actions: assign((context) => ({
            ...context,
            allowFetch: !context.allowFetch,
          })),
          target: States.enabled,
        },
      },
    },
    [States.loading]: {
      on: {
        FETCH_END: {
          actions: assign((context, event) => ({
            ...context,
            isLoading: false,
            uri: event?.data?.image ?? '',    //IT's just for visualiser to work
          })),
          target: States.enabled,
        },
      },
    },
  },
});

window.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://rickandmortyapi.com/api/character/";

  //DOM elements handlers
  const $imageSrc = document.querySelector<HTMLImageElement>(".js-image");
  const $guard = document.querySelector<HTMLInputElement>(".js-guard");
  const $button = document.querySelector<HTMLButtonElement>(".js-button");

  // just for logging the state and update the DOM  (no React here)
  const dumpImageService = interpret(machine)
    .onTransition((state) => {
      console.log("Machine: ", state.value, state.context);

      $button!.disabled = !state.context.allowFetch;
      $imageSrc!.src = state.context.uri;
    })
    .start(); // remember to start the service!

  // Reflect machine context to DOM elements  (no React here)
  $guard!.checked = dumpImageService.machine.context.allowFetch;
  $button!.disabled = !dumpImageService.machine.context.allowFetch;

  // Apply click events
  $guard!.addEventListener("change", () => {
    dumpImageService.send("TOGGLE");
  });

  $button!.addEventListener("click", async () => {
    dumpImageService.send("FETCH_START");
    const result = await fetch(API_URL + Math.round(Math.random() * 50));
    const response = await result.json();
    dumpImageService.send("FETCH_END", { data: { image: response.image } });
  });
});
