import { OffscreenCanvasTable } from "./core/OffscreenCanvasTable";
import './style.css'

const worker = new Worker('./worker.js');
const canvasTable = new OffscreenCanvasTable(1, worker, "canvas");
