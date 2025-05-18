// ========== DATA ADMINISTRASI ==========
var kecamatan = ee.FeatureCollection("projects/januarw33/assets/Kec_Kbm");

function maskL8sr(image) {
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
               .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

function getLST(start, end) {
  var collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
                      .filterDate(start, end)
                      .filterBounds(kecamatan)
                      .map(maskL8sr)
                      .map(function(image) {
                        var lst = image.select('ST_B10')
                          .multiply(0.00341802)
                          .add(149.0)
                          .subtract(273.15)
                          .rename('LST'); // suhu dalam °C
                        return lst.copyProperties(image, image.propertyNames());
                      });
  return collection.median().clip(kecamatan);
}

// MUSIM KEMARAU PER TAHUN
var lstKemarau2022 = getLST('2022-06-01', '2022-08-31').rename('LST_2022');
var lstKemarau2023 = getLST('2023-06-01', '2023-08-31').rename('LST_2023');
var lstKemarau2024 = getLST('2024-06-01', '2024-08-31').rename('LST_2024');

// RATA-RATA LST 
function hitungRata(image, label) {
  return image.reduceRegions({
    collection: kecamatan,
    reducer: ee.Reducer.mean(),
    scale: 30
  }).map(function(f) {
    return f.set('musim', label);
  });
}

var rata2022 = hitungRata(lstKemarau2022, 'KEMARAU_2022');
var rata2023 = hitungRata(lstKemarau2023, 'KEMARAU_2023');
var rata2024 = hitungRata(lstKemarau2024, 'KEMARAU_2024');

// GABUNGKAN SEMUA HASIL
var semuaLST = rata2022.merge(rata2023).merge(rata2024);

// TAMPILKAN DI PETA 
Map.centerObject(kecamatan, 10);
Map.addLayer(lstKemarau2022, {min: 20, max: 40, palette: ['blue', 'green', 'yellow', 'red']}, 'LST Kemarau 2022');
Map.addLayer(lstKemarau2023, {min: 20, max: 40, palette: ['blue', 'green', 'yellow', 'red']}, 'LST Kemarau 2023');
Map.addLayer(lstKemarau2024, {min: 20, max: 40, palette: ['blue', 'green', 'yellow', 'red']}, 'LST Kemarau 2024');

// GRAFIK PERBANDINGAN
var chartLST = ui.Chart.feature.groups({
  features: semuaLST,
  xProperty: 'musim',
  yProperty: 'mean',
  seriesProperty: 'WADMKC' // pastikan kolom ini ada
})
.setChartType('ColumnChart')
.setOptions({
  title: 'Perbandingan Suhu Permukaan Kemarau (2022–2024) per Kecamatan',
  hAxis: {title: 'Tahun Musim Kemarau'},
  vAxis: {title: 'Suhu (°C)', minValue: 20, maxValue: 45},
  legend: {position: 'top', maxLines: 3},
  colors: ['#e41a1c', '#377eb8', '#4daf4a']
});

print(chartLST);

// EKSPOR DATA 
Export.table.toDrive({
  collection: semuaLST,
  description: 'LST_Kemarau_Kebumen_2022_2024',
  fileFormat: 'CSV'
});
