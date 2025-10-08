# Claude Code Configuration

This file contains configuration and commands for Claude Code to better assist with this project.

## Project Information
- **Type**: React/TypeScript Electoral Vote Re-counting Application
- **Main Branch**: main
- **Target Election**: Peru 2026 Presidential Elections (April 12, 2026)
- **Purpose**: Digital re-counting system for questioned electoral actas as secondary validation

## Project Context & Legal Framework

### Electoral Law Background
Based on the official law published in "El Peruano" that regulates vote recounting for electoral records (actas) with formal errors:

- **Purpose**: Preserve voter intent, prevent unnecessary vote nullification, strengthen electoral transparency
- **Scope**: One-time recounting permitted for actas with unresolvable formal errors
- **Process**: Must be conducted in public hearings with party representatives and Public Ministry participation
- **Restrictions**: Original polling station counts remain constitutionally irreversible (Article 185)

### Application Role
This system serves as a digital tool to replicate the manual vote counting process from physical "cédulas electorales" (ballot papers) for secondary validation of contested actas only.

## Electoral System Structure

### Five Election Categories (2026)
1. **Presidencial** - Presidential formula (president + 2 vice presidents)
2. **Senadores Nacional** - 30 national senators
3. **Senadores Regional** - 30 district senators (27 districts, Lima has 4)
4. **Diputados** - 130 district deputies
5. **Parlamento Andino** - Peruvian Andean Parliament representatives

### Key Electoral Concepts
- **Mesa de Sufragio**: Unique voting table number (country-wide) with geographical location
  - Location hierarchy: Departamento → Provincia → Distrito
  - Each mesa has "Total Electores Hábiles" (eligible voters count)
- **Cédula Electoral**: Single ballot document covering all five election categories
- **Voto Preferencial**: Optional preferential voting for specific candidates within parties
- **Acta Electoral**: Official electoral record documenting vote counts

### Ballot Structure & Voting Process
- Single document ballot for all five categories
- Voters can mark party only OR use preferential voting for specific candidates
- Careful marking required to prevent vote nullification
- Common nullification causes: incorrect markings, incomplete sections, unclear marks

## Application Workflow

### Re-counting Process
1. **Mesa Selection**: Choose specific mesa number and verify geographical location
2. **Election Type**: Select one of the five election categories for re-counting
3. **Start Process**: Begin re-counting for selected election type on observed acta
4. **Vote Entry**: Count votes from physical cédulas following ballot structure
5. **Validation**: Compare against original acta counts
6. **Finalization**: Complete count and generate PDF acta download

### Technical Features
- Per-election-type counting on specific mesa numbers
- Support for preferential voting system
- Auto-increment functionality for voter counts
- PDF generation for finalized actas
- Local storage for session management

## Common Commands

### Development
```bash
npm start
npm run dev
```

### Building
```bash
npm run build
```

### Testing
```bash
npm test
npm run test
```

### Linting & Type Checking
```bash
npm run lint
npm run typecheck
```

## Project Structure
- `src/components/` - React components
- `public/` - Static assets
- Main components:
  - ElectoralCountTable.tsx - Main counting interface
  - VoteEntryForm.tsx - Vote input forms
  - PoliticalOrganizations.tsx - Party/candidate management
  - ElectoralDashboard.tsx - Overview dashboard

## Technical Stack
- **Frontend**: React with TypeScript
- **State Management**: React state + localStorage
- **Features**: Electoral vote counting, preferential voting support, PDF generation
- **Validation**: Auto-increment counters, vote validation logic

## Important Implementation Notes
- Re-counting is performed per election type on specific mesa numbers
- System handles contested acta validation only (not general elections)
- Must support all five election categories with different candidate structures
- Preferential voting logic must align with official electoral rules
- PDF output should match official acta format requirements
- Geographic location validation for mesa numbers