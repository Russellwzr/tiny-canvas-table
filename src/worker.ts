
import { Align, OffscreenCanvasTableWorker, ICanvasTableColumnConf } from './core/OffscreenCanvasTableWorker';


const col: ICanvasTableColumnConf[] = [
    {
        header: "ID",
        field: "__rownum__",
        width: 100,
        //align: Align.center
    },
    {
        header: "Country",
        field: "country",
        width: 200
    },
    {
        header: "Name",
        field: "name",
        width: 200
    },
    {
        header: "Subcountry",
        field: "subcountry",
        width: 200
    },
    {
        header: "Geonameid",
        field: "geonameid",
        width: 200
    },
];

const offscreenCanvasTableWorker = new OffscreenCanvasTableWorker(1, col);
offscreenCanvasTableWorker.setAllowEdit(true);

const httpRequest = new XMLHttpRequest();
httpRequest.onreadystatechange = function() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
        const data = JSON.parse(httpRequest.responseText);
        offscreenCanvasTableWorker.setData(data);
    }
};
httpRequest.open('GET', 'data.json', true);
httpRequest.send();

addEventListener('message', (message) => {
    if (message.data.canvasTableId !== undefined) {
        offscreenCanvasTableWorker.message(message.data);
        return;
    }
    postMessage('this is the response ' + message.data);
});
