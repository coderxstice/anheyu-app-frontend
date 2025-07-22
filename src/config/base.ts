let config: Record<string, any> = {};

export const setConfig = (cfg?: object): void => {
  config = Object.assign(config, cfg);
};

export const getConfig = (key?: string): any => {
  if (typeof key === "string") {
    const arr = key.split(".");
    if (arr && arr.length) {
      let data: any = config;
      arr.forEach(v => {
        if (data && typeof data[v] !== "undefined") {
          data = data[v];
        } else {
          data = null;
        }
      });
      return data;
    }
  }
  return config;
};

export const responsiveStorageNameSpace = (): string => {
  return getConfig()?.ResponsiveStorageNameSpace ?? "responsive-";
};
