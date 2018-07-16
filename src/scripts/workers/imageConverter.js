const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const sharp = require('sharp');
const path = require('path')

// function useImagemin(options) {
//     imagemin(options.input, options.output, {
//         plugins: [
//             imageminJpegtran(),
//             imageminPngquant({
//                 quality: '65-80'
//             })
//         ]
//     }).then(files => {
//         console.log(files);
//         //=> [{data: <Buffer 89 50 4e …>, path: 'build/images/foo.jpg'}, …]
//     });
// }

self.addEventListener('message', function(e) {
    var data = e.data;

    var i = 0;

    for (var image of data.input) {

        sharp(image.path)
            .resize(1920, 1080, {
                kernel: sharp.kernel.nearest
            })
            .max()
            .withoutEnlargement(true)
            // .toBuffer()
            .toFile(path.join(data.output, '/', image.name))
        // .then(info => {
        //     i++;
        //     self.postMessage({
        //         type: 'progress',
        //         count: i
        //     })
        // })
        // .catch(err => {
        //     self.postMessage({
        //         type: 'error',
        //         message: err
        //     })
        // });
    }
}, false);