import { registerScript } from "./index";

export function Register(name: string) {
  return function (
    target: new (params: Record<string, any>, timeout: number) => any,
  ) {
    registerScript(name, target);
  };
}
