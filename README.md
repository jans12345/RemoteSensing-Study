# RemoteSensing-Study
A collection of personal learning projects using Google Earth Engine and Python for spatial analysis

## LST_Kebumen.js

Estimates Land Surface Temperature (LST) in Kebumen Regency using MODIS or Landsat thermal imagery.

### Key Processes:
- Uses MOD11A2 or Landsat thermal bands (e.g., Band 10)
- Converts brightness temperature to Celsius
- Filters for cloud-free data and specific dates

### Area of Interest:
Kebumen Regency (shapefile)

### Output:
Spatial map showing land surface temperature distribution, useful for heat monitoring and urban rural thermal contrast.

## NDVI_Kebumen_Kemarau.js

Analyzes vegetation health using NDVI (Normalized Difference Vegetation Index) during the dry season in Kebumen Regency.

### Key Processes:
- Uses Sentinel-2 SR imagery (B8 and B4)
- Applies cloud masking and selects dry season period
- Calculates NDVI: (B8 - B4) / (B8 + B4)
- Creates a median composite for clearer signal
- Visualizes NDVI in green color palette

### Area of Interest:
Kebumen Regency boundary (FeatureCollection)

### Output:
NDVI map layer to assess vegetation condition and potential drought impact.

## VHI_Kebumen.js

Calculates the Vegetation Health Index (VHI) to monitor drought stress in Kebumen Regency.

### Key Processes:
- Combines NDVI and LST datasets
- Computes VCI (Vegetation Condition Index)
- Computes TCI (Temperature Condition Index)
- Calculates VHI: weighted average of VCI and TCI
- Rescales outputs between 0–100 for interpretation

### Area of Interest:
Kebumen Regency administrative boundary

### Output:
VHI raster to detect vegetation stress zones and assess drought vulnerability.

## MVI_Pati.js

Analyzes vegetation moisture condition in Pati Regency using Moisture Vegetation Index (MVI).

### Key Processes:
- Uses Sentinel-2 bands (e.g., B8 and B11)
- Calculates MVI: (B8 - B11) / (B8 + B11)
- Filters cloud and creates median composite
- Visualizes using custom color ramp (blue–brown)

### Area of Interest:
AOI with polygon area near Pati Regency

### Output:
MVI raster indicating vegetation moisture variation useful for detection mangrove area

