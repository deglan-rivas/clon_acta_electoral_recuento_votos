#!/usr/bin/env node

/**
 * Script to generate circunscripcion-organizacion mapping data
 *
 * This script creates the mapping between circunscripciones electorales and
 * organizaciones políticas (political parties).
 *
 * Rules:
 * 1. UNICO NACIONAL - All political parties participate (39 parties)
 * 2. LIMA METROPOLITANA - All political parties participate (39 parties)
 * 3. Other circunscripciones - Random subset of political parties (10-25 parties)
 * 4. BLANCO and NULO always included in all circunscripciones
 *
 * Output: circunscripcion_organizacion_mapping.csv
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Number of random parties for regular circunscripciones
  RANDOM_PARTIES: { min: 10, max: 25 },
  // Special circunscripciones that get ALL parties
  FULL_PARTICIPATION: ['UNICO NACIONAL', 'LIMA METROPOLITANA'],
  // Categories that apply to all circunscripciones (A=presidencial, E=parlamentoAndino, B=senadoresNacional)
  NATIONAL_CATEGORIES: ['presidencial', 'parlamentoAndino', 'senadoresNacional'],
  // Categories that apply to regional/district circunscripciones (C=senadoresRegional, D=diputados)
  REGIONAL_CATEGORIES: ['senadoresRegional', 'diputados']
};

class CircunscripcionOrganizacionGenerator {
  constructor() {
    this.mappingData = [];
    this.organizacionesData = [];
    this.circunscripcionesData = [];
    this.normalParties = []; // Excluding BLANCO and NULO
    this.specialVotes = []; // BLANCO and NULO
  }

  // Load CSV data
  loadCSVData() {
    console.log('Loading CSV data...');

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

    // Separate normal parties from special votes
    this.normalParties = this.organizacionesData.filter(org =>
      org.name !== 'BLANCO' && org.name !== 'NULO'
    );
    this.specialVotes = this.organizacionesData.filter(org =>
      org.name === 'BLANCO' || org.name === 'NULO'
    );

    console.log(`Loaded ${this.organizacionesData.length} political organizations`);
    console.log(`├── Normal parties: ${this.normalParties.length}`);
    console.log(`└── Special votes (BLANCO/NULO): ${this.specialVotes.length}`);

    // Load circunscripciones electorales
    const circPath = path.join(__dirname, '../public/circunscripcion_electoral_por_categoria.csv');
    const circContent = fs.readFileSync(circPath, 'utf-8');
    const circLines = circContent.split('\n').slice(1); // Skip header

    this.circunscripcionesData = circLines
      .filter(line => line.trim())
      .map(line => {
        const [category, circunscripcion_electoral] = line.split(';');
        return {
          category: category?.trim() || '',
          circunscripcion_electoral: circunscripcion_electoral?.trim() || ''
        };
      })
      .filter(circ => circ.circunscripcion_electoral);

    console.log(`Loaded ${this.circunscripcionesData.length} circunscripciones electorales`);
  }

  // Get random subset of parties
  getRandomParties(count) {
    const shuffled = [...this.normalParties].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Generate mappings for a circunscripcion (single category)
  generateMappingsForCircunscripcion(circunscripcion, category, selectedParties = null) {
    const circName = circunscripcion.circunscripcion_electoral;
    let parties = selectedParties;

    // If parties not provided, determine which parties participate
    if (!parties) {
      if (CONFIG.FULL_PARTICIPATION.includes(circName)) {
        // UNICO NACIONAL and LIMA METROPOLITANA get ALL parties
        parties = [...this.normalParties];
        console.log(`├── ${circName} (${category || 'all'}): ALL parties (${parties.length})`);
      } else {
        // Other circunscripciones get random subset
        const randomCount = Math.floor(
          Math.random() * (CONFIG.RANDOM_PARTIES.max - CONFIG.RANDOM_PARTIES.min) +
          CONFIG.RANDOM_PARTIES.min
        );
        parties = this.getRandomParties(randomCount);
        console.log(`├── ${circName} (${category || 'all'}): ${parties.length} random parties`);
      }
    }

    // Add selected parties with their order
    parties.forEach((party, index) => {
      this.mappingData.push({
        circunscripcion_electoral: circName,
        organizacion_key: party.key,
        categoria_id: this.getCategoryId(category),
        orden_visualizacion: index + 1
      });
    });

    // Always add BLANCO and NULO at the end
    this.specialVotes.forEach((specialVote, index) => {
      this.mappingData.push({
        circunscripcion_electoral: circName,
        organizacion_key: specialVote.key,
        categoria_id: this.getCategoryId(category),
        orden_visualizacion: parties.length + index + 1
      });
    });

    return parties;
  }

  // Generate mappings for regional categories with shared organizations
  generateRegionalMappings(circunscripcion) {
    const circName = circunscripcion.circunscripcion_electoral;
    let selectedParties = [];

    // Determine which parties participate in this circunscripcion
    if (CONFIG.FULL_PARTICIPATION.includes(circName)) {
      // UNICO NACIONAL and LIMA METROPOLITANA get ALL parties
      selectedParties = [...this.normalParties];
      console.log(`├── ${circName} (C & D): ALL parties (${selectedParties.length})`);
    } else {
      // Other circunscripciones get random subset
      const randomCount = Math.floor(
        Math.random() * (CONFIG.RANDOM_PARTIES.max - CONFIG.RANDOM_PARTIES.min) +
        CONFIG.RANDOM_PARTIES.min
      );
      selectedParties = this.getRandomParties(randomCount);
      console.log(`├── ${circName} (C & D): ${selectedParties.length} random parties`);
    }

    // Generate mappings for senadoresRegional (C) with all selected parties
    this.generateMappingsForCircunscripcion(
      { circunscripcion_electoral: circName },
      'senadoresRegional',
      selectedParties
    );

    // For diputados (D), use a subset of the selected parties
    // D should be a subset of C (or equal in case of full participation)
    let diputadosParties;
    if (CONFIG.FULL_PARTICIPATION.includes(circName)) {
      // Full participation: both get all parties
      diputadosParties = selectedParties;
    } else {
      // Random subset: D gets 60-100% of C's parties
      const subsetPercentage = 0.6 + Math.random() * 0.4; // 60% to 100%
      const subsetCount = Math.max(
        Math.floor(selectedParties.length * subsetPercentage),
        Math.min(5, selectedParties.length) // At least 5 parties or all if less than 5
      );

      // Randomly select subset from the selected parties
      diputadosParties = [...selectedParties]
        .sort(() => Math.random() - 0.5)
        .slice(0, subsetCount);

      console.log(`│   └── D subset: ${diputadosParties.length} parties (${Math.round(subsetPercentage * 100)}% of C)`);
    }

    // Generate mappings for diputados (D) with subset
    this.generateMappingsForCircunscripcion(
      { circunscripcion_electoral: circName },
      'diputados',
      diputadosParties
    );
  }

  // Convert category name to ID
  getCategoryId(categoryName) {
    const categoryMap = {
      'presidencial': 'A',
      'senadoresNacional': 'B',
      'senadoresRegional': 'C',
      'diputados': 'D',
      'parlamentoAndino': 'E'
    };
    return categoryMap[categoryName] || '';
  }

  // Generate all mappings
  generate() {
    console.log('Starting circunscripcion-organizacion mapping generation...\n');

    this.loadCSVData();

    console.log('\nGenerating mappings...');

    // Process each circunscripcion
    this.circunscripcionesData.forEach(circ => {
      const category = circ.category;
      const circName = circ.circunscripcion_electoral;

      // Skip empty circunscripciones
      if (!circName) return;

      // Determine which categories apply to this circunscripcion
      if (category) {
        // Specific category defined (presidencial, senadoresNacional, parlamentoAndino)
        this.generateMappingsForCircunscripcion(circ, category);
      } else {
        // Regional/district circunscripcion - applies to regional categories
        // Generate for both senadoresRegional (C) and diputados (D) with shared organizations
        // D will be a subset of C
        this.generateRegionalMappings({ circunscripcion_electoral: circName });
      }
    });

    console.log(`\nTotal mappings generated: ${this.mappingData.length}`);
    return this.mappingData;
  }

  // Save to CSV file
  saveToCSV(filename = 'circunscripcion_organizacion_mapping.csv') {
    console.log(`\nSaving data to ${filename}...`);

    // CSV headers
    const headers = [
      'circunscripcion_electoral',
      'organizacion_key',
      'categoria_id',
      'orden_visualizacion'
    ];

    // Convert data to CSV
    const csvContent = [
      headers.join(';'),
      ...this.mappingData.map(mapping =>
        headers.map(header => mapping[header] || '').join(';')
      )
    ].join('\n');

    // Save to public directory
    const outputPath = path.join(__dirname, '../public/', filename);
    fs.writeFileSync(outputPath, csvContent, 'utf-8');

    console.log(`✅ Circunscripcion-Organizacion mapping saved to: ${outputPath}`);
    console.log(`📊 Total records: ${this.mappingData.length}`);

    // Print summary statistics
    this.printSummary();
  }

  // Print generation summary
  printSummary() {
    console.log('\n📈 Generation Summary:');

    // Count by circunscripcion
    const circunscripcionStats = {};
    this.mappingData.forEach(mapping => {
      const key = mapping.circunscripcion_electoral;
      circunscripcionStats[key] = (circunscripcionStats[key] || 0) + 1;
    });

    console.log(`\n🗳️ Mappings by Circunscripción Electoral:`);
    Object.entries(circunscripcionStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([circ, count]) => {
        console.log(`├── ${circ}: ${count} organizations`);
      });

    // Count by category
    const categoryStats = {};
    this.mappingData.forEach(mapping => {
      const key = mapping.categoria_id;
      categoryStats[key] = (categoryStats[key] || 0) + 1;
    });

    const categoryNames = {
      'A': 'Presidencial',
      'B': 'Senadores Nacional',
      'C': 'Senadores Regional',
      'D': 'Diputados',
      'E': 'Parlamento Andino'
    };

    console.log(`\n📋 Mappings by Category:`);
    Object.entries(categoryStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([category, count]) => {
        const name = categoryNames[category] || category;
        console.log(`├── ${category} (${name}): ${count} mappings`);
      });

    // Sample data preview
    console.log('\n📋 Sample Mapping Data:');

    // UNICO NACIONAL sample
    const unicoSample = this.mappingData.filter(m =>
      m.circunscripcion_electoral === 'UNICO NACIONAL'
    );
    if (unicoSample.length > 0) {
      console.log('├── UNICO NACIONAL Sample:');
      console.log(`│   ├── Total organizations: ${unicoSample.length / 3} (x3 categories)`);
      console.log(`│   └── First 3: ${unicoSample.slice(0, 3).map(m => m.organizacion_key).join(', ')}`);
    }

    // LIMA METROPOLITANA sample
    const limaSample = this.mappingData.filter(m =>
      m.circunscripcion_electoral === 'LIMA METROPOLITANA'
    );
    if (limaSample.length > 0) {
      console.log('├── LIMA METROPOLITANA Sample:');
      console.log(`│   ├── Total organizations: ${limaSample.length / 2} (x2 categories)`);
      console.log(`│   └── First 3: ${limaSample.slice(0, 3).map(m => m.organizacion_key).join(', ')}`);
    }

    // Random regional sample
    const regionalSample = this.mappingData.find(m =>
      !CONFIG.FULL_PARTICIPATION.includes(m.circunscripcion_electoral) &&
      m.circunscripcion_electoral !== 'PERUANOS RESIDENTES EN EL EXTRANJERO'
    );
    if (regionalSample) {
      const regionalCirc = regionalSample.circunscripcion_electoral;
      const regionalMappings = this.mappingData.filter(m =>
        m.circunscripcion_electoral === regionalCirc
      );
      console.log(`└── ${regionalCirc} Sample (Random):`);
      console.log(`    ├── Total organizations: ${regionalMappings.length / 2} (x2 categories)`);
      console.log(`    └── First 3: ${regionalMappings.slice(0, 3).map(m => m.organizacion_key).join(', ')}`);
    }
  }
}

// Main execution
try {
  const generator = new CircunscripcionOrganizacionGenerator();
  generator.generate();
  generator.saveToCSV('circunscripcion_organizacion_mapping.csv');

  console.log('\n🎉 Circunscripcion-Organizacion mapping generation completed successfully!');
  console.log('💡 You can now use this data to populate the circunscripcion_organizaciones table.');
  console.log('📝 Notes:');
  console.log('   - UNICO NACIONAL: ALL 39 parties');
  console.log('   - LIMA METROPOLITANA: ALL 39 parties');
  console.log('   - Other circunscripciones: Random 10-25 parties');
  console.log('   - BLANCO and NULO: Always included in all circunscripciones');
  console.log('   - Categories: A=Presidencial, B=Senadores Nacional, C=Senadores Regional, D=Diputados, E=Parlamento Andino');

} catch (error) {
  console.error('❌ Error generating Circunscripcion-Organizacion mapping:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

export default CircunscripcionOrganizacionGenerator;
