interface UserConfig {
  exportLocation: string;
  downloadLocation: string;
  colorExportLocation: string;
  remoteURL: string;
  autoSaveTime: number;
  useLatestConfig: boolean;
  mapObj?: Recordable;
  sizeObj?: Recordable;
}

interface CustomSetting {
  openProjectInNewWindow: boolean;
  ctrlSSaveProject: boolean;
  closeCPUAcceleration: boolean;
}

type CustomSettingKey = keyof CustomSetting;
