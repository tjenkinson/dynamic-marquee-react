export function IdGenerator() {
  const ids = new Set();
  return {
    generate() {
      const base = `${performance.now()}`;
      let id = base;
      for (let i = 0; ids.has(id); i++) {
        id = `${base}:${i}`;
      }
      ids.add(id);
      return id;
    },
    release(id: string) {
      ids.delete(id);
    },
  };
}
