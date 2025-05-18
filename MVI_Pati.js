// Mangrove Vegetation Index

Map.addLayer(AOI, {}, 'AOI');

var s2 = ee.ImageCollection('COPERNICUS/S2')
            .filterBounds(AOI)
            .filterDate('2024-01-01', '2024-12-31')
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
            .median(); // Create a median composite

function calculateMVI(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']); // NIR - Red / NIR + Red
  return ndvi.rename('MVI');
}

var mvi = calculateMVI(s2);

var mviVis = {
  min: 0.0,
  max: 1.0,
  palette: ['white', 'blue', 'green']
};

Map.centerObject(AOI, 12);
Map.addLayer(mvi.clip(AOI), mviVis, 'Mangrove Vegetation Index');

print('Mangrove Vegetation Index Image:', mvi);

// Export.image.toDrive({
//   image: mvi.clip(AOI),
//   description: 'MVI_Pati_2024',
//   scale: 10,
//   region: AOI.geometry(),
//   fileFormat: 'GeoTIFF'
// });
