import { dataURLtoUint8 } from "../util";

class PngQuantClass {
  private worker?: Worker;
  state = "initial";
  prepare(callback: () => void) {
    this.worker = new Worker("./worker/worker.js");
    const preparedListener = (event: MessageEvent) => {
      console.log("prepare", event);
      if (event.data.type === "ready") {
        this.state = "ready";
        callback();
        this.worker?.removeEventListener("message", preparedListener);
      }
    };
    this.worker.addEventListener("message", preparedListener);
  }
  toByte(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      var dataUrlReader = new FileReader();
      dataUrlReader.onload = function (e: any) {
        resolve(dataURLtoUint8(e.target.result));
      };
      dataUrlReader.readAsDataURL(file);
    });
  }
  compress(
    inputImageData: Uint8Array
  ): Promise<{ data: Uint8Array; time: number }> {
    return new Promise((resolve, reject) => {
      const id = this.uuidv4();
      const compressListener = (event: MessageEvent) => {
        console.log("compress", event.data);
        if (event.data.type === "done") {
          console.log(event.data.data[0].data);
          resolve({ data: event.data.data[0].data, time: event.data.time });
          this.worker?.removeEventListener("message", compressListener);
        }
      };
      this.worker?.addEventListener("message", compressListener);
      this.worker?.postMessage({
        type: "command",
        id,
        arguments: {
          quality: "85-100",
          speed: "1",
        },
        file: {
          name: "input.png",
          data: inputImageData,
        },
      });
    });
  }
  private uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
      c
    ) {
      var r = (Math.random() * 16) | 0,
        v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
export const PngQuant = new PngQuantClass();
