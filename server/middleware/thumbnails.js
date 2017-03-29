const sharp = require('sharp');

const sizeMap = {
  sm: [150, 150],
  md: [350, 350],
  lg: [500, 500],
  xl: [1200, 1200]
};

const cropMap = {
  fit: (pipeline, size) =>
    pipeline
      .resize(size[0], size[1])
      .ignoreAspectRatio(false),
  fill: (pipeline, size) =>
    pipeline
      .resize(size[0], size[1])
      .max(),
  growx: (pipeline, size) =>
    pipeline
      .resize(null, size[1]),
  growy: (pipeline, size) =>
    pipeline
      .resize(size[0], null)
};

function generate(image_stream, size, cropping, cb) {
  if (!sizeMap[size] || !cropMap[cropping]) {
    cb(400, 'invalid parameters');
    return;
  }

  // Load image stream
  // I think making it apply the jpeg pipe here is more performant
  // Jpeg only has 3 channels so it should speed up operations?
  const pipeline = sharp(image_stream).jpeg();

  // Apply resizing & output to a stream
  cropMap[cropping](pipeline, sizeMap[size])
    .toBuffer((err, buffer, info) => {
      if (err) cb(500, err);
      else cb(err, buffer, info);
    });
}

module.exports = { generate, sizeMap, cropMap };
