var $ = require('jquery')
// import * as $ from 'jquery'
var doT = require(__dirname + '/vendor/doT.js')
// import * as doT from './vendor/doT.js'

let remote = require('electron').remote;

var $labels = $('.radio-button-input[name="media-type"]')

$labels.change(function() {
    console.log(1)
})

function getElem(id) {
    return document.getElementById(id)
}

function tpl(id) {
    return doT.template(getElem('tpl-' + id).innerHTML)
}

let elems = {
    files: getElem('selected-files'),
    fileCatcher: getElem('drag-file'),

    tpl: {
        file: tpl('file')
    }
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

    var files = Array.from(e.dataTransfer.files)

    var results = []

    var i = 0;

    for(var file of files) {
        results.push(elems.tpl.file({
            type: file.type,
            name: file.name,
            path: file.path,
            size: file.size,
            delay: Math.min(i * 15, 500)
        }))
        i++
    }

    elems.files.innerHTML = results.join('')
    

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
    document.body.dataset.step = 'file-list'

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