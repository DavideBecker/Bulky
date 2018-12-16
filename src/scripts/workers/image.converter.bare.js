const sharp = require( 'sharp' );
const path = require( 'path' )

module.exports = function(outputFolder, images, progressCallback) {
  for ( var image of images ) {
    sharp( image.path )
      .resize( 1920, 1080, {
        kernel: 'lanczos3',
        fit: 'inside',
        withoutEnlargement: true
      } )
      .rotate()
      .toFile( path.join( outputFolder, '/', image.name ) )
      .then( info => {
        progressCallback()
      } )
      .catch( err => {
        console.error( 'Image converter error!' )
        console.error( err )
      } );
  }
}