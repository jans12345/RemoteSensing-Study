var kebumen = ee.FeatureCollection("projects/januarw33/assets/Kec_Kbm");
Map.centerObject(kebumen, 9);
Map.addLayer(kebumen, {}, 'Kecamatan Kebumen');

function safeCalculateVHI(year) {
  var start = ee.Date.fromYMD(year, 1, 1);
  var end = ee.Date.fromYMD(year, 12, 31);

  var ndviCol = ee.ImageCollection("MODIS/006/MOD13Q1")
    .filterDate(start, end)
    .filterBounds(kebumen)
    .select("NDVI")
    .map(function(img) {
      return img.updateMask(img.neq(-3000))
                .multiply(0.0001)
                .copyProperties(img, img.propertyNames());
    });

  var ndviCount = ndviCol.size();
  print('Jumlah citra NDVI untuk ' + year, ndviCount);

  var ndviMean = ee.Image(ee.Algorithms.If(
    ndviCount.gt(0), ndviCol.mean(), ee.Image.constant(0).rename("NDVI")
  ));

  var ndviMin = ee.Image(ee.Algorithms.If(
    ndviCount.gt(0), ndviCol.reduce(ee.Reducer.min()), ee.Image.constant(0).rename("NDVI")
  ));

  var ndviMax = ee.Image(ee.Algorithms.If(
    ndviCount.gt(0), ndviCol.reduce(ee.Reducer.max()), ee.Image.constant(1).rename("NDVI")
  ));

  var vci = ndviMean.subtract(ndviMin).divide(ndviMax.subtract(ndviMin)).rename("VCI");

  var lstCol = ee.ImageCollection("MODIS/006/MOD11A2")
    .filterDate(start, end)
    .filterBounds(kebumen)
    .select("LST_Day_1km")
    .map(function(img) {
      return img.updateMask(img.neq(0))
                .multiply(0.02).subtract(273.15)
                .copyProperties(img, img.propertyNames());
    });

  var lstCount = lstCol.size();
  print('Jumlah citra LST untuk ' + year, lstCount);

  var lstMean = ee.Image(ee.Algorithms.If(
    lstCount.gt(0), lstCol.mean(), ee.Image.constant(0).rename("LST")
  ));

  var lstMin = ee.Image(ee.Algorithms.If(
    lstCount.gt(0), lstCol.reduce(ee.Reducer.min()), ee.Image.constant(0).rename("LST")
  ));

  var lstMax = ee.Image(ee.Algorithms.If(
    lstCount.gt(0), lstCol.reduce(ee.Reducer.max()), ee.Image.constant(1).rename("LST")
  ));

  var tci = lstMax.subtract(lstMean).divide(lstMax.subtract(lstMin)).rename("TCI");

  // VHI
  var vhi = vci.multiply(0.5).add(tci.multiply(0.5)).rename("VHI");
  return vhi.clip(kebumen);
}

// AGREGASI KECAMATAN
function getZonalVHI(vhiImage, year) {
  return vhiImage.reduceRegions({
    collection: kebumen,
    reducer: ee.Reducer.mean(),
    scale: 1000
  }).map(function(f) {
    return f.set({
      'kecamatan': f.get('WADMKC'),
      'mean_vhi': f.get('mean'),
      'year': year
    });
  });
}

//LOOP UNTUK TAHUN 5 TAHUNAN
var years = [2014, 2019, 2024];
var allZonal = ee.FeatureCollection([]);

years.forEach(function(year) {
  var vhi = safeCalculateVHI(year);
  var zonal = getZonalVHI(vhi, year);
  allZonal = allZonal.merge(zonal);

// Tambahkan layer peta
  Map.addLayer(vhi, {
    min: 0,
    max: 1,
    palette: ['800000', 'FF0000', 'FFA500', 'FFFF00', '00FF00']
  }, 'VHI ' + year);
});

// CHART PERBANDINGAN
var chart = ui.Chart.feature.groups({
  features: allZonal,
  xProperty: 'kecamatan',
  yProperty: 'mean_vhi',
  seriesProperty: 'year'
}).setChartType('ColumnChart')
  .setOptions({
    title: 'Perbandingan Rata-rata VHI per Kecamatan (2014, 2019, 2024)',
    hAxis: {title: 'Kecamatan', slantedText: true, slantedTextAngle: 45},
    vAxis: {title: 'Rata-rata VHI'},
    bar: {groupWidth: '80%'},
    colors: ['#1f77b4', '#ff7f0e', '#2ca02c']
  });

print(chart);

// EKSPOR KE CSV 
Export.table.toDrive({
  collection: allZonal,
  description: 'Zonal_VHI_2014_2019_2024',
  fileFormat: 'CSV'
});
