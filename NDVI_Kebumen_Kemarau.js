var kecamatan = ee.FeatureCollection("projects/januarw33/assets/Kec_Kbm");

function maskS2clouds(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3) // shadow
                .and(scl.neq(8)) // cloud
                .and(scl.neq(9)) // cirrus
                .and(scl.neq(11)); // snow
  return image.updateMask(mask);
}

function getNDVI(start, end) {
  var s2 = ee.ImageCollection('COPERNICUS/S2_SR')
              .filterDate(start, end)
              .filterBounds(kecamatan)
              .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
              .select(['B4', 'B8', 'SCL']) // hanya pilih band yang dibutuhkan
              .map(maskS2clouds)
              .median(); // setelah semua band homogen, baru median
  return s2.normalizedDifference(['B8', 'B4']).rename('NDVI');
}

// MUSIM KEMARAU PER TAHUN 
var ndviKemarau2020 = getNDVI('2020-04-01', '2020-09-30').rename('NDVI_2020');
var ndviKemarau2021 = getNDVI('2021-04-01', '2021-09-30').rename('NDVI_2021');
var ndviKemarau2022 = getNDVI('2022-04-01', '2022-09-30').rename('NDVI_2022');
var ndviKemarau2023 = getNDVI('2023-04-01', '2023-09-30').rename('NDVI_2023');
var ndviKemarau2024 = getNDVI('2024-04-01', '2024-09-30').rename('NDVI_2024');

// RATA-RATA NDVI PER KECAMATAN
function hitungRata(image, label) {
  return image.reduceRegions({
    collection: kecamatan,
    reducer: ee.Reducer.mean(),
    scale: 10
  }).map(function(f) {
    return f.set('musim', label);
  });
}

var rata2020 = hitungRata(ndviKemarau2020, 'KEMARAU_2020');
var rata2021 = hitungRata(ndviKemarau2021, 'KEMARAU_2021');
var rata2022 = hitungRata(ndviKemarau2022, 'KEMARAU_2022');
var rata2023 = hitungRata(ndviKemarau2023, 'KEMARAU_2023');
var rata2024 = hitungRata(ndviKemarau2024, 'KEMARAU_2024');

var semuaData = rata2020.merge(rata2021)
                        .merge(rata2022)
                        .merge(rata2023)
                        .merge(rata2024);

Map.centerObject(kecamatan, 10);
Map.addLayer(ndviKemarau2020.clip(kecamatan), {min: 0, max: 1, palette: ['brown', 'yellow', 'green']}, 'NDVI Kemarau 2020');
Map.addLayer(ndviKemarau2021.clip(kecamatan), {min: 0, max: 1, palette: ['brown', 'yellow', 'green']}, 'NDVI Kemarau 2021');
Map.addLayer(ndviKemarau2022.clip(kecamatan), {min: 0, max: 1, palette: ['brown', 'yellow', 'green']}, 'NDVI Kemarau 2022');
Map.addLayer(ndviKemarau2023.clip(kecamatan), {min: 0, max: 1, palette: ['brown', 'yellow', 'green']}, 'NDVI Kemarau 2023');
Map.addLayer(ndviKemarau2024.clip(kecamatan), {min: 0, max: 1, palette: ['brown', 'yellow', 'green']}, 'NDVI Kemarau 2024');

// KLASIFIKASI NDVI
function klasifikasiNDVI(image) {
  return image
    .where(image.lte(0.2), 1)
    .where(image.gt(0.2).and(image.lte(0.4)), 2)
    .where(image.gt(0.4).and(image.lte(0.6)), 3)
    .where(image.gt(0.6), 4)
    .toByte();
}

var visKlas = {
  min: 1,
  max: 4,
  palette: ['#d73027', '#fee08b', '#1a9850', '#006837']
};

Map.addLayer(klasifikasiNDVI(ndviKemarau2020).clip(kecamatan), visKlas, 'Kelas NDVI Kemarau 2020');
Map.addLayer(klasifikasiNDVI(ndviKemarau2021).clip(kecamatan), visKlas, 'Kelas NDVI Kemarau 2021');
Map.addLayer(klasifikasiNDVI(ndviKemarau2022).clip(kecamatan), visKlas, 'Kelas NDVI Kemarau 2022');
Map.addLayer(klasifikasiNDVI(ndviKemarau2023).clip(kecamatan), visKlas, 'Kelas NDVI Kemarau 2023');
Map.addLayer(klasifikasiNDVI(ndviKemarau2024).clip(kecamatan), visKlas, 'Kelas NDVI Kemarau 2024');

// GRAFIK PERBANDINGAN
var chart = ui.Chart.feature.groups({
  features: semuaData,
  xProperty: 'musim',
  yProperty: 'mean',
  seriesProperty: 'WADMKC' // pastikan nama kolom kecamatan
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Perbandingan NDVI Kemarau (2020–2024) per Kecamatan',
  hAxis: {title: 'Tahun Musim Kemarau'},
  vAxis: {title: 'NDVI Rata-rata', minValue: 0, maxValue: 1},
  legend: {position: 'top', maxLines: 5},
  colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
});

print(chart);

// EKSPOR CSV
Export.table.toDrive({
  collection: semuaData,
  description: 'NDVI_Kemarau_Kebumen_2020_2024',
  fileFormat: 'CSV'
});
