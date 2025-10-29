#!/usr/bin/env node

/**
 * Script to generate personeros (party representatives) data
 *
 * This script creates personeros associated with political parties
 * in each circunscripción electoral.
 *
 * Rules:
 * 1. Two personeros per political party per circunscripción electoral
 * 2. Based on existing circunscripcion_organizacion_mapping.csv
 * 3. Generate fake names and DNI numbers
 * 4. Each personero is unique (no duplicate DNIs)
 *
 * Output: personeros_data.csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  PERSONEROS_PER_ORG: 2, // Two personeros per organization per circunscripción
  DNI_MIN: 10000000,
  DNI_MAX: 99999999
};

// Fake name data pools
const NOMBRES = [
  'Juan Carlos', 'María Elena', 'José Luis', 'Ana Patricia', 'Carlos Alberto',
  'Rosa María', 'Luis Fernando', 'Carmen Rosa', 'Pedro Pablo', 'Lucía Isabel',
  'Miguel Ángel', 'Sandra Beatriz', 'Jorge Luis', 'Patricia Elena', 'Roberto Carlos',
  'Gloria Mercedes', 'Eduardo José', 'Silvia Rocío', 'Ricardo Manuel', 'Teresa Guadalupe',
  'Fernando José', 'Mónica Alejandra', 'Alberto Raúl', 'Claudia Vanessa', 'Daniel Enrique',
  'Verónica Luz', 'Héctor Manuel', 'Diana Carolina', 'Francisco Javier', 'Angela María',
  'Gustavo Adolfo', 'Mariana Isabel', 'Raúl Alberto', 'Gabriela Sofía', 'Víctor Hugo',
  'Cecilia Beatriz', 'Omar Alejandro', 'Liliana Patricia', 'Arturo Eduardo', 'Roxana Milagros',
  'Sergio Antonio', 'Yolanda Mercedes', 'Marco Antonio', 'Susana Elena', 'Pablo César',
  'Norma Angélica', 'Julio César', 'Irma Rosa', 'Andrés Felipe', 'Cristina María',
  'Ernesto José', 'Beatriz Elena', 'Felipe Augusto', 'Dora Inés', 'Ramiro Luis',
  'Gladys Pilar', 'Hugo Alberto', 'Martha Lucía', 'Jaime Eduardo', 'Nelly Victoria',
  'Alfonso Manuel', 'Elisa Carmen', 'Guillermo José', 'Olga Marina', 'Armando Luis',
  'Rosa Elena', 'Enrique Miguel', 'Julia Esperanza', 'Lorenzo Manuel', 'Iris Margarita',
  'Alfredo José', 'Amparo Luz', 'Mauricio Andrés', 'Lidia Mercedes', 'Salvador Antonio',
  'Bertha Rosa', 'Gerardo Luis', 'Sonia Patricia', 'Rodolfo César', 'Laura Angélica',
  'Ismael Roberto', 'Luz Marina', 'Gonzalo Alberto', 'Elena Isabel', 'Óscar Eduardo',
  'Pilar Mercedes', 'Rubén Darío', 'Victoria Elena', 'Ignacio José', 'Alicia Rosa',
  'Tomás Alberto', 'Mercedes Beatriz', 'Benjamín Luis', 'Sara Luz', 'Joaquín Manuel',
  'Regina Patricia', 'Esteban José', 'Magdalena Rosa', 'Samuel Antonio', 'Josefa María'
];

const APELLIDOS_PATERNOS = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez',
  'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez',
  'Ortiz', 'Chávez', 'Ruiz', 'Jiménez', 'Hernández', 'Mendoza', 'Castillo', 'Vargas',
  'Romero', 'Álvarez', 'Medina', 'Castro', 'Vega', 'Ramos', 'Salazar', 'Herrera', 'Aguilar',
  'Silva', 'Contreras', 'Rojas', 'Figueroa', 'Guzmán', 'Carrillo', 'Ríos', 'Fernández',
  'Núñez', 'Campos', 'Guerrero', 'Espinoza', 'Paredes', 'Delgado', 'Cabrera', 'Vásquez',
  'Navarro', 'Cárdenas', 'Maldonado', 'Sandoval', 'Zamora', 'Acosta', 'Estrada', 'Luna',
  'Mendez', 'Domínguez', 'Cortez', 'Pacheco', 'Cervantes', 'Velasco', 'Ponce', 'Fuentes',
  'Solís', 'Valdez', 'Huerta', 'León', 'Márquez', 'Ayala', 'Peña', 'Montes', 'Lara',
  'Córdova', 'Miranda', 'Montoya', 'Gallegos', 'Ochoa', 'Molina', 'Ibarra', 'Soto'
];

const APELLIDOS_MATERNOS = [
  'Fernández', 'Vargas', 'Castro', 'Moreno', 'Guzmán', 'Soto', 'Campos', 'Molina',
  'Delgado', 'Vega', 'Navarro', 'Bravo', 'Palacios', 'Miranda', 'Robles', 'Carrasco',
  'Córdova', 'Valdés', 'Guerrero', 'Alvarado', 'Paredes', 'León', 'Arias', 'Villalobos',
  'Santana', 'Bautista', 'Cortés', 'Lozano', 'Benítez', 'Gallardo', 'Velázquez', 'Olivares',
  'Padilla', 'Montero', 'Valencia', 'Ibáñez', 'Mejía', 'Salinas', 'Burgos', 'Caballero',
  'Téllez', 'Escobar', 'Vidal', 'Andrade', 'Bustamante', 'Parra', 'Mora', 'Quintero',
  'Franco', 'Nava', 'Salas', 'Barrera', 'Suárez', 'Calderón', 'Merino', 'Ochoa',
  'Sierra', 'Cardona', 'Villa', 'Montes', 'Mercado', 'Villegas', 'Arellano', 'Durán',
  'Segura', 'Briones', 'Meza', 'Serrano', 'Galván', 'Trujillo', 'Cisneros', 'Orozco',
  'Rangel', 'Portillo', 'Muñoz', 'Zavala', 'Rosales', 'Cuevas', 'Chávez', 'Figueroa'
];

class PersonerosGenerator {
  constructor() {
    this.personeros = [];
    this.usedDNIs = new Set();
    this.mappingData = [];
    this.organizacionesData = [];
  }

  // Load CSV data
  loadCSVData() {
    console.log('Loading CSV data...');

    // Load circunscripcion_organizacion_mapping
    const mappingPath = path.join(__dirname, '../public/circunscripcion_organizacion_mapping.csv');
    const mappingContent = fs.readFileSync(mappingPath, 'utf-8');
    const mappingLines = mappingContent.split('\n').slice(1); // Skip header

    this.mappingData = mappingLines
      .filter(line => line.trim())
      .map(line => {
        const [circunscripcion_electoral, organizacion_key, categoria_id, orden_visualizacion] = line.split(';');
        return {
          circunscripcion_electoral: circunscripcion_electoral?.trim() || '',
          organizacion_key: organizacion_key?.trim() || '',
          categoria_id: categoria_id?.trim() || '',
          orden_visualizacion: orden_visualizacion?.trim() || ''
        };
      })
      .filter(m => m.circunscripcion_electoral && m.organizacion_key);

    console.log(`Loaded ${this.mappingData.length} circunscripcion-organizacion mappings`);

    // Load organizaciones políticas
    const orgPath = path.join(__dirname, '../public/organizaciones_politicas.csv');
    const orgContent = fs.readFileSync(orgPath, 'utf-8');
    const orgLines = orgContent.split('\n').slice(1); // Skip header

    this.organizacionesData = orgLines
      .filter(line => line.trim())
      .map(line => {
        const [key, order, name] = line.split(';');
        return {
          key: key?.trim() || '',
          order: order?.trim() || '',
          name: name?.trim() || ''
        };
      })
      .filter(org => org.key);

    console.log(`Loaded ${this.organizacionesData.length} political organizations`);
  }

  // Generate unique DNI
  generateDNI() {
    let dni;
    do {
      dni = Math.floor(
        Math.random() * (CONFIG.DNI_MAX - CONFIG.DNI_MIN) + CONFIG.DNI_MIN
      );
    } while (this.usedDNIs.has(dni));

    this.usedDNIs.add(dni);
    return dni.toString().padStart(8, '0');
  }

  // Generate random name
  generateName() {
    const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
    const apellidoPaterno = APELLIDOS_PATERNOS[Math.floor(Math.random() * APELLIDOS_PATERNOS.length)];
    const apellidoMaterno = APELLIDOS_MATERNOS[Math.floor(Math.random() * APELLIDOS_MATERNOS.length)];

    return {
      nombres: nombre,
      apellido_paterno: apellidoPaterno,
      apellido_materno: apellidoMaterno
    };
  }

  // Get organization name by key
  getOrganizacionName(key) {
    const org = this.organizacionesData.find(o => o.key === key);
    return org ? org.name : '';
  }

  // Generate personeros for all mappings
  generate() {
    console.log('Starting personeros data generation...\n');

    this.loadCSVData();

    console.log('\nGenerating personeros...');

    let count = 0;
    const progressInterval = 100;

    // For each mapping, create CONFIG.PERSONEROS_PER_ORG personeros
    this.mappingData.forEach((mapping, index) => {
      const orgName = this.getOrganizacionName(mapping.organizacion_key);

      // Skip BLANCO and NULO (they don't have personeros)
      if (orgName === 'BLANCO' || orgName === 'NULO') {
        return;
      }

      for (let i = 0; i < CONFIG.PERSONEROS_PER_ORG; i++) {
        const personData = this.generateName();

        this.personeros.push({
          dni: this.generateDNI(),
          nombres: personData.nombres,
          apellido_paterno: personData.apellido_paterno,
          apellido_materno: personData.apellido_materno,
          organizacion_key: mapping.organizacion_key,
          organizacion_nombre: orgName,
          circunscripcion_electoral: mapping.circunscripcion_electoral,
          categoria_id: mapping.categoria_id
        });

        count++;
        if (count % progressInterval === 0) {
          console.log(`├── Generated ${count} personeros...`);
        }
      }
    });

    console.log(`\nTotal personeros generated: ${this.personeros.length}`);
    return this.personeros;
  }

  // Save to CSV file
  saveToCSV(filename = 'personeros_data.csv') {
    console.log(`\nSaving data to ${filename}...`);

    // CSV headers
    const headers = [
      'dni',
      'nombres',
      'apellido_paterno',
      'apellido_materno',
      'organizacion_key',
      'organizacion_nombre',
      'circunscripcion_electoral',
      'categoria_id'
    ];

    // Convert data to CSV
    const csvContent = [
      headers.join(';'),
      ...this.personeros.map(personero =>
        headers.map(header => personero[header] || '').join(';')
      )
    ].join('\n');

    // Save to public directory
    const outputPath = path.join(__dirname, '../public/', filename);
    fs.writeFileSync(outputPath, csvContent, 'utf-8');

    console.log(`✅ Personeros data saved to: ${outputPath}`);
    console.log(`📊 Total records: ${this.personeros.length}`);

    // Print summary statistics
    this.printSummary();
  }

  // Print generation summary
  printSummary() {
    console.log('\n📈 Generation Summary:');

    // Count by circunscripción
    const circunscripcionStats = {};
    this.personeros.forEach(personero => {
      const key = personero.circunscripcion_electoral;
      circunscripcionStats[key] = (circunscripcionStats[key] || 0) + 1;
    });

    console.log(`\n🗳️ Personeros by Circunscripción Electoral (top 10):`);
    Object.entries(circunscripcionStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([circ, count]) => {
        console.log(`├── ${circ}: ${count} personeros`);
      });

    // Count by category
    const categoryStats = {};
    this.personeros.forEach(personero => {
      const key = personero.categoria_id;
      categoryStats[key] = (categoryStats[key] || 0) + 1;
    });

    const categoryNames = {
      'A': 'Presidencial',
      'B': 'Senadores Nacional',
      'C': 'Senadores Regional',
      'D': 'Diputados',
      'E': 'Parlamento Andino'
    };

    console.log(`\n📋 Personeros by Category:`);
    Object.entries(categoryStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, count]) => {
        const name = categoryNames[category] || category;
        console.log(`├── ${category} (${name}): ${count} personeros`);
      });

    // Count by organization (top 10)
    const orgStats = {};
    this.personeros.forEach(personero => {
      const key = personero.organizacion_nombre;
      orgStats[key] = (orgStats[key] || 0) + 1;
    });

    console.log(`\n🏛️ Personeros by Political Organization (top 10):`);
    Object.entries(orgStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .forEach(([org, count]) => {
        console.log(`├── ${org}: ${count} personeros`);
      });

    // Sample data preview
    console.log('\n📋 Sample Personero Data:');
    const samples = this.personeros.slice(0, 3);
    samples.forEach((personero, index) => {
      console.log(`\n${index + 1}. ${personero.nombres} ${personero.apellido_paterno} ${personero.apellido_materno}`);
      console.log(`   ├── DNI: ${personero.dni}`);
      console.log(`   ├── Organización: ${personero.organizacion_nombre} (${personero.organizacion_key})`);
      console.log(`   ├── Circunscripción: ${personero.circunscripcion_electoral}`);
      console.log(`   └── Categoría: ${personero.categoria_id}`);
    });

    // Statistics
    console.log('\n📊 Overall Statistics:');
    console.log(`├── Total personeros: ${this.personeros.length}`);
    console.log(`├── Unique DNIs: ${this.usedDNIs.size}`);
    console.log(`├── Circunscripciones covered: ${Object.keys(circunscripcionStats).length}`);
    console.log(`├── Organizations represented: ${Object.keys(orgStats).length}`);
    console.log(`└── Personeros per org/circunscripción: ${CONFIG.PERSONEROS_PER_ORG}`);
  }
}

// Main execution
try {
  const generator = new PersonerosGenerator();
  generator.generate();
  generator.saveToCSV('personeros_data.csv');

  console.log('\n🎉 Personeros data generation completed successfully!');
  console.log('💡 You can now use this data to populate the personeros table.');
  console.log('📝 Notes:');
  console.log('   - Two personeros per political party per circunscripción electoral');
  console.log('   - BLANCO and NULO excluded (no personeros)');
  console.log('   - All DNIs are unique');
  console.log('   - Names are randomly generated from Peruvian name pools');
  console.log('   - Data includes categoria_id for proper categorization');

} catch (error) {
  console.error('❌ Error generating personeros data:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

export default PersonerosGenerator;
