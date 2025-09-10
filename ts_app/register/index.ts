// 注册中心：功能名 => 类构造函数
type ScriptConstructor = new (
  params: Record<string, any>,
  timeout?: number,
) => any;

const scriptRegistry = new Map<string, ScriptConstructor>();

export function registerScript(name: string, ctor: ScriptConstructor) {
  scriptRegistry.set(name, ctor);
}

export function getScript(name: string): ScriptConstructor | undefined {
  return scriptRegistry.get(name);
}
