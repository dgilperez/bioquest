/**
 * Iconic Taxa Constants
 *
 * Centralized source of truth for iNaturalist's 13 iconic taxa.
 * These are the major life groups used throughout the app for:
 * - Tree of Life navigation
 * - Statistics aggregation
 * - Observation filtering
 * - Badge criteria
 *
 * Reference: https://www.inaturalist.org/pages/help#whaticonic
 */

/**
 * Iconic taxon definition
 */
export interface IconicTaxon {
  id: number;
  name: string;
  commonName: string;
  rank: string;
}

/**
 * The 13 iconic taxa recognized by iNaturalist
 */
export const ICONIC_TAXA: readonly IconicTaxon[] = [
  { id: 47126, name: 'Plantae', commonName: 'Plants', rank: 'kingdom' },
  { id: 1, name: 'Animalia', commonName: 'Animals', rank: 'kingdom' },
  { id: 47170, name: 'Fungi', commonName: 'Fungi', rank: 'kingdom' },
  { id: 47115, name: 'Mollusca', commonName: 'Mollusks', rank: 'phylum' },
  { id: 47119, name: 'Arachnida', commonName: 'Arachnids', rank: 'class' },
  { id: 47158, name: 'Insecta', commonName: 'Insects', rank: 'class' },
  { id: 3, name: 'Aves', commonName: 'Birds', rank: 'class' },
  { id: 40151, name: 'Mammalia', commonName: 'Mammals', rank: 'class' },
  { id: 26036, name: 'Reptilia', commonName: 'Reptiles', rank: 'class' },
  { id: 20978, name: 'Amphibia', commonName: 'Amphibians', rank: 'class' },
  { id: 47178, name: 'Actinopterygii', commonName: 'Ray-finned Fishes', rank: 'class' },
  { id: 48222, name: 'Chromista', commonName: 'Chromista', rank: 'kingdom' },
  { id: 47686, name: 'Protozoa', commonName: 'Protozoans', rank: 'kingdom' },
] as const;

/**
 * Map iconic taxon name to taxon ID
 * @example ICONIC_TAXON_IDS['Plantae'] => 47126
 */
export const ICONIC_TAXON_IDS: Record<string, number> = Object.fromEntries(
  ICONIC_TAXA.map(taxon => [taxon.name, taxon.id])
);

/**
 * Map taxon ID to iconic taxon name
 * @example TAXON_ID_TO_ICONIC[47126] => 'Plantae'
 */
export const TAXON_ID_TO_ICONIC: Record<number, string> = Object.fromEntries(
  ICONIC_TAXA.map(taxon => [taxon.id, taxon.name])
);

/**
 * Get iconic taxon details by ID
 */
export function getIconicTaxonById(id: number): IconicTaxon | undefined {
  return ICONIC_TAXA.find(taxon => taxon.id === id);
}

/**
 * Get iconic taxon details by name
 */
export function getIconicTaxonByName(name: string): IconicTaxon | undefined {
  return ICONIC_TAXA.find(taxon => taxon.name === name);
}

/**
 * Check if a taxon ID is an iconic taxon
 */
export function isIconicTaxon(taxonId: number): boolean {
  return taxonId in TAXON_ID_TO_ICONIC;
}

/**
 * Get all iconic taxon IDs
 */
export function getIconicTaxonIds(): number[] {
  return ICONIC_TAXA.map(taxon => taxon.id);
}

/**
 * Get all iconic taxon names
 */
export function getIconicTaxonNames(): string[] {
  return ICONIC_TAXA.map(taxon => taxon.name);
}
