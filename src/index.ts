import { OffscreenCanvasTable } from "./OffscreenCanvasTable";
import './style.css'

const worker = new Worker('./worker.js');
const canvasTable = new OffscreenCanvasTable(1, worker, "canvas");

worker.addEventListener('message', message => { console.log(message); });

worker.postMessage('this is a test message to the worker');

(window as any).canvasTable = canvasTable;
