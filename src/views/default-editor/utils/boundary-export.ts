import DownloadWorker from '@/worker/download-boundary-positions.worker?worker';
import { useCanvasState } from '@/store/modules/canvas-state';
import { useLocalState } from '@/store/modules/local-state';
import { getLocalApi } from '@/utils/env';
import { exportFile } from '@/utils/file';
import { message, notification } from 'ant-design-vue';
import { useEditorConfig } from '@/store/modules/editor-config';
import { useProgressEvent } from '@/components/controlled-progress';
import { canvasToFile } from '@/utils/file/image';

export function handleExportBoundary() {
  const configRef = useEditorConfig();
  const localState = useLocalState();
  const localApi = getLocalApi();
  const canvasState = useCanvasState();
  const [start, progress] = useProgressEvent();

  let iter = canvasState.getAreaMap.values();
  let areaNext = iter.next();

  start(canvasState.getAreaMap.size);

  while (!areaNext.done) {
    const name = areaNext.value.getName(),
      boundRect = areaNext.value.getBoundRect(),
      data = areaNext.value.getData();

    const worker = new DownloadWorker();
    worker.onmessage = async function (e) {
      const fileName = name + '.boundary.json';
      const retData = e.data;
      if (localApi) {
        const e = await localApi.saveLocalFile(
          fileName,
          JSON.stringify(retData),
          localState.getDownloadLocation,
        );
        // #[test]
        // let maskCanvas: HTMLCanvasElement | null = document.querySelector('#mask-canvas');
        // if (maskCanvas == null) return;
        // maskCanvas.style.display = 'block';
        // let ctx = maskCanvas.getContext('2d', {}) as CanvasRenderingContext2D;
        // ctx.fillStyle = 'red';
        // console.log(retData);
        // const formatPoints = retData.value.map((point) => ([
        //   Math.round(
        //     Number(configRef.getMapSize.ltX) +
        //       (point[0] + boundRect[0]) * Number(configRef.getSize.scale) +
        //       50,
        //   ),
        //   Math.round(
        //     Number(configRef.getMapSize.ltY) +
        //       (point[1] + boundRect[1]) * Number(configRef.getSize.scale) +
        //       50,
        //   ),
        // ]));
        // console.log('111', formatPoints);

        // retData.value.forEach((p) => {
        //   ctx.fillRect(Math.round(p[0]), Math.round(p[1]), 1, 1);
        // });
        // test end
        if (e) {
          message.error(`区域[${name}]导出失败！`);
          console.error(e);
          return;
        }
      } else {
        exportFile(fileName, retData);
      }
      progress();
      notification.success({
        message: '下载边框坐标',
        description: `区域[${name}]下载完成！`,
      });
      worker.terminate();
    };
    worker.onerror = function (event) {
      console.error(event);
      message.error('下载失败！');
      worker.terminate();
    };

    worker.postMessage([
      data,
      boundRect[0],
      boundRect[1],
      Number(configRef.getMapSize.ltX),
      Number(configRef.getMapSize.ltY),
      Number(configRef.getSize.scale),
      areaNext.value.type,
    ]);

    areaNext = iter.next();
  }

  const dataCanvas = document.createElement('canvas');
  const dataContext = dataCanvas.getContext('2d') as CanvasRenderingContext2D;
  dataCanvas.width = configRef.getSize.x;
  dataCanvas.height = configRef.getSize.y;
  canvasState.getAreaMap.forEach((area) => {
    dataContext.putImageData(area.getData(), area.getBoundRect()[0], area.getBoundRect()[1]);
  });
  canvasToFile(dataCanvas, 'image/jpeg', 0.5).then((blob) => {
    blob?.arrayBuffer().then((buffer) => {
      localApi?.saveLocalFile('2d_areas.png', buffer as Buffer, localState.getDownloadLocation);
    });
  });
}
