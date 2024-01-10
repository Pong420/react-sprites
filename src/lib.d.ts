declare global {
  interface NodeRequire {
    (url: `${string}?sprites`): SpriteModule;
  }
}

declare module '*?sprites' {
  const module: SpriteModule;
  export default module;
}
