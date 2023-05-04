import { LocalApi } from '../env';

class ElectronApi implements LocalApi {
  getLocalHistoryList(): Promise<Recordable<any>[]> {
    return window['electronAPI'].getLocalHistoryList();
  }
  getLocalFileContent(fileName: string): Promise<string> {
    return window['electronAPI'].getLocalFileContent(fileName);
  }
  renameLocalFile(fileName: string, newname: string): Promise<LocalResult<null>> {
    return window['electronAPI'].renameLocalFile(fileName, newname);
  }
  deleteLocalFile(fileName: string): Promise<unknown> {
    return window['electronAPI'].deleteLocalFile(fileName);
  }
  saveLocalFile(fileName: string, data: string): Promise<unknown> {
    return window['electronAPI'].saveLocalFile(fileName, data);
  }
}

const electronApi = new ElectronApi();

export default electronApi;
