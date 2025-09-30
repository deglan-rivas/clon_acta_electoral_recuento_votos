#!/usr/bin/env node

/**
 * Script to generate fake Mesa Electoral data with associated geographical information
 *
 * This script creates:
 * 1. Mesa numbers for domestic locations (based on circunscripcion_electoral_por_departamento.csv and TB_UBIGEOS.csv)
 * 2. Mesa numbers for international locations (PERUANOS RESIDENTES EN EL EXTRANJERO)
 *
 * Unified location columns:
 * - departamento (domestic) / continente (international)
 * - provincia (domestic) / pais (international)
 * - distrito (domestic) / ciudad (international)
 *
 * Circunscripción Electoral assignment: Random assignment (not tied to departamento)
 * Output: mesa_electoral_data.csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Number of mesas per distrito (domestic)
  MESAS_PER_DISTRITO: { min: 1, max: 8 },
  // Number of mesas per city (international)
  MESAS_PER_CITY: { min: 1, max: 4 },
  // Mesa number range (6 digits)
  MESA_NUMBER_RANGE: { start: 100001, end: 999999 }
};

// International locations for "PERUANOS RESIDENTES EN EL EXTRANJERO"
const INTERNATIONAL_LOCATIONS = [
  // North America
  { continente: 'AMERICA', pais: 'ESTADOS UNIDOS', ciudad: 'NEW YORK' },
  { continente: 'AMERICA', pais: 'ESTADOS UNIDOS', ciudad: 'LOS ANGELES' },
  { continente: 'AMERICA', pais: 'ESTADOS UNIDOS', ciudad: 'MIAMI' },
  { continente: 'AMERICA', pais: 'ESTADOS UNIDOS', ciudad: 'CHICAGO' },
  { continente: 'AMERICA', pais: 'ESTADOS UNIDOS', ciudad: 'WASHINGTON' },
  { continente: 'AMERICA', pais: 'CANADA', ciudad: 'TORONTO' },
  { continente: 'AMERICA', pais: 'CANADA', ciudad: 'VANCOUVER' },
  { continente: 'AMERICA', pais: 'MEXICO', ciudad: 'CIUDAD DE MEXICO' },

  // South America
  { continente: 'AMERICA', pais: 'ARGENTINA', ciudad: 'BUENOS AIRES' },
  { continente: 'AMERICA', pais: 'ARGENTINA', ciudad: 'CORDOBA' },
  { continente: 'AMERICA', pais: 'BRASIL', ciudad: 'SAO PAULO' },
  { continente: 'AMERICA', pais: 'BRASIL', ciudad: 'RIO DE JANEIRO' },
  { continente: 'AMERICA', pais: 'CHILE', ciudad: 'SANTIAGO' },
  { continente: 'AMERICA', pais: 'COLOMBIA', ciudad: 'BOGOTA' },
  { continente: 'AMERICA', pais: 'ECUADOR', ciudad: 'QUITO' },
  { continente: 'AMERICA', pais: 'VENEZUELA', ciudad: 'CARACAS' },
  { continente: 'AMERICA', pais: 'BOLIVIA', ciudad: 'LA PAZ' },

  // Europe
  { continente: 'EUROPA', pais: 'ESPAÑA', ciudad: 'MADRID' },
  { continente: 'EUROPA', pais: 'ESPAÑA', ciudad: 'BARCELONA' },
  { continente: 'EUROPA', pais: 'ITALIA', ciudad: 'ROMA' },
  { continente: 'EUROPA', pais: 'ITALIA', ciudad: 'MILAN' },
  { continente: 'EUROPA', pais: 'FRANCIA', ciudad: 'PARIS' },
  { continente: 'EUROPA', pais: 'ALEMANIA', ciudad: 'BERLIN' },
  { continente: 'EUROPA', pais: 'REINO UNIDO', ciudad: 'LONDRES' },
  { continente: 'EUROPA', pais: 'SUIZA', ciudad: 'ZURICH' },

  // Asia
  { continente: 'ASIA', pais: 'JAPON', ciudad: 'TOKIO' },
  { continente: 'ASIA', pais: 'CHINA', ciudad: 'BEIJING' },
  { continente: 'ASIA', pais: 'COREA DEL SUR', ciudad: 'SEUL' },

  // Oceania
  { continente: 'OCEANIA', pais: 'AUSTRALIA', ciudad: 'SYDNEY' },
  { continente: 'OCEANIA', pais: 'AUSTRALIA', ciudad: 'MELBOURNE' }
];

class MesaElectoralGenerator {
  constructor() {
    this.usedMesaNumbers = new Set();
    this.mesaData = [];
    this.ubigeoData = [];
    this.circunscripcionData = [];
    this.domesticCircunscripciones = []; // Non-international circunscripciones
  }

  // Load CSV data
  loadCSVData() {
    console.log('Loading CSV data...');

    // Load ubigeo data - only extract departamento, provincia, distrito
    const ubigeoPath = path.join(__dirname, '../public/TB_UBIGEOS.csv');
    const ubigeoContent = fs.readFileSync(ubigeoPath, 'utf-8');
    const ubigeoLines = ubigeoContent.split('\n').slice(1); // Skip header

    this.ubigeoData = ubigeoLines
      .filter(line => line.trim())
      .map(line => {
        const [, , , departamento, , provincia, distrito] = line.split(';');
        return {
          departamento: departamento?.trim(),
          provincia: provincia?.trim(),
          distrito: distrito?.trim()
        };
      })
      .filter(record => record.departamento && record.provincia && record.distrito);

    // Load circunscripcion data (format: category;CIRCUNSCRIPCION_ELECTORAL)
    const circunscripcionPath = path.join(__dirname, '../public/circunscripcion_electoral_por_categoria.csv');
    const circunscripcionContent = fs.readFileSync(circunscripcionPath, 'utf-8');
    const circunscripcionLines = circunscripcionContent.split('\n').slice(1); // Skip header

    this.circunscripcionData = circunscripcionLines
      .filter(line => line.trim())
      .map(line => {
        const [category, circunscripcion_electoral] = line.split(';');
        return {
          category: category?.trim() || '',
          circunscripcion_electoral: circunscripcion_electoral?.trim() || ''
        };
      });

    // Filter domestic circunscripciones (exclude international and national-level)
    this.domesticCircunscripciones = this.circunscripcionData
      .filter(record =>
        record.circunscripcion_electoral !== 'PERUANOS RESIDENTES EN EL EXTRANJERO' &&
        record.circunscripcion_electoral !== 'UNICO NACIONAL' &&
        record.circunscripcion_electoral
      )
      .map(record => record.circunscripcion_electoral);

    console.log(`Loaded ${this.ubigeoData.length} ubigeo records`);
    console.log(`Loaded ${this.circunscripcionData.length} circunscripcion records`);
    console.log(`Found ${this.domesticCircunscripciones.length} domestic circunscripciones for random assignment`);
  }

  // Generate unique mesa number
  generateMesaNumber() {
    let mesaNumber;
    do {
      mesaNumber = Math.floor(
        Math.random() * (CONFIG.MESA_NUMBER_RANGE.end - CONFIG.MESA_NUMBER_RANGE.start) +
        CONFIG.MESA_NUMBER_RANGE.start
      );
    } while (this.usedMesaNumbers.has(mesaNumber));

    this.usedMesaNumbers.add(mesaNumber);
    return mesaNumber.toString().padStart(6, '0');
  }

  // Randomly select a domestic circunscripcion electoral
  getRandomDomesticCircunscripcion() {
    const randomIndex = Math.floor(Math.random() * this.domesticCircunscripciones.length);
    return this.domesticCircunscripciones[randomIndex];
  }

  // Generate domestic mesas
  generateDomesticMesas() {
    console.log('Generating domestic mesas...');

    // Group ubigeo data by departamento-provincia-distrito
    const locationGroups = new Map();

    this.ubigeoData.forEach(record => {
      const key = `${record.departamento}-${record.provincia}-${record.distrito}`;
      if (!locationGroups.has(key)) {
        locationGroups.set(key, record);
      }
    });

    console.log(`Found ${locationGroups.size} unique distrito locations`);

    // Generate mesas for each distrito
    locationGroups.forEach((location) => {
      const numMesas = Math.floor(
        Math.random() * (CONFIG.MESAS_PER_DISTRITO.max - CONFIG.MESAS_PER_DISTRITO.min) +
        CONFIG.MESAS_PER_DISTRITO.min
      );

      for (let i = 0; i < numMesas; i++) {
        // Randomly assign circunscripcion electoral (independent of departamento)
        const circunscripcionElectoral = this.getRandomDomesticCircunscripcion();

        this.mesaData.push({
          mesa_number: this.generateMesaNumber(),
          tipo_ubicacion: 'NACIONAL',
          circunscripcion_electoral: circunscripcionElectoral,
          // Unified location fields (domestic uses departamento/provincia/distrito)
          departamento: location.departamento,
          provincia: location.provincia,
          distrito: location.distrito
        });
      }
    });

    console.log(`Generated ${this.mesaData.length} domestic mesas`);
  }

  // Generate international mesas
  generateInternationalMesas() {
    console.log('Generating international mesas...');

    const startCount = this.mesaData.length;

    INTERNATIONAL_LOCATIONS.forEach(location => {
      const numMesas = Math.floor(
        Math.random() * (CONFIG.MESAS_PER_CITY.max - CONFIG.MESAS_PER_CITY.min) +
        CONFIG.MESAS_PER_CITY.min
      );

      for (let i = 0; i < numMesas; i++) {
        this.mesaData.push({
          mesa_number: this.generateMesaNumber(),
          tipo_ubicacion: 'INTERNACIONAL',
          circunscripcion_electoral: 'PERUANOS RESIDENTES EN EL EXTRANJERO',
          // Unified location fields (international uses continente/pais/ciudad)
          departamento: location.continente,
          provincia: location.pais,
          distrito: location.ciudad
        });
      }
    });

    console.log(`Generated ${this.mesaData.length - startCount} international mesas`);
  }

  // Generate all mesa data
  generate() {
    console.log('Starting Mesa Electoral data generation...');

    this.loadCSVData();
    this.generateDomesticMesas();
    this.generateInternationalMesas();

    console.log(`Total mesas generated: ${this.mesaData.length}`);
    return this.mesaData;
  }

  // Save to CSV file
  saveToCSV(filename = 'mesa_electoral_data.csv') {
    console.log(`Saving data to ${filename}...`);

    // CSV headers - unified location columns
    const headers = [
      'mesa_number',
      'tipo_ubicacion',
      'circunscripcion_electoral',
      'departamento',
      'provincia',
      'distrito'
    ];

    // Convert data to CSV
    const csvContent = [
      headers.join(';'),
      ...this.mesaData.map(mesa =>
        headers.map(header => mesa[header] || '').join(';')
      )
    ].join('\n');

    // Save to public directory
    const outputPath = path.join(__dirname, '../public/', filename);
    fs.writeFileSync(outputPath, csvContent, 'utf-8');

    console.log(`✅ Mesa Electoral data saved to: ${outputPath}`);
    console.log(`📊 Total records: ${this.mesaData.length}`);

    // Print summary statistics
    this.printSummary();
  }

  // Print generation summary
  printSummary() {
    const domestic = this.mesaData.filter(m => m.tipo_ubicacion === 'NACIONAL').length;
    const international = this.mesaData.filter(m => m.tipo_ubicacion === 'INTERNACIONAL').length;

    console.log('\n📈 Generation Summary:');
    console.log(`├── Domestic mesas: ${domestic}`);
    console.log(`├── International mesas: ${international}`);
    console.log(`└── Total mesas: ${this.mesaData.length}`);

    // Circunscripcion breakdown
    const circunscripcionStats = {};
    this.mesaData.forEach(mesa => {
      const circ = mesa.circunscripcion_electoral;
      circunscripcionStats[circ] = (circunscripcionStats[circ] || 0) + 1;
    });

    console.log('\n🗳️ Mesas by Circunscripción Electoral (Random Assignment):');
    Object.entries(circunscripcionStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([circ, count]) => {
        console.log(`├── ${circ}: ${count} mesas`);
      });

    // Location breakdown for domestic mesas
    const locationStats = {};
    this.mesaData
      .filter(m => m.tipo_ubicacion === 'NACIONAL')
      .forEach(mesa => {
        const location = mesa.departamento;
        locationStats[location] = (locationStats[location] || 0) + 1;
      });

    console.log('\n🏛️ Domestic Mesas by Departamento:');
    Object.entries(locationStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) // Show top 10
      .forEach(([location, count]) => {
        console.log(`├── ${location}: ${count} mesas`);
      });

    // International location breakdown
    const internationalStats = {};
    this.mesaData
      .filter(m => m.tipo_ubicacion === 'INTERNACIONAL')
      .forEach(mesa => {
        const location = mesa.departamento; // This is continente for international
        internationalStats[location] = (internationalStats[location] || 0) + 1;
      });

    console.log('\n🌍 International Mesas by Continente:');
    Object.entries(internationalStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([location, count]) => {
        console.log(`├── ${location}: ${count} mesas`);
      });

    // Sample data preview
    console.log('\n📋 Sample Mesa Data:');
    console.log('├── Domestic Sample:');
    const domesticSample = this.mesaData.find(m => m.tipo_ubicacion === 'NACIONAL');
    if (domesticSample) {
      console.log(`│   ├── Mesa: ${domesticSample.mesa_number}`);
      console.log(`│   ├── Circunscripción: ${domesticSample.circunscripcion_electoral}`);
      console.log(`│   └── Ubicación: ${domesticSample.departamento} > ${domesticSample.provincia} > ${domesticSample.distrito}`);
    }

    console.log('└── International Sample:');
    const internationalSample = this.mesaData.find(m => m.tipo_ubicacion === 'INTERNACIONAL');
    if (internationalSample) {
      console.log(`    ├── Mesa: ${internationalSample.mesa_number}`);
      console.log(`    ├── Circunscripción: ${internationalSample.circunscripcion_electoral}`);
      console.log(`    └── Ubicación: ${internationalSample.departamento} > ${internationalSample.provincia} > ${internationalSample.distrito}`);
      console.log(`    └── (Continente > País > Ciudad)`);
    }
  }
}

// Main execution
try {
  const generator = new MesaElectoralGenerator();
  generator.generate();
  generator.saveToCSV('mesa_electoral_data.csv');

  console.log('\n🎉 Mesa Electoral data generation completed successfully!');
  console.log('💡 You can now use this data to implement the Mesa Electoral preloaded information feature.');
  console.log('📝 Notes:');
  console.log('   - Unified location columns: departamento/provincia/distrito');
  console.log('   - Domestic: departamento/provincia/distrito');
  console.log('   - International: continente/pais/ciudad (using same columns)');
  console.log('   - Only mesa identification and location data included');
  console.log('   - Circunscripción Electoral randomly assigned (independent of departamento)');

} catch (error) {
  console.error('❌ Error generating Mesa Electoral data:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

export default MesaElectoralGenerator;