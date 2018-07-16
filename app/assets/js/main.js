let $ = require('jquery')
// import * as $ from 'jquery'
let doT = require(__dirname + '/vendor/doT.min.js')
// import * as doT from './vendor/doT.js'

let remote = require('electron').remote;

var fileSorter = new Worker('./workers/fileSorter.js');

let $labels = $('.radio-button-input[name="media-type"]')

$labels.change(function() {
    console.log(1)
})

function getElem(id) {
    return document.getElementById(id)
}

function tpl(id) {
    return doT.template(getElem('tpl-' + id).innerHTML)
}

const elems = {
    files: getElem('selected-files'),
    fileCatcher: getElem('drag-file'),

    tpl: {
        file: tpl('file')
    }
}

const fileCategories = {
    'image/jpeg': 'image',
    'video/quicktime': 'video',
    'video/mp4': 'video'
}

// https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
function calculateFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
}

function parseFile(file) {
    let category = fileCategories[file.type] || false
    if(!category)
        return false

    file.category = category;
    file.humaneSize = calculateFileSize(file.size)
    
    return file
}

elems.fileCatcher.ondragover = (e) => {
    elems.fileCatcher.classList.add('active')
    return false;
};

elems.fileCatcher.ondragleave = () => {
    elems.fileCatcher.classList.remove('active')
    return false;
};

elems.fileCatcher.ondragend = () => {
    return false;
};

elems.fileCatcher.ondrop = (e) => {
    e.preventDefault();

    // for (let f of e.dataTransfer.files) {
    //     console.log('File(s) you dragged here: ', f.path)
    // }

    let files = Array.from(e.dataTransfer.files)

    console.log(files)

    let results = {
        'video': {
            totalSize: 0,
            files: []
        },
        'image': {
            totalSize: 0,
            files: []
        },
        'audio': {
            totalSize: 0,
            files: []
        }
    }

    let i = 0;

    for(let file of files) {
        let meta = parseFile(file)
        if(meta) {
            results[meta.category].totalSize += meta.size
            results[meta.category].files.push(meta)
        }
    }

    fileSorter.addEventListener('message', function(e) {
        console.log(e.data);
      }, false);

    fileSorter.postMessage(files);

    console.log(results)

    // elems.files.innerHTML = results.join('')

    // let results = []

    // let i = 0;

    // for(let file of files) {
    //     results.push(elems.tpl.file({
    //         type: file.type,
    //         name: file.name,
    //         path: file.path,
    //         size: file.size,
    //         delay: Math.min(i * 15, 500)
    //     }))
    //     i++
    // }

    // elems.files.innerHTML = results.join('')
    

    // (async () => {
    //     let numLines = 0;
    //     for await (const batch of files) {
    //         for (const line of batch) {
    //             numLines += 1;
    //         }
    //     }
    //     console.log(`Read ${numLines} lines.`);
    // })().catch(e => {
    //     console.error(e);
    // })

    // elems.files.innerHTML += elems.tpl.file({
    //     type: file.type,
    //     name: file.name,
    //     path: file.path,
    //     size: file.size
    // })

    elems.fileCatcher.classList.remove('active')

    return false;
};

document.body.dataset.step = 'initial'

// remote.getCurrentWindow().setResizable(true)
// remote.getCurrentWindow().setMaximizable(true)

// remote.getCurrentWindow().setBounds({
//     x: 1621,
//     y: 611,
//     width: 10,
//     height: 1000
// });
// Prevent dragging of any file
document.addEventListener('dragover', function(event) {
    event.preventDefault();
    return false;
}, false);

document.addEventListener('drop', function(event) {
    event.preventDefault();
    return false;
}, false);